module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'vercel-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};
