const ejs = require('ejs');
const sendEmail = require('../utils/emailService');
const EmailTemplate = require('../models/EmailTemplate');
const Setting = require('../models/Setting');
const EmailLog = require('../models/EmailStatusLog');


/**
 * A generic function to send an email based on a template slug.
 * @param {string} slug - The slug of the email template.
 * @param {string} recipientEmail - The recipient's email address.
 * @param {object} data - The data object to be injected into the template.
 */
async function sendEmailByTemplateSlug(slug, recipientEmail, data) {
    let subject; 
  try {
    const template = await EmailTemplate.findOne({ slug, isActive: true });
    if (!template) {
      console.log(`Email Warning: Active template with slug "${slug}" not found.`);
      return;
    }

    const subject = ejs.render(template.subject, data);
    const htmlBody = ejs.render(template.body, data);

    await sendEmail({
      email: recipientEmail,
      subject: subject,
      html: htmlBody,
    });

    // MODIFIED: Create log data and add both orderId and orderNumber if they exist
    const logData = {
      recipient: recipientEmail,
      subject: subject,
      templateSlug: slug,
      status: 'sent'
    };
    if (data.order && data.order._id) {
      logData.orderId = data.order._id;
      logData.orderNumber = data.order.orderNumber;
    }
    await EmailLog.create(logData);

    console.log(`Email with slug "${slug}" sent and logged successfully for ${recipientEmail}`);

  } catch (error) {
    console.error(`Error sending email with slug "${slug}":`, error.message);
    
    const logData = {
      recipient: recipientEmail,
      subject: subject || `Failed to render for slug: ${slug}`,
      templateSlug: slug,
      status: 'failed',
      errorMessage: error.message
    };
    if (data.order && data.order._id) {
      logData.orderId = data.order._id;
      logData.orderNumber = data.order.orderNumber;
    }
    await EmailLog.create(logData);
    
    throw error;
  }
}
// --- ORDER-RELATED EMAIL FUNCTIONS ---

async function sendOrderConfirmationEmail(order) {
  const settings = await Setting.findOne();
  const token = order.viewToken;
  const data = { order, settings, token, customer: order.user || order.customerDetails };
  await sendEmailByTemplateSlug('order-confirmation', order.customerDetails.email, data);
}

async function sendPendingPaymentEmail(order) {
  const settings = await Setting.findOne(); 
  const token = order.viewToken;
  const data = { order, settings, token, customer: order.user || order.customerDetails };
  await sendEmailByTemplateSlug('pending-payment-instructions', order.customerDetails.email, data);
}

async function sendOrderShippedEmail(order) {
  const settings = await Setting.findOne();
  const token = order.viewToken;
  const data = { order, settings, token, customer: order.user || order.customerDetails };
  await sendEmailByTemplateSlug('order-shipped', order.customerDetails.email, data);
}

async function sendOrderCancelledEmail(order) {
  const settings = await Setting.findOne();
  const token = order.viewToken;
  const data = { order, settings, token, customer: order.user || order.customerDetails };
  await sendEmailByTemplateSlug('order-cancelled', order.customerDetails.email, data);
}

async function sendPaymentReceivedEmail(order) {
  const settings = await Setting.findOne();
  const token = order.viewToken;
  const data = { order, settings, token, customer: order.user || order.customerDetails };
  await sendEmailByTemplateSlug('payment-received', order.customerDetails.email, data);
}

// --- AUTH-RELATED EMAIL FUNCTIONS ---

async function sendRegistrationEmail(user, verificationUrl) {
  const data = { user, verificationUrl };
  await sendEmailByTemplateSlug('user-registration-confirmation', user.email, data);
}

async function sendPasswordResetEmail(user, resetUrl) {
  const data = { user, resetUrl };
  await sendEmailByTemplateSlug('password-reset', user.email, data);
}

module.exports = {
  sendOrderConfirmationEmail,
  sendPendingPaymentEmail,
  sendOrderShippedEmail,
  sendOrderCancelledEmail,
  sendRegistrationEmail,
  sendPasswordResetEmail,
  sendPaymentReceivedEmail
};