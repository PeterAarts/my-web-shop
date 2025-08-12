// FILE: server/utils/shippingLogger.js (NEW FILE)
// A simple, dedicated logger for shipping provider interactions.

const fs = require('fs');
const path = require('path');

// Define the path for the log file
const logDirectory = path.join(__dirname, '../logs');
const logFilePath = path.join(logDirectory, 'shipping.log');

// Ensure the log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

/**
 * Logs a message to the shipping.log file.
 * @param {string} providerName - The name of the shipping provider (e.g., "PostNL").
 * @param {string} message - A descriptive message for the log entry.
 * @param {object} data - The data object to be logged (e.g., request body, response, error).
 */
const log = (providerName, message, data) => {
  const timestamp = new Date().toISOString();
  // Use JSON.stringify with indentation for readability
  const logData = JSON.stringify(data, null, 2);
  const logEntry = `[${timestamp}] [${providerName}] ${message}:\n${logData}\n---------------------------------\n`;

  // Append the entry to the log file
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to shipping log:', err);
    }
  });

  // Also log to the console for real-time visibility during development
  console.log(`[${providerName}] ${message}`);
};

module.exports = {
  log,
};