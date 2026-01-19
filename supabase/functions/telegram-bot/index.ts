import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Telegraf, Markup } from 'https://esm.sh/telegraf@4.16.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookUpdate {
  update_id: number;
  message?: any;
  callback_query?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const ADMIN_ID = Deno.env.get('ADMIN_ID')
    const CHANNEL_ID = Deno.env.get('CHANNEL_ID')

    if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const bot = new Telegraf(BOT_TOKEN)

    // Главное меню
    const mainMenu = Markup.keyboard([
      ['📄 Смотреть объявления'],
      ['➕ Создать объявление'],
      ['❤️ Избранное', '🔍 Поиск'],
      ['⚙ Настройки']
    ]).resize()

    // Категории
    const categoriesKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🚗 Транспорт', 'category_transport')],
      [Markup.button.callback('🏠 Недвижимость', 'category_real_estate')],
      [Markup.button.callback('💼 Работа', 'category_jobs')],
      [Markup.button.callback('🛠 Услуги', 'category_services')],
      [Markup.button.callback('👕 Личные вещи', 'category_personal')],
      [Markup.button.callback('📱 Электроника', 'category_electronics')],
      [Markup.button.callback('🌿 Дом и сад', 'category_home_garden')],
      [Markup.button.callback('🐶 Животные', 'category_animals')],
      [Markup.button.callback('🎮 Хобби и отдых', 'category_hobby')],
      [Markup.button.callback('🏭 Для бизнеса', 'category_business')],
      [Markup.button.callback('💄 Красота и здоровье', 'category_beauty')],
      [Markup.button.callback('✈ Билеты и путешествия', 'category_travel')],
      [Markup.button.callback('🏗 Строительство и ремонт', 'category_construction')],
      [Markup.button.callback('📦 Прочее', 'category_other')],
      [Markup.button.callback('⬅ Назад', 'back_to_main')]
    ])

    // Получить или создать пользователя
    async function getOrCreateUser(telegramId: number, userData: any) {
      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single()

      if (!user) {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            telegram_id: telegramId,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name
          })
          .select()
          .single()
        
        user = newUser
      }

      return user
    }

    // Команда /start
    bot.start(async (ctx: any) => {
      const welcomeText = `👋 Добро пожаловать в Lavka26
Торговая площадка объявлений города Михайловска

Выберите действие в меню ниже:`

      await ctx.reply(welcomeText, mainMenu)
    })

    // Показать категории
    bot.hears('📄 Смотреть объявления', async (ctx: any) => {
      await ctx.reply('Выберите категорию:', categoriesKeyboard)
    })

    // Создать объявление
    bot.hears('➕ Создать объявление', async (ctx: any) => {
      await ctx.reply(
        '📝 Функция создания объявлений в разработке\n\n' +
        'Скоро вы сможете создавать объявления с фото и описанием!',
        mainMenu
      )
    })

    // Другие кнопки меню
    bot.hears('❤️ Избранное', async (ctx: any) => {
      await ctx.reply('❤️ Ваши избранные объявления:\n\n(Пусто)', mainMenu)
    })

    bot.hears('🔍 Поиск', async (ctx: any) => {
      await ctx.reply(
        '🔍 Введите слово для поиска:\n(например: айфон, диван, работа)',
        mainMenu
      )
    })

    bot.hears('⚙ Настройки', async (ctx: any) => {
      await ctx.reply(
        '⚙ Настройки Lavka26\n\n' +
        '📄 Мои объявления\n' +
        '🔔 Уведомления\n' +
        '💳 История оплат\n' +
        '📞 Поддержка',
        Markup.inlineKeyboard([
          [Markup.button.callback('📄 Мои объявления', 'my_ads')],
          [Markup.button.callback('⬅ Назад', 'back_to_main')]
        ])
      )
    })

    // Обработка callback
    bot.on('callback_query', async (ctx: any) => {
      const action = ctx.callbackQuery.data
      
      if (action === 'back_to_main') {
        await ctx.editMessageText(
          'Выберите действие в меню ниже:',
          mainMenu
        )
      } else if (action === 'my_ads') {
        await ctx.editMessageText(
          '📄 Мои объявления:\n\n(У вас пока нет объявлений)',
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅ Назад', 'back_to_main')]
          ])
        )
      }
      
      await ctx.answer()
    })

    // Получаем update из запроса
    const update: WebhookUpdate = await req.json()
    
    // Обрабатываем update
    await bot.handleUpdate(update)

    return new Response(
      JSON.stringify({ status: 'ok' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
