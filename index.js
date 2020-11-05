require('dotenv').config()

const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: process.env.AZYROS_ADDRESS,
  username: process.env.BOT_USERNAME,
  password: process.env.BOT_PASSWORD
})

bot.on('chat', function (username, message) {
  if (username === bot.username) return
  bot.chat(message)
})

// Log errors and kick reasons:
bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn))
bot.on('error', err => console.log(err))