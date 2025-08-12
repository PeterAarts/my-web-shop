// FILE: server/payment-providers/bankTransfer.js
// A simple "offline" provider. It doesn't make API calls.
// Its purpose is to be a record in the DB that can be enabled/disabled
// and have its instructions configured in the admin panel.

module.exports = {
  key: 'banktransfer',
  name: 'Bank Transfer',
  isOnline: false,
  // This provider's initiation is simple: it just confirms the order can be placed.
  initiate: async () => {
    return { action: 'confirm' };
  },
};