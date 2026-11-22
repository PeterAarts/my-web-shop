// File: server/server.js
console.log('Server loading initiated.');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const fs = require('fs');
const User = require('./models/User');
const shippingRoutes = require('./routes/shippingRoutes');

// --- UPDATED: Swagger/OpenAPI Documentation ---
const swaggerUi = require('swagger-ui-express');

// We now require the JSON file directly.
const swaggerDocument = require('./swagger.json'); 
// --- END UPDATE ---

const helmet = require('helmet');
const { UPLOAD_DIR } = require('./lib/paths');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// --- Refuse to start with missing or weak secrets ---
// A guessable JWT_SECRET lets anyone make their own admin login token.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  const msg = 'JWT_SECRET is missing or shorter than 32 characters.';
  if (isProduction) { console.error(`FATAL: ${msg} Set a long random value in .env.`); process.exit(1); }
  console.warn(`- WARNING: ${msg} Fine for development, never for production.`);
}

// --- Middleware ---
// Apache on the same machine passes on the visitor's address; trust only that.
app.set('trust proxy', 'loopback');
app.disable('x-powered-by');
// Security headers. The page CSP is set by Apache for the shop and admin sites.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }));

// CORS: only our own sites may call the API from a browser. On the server the shop and
// admin call /api on their own address, so CORS isn't even needed there. In development
// the Vite dev servers on localhost are allowed. Extra origins: CORS_ORIGINS in .env.
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin(origin, done) {
    if (!origin || allowedOrigins.includes(origin)) return done(null, true);
    if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return done(null, true);
    done(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));

// --- Request Logging Setup ---
if (process.env.NODE_ENV === 'development') {
  console.log('- Morgan logging is enabled.');
  const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
  morgan.token('body', (req) => JSON.stringify(req.body, null, 2));
  app.use(morgan(
    ':method :url :status :res[content-length] - :response-time ms \nBody: :body\n', 
    { stream: accessLogStream }
  ));
}
// Uploaded product images (UPLOAD_DIR in .env, see lib/paths.js), then other public files
app.use('/uploads', express.static(UPLOAD_DIR, { dotfiles: 'deny' }));
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'deny' }));

// (Sessions were removed: nothing used them, and every visitor got one stored in MongoDB.
//  Logins use the JWT token; guest carts use the X-Guest-Token header.)

// --- Function to Ensure Default Admin User Exists ---
const ensureAdminExists = async () => {
  try {
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('- Admin user already exists.');
      return;
    }
    const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.log('- Default admin credentials not found in .env file. Skipping admin creation.');
      return;
    }
    console.log('- No admin user found. Creating default admin...');
    const newAdmin = new User({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true
    });
    await newAdmin.save();
    console.log('Default admin user created successfully.');
  } catch (error) {
    console.error('Error ensuring admin user exists:', error);
  }
};

// --- Database Connection ---
const dbURI = process.env.MONGODB_URI;
const connectDB = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log(' - Successfully connected to MongoDB!');
    await ensureAdminExists();
  } catch (error) {
    console.error(' - Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
connectDB();

// --- Provider Sync Services ---
const { syncShippingProviders } = require('./services/shippingSyncService');
const { syncPaymentProviders } = require('./services/paymentSyncService');

syncShippingProviders();
syncPaymentProviders();

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('Hello, your e-commerce server is running!');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/stories', require('./routes/storyItemRoutes'));
app.use('/api/upload',require('./routes/uploadRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/shipping-providers', require('./routes/shippingProviderRoutes'));
app.use('/api/payment-providers', require('./routes/paymentProviderRoutes'));
app.use('/api/shipping', shippingRoutes);
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/email-templates', require('./routes/emailTemplateRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));

// API documentation: a full map of the API, so not public in production.
// Turn it on with ENABLE_API_DOCS=true (e.g. temporarily on a LAN-only test server).
if (!isProduction || process.env.ENABLE_API_DOCS === 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Unknown API paths: a clear 404 instead of the HTML error page
app.use('/api', (req, res) => res.status(404).json({ msg: 'Not found' }));

// Last resort: never send error details (stack traces, paths) to the browser
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') return res.status(413).json({ msg: 'Request too large.' });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ msg: 'Invalid JSON.' });
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Server Error' });
});

// --- Start the Server ---
// Listen on this machine only (HOST in .env); Apache is the way in from outside.
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(` - Server is running on ${HOST}:${PORT}`);
});
