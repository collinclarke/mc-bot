"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNavigation = void 0;
var MinecraftData = require("minecraft-data");
var mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
function addNavigation(bot) {
    bot.loadPlugin(mineflayer_pathfinder_1.pathfinder);
    // Once we've spawn, it is safe to access mcData because we know the version
    var mcData = MinecraftData(bot.version);
    // We create different movement generators for different type of activity
    var defaultMove = new mineflayer_pathfinder_1.Movements(bot, mcData);
    bot.on('path_update', function (r) {
        var nodesPerTick = ((r.visitedNodes * 50) / r.time).toFixed(2);
        console.log("I can get there in " + r.path.length + " moves. Computation took " + r.time.toFixed(2) + " ms (" + nodesPerTick + " nodes/tick).");
    });
    bot.on('goal_reached', function (goal) {
        console.log('Here I am !', goal);
    });
    return defaultMove;
}
exports.addNavigation = addNavigation;
