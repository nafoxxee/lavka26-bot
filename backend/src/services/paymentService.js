const { supabase } = require('./supabaseService');
const { bot } = require('./telegramService');

const createPayment = async (userId, adId, paymentType, amount) => {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      ad_id: adId,
      amount,
      payment_type: paymentType,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const processTelegramPayment = async (userId, chargeId, paymentId) => {
  try {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !payment) {
      throw new Error('Payment not found');
    }

    // Update payment status
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        telegram_payment_charge_id: chargeId,
        completed_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Process the boost
    if (payment.payment_type === 'boost_24h') {
      const { boostAd } = require('./adService');
      await boostAd(payment.ad_id, userId, 24);
    } else if (payment.payment_type === 'boost_72h') {
      const { boostAd } = require('./adService');
      await boostAd(payment.ad_id, userId, 72);
    }

    return updatedPayment;
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

const getPaymentPrices = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['boost_price_24h', 'boost_price_72h']);

  if (error) throw error;

  const prices = {};
  data.forEach(setting => {
    prices[setting.key] = parseFloat(setting.value);
  });

  return prices;
};

const getUserPayments = async (userId) => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      ad:ad_id(title)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const createInvoiceLink = async (userId, adId, paymentType) => {
  try {
    const prices = await getPaymentPrices();
    const amount = paymentType === 'boost_24h' ? prices.boost_price_24h : prices.boost_price_72h;
    
    // Create payment record
    const payment = await createPayment(userId, adId, paymentType, amount);
    
    // Get ad details for description
    const { data: ad } = await supabase
      .from('ads')
      .select('title')
      .eq('id', adId)
      .single();

    const description = `Поднятие объявления "${ad.title}" на ${paymentType === 'boost_24h' ? '24 часа' : '72 часа'}`;
    
    // Create invoice link
    const invoiceLink = await bot.createInvoiceLink({
      chat_id: userId,
      title: 'Поднятие объявления',
      description,
      payload: JSON.stringify({ paymentId: payment.id }),
      provider_token: process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN,
      currency: 'RUB',
      prices: [{ label: description, amount: Math.round(amount * 100) }] // Convert to kopecks
    });

    return {
      invoiceLink,
      payment
    };
  } catch (error) {
    console.error('Error creating invoice link:', error);
    throw error;
  }
};

const handlePreCheckoutQuery = async (query) => {
  try {
    const payload = JSON.parse(query.invoice_payload);
    const { paymentId } = payload;

    // Verify payment exists and is pending
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('status', 'pending')
      .single();

    if (error || !payment) {
      await bot.answerPreCheckoutQuery(query.id, false, 'Payment not found');
      return;
    }

    await bot.answerPreCheckoutQuery(query.id, true);
  } catch (error) {
    console.error('Pre-checkout query error:', error);
    await bot.answerPreCheckoutQuery(query.id, false, 'Payment processing error');
  }
};

const handleSuccessfulPayment = async (msg) => {
  try {
    const payment = msg.successful_payment;
    const payload = JSON.parse(payment.invoice_payload);
    const { paymentId } = payload;

    const userId = msg.from.id;
    const chargeId = payment.provider_payment_charge_id;

    await processTelegramPayment(userId, chargeId, paymentId);

    await bot.sendMessage(
      msg.chat.id,
      '✅ Оплата прошла успешно! Ваше объявление поднято.'
    );
  } catch (error) {
    console.error('Successful payment handling error:', error);
    await bot.sendMessage(
      msg.chat.id,
      '❌ Произошла ошибка при обработке платежа. Пожалуйста, обратитесь в поддержку.'
    );
  }
};

module.exports = {
  createPayment,
  processTelegramPayment,
  getPaymentPrices,
  getUserPayments,
  createInvoiceLink,
  handlePreCheckoutQuery,
  handleSuccessfulPayment
};
