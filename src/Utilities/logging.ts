import * as mineflayer from 'mineflayer'

export function addBasicLogging (bot: mineflayer.Bot): void {
  bot.on('login', () => {
		console.log('I logged in.')
		console.log('settings', bot.settings)
	})

	bot.on('kicked', (reason) => {
		console.log('I got kicked for', reason, 'lol')
	})

	bot.on('error', (err) => {
		console.log(err)
	})
}