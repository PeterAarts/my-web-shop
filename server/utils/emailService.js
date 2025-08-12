// FILE: server/utils/emailService.js
// DESC: A utility for sending emails using Nodemailer.

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // ADD THIS CONSOLE.LOG FOR DEBUGGING
  console.log('--- Email Service using credentials ---');
  console.log('Host:', process.env.EMAIL_HOST);
  console.log('User:', process.env.EMAIL_USERNAME);
  console.log('------------------------------------');

  // 1. Create a transporter
  // For production, use a real service like SendGrid, Mailgun, etc.
  // For development, you can use a service like Mailtrap or a Gmail account.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. Define email options
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // 3. Send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log(' - Email sent successfully to :'+options.email);
  } catch (error) {
    console.error(' - Error sending email:', error);
    // In a real app, you might want to throw this error to be handled by the caller
  }
};

module.exports = sendEmail;
