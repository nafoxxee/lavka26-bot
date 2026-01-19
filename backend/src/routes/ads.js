const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const { supabase } = require('../services/supabaseService');
const {
  createAd,
  getAds,
  getAdById,
  updateAd,
  deleteAd,
  getUserAds,
  incrementViews,
  getCategories
} = require('../services/adService');

const router = express.Router();

// Validation schemas
const createAdSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(5000).required(),
  price: Joi.number().min(0).required(),
  categoryId: Joi.string().uuid().required(),
  location: Joi.string().max(255).optional(),
  contactInfo: Joi.object().optional()
});

const updateAdSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(5000).optional(),
  price: Joi.number().min(0).optional(),
  categoryId: Joi.string().uuid().optional(),
  location: Joi.string().max(255).optional(),
  contactInfo: Joi.object().optional(),
  status: Joi.string().valid('draft', 'pending').optional()
});

const getAdsSchema = Joi.object({
  categoryId: Joi.string().uuid().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  search: Joi.string().max(100).optional(),
  limit: Joi.number().integer().min(1).max(50).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// GET /api/ads/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// GET /api/ads
router.get('/', async (req, res) => {
  try {
    const { error, value } = getAdsSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const ads = await getAds(value);
    res.json(ads);
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ error: 'Failed to get ads' });
  }
});

// GET /api/ads/my
router.get('/my', async (req, res) => {
  try {
    const { status } = req.query;
    const ads = await getUserAds(req.user.id, status);
    res.json(ads);
  } catch (error) {
    console.error('Get user ads error:', error);
    res.status(500).json({ error: 'Failed to get user ads' });
  }
});

// GET /api/ads/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await getAdById(id, req.user.id);
    
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    // Increment views if ad is active and user is not the owner
    if (ad.status === 'active' && ad.user_id !== req.user.id) {
      await incrementViews(id);
    }

    res.json(ad);
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({ error: 'Failed to get ad' });
  }
});

// POST /api/ads
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const { error, value } = createAdSchema.validate(JSON.parse(req.body.data));
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let imageUrls = [];
    
    // Upload images to Supabase Storage if provided
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file, index) => {
        const fileName = `ads/${req.user.id}/${Date.now()}-${index}.${file.originalname.split('.').pop()}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || 'ad-images')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || 'ad-images')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      imageUrls = await Promise.all(uploadPromises);
    }

    const adData = {
      ...value,
      images: imageUrls
    };

    const ad = await createAd(adData, req.user.id);
    res.status(201).json(ad);
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// PUT /api/ads/:id
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateAdSchema.validate(JSON.parse(req.body.data));
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let updateData = { ...value };

    // Handle image updates
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file, index) => {
        const fileName = `ads/${req.user.id}/${Date.now()}-${index}.${file.originalname.split('.').pop()}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || 'ad-images')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || 'ad-images')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const newImageUrls = await Promise.all(uploadPromises);
      
      // Get existing images if any
      const existingAd = await getAdById(id, req.user.id);
      const existingImages = existingAd.images || [];
      
      updateData.images = [...existingImages, ...newImageUrls];
    }

    const ad = await updateAd(id, req.user.id, updateData);
    
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found or access denied' });
    }

    res.json(ad);
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

// DELETE /api/ads/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteAd(id, req.user.id);
    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

// DELETE /api/ads/:id/images/:index
router.delete('/:id/images/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const imageIndex = parseInt(index);
    
    const ad = await getAdById(id, req.user.id);
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found or access denied' });
    }

    const images = ad.images || [];
    if (imageIndex < 0 || imageIndex >= images.length) {
      return res.status(400).json({ error: 'Invalid image index' });
    }

    // Remove image from array
    images.splice(imageIndex, 1);
    
    await updateAd(id, req.user.id, { images });
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
