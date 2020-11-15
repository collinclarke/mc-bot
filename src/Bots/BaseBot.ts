import * as mineflayer from 'mineflayer'
import { addBasicLogging } from '../Utilities/logging'
import * as minecraftPvp from 'mineflayer-pvp'
import { addNavigation } from '../Utilities/navigation'
import { goals, Movements } from 'mineflayer-pathfinder'
import { generateDisobidienceMessage, generateFeelingsMessage } from '../Utilities/conversation'
const {
	GoalBlock, GoalFollow, GoalInvert, GoalNear, GoalXZ, GoalY,
} = goals
const pvp = minecraftPvp.plugin

export default class BaseBot {
  options: mineflayer.BotOptions
  allowedUsers: Record<string, { listening: boolean }> = {}
  responseDelay: number = 1000
  public bot: mineflayer.Bot
  playerWhoMessaged: mineflayer.Player | null
  currentTarget: mineflayer.Player['entity'] | null
  defaultMove: Movements

  constructor(options: {host: string, username: string, password: string}) {
    this.options = options
  }

  launch () {
    this.bot = mineflayer.createBot(this.options)
    addBasicLogging(this.bot)
    this.addBehavior()
  }

  addBehavior() {
    this.bot.once('spawn', () => {
      this.authorize(process.env.ALLOW_LIST)
      this.defaultMove = addNavigation(this.bot)
      this.bot.on('chat', (username: string, message: string) => {
        this.chatBehavior(username, message)
      })
      this.bot.on('whisper', (username: string, message: string) => {
        this.chatBehavior(username, message, true)
      })
    })
  }

  setMessageSender (player?: mineflayer.Player) {
    if (!player) return console.error('Failed to find message sender')
    this.playerWhoMessaged = player
    this.currentTarget = player?.entity
  }

  targetIsNull () {
    return !!this.currentTarget
  }

  chatBehavior (username: string, message: string, whisper?: boolean) {
    if (username === this.bot.username) return
    if (username === 'you') return

    this.setMessageSender(this.bot.players[username])
    
    const respond = (answer) => {
      setTimeout(() => {
        if (whisper) {
          this.bot.whisper(username, answer)
        } else {
          this.bot.chat(answer)
        }
      }, this.responseDelay)
    }

    
    if (message.toLowerCase().includes('how are you')) {
      respond(generateFeelingsMessage())
    }

    if (message.toLowerCase().includes('listen')) {
      const success = this.setListen(username, true)
      if (success) {
        respond('ok sure whats up? try "come", "goto", "follow", "avoid", "stop"')
      } else {
        respond(generateDisobidienceMessage())
      }
    }

    
    if (message === 'stop listening') {
      const success = this.setListen(username, false)
      if (success) {
        respond('ok i will leave you alone')
      }
    }

    if (!this.isListening(username)) {
      if (whisper) {
        respond('I was told not to talk to strangers')
      } else if (message.toLowerCase().includes('quadratum')) {
        respond('Hello stranger, ask me to listen if you want me to follow commands')
      }
      return
    }

    if (message.startsWith('kill')) {
      const cmd = message.split(' ')
      if (cmd.length > 1) {
        let killTarget
        if (cmd[1] === 'me') {
          killTarget = this.playerWhoMessaged.entity
        } else {
          const otherPlayer = this.bot.players[cmd[1]]
          if (!otherPlayer) return
          killTarget = otherPlayer.entity
        }
        this.bot.pvp.attack(killTarget)
      }
    }

    if (message === 'come') {
      if (this.targetIsNull()) return
      const p = this.currentTarget.position

      this.bot.pathfinder.setMovements(this.defaultMove)
      this.bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1))
    } else if (message.startsWith('goto')) {
      const cmd = message.split(' ')

      if (cmd.length === 4) { // goto x y z
        const x = parseInt(cmd[1], 10)
        const y = parseInt(cmd[2], 10)
        const z = parseInt(cmd[3], 10)

        this.bot.pathfinder.setMovements(this.defaultMove)
        this.bot.pathfinder.setGoal(new GoalBlock(x, y, z))
      } else if (cmd.length === 3) { // goto x z
        const x = parseInt(cmd[1], 10)
        const z = parseInt(cmd[2], 10)

        this.bot.pathfinder.setMovements(this.defaultMove)
        this.bot.pathfinder.setGoal(new GoalXZ(x, z))
      } else if (cmd.length === 2) { // goto y
        const y = parseInt(cmd[1], 10)

        this.bot.pathfinder.setMovements(this.defaultMove)
        this.bot.pathfinder.setGoal(new GoalY(y))
      }
    } else if (message === 'follow') {
      if (this.targetIsNull()) return
      this.bot.pathfinder.setMovements(this.defaultMove)
      this.bot.pathfinder.setGoal(new GoalFollow(this.currentTarget, 3), true)
      // follow is a dynamic goal: setGoal(goal, dynamic=true)
      // when reached, the goal will stay active and will not
      // emit an event
    } else if (message === 'avoid') {
      if (this.targetIsNull()) return
      this.bot.pathfinder.setMovements(this.defaultMove)
      this.bot.pathfinder.setGoal(new GoalInvert(new GoalFollow(this.currentTarget, 5)), true)
    } else if (message === 'stop') {
      this.bot.pvp.stop()
      this.bot.pathfinder.setGoal(null)
    }
  }


  private authorize (usernameList: string): void {
    usernameList.split(',').forEach((username) => {
      this.allowedUsers[username] = {
        listening: true,
      }
    })
  }

  private setListen (username: string, listening: boolean) {
    if (this.allowedUsers[username]) {
      this.allowedUsers[username].listening = listening
      return true
    }
    return false
  }

  private isListening(username:string) {
    return this.allowedUsers[username] && this.allowedUsers[username].listening
  }

}