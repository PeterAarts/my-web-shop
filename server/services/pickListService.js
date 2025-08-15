const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Setting = require('../models/Setting');
const { print } = require('pdf-to-printer'); // NEW: Import the printing utility

/**
 * Generates a PDF picklist from an order, saves it to a PRIVATE directory,
 * and sends it to the default server printer.
 * @param {object} order - The full Mongoose order object.
 * @returns {Promise<string>} A promise that resolves with the generated filename.
 */
const generateAndSavePickList = async (order) => {
  return new Promise(async (resolve, reject) => {
    // --- 1. Prepare File Path and Filename ---
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const filename = `PickList-${order.orderNumber}-${timestamp}.pdf`;
    
    const picklistDir = path.join(__dirname, '..', 'storage', 'picklists');
    fs.mkdirSync(picklistDir, { recursive: true });
    
    const filePath = path.join(picklistDir, filename);

    // --- Setup PDF Document and Stream ---
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // --- (PDF Generation Logic - remains the same) ---
    const drawSection = (title, contentLines) => {
        doc.fontSize(10).font('Helvetica-Bold').text(title, 40, doc.y);
        doc.strokeColor('#333').lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(550, doc.y + 2).stroke();
        doc.moveDown(1.0);
        doc.fontSize(10).font('Helvetica');
        contentLines.forEach(line => doc.text(line, { indent: 10 }));
        doc.moveDown(1.5);
    };
    doc.fontSize(20).font('Helvetica-Bold').text(`Pick List #${order.orderNumber}`, 50, 50);
    doc.moveDown(2);
    const customerLines = [`${order.customerDetails.name}`, `${order.customerDetails.address}`];
    drawSection('Customer', customerLines);
    const shippingLines = [`${order.shippingDetails.shippingMethodName} , cost: € ${order.shippingDetails.shippingCost || '0.00'}`];
    drawSection('Shipping', shippingLines);
    let paymentLines = [`Method: ${order.paymentDetails.paymentMethod || 'N/A'}, Status: ${order.paymentDetails.paymentStatus || 'N/A'},  Amount: € ${order.totalAmount}`];
    if (order.paymentDetails.paymentDate) {
        paymentLines.push(`Date: ${new Date(order.paymentDetails.paymentDate).toLocaleDateString()}`);
    }
    if (order.paymentDetails.paymentTransactionId) {
        paymentLines.push(`Transaction ID: ${order.paymentDetails.paymentTransactionId}`);
    }
    drawSection('Payment', paymentLines);
    doc.moveDown(1);
    const tableTop = doc.y;
    doc.font('Helvetica').fontSize(9);
    doc.text('Qty', 40, tableTop);
    doc.text('sku', 70, tableTop);
    doc.text('Product Name', 140, tableTop);
    doc.text('Specs', 420, tableTop);
    doc.text('-', 540, tableTop);
    doc.rect(40, tableTop + 20, 520, 0.5).stroke();
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(10);
    for (const item of order.items) {
        const product = item.productId;
        const y = doc.y;
        if (product) {
            doc.text(`${item.quantity}x`, 40, y, { width: 30 });
            doc.text(`${product.sku || 'N/A'}`, 70, y , { width: 70 });
            doc.text(product.name, 140, y, { width: 250 });
            let specs = [];
            if (product.weight > 0) specs.push(`${product.weight} g`);
            if (product.dimensions && product.dimensions.length > 0) specs.push(`${product.dimensions.length} x ${product.dimensions.width} x ${product.dimensions.height} cm`);
            doc.font('Helvetica').fontSize(9).text(specs.join(' / '), 420, y, { width: 150 });
        } else {
            doc.text(`${item.quantity}x`, 50, y, { width: 40 });
            doc.font('Helvetica-Bold').fillColor('red').text('[Product not found in database]', 90, y, { width: 400 });
            doc.fillColor('black');
        }
        doc.rect(540, y-5, 15, 15).stroke();
        doc.moveDown(2.0);
    }
    doc.end();

    // --- 4. Handle Stream Events ---
    stream.on('finish', () => {
      console.log(`✅ Picklist securely generated: ${filename}`);
      
      // --- NEW: Automatically print the generated PDF ---
      const options = {
        // Optional: specify a printer name if you don't want to use the default
        // printer: "MyWarehousePrinter" 
      };

      print(filePath, options)
        .then(() => {
          console.log(`🖨️  Successfully sent ${filename} to the printer.`);
        })
        .catch((err) => {
          // Log the error, but don't stop the process. The file is still saved.
          console.error('❌  Error sending file to printer:', err);
        });
      // --- END NEW SECTION ---

      resolve(filename);
    });

    stream.on('error', (err) => {
      console.error('❌ Error generating picklist PDF:', err);
      reject(err);
    });
  });
};

module.exports = { generateAndSavePickList };
