const express = require('express');
const Joi = require('joi');
const {
  createInvoiceLink,
  getUserPayments,
  getPaymentPrices
} = require('../services/paymentService');

const router = express.Router();

// Validation schemas
const createPaymentSchema = Joi.object({
  adId: Joi.string().uuid().required(),
  paymentType: Joi.string().valid('boost_24h', 'boost_72h').required()
});

// GET /api/payments/prices
router.get('/prices', async (req, res) => {
  try {
    const prices = await getPaymentPrices();
    res.json(prices);
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ error: 'Failed to get prices' });
  }
});

// GET /api/payments/my
router.get('/my', async (req, res) => {
  try {
    const payments = await getUserPayments(req.user.id);
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

// POST /api/payments/invoice
router.post('/invoice', async (req, res) => {
  try {
    const { error, value } = createPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { adId, paymentType } = value;

    const result = await createInvoiceLink(req.user.id, adId, paymentType);
    res.json(result);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

module.exports = router;
