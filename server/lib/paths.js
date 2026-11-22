// File: server/lib/paths.js
// Where the server keeps files it writes itself. Defaults are the old locations, so
// development works as before; on the server they point to the data folder in .env,
// so uploads, labels and picklists survive deploys and are in the backup.
const path = require('path');
const fs = require('fs');

const SERVER_DIR = path.join(__dirname, '..');

function dir(envName, fallback) {
  const d = process.env[envName] ? path.resolve(process.env[envName]) : fallback;
  fs.mkdirSync(d, { recursive: true });
  return d;
}

module.exports = {
  UPLOAD_DIR:    dir('UPLOAD_DIR',    path.join(SERVER_DIR, 'public', 'uploads')),
  LABELS_DIR:    dir('LABELS_DIR',    path.join(SERVER_DIR, 'storage', 'labels')),
  PICKLIST_DIR:  dir('PICKLIST_DIR',  path.join(SERVER_DIR, 'storage', 'picklists')),
};
