import * as dotenv from "dotenv";
import CombatBot from "./Bots/CombatBot";
dotenv.config()

const USER_OPTIONS = {
	host: process.env.AZYROS_ADDRESS,
	username: process.env.BOT_USERNAME,
	password: process.env.BOT_PASSWORD,
	port: Number(process.env.PORT)
}

const currentBot = new CombatBot(USER_OPTIONS)

function initInput() {
	process.stdin.resume()
	process.stdin.setEncoding('utf8')
	console.log('Listening for input, Type quit or exit to end process, type start to relaunch bot')

	function done() {
		console.log('Now that process.stdin is paused, there is nothing more to do.')
		process.exit()
	}

	process.stdin.on('data', (text) => {
		const input = text.toString().trim().toLowerCase()
		switch (input) {
		case 'start':
			currentBot.launch()
			break
		case 'exit':
		case 'quit':
			done()
			break
		default:
			console.log(input)
		}
	})
}

initInput()
currentBot.launch()
