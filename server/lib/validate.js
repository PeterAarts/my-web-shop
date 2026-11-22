// File: server/lib/validate.js
// Small input checks. Form fields must be plain text: an object like {"$ne": null}
// in a login field would otherwise be read by MongoDB as a query ("any value").

const MIN_PASSWORD_LENGTH = 10;

/** The value if it is non-empty text of at most `max` characters, else null. */
function text(value, max = 254) {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null;
}

/** A problem with a new password, or null if it's fine. */
function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD_LENGTH) {
    return `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (pw.length > 200) return 'The password is too long.';
  return null;
}

const isEmail = v => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

module.exports = { text, passwordProblem, isEmail, MIN_PASSWORD_LENGTH };
