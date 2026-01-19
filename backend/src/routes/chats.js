const express = require('express');
const Joi = require('joi');
const { supabase } = require('../services/supabaseService');

const router = express.Router();

// Validation schemas
const createChatSchema = Joi.object({
  adId: Joi.string().uuid().required()
});

const sendMessageSchema = Joi.object({
  text: Joi.string().min(1).max(1000).required(),
  imageUrl: Joi.string().uri().optional()
});

// GET /api/chats
router.get('/', async (req, res) => {
  try {
    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        *,
        ad:ad_id(id, title, images, user_id),
        buyer:buyer_id(username, first_name),
        seller:seller_id(username, first_name),
        last_message:messages(
          id, text, created_at, sender_id,
          sender:sender_id(username, first_name)
        )
      `)
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get unread message counts for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .neq('sender_id', req.user.id)
          .eq('is_read', false);

        return {
          ...chat,
          unreadCount: count || 0,
          last_message: chat.last_message[0] || null
        };
      })
    );

    res.json(chatsWithUnread);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// GET /api/chats/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: chat, error } = await supabase
      .from('chats')
      .select(`
        *,
        ad:ad_id(id, title, images, user_id, price),
        buyer:buyer_id(username, first_name),
        seller:seller_id(username, first_name)
      `)
      .eq('id', id)
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`)
      .single();

    if (error || !chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// GET /api/chats/:id/messages
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is part of the chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(username, first_name)
      `)
      .eq('chat_id', id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// POST /api/chats
router.post('/', async (req, res) => {
  try {
    const { error, value } = createChatSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { adId } = value;

    // Get ad details
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('user_id, title')
      .eq('id', adId)
      .eq('status', 'active')
      .single();

    if (adError || !ad) {
      return res.status(404).json({ error: 'Ad not found or not active' });
    }

    // Check if user is trying to chat with themselves
    if (ad.user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }

    // Check if chat already exists
    const { data: existingChat, error: checkError } = await supabase
      .from('chats')
      .select('*')
      .eq('ad_id', adId)
      .eq('buyer_id', req.user.id)
      .eq('seller_id', ad.user_id)
      .single();

    if (existingChat) {
      return res.status(409).json({ chat: existingChat });
    }

    // Create new chat
    const { data: chat, error: createError } = await supabase
      .from('chats')
      .insert({
        ad_id: adId,
        buyer_id: req.user.id,
        seller_id: ad.user_id
      })
      .select(`
        *,
        ad:ad_id(id, title, images),
        buyer:buyer_id(username, first_name),
        seller:seller_id(username, first_name)
      `)
      .single();

    if (createError) throw createError;

    res.status(201).json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// POST /api/chats/:id/messages
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify user is part of the chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: id,
        sender_id: req.user.id,
        text: value.text,
        image_url: value.imageUrl
      })
      .select(`
        *,
        sender:sender_id(username, first_name)
      `)
      .single();

    if (messageError) throw messageError;

    // Update chat's updated_at
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PUT /api/chats/:id/messages/read
router.put('/:id/messages/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'Message IDs array required' });
    }

    // Verify user is part of the chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    // Mark messages as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds)
      .neq('sender_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// DELETE /api/chats/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is part of the chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }

    // Delete chat (cascade will delete messages)
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

module.exports = router;
