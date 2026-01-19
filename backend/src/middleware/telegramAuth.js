const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { supabase } = require('../services/supabaseService');

const validateTelegramData = (initData) => {
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const data = new URLSearchParams(initData);
  const hash = data.get('hash');
  data.delete('hash');

  const dataCheckString = Array.from(data.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
};

const parseTelegramData = (initData) => {
  const data = new URLSearchParams(initData);
  const userStr = data.get('user');
  
  if (!userStr) {
    throw new Error('No user data found');
  }

  const user = JSON.parse(userStr);
  return {
    telegramId: user.id,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    authDate: parseInt(data.get('auth_date'))
  };
};

const telegramAuth = async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'Init data required' });
    }

    // Validate Telegram data
    if (!validateTelegramData(initData)) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Parse user data
    const userData = parseTelegramData(initData);

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userData.telegramId)
      .single();

    let user;

    if (fetchError && fetchError.code === 'PGRST116') {
      // User doesn't exist, create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: userData.telegramId,
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      user = newUser;
    } else if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    } else {
      user = existingUser;
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Account blocked' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { telegramId: userData.telegramId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = telegramAuth;
