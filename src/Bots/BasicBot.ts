import * as mineflayer from 'mineflayer'
var blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
import { generateFeelingsMessage } from '../Utilities/conversation';

export default class BasicBot {
    options: mineflayer.BotOptions
    currentTarget: mineflayer.Player['entity']
    allowedUsers: Record<string, boolean> = {}
    public bot: mineflayer.Bot

    constructor(options: {host: string, username: string, password: string}) {
      this.options = options
    }

    public launch() {
      this.bot = mineflayer.createBot(this.options)
      this.bot.once('spawn', () => {
        this.initPlugins()
        this.handleMessage()
        this.authorize(process.env.ALLOW_LIST)
      })
    }

    initPlugins (): void {
      this.bot.loadPlugin(blockFinderPlugin);
    }

    public respond (answer: string, username?: string) {
      setTimeout(() => {
        if (username) {
          this.bot.whisper(username, answer)
        } else {
          this.bot.chat(answer)
        }
      }, Math.floor(Math.random() * 500))
    }

    setTarget (entity?: mineflayer.Player['entity']) {
      this.currentTarget = entity
    }

    get noTarget () {
      return !this.currentTarget
    }

    private handleMessage () {
      this.bot.on('chat', (username: string, message: string) => {
        if (username === this.bot.username) return
        if (username === 'you') return
        this.setTarget(this.bot.players[username]?.entity)
        if (this.isListening(username)) this.parseMessage(username, message)
      })
      this.bot.on('whisper', (username: string, message: string) => {
        if (username === this.bot.username) return
        if (username === 'you') return
        this.setTarget(this.bot.players[username]?.entity)
        if (this.isListening(username)) {
          this.parseMessage(username, message, true)
        } else {
          this.respond('I dont know you', username)
        }
      })
    }

    public findBed () {
      this.bot.findBlock({
        point: this.bot.entity.position,
        matching: 56,
        maxDistance: 256,
        count: 1,
      });
    }

    public clanHome () {
      this.bot.chat('/clan home')
    }

    parseMessage(username:string, message: string, whisper?:boolean) {
      if (message.toLowerCase().includes('how are you')) {
        this.respond(generateFeelingsMessage(), whisper ? username : null)
      }

      if(message.toLowerCase() == "sleep here"){
        this.findBed()
      }

      if (message.toLowerCase() == 'clan home'){
        this.clanHome()
      }
    }

    private authorize (usernameList: string): void {
      usernameList.split(',').forEach((username) => {
        this.allowedUsers[username] = true
      })
    }
  
    private isListening(username:string) {
      return this.allowedUsers[username]
    }
}
