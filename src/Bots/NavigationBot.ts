import MinecraftData = require("minecraft-data");
import { Movements, pathfinder, goals } from "mineflayer-pathfinder";
const {
	GoalBlock, GoalFollow, GoalInvert, GoalNear, GoalXZ, GoalY, GoalGetToBlock
} = goals
import BasicBot from "./BasicBot";
import { Vec3 } from "vec3";

export default class NavigationBot extends BasicBot {
  defaultMove: Movements;

  initPlugins() {
    super.initPlugins()
    this.bot.loadPlugin(pathfinder)
    const mcData = MinecraftData(this.bot.version)
    this.defaultMove = new Movements(this.bot, mcData)
    this.addBaseNavigationEvents()
  }

  addBaseNavigationEvents () {
    this.bot.on('path_update', (r) => {
      const nodesPerTick = ((r.visitedNodes * 50) / r.time).toFixed(2)
      console.log(`I can get there in ${r.path.length} moves. Computation took ${r.time.toFixed(2)} ms (${nodesPerTick} nodes/tick).`)
    })
  
    this.bot.on('goal_reached', (goal) => {
      console.log('Here I am !', goal)
    })
  }

  parseMessage(username: string, message: string, whisper?:boolean) {
    super.parseMessage(username, message, whisper)
    if (message === 'come') {
      if (this.noTarget) return
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
      if (this.noTarget) return
      this.bot.pathfinder.setMovements(this.defaultMove)
      this.bot.pathfinder.setGoal(new GoalFollow(this.currentTarget, 3), true)
      // follow is a dynamic goal: setGoal(goal, dynamic=true)
      // when reached, the goal will stay active and will not
      // emit an event
    } else if (message === 'avoid') {
      if (this.noTarget) return
      this.bot.pathfinder.setMovements(this.defaultMove)
      this.bot.pathfinder.setGoal(new GoalInvert(new GoalFollow(this.currentTarget, 5)), true)
    } else if (message === 'stop') {
      this.bot.pathfinder.setGoal(null)
    }
  }

  goTo(p: Vec3){       
    this.bot.pathfinder.setMovements(this.defaultMove)
    this.bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 4))
    console.log("Going to buildspot")
  }
}
