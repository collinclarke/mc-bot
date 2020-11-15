import { generateDisobidienceMessage } from "src/Utilities/conversation";

import * as minecraftPvp from 'mineflayer-pvp'
const pvp = minecraftPvp.plugin
import BasicBot from "./BasicBot";
import NavigationBot from "./NavigationBot";

export default class CombatBot extends NavigationBot {
  initPlugins() {
    super.initPlugins()
    this.bot.loadPlugin(pvp)
  }
  parseMessage(username: string, message: string, whisper?:boolean) {
    super.parseMessage(username, message, whisper)
    if (message.startsWith('kill')) {
      const cmd = message.split(' ')
      if (cmd.length > 1) {
        let killTarget
        if (cmd[1] === 'me') {
          killTarget = this.currentTarget
        } else {
          const otherPlayer = this.bot.players[cmd[1]]
          if (!otherPlayer) return
          killTarget = otherPlayer.entity
        }
        this.bot.pvp.attack(killTarget)
      }
    }
  }
}