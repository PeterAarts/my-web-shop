// File: server/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Please upload image files only.');
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5000000 },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('productImage');

router.post('/', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ msg: err });
    }
    if (req.file === undefined) {
      return res.status(400).json({ msg: 'Error: No file selected.' });
    }

    try {
      // MODIFIED: Check for the 'resize' query parameter. Default to true.
      const shouldResize = req.query.resize !== 'false';

      const { buffer, originalname } = req.file;
      const timestamp = Date.now();
      const filename = `${path.parse(originalname).name}-${timestamp}.webp`;
      const outputPath = path.join(uploadsDir, filename);

      // Initialize sharp with the image buffer
      let imageProcessor = sharp(buffer);

      // MODIFIED: Conditionally apply the resize operation
      if (shouldResize) {
        console.log('Resizing image...');
        imageProcessor.resize({
          width: 700,
          height: 700,
          fit: 'inside',
          withoutEnlargement: true,
        });
      } else {
        console.log('Skipping resize, saving original dimensions...');
      }

      // Continue with format conversion and saving the file
      await imageProcessor
        .toFormat('webp', { quality: 90 }) // Increased quality slightly for original-size saves
        .toFile(outputPath);

      res.status(200).json({
        msg: `File Uploaded! ${shouldResize ? '(Resized)' : '(Original Size)'}`,
        filePath: `/uploads/${filename}`
      });

    } catch (sharpError) {
      console.error('Error processing image:', sharpError);
      res.status(500).json({ msg: 'There was an error processing the image.' });
    }
  });
});

module.exports = router;