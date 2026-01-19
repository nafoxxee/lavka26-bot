const { supabase } = require('./supabaseService');

const createAd = async (adData, userId) => {
  const { data, error } = await supabase
    .from('ads')
    .insert({
      ...adData,
      user_id: userId,
      status: 'pending'
    })
    .select(`
      *,
      category:category_id(name, icon),
      user:user_id(username, first_name)
    `)
    .single();

  if (error) throw error;
  return data;
};

const getAds = async (filters = {}) => {
  let query = supabase
    .from('ads')
    .select(`
      *,
      category:category_id(name, icon),
      user:user_id(username, first_name),
      favorites:favorites(id)
    `)
    .eq('status', 'active');

  // Apply filters
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.minPrice) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Sort: boosted first, then by created_at desc
  query = query.order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

const getAdById = async (adId, userId = null) => {
  let query = supabase
    .from('ads')
    .select(`
      *,
      category:category_id(name, icon),
      user:user_id(username, first_name),
      favorites:favorites(id)
    `)
    .eq('id', adId);

  // If user is not the owner, only show active ads
  if (userId) {
    query = query.or(`status.eq.active,user_id.eq.${userId}`);
  } else {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query.single();

  if (error) throw error;
  return data;
};

const updateAd = async (adId, userId, updateData) => {
  const { data, error } = await supabase
    .from('ads')
    .update(updateData)
    .eq('id', adId)
    .eq('user_id', userId)
    .select(`
      *,
      category:category_id(name, icon),
      user:user_id(username, first_name)
    `)
    .single();

  if (error) throw error;
  return data;
};

const deleteAd = async (adId, userId) => {
  const { error } = await supabase
    .from('ads')
    .delete()
    .eq('id', adId)
    .eq('user_id', userId);

  if (error) throw error;
};

const getUserAds = async (userId, status = null) => {
  let query = supabase
    .from('ads')
    .select(`
      *,
      category:category_id(name, icon),
      favorites:favorites(id)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

const incrementViews = async (adId) => {
  await supabase.rpc('increment_views', { ad_id: adId });
};

const boostAd = async (adId, userId, duration) => {
  const boostExpiresAt = new Date();
  boostExpiresAt.setHours(boostExpiresAt.getHours() + duration);

  const { data, error } = await supabase
    .from('ads')
    .update({
      is_boosted: true,
      boost_expires_at: boostExpiresAt.toISOString()
    })
    .eq('id', adId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const expireBoostedAds = async () => {
  const { error } = await supabase.rpc('expire_boosted_ads');
  if (error) console.error('Error expiring boosted ads:', error);
};

const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data;
};

const moderateAd = async (adId, moderatorId, action, reason = null) => {
  const status = action === 'approve' ? 'active' : action === 'block' ? 'blocked' : 'pending';
  
  const { data, error } = await supabase
    .from('ads')
    .update({ status })
    .eq('id', adId)
    .select()
    .single();

  if (error) throw error;

  // Log moderation action
  await supabase
    .from('moderation_queue')
    .insert({
      ad_id: adId,
      moderator_id: moderatorId,
      action,
      reason,
      resolved_at: new Date().toISOString()
    });

  return data;
};

const getPendingAds = async () => {
  const { data, error } = await supabase
    .from('ads')
    .select(`
      *,
      category:category_id(name, icon),
      user:user_id(username, first_name)
    `)
    .eq('status', 'pending')
    .order('created_at');

  if (error) throw error;
  return data;
};

module.exports = {
  createAd,
  getAds,
  getAdById,
  updateAd,
  deleteAd,
  getUserAds,
  incrementViews,
  boostAd,
  expireBoostedAds,
  getCategories,
  moderateAd,
  getPendingAds
};
