const express = require('express');
const Joi = require('joi');
const { supabase } = require('../services/supabaseService');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).max(20).optional()
});

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        ads_count:ads(count),
        active_ads_count:ads(count, { filter: { status: { _eq: 'active' } } })
      `)
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    // Get user's ad statistics
    const { data: stats } = await supabase
      .rpc('get_ad_stats', { p_user_id: req.user.id });

    res.json({
      ...user,
      stats
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /api/users/profile
router.put('/profile', async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updateData = {};
    if (value.username) updateData.username = value.username;
    if (value.firstName !== undefined) updateData.first_name = value.firstName;
    if (value.lastName !== undefined) updateData.last_name = value.lastName;
    if (value.phone) updateData.phone = value.phone;

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/favorites
router.get('/favorites', async (req, res) => {
  try {
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        ad:ad_id(
          *,
          category:category_id(name, icon),
          user:user_id(username, first_name)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const ads = favorites.map(fav => fav.ad);
    res.json(ads);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// POST /api/users/favorites/:adId
router.post('/favorites/:adId', async (req, res) => {
  try {
    const { adId } = req.params;

    // Check if ad exists and is active
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('id')
      .eq('id', adId)
      .eq('status', 'active')
      .single();

    if (adError || !ad) {
      return res.status(404).json({ error: 'Ad not found or not active' });
    }

    // Check if already in favorites
    const { data: existing, error: checkError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('ad_id', adId)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Already in favorites' });
    }

    // Add to favorites
    const { data: favorite, error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: req.user.id,
        ad_id: adId
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE /api/users/favorites/:adId
router.delete('/favorites/:adId', async (req, res) => {
  try {
    const { adId } = req.params;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', req.user.id)
      .eq('ad_id', adId);

    if (error) throw error;

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// GET /api/users/stats
router.get('/stats', async (req, res) => {
  try {
    const { data: stats } = await supabase
      .rpc('get_ad_stats', { p_user_id: req.user.id });

    // Get additional stats
    const { data: favoritesCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    const { data: chatsCount } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`);

    res.json({
      ...stats,
      favoritesCount: favoritesCount.length,
      chatsCount: chatsCount.length
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
