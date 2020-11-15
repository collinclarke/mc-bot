import MinecraftData = require('minecraft-data')
import * as mineflayer from 'mineflayer'
import { Movements, pathfinder } from 'mineflayer-pathfinder'

export function addNavigation (bot: mineflayer.Bot): Movements {
  bot.loadPlugin(pathfinder)

  // Once we've spawn, it is safe to access mcData because we know the version
  const mcData = MinecraftData(bot.version)

  // We create different movement generators for different type of activity
  const defaultMove = new Movements(bot, mcData)

  bot.on('path_update', (r) => {
    const nodesPerTick = ((r.visitedNodes * 50) / r.time).toFixed(2)
    console.log(`I can get there in ${r.path.length} moves. Computation took ${r.time.toFixed(2)} ms (${nodesPerTick} nodes/tick).`)
  })

  bot.on('goal_reached', (goal) => {
    console.log('Here I am !', goal)
  })

  return defaultMove
}