import * as mineflayer from 'mineflayer'
var blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
import { generateFeelingsMessage, isAskingWhereYouAre } from '../Utilities/conversation';

export default class BasicBot {
    options: mineflayer.BotOptions
    currentTarget: mineflayer.Player['entity']
    allowedUsers: Record<string, boolean> = {}
    public bot: mineflayer.Bot

    constructor(options: {host: string, username: string, password?: string, port?: number}) {
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
      },500+ Math.floor(Math.random() * 500))
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
    
    let b = this.bot.findBlock({
        point: this.bot.entity.position,
        matching: block => this.bot.isABed(block), // bed ids
        maxDistance: 256,
        count: 1,
      },(e,bl) =>{
        if(bl.length)
        {
          this.bot.chat(bl[0].position.toString());
          this.bot.sleep(bl[0],(err)=>{
            if(err)
              this.bot.chat(err.toString());
          })
          //this.bot.chat(bl[0].position.toString());
        }
      });

    }

    public clanHome () {
      this.bot.chat('/clan home')
    }

    public reportPosition()
    {
      let x = this.bot.entity.position.x.toFixed().toString();
      let y = this.bot.entity.position.y.toFixed().toString();
      let z = this.bot.entity.position.z.toFixed().toString();

      this.respond("I'm at " + x + " " + y + " " + z);
    }

    public skipNight () {
      this.bot.chat('/sn')
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

      if (message.toLowerCase() == 'skipnight'){
        this.skipNight()
      }

      if(message.toLowerCase().includes(process.env.NICKNAME.toLowerCase()) && isAskingWhereYouAre(message.toLowerCase()))
      {
        this.reportPosition()
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
