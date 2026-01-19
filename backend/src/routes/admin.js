const express = require('express');
const Joi = require('joi');
const { moderateAd, getPendingAds } = require('../services/adService');
const { supabase } = require('../services/supabaseService');

const router = express.Router();

// Admin middleware
const adminMiddleware = async (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(adminMiddleware);

// Validation schemas
const moderateAdSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject', 'block').required(),
  reason: Joi.string().max(500).optional()
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalAds },
      { count: activeAds },
      { count: pendingAds },
      { count: totalChats },
      { count: totalMessages },
      { count: totalPayments }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('ads').select('*', { count: 'exact', head: true }),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('chats').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true })
    ]);

    // Get revenue
    const { data: revenueData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;

    res.json({
      totalUsers,
      totalAds,
      activeAds,
      pendingAds,
      totalChats,
      totalMessages,
      totalPayments,
      totalRevenue
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /api/admin/ads/pending
router.get('/ads/pending', async (req, res) => {
  try {
    const ads = await getPendingAds();
    res.json(ads);
  } catch (error) {
    console.error('Get pending ads error:', error);
    res.status(500).json({ error: 'Failed to get pending ads' });
  }
});

// POST /api/admin/ads/:id/moderate
router.post('/ads/:id/moderate', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = moderateAdSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const ad = await moderateAd(id, req.user.id, value.action, value.reason);
    
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json(ad);
  } catch (error) {
    console.error('Moderate ad error:', error);
    res.status(500).json({ error: 'Failed to moderate ad' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (search) {
      query = query.or(`username.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// PUT /api/admin/users/:id/block
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ error: 'isBlocked must be a boolean' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ is_blocked: isBlocked })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(user);
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// GET /api/admin/payments
router.get('/payments', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = supabase
      .from('payments')
      .select(`
        *,
        user:user_id(username, first_name),
        ad:ad_id(title)
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) throw error;

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (error) throw error;

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/admin/settings
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    const updates = Object.entries(settings).map(([key, value]) => 
      supabase
        .from('settings')
        .update({ value })
        .eq('key', key)
    );

    await Promise.all(updates);

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
