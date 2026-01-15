require('dotenv').config()
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start(ctx => {
  ctx.reply('Бот Lavka26 запущен 🚀')
})

bot.launch()
console.log('Bot started')
