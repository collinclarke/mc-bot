"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mineflayer = require("mineflayer");
var logging_1 = require("../Utilities/logging");
var minecraftPvp = require("mineflayer-pvp");
var navigation_1 = require("../Utilities/navigation");
var mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
var conversation_1 = require("../Utilities/conversation");
var GoalBlock = mineflayer_pathfinder_1.goals.GoalBlock, GoalFollow = mineflayer_pathfinder_1.goals.GoalFollow, GoalInvert = mineflayer_pathfinder_1.goals.GoalInvert, GoalNear = mineflayer_pathfinder_1.goals.GoalNear, GoalXZ = mineflayer_pathfinder_1.goals.GoalXZ, GoalY = mineflayer_pathfinder_1.goals.GoalY;
var pvp = minecraftPvp.plugin;
var BaseBot = /** @class */ (function () {
    function BaseBot(options) {
        this.responseDelay = 1000;
        this.options = options;
    }
    BaseBot.prototype.launch = function () {
        this.bot = mineflayer.createBot(this.options);
        logging_1.addBasicLogging(this.bot);
        this.addBehavior();
    };
    BaseBot.prototype.addBehavior = function () {
        var _this = this;
        this.bot.once('spawn', function () {
            _this.authorize(process.env.ALLOW_LIST);
            _this.defaultMove = navigation_1.addNavigation(_this.bot);
            _this.bot.on('chat', function (username, message) {
                _this.chatBehavior(username, message);
            });
            _this.bot.on('whisper', function (username, message) {
                _this.chatBehavior(username, message, true);
            });
        });
    };
    BaseBot.prototype.setMessageSender = function (player) {
        if (!player)
            return console.error('Failed to find message sender');
        this.playerWhoMessaged = player;
        this.currentTarget = player === null || player === void 0 ? void 0 : player.entity;
    };
    BaseBot.prototype.targetIsNull = function () {
        return !!this.currentTarget;
    };
    BaseBot.prototype.chatBehavior = function (username, message, whisper) {
        var _this = this;
        if (username === this.bot.username)
            return;
        if (username === 'you')
            return;
        this.setMessageSender(this.bot.players[username]);
        var respond = function (answer) {
            setTimeout(function () {
                if (whisper) {
                    _this.bot.whisper(username, answer);
                }
                else {
                    _this.bot.chat(answer);
                }
            }, _this.responseDelay);
        };
        if (message.toLowerCase().includes('how are you')) {
            respond(conversation_1.generateFeelingsMessage());
        }
        if (message.toLowerCase().includes('listen')) {
            var success = this.setListen(username, true);
            if (success) {
                respond('ok sure whats up? try "come", "goto", "follow", "avoid", "stop"');
            }
            else {
                respond(conversation_1.generateDisobidienceMessage());
            }
        }
        if (message === 'stop listening') {
            var success = this.setListen(username, false);
            if (success) {
                respond('ok i will leave you alone');
            }
        }
        if (!this.isListening(username)) {
            if (whisper) {
                respond('I was told not to talk to strangers');
            }
            else if (message.toLowerCase().includes('quadratum')) {
                respond('Hello stranger, ask me to listen if you want me to follow commands');
            }
            return;
        }
        if (message.startsWith('kill')) {
            var cmd = message.split(' ');
            if (cmd.length > 1) {
                var killTarget = void 0;
                if (cmd[1] === 'me') {
                    killTarget = this.playerWhoMessaged.entity;
                }
                else {
                    var otherPlayer = this.bot.players[cmd[1]];
                    if (!otherPlayer)
                        return;
                    killTarget = otherPlayer.entity;
                }
                this.bot.pvp.attack(killTarget);
            }
        }
        if (message === 'come') {
            if (this.targetIsNull())
                return;
            var p = this.currentTarget.position;
            this.bot.pathfinder.setMovements(this.defaultMove);
            this.bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1));
        }
        else if (message.startsWith('goto')) {
            var cmd = message.split(' ');
            if (cmd.length === 4) { // goto x y z
                var x = parseInt(cmd[1], 10);
                var y = parseInt(cmd[2], 10);
                var z = parseInt(cmd[3], 10);
                this.bot.pathfinder.setMovements(this.defaultMove);
                this.bot.pathfinder.setGoal(new GoalBlock(x, y, z));
            }
            else if (cmd.length === 3) { // goto x z
                var x = parseInt(cmd[1], 10);
                var z = parseInt(cmd[2], 10);
                this.bot.pathfinder.setMovements(this.defaultMove);
                this.bot.pathfinder.setGoal(new GoalXZ(x, z));
            }
            else if (cmd.length === 2) { // goto y
                var y = parseInt(cmd[1], 10);
                this.bot.pathfinder.setMovements(this.defaultMove);
                this.bot.pathfinder.setGoal(new GoalY(y));
            }
        }
        else if (message === 'follow') {
            if (this.targetIsNull())
                return;
            this.bot.pathfinder.setMovements(this.defaultMove);
            this.bot.pathfinder.setGoal(new GoalFollow(this.currentTarget, 3), true);
            // follow is a dynamic goal: setGoal(goal, dynamic=true)
            // when reached, the goal will stay active and will not
            // emit an event
        }
        else if (message === 'avoid') {
            if (this.targetIsNull())
                return;
            this.bot.pathfinder.setMovements(this.defaultMove);
            this.bot.pathfinder.setGoal(new GoalInvert(new GoalFollow(this.currentTarget, 5)), true);
        }
        else if (message === 'stop') {
            this.bot.pvp.stop();
            this.bot.pathfinder.setGoal(null);
        }
    };
    BaseBot.prototype.authorize = function (usernameList) {
        var _this = this;
        usernameList.split(',').forEach(function (username) {
            _this.allowedUsers[username] = {
                listening: true,
            };
        });
    };
    BaseBot.prototype.setListen = function (username, listening) {
        if (this.allowedUsers[username]) {
            this.allowedUsers[username].listening = listening;
            return true;
        }
        return false;
    };
    BaseBot.prototype.isListening = function (username) {
        return this.allowedUsers[username] && this.allowedUsers[username].listening;
    };
    return BaseBot;
}());
exports.default = BaseBot;
