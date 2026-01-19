const ADMIN_IDS = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS.split(',').map(Number)
  : [];

function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

function checkText(text) {
  const banned = [
    'наркот',
    'оруж',
    'интим',
    'секс',
    'мошен',
    'обман'
  ];

  const lower = text.toLowerCase();
  return !banned.some(word => lower.includes(word));
}

module.exports = {
  isAdmin,
  checkText
};
