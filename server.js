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

// Session management packages
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

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
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Session Configuration ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

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

// --- UPDATED: SERVE THE API DOCUMENTATION FROM THE JSON FILE ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// --- END UPDATE ---

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(` - Server is running on port ${PORT}`);
});
