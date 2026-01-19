const jwt = require('jsonwebtoken');
const { supabase } = require('./supabaseService');
const { sendTelegramNotification } = require('./telegramService');

const connectedUsers = new Map(); // userId -> socketId

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', decoded.telegramId)
        .single();

      if (error || !user || user.is_blocked) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user.id;
      socket.telegramId = user.telegram_id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    connectedUsers.set(socket.userId, socket.id);

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    // Handle joining chat rooms
    socket.on('join_chat', async (chatId) => {
      try {
        const { data: chat, error } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .or(`buyer_id.eq.${socket.userId},seller_id.eq.${socket.userId}`)
          .single();

        if (!error && chat) {
          socket.join(`chat_${chatId}`);
          socket.emit('joined_chat', chatId);
        } else {
          socket.emit('error', 'Chat not found or access denied');
        }
      } catch (error) {
        socket.emit('error', 'Failed to join chat');
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { chatId, text, imageUrl } = data;

        // Verify user is part of the chat
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .or(`buyer_id.eq.${socket.userId},seller_id.eq.${socket.userId}`)
          .single();

        if (chatError || !chat) {
          socket.emit('error', 'Chat not found or access denied');
          return;
        }

        // Insert message
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatId,
            sender_id: socket.userId,
            text,
            image_url: imageUrl
          })
          .select(`
            *,
            sender:sender_id(username, first_name)
          `)
          .single();

        if (messageError) {
          socket.emit('error', 'Failed to send message');
          return;
        }

        // Update chat's updated_at
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chatId);

        // Send to all users in the chat
        io.to(`chat_${chatId}`).emit('new_message', message);

        // Send Telegram notification to the other user
        const recipientId = chat.buyer_id === socket.userId ? chat.seller_id : chat.buyer_id;
        const { data: recipient } = await supabase
          .from('users')
          .select('telegram_id')
          .eq('id', recipientId)
          .single();

        if (recipient) {
          await sendTelegramNotification(
            recipient.telegram_id,
            'Новое сообщение',
            `У вас новое сообщение в чате по объявлению`
          );
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle marking messages as read
    socket.on('mark_read', async (messageIds) => {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', messageIds)
          .neq('sender_id', socket.userId); // Only mark others' messages as read

        socket.emit('messages_marked_read', messageIds);
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (chatId) => {
      socket.to(`chat_${chatId}`).emit('user_typing', { userId: socket.userId, typing: true });
    });

    socket.on('typing_stop', (chatId) => {
      socket.to(`chat_${chatId}`).emit('user_typing', { userId: socket.userId, typing: false });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      connectedUsers.delete(socket.userId);
    });
  });
};

const getConnectedUsers = () => connectedUsers;

module.exports = {
  initializeSocket,
  getConnectedUsers
};
