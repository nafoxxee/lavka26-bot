const jwt = require('jsonwebtoken');
const { supabase } = require('../services/supabaseService');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', decoded.telegramId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    if (user.is_blocked) {
      return res.status(403).json({ error: 'Account blocked.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
