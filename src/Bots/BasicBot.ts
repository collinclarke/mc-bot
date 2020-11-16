import * as mineflayer from 'mineflayer'
import { generateFeelingsMessage } from '../Utilities/conversation';

export default class BasicBot {
    options: mineflayer.BotOptions
    currentTarget: mineflayer.Player['entity']
    public bot: mineflayer.Bot

    constructor(options: {host: string, username: string, password: string}) {
      this.options = options
    }

    public launch() {
      this.bot = mineflayer.createBot(this.options)
      this.bot.once('spawn', () => {
        this.initPlugins()
        this.handleMessage()
      })
    }

    initPlugins (): void {}

    public respond (answer: string, username?: string) {
      setTimeout(() => {
        if (username) {
          this.bot.whisper(username, answer)
        } else {
          this.bot.chat(answer)
        }
      }, Math.floor(Math.random() * 500))
    }

    setTarget (player?: mineflayer.Player) {
      this.currentTarget = player.entity
    }

    private handleMessage () {
      this.bot.on('chat', (username: string, message: string) => {
        if (username === this.bot.username) return
        if (username === 'you') return
        this.setTarget(this.bot.players[username])
        this.parseMessage(username, message)
      })
      this.bot.on('whisper', (username: string, message: string) => {
        if (username === this.bot.username) return
        if (username === 'you') return
        this.setTarget(this.bot.players[username])
        this.parseMessage(username, message, true)
      })
    }

    parseMessage(username:string, message: string, whisper?:boolean) {
      if (message.toLowerCase().includes('how are you')) {
        this.respond(generateFeelingsMessage(), whisper ? username : null)
      }
    }
}
