import * as mineflayer from 'mineflayer'
var blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
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

      if(message.toLowerCase() == "sleep here")
      {
       // let p = this.bot.players[username];
      // let bed = this.bot.blockAt( p.entity.position, extraInfos=true)
      // this.bot.sleep(bed,()=>{});

      var b =  this.bot.findBlock({
        point: this.bot.entity.position,
        matching: 56,
        maxDistance: 256,
        count: 1,
      });

      }
    }
}
