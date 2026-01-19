module.exports = (req, res) => {
  res.status(200).json({
    message: 'API работает на Vercel!',
    timestamp: new Date().toISOString(),
    platform: 'Vercel Functions'
  });
};
