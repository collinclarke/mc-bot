require('dotenv').config();

const MinecraftData = require('minecraft-data');
const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const {
  GoalBlock, GoalFollow, GoalInvert, GoalNear, GoalXZ, GoalY,
} = require('mineflayer-pathfinder').goals;
const pvp = require('mineflayer-pvp').plugin;

const allowedUsers = {};

function authorize(usernameList) {
  usernameList.split(',').forEach((username) => {
    allowedUsers[username] = {
      listening: true,
    };
  });
}

function setListen(username, listen) {
  if (allowedUsers[username]) {
    allowedUsers[username].listening = listen;
    return true;
  }
  return false;
}

function listening(username) {
  return allowedUsers[username] && allowedUsers[username].listening;
}

function generateDisobidienceMessage() {
  const messageIndex = Math.floor(Math.random() * 10);
  const messages = [
    'leave me alone',
    'stop',
    'i do not take commands from you',
    'shh',
    'stfu',
    'lol',
    'nerd',
    'ok quiet now',
    'why should i?',
    'who are you?',
    'you are not my friend',
  ];
  return messages[messageIndex];
}

function generateFeelingsMessage() {
  const messageIndex = Math.floor(Math.random() * 10);
  const messages = [
    'leave me alone',
    'dont talk to me',
    'im good, how are you?',
    'excited to explore Azyros',
    'stfu',
    'gfys',
    'kys asap',
    'ok quiet now',
    'im depressed',
    'im feeling alright...',
    'im eager to actually do something...',
  ];
  return messages[messageIndex];
}

const USER_OPTIONS = {
  host: process.env.AZYROS_ADDRESS,
  username: process.env.BOT_USERNAME,
  password: process.env.BOT_PASSWORD,
};

function setBehavior(bot) {
  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);

  bot.once('spawn', () => {
    authorize(process.env.ALLOW_LIST);

    // Once we've spawn, it is safe to access mcData because we know the version
    const mcData = MinecraftData(bot.version);

    // We create different movement generators for different type of activity
    const defaultMove = new Movements(bot, mcData);

    bot.on('path_update', (r) => {
      const nodesPerTick = ((r.visitedNodes * 50) / r.time).toFixed(2);
      console.log(`I can get there in ${r.path.length} moves. Computation took ${r.time.toFixed(2)} ms (${nodesPerTick} nodes/tick).`);
    });

    bot.on('goal_reached', (goal) => {
      console.log('Here I am !', goal);
    });

    const chatFunctionality = (whisper) => (username, message) => {
      if (username === bot.username) return;
      if (username === 'you') return;

      const respond = (answer) => {
        if (whisper) {
          bot.whisper(username, answer);
        } else {
          bot.chat(answer);
        }
      };

      if (message.toLowerCase().includes('how are you')) {
        setTimeout(() => { respond(generateFeelingsMessage()); }, 1500);
      }

      if (message.toLowerCase().includes('listen')) {
        const success = setListen(username, true, bot);
        if (success) {
          respond('ok sure whats up? try "come", "goto", "follow", "avoid", "stop"');
        } else {
          respond(generateDisobidienceMessage());
        }
      }

      if (message === 'stop listening') {
        const success = setListen(username, false);
        if (success) {
          respond('ok i will leave you alone');
        }
      }

      if (!listening(username)) {
        if (whisper) {
          respond('I was told not to talk to strangers');
        } else if (message.toLowerCase().includes('quadratum')) {
          respond('Hello stranger, ask me to listen if you want me to follow commands');
        }
        return;
      }

      const player = bot.players[username];
      const target = player.entity;

      const isTargetNull = () => {
        if (!target || !target.position) {
          bot.chat('I have no idea where you are');
          return true;
        }
        return false;
      };

      if (!target) {
        respond('');
      }

      if (message.startsWith('kill')) {
        const cmd = message.split(' ');
        if (cmd.length > 1) {
          let killTarget = null;

          if (cmd[1] === 'me') {
            killTarget = target;
          } else {
            const otherPlayer = bot.players[cmd[1]];
            if (!otherPlayer) { return; }

            killTarget = otherPlayer.entity;
          }
          bot.pvp.attack(killTarget);
        }
      }

      if (message === 'come') {
        if (isTargetNull(bot)) return;
        const p = target.position;

        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1));
      } else if (message.startsWith('goto')) {
        const cmd = message.split(' ');

        if (cmd.length === 4) { // goto x y z
          const x = parseInt(cmd[1], 10);
          const y = parseInt(cmd[2], 10);
          const z = parseInt(cmd[3], 10);

          bot.pathfinder.setMovements(defaultMove);
          bot.pathfinder.setGoal(new GoalBlock(x, y, z));
        } else if (cmd.length === 3) { // goto x z
          const x = parseInt(cmd[1], 10);
          const z = parseInt(cmd[2], 10);

          bot.pathfinder.setMovements(defaultMove);
          bot.pathfinder.setGoal(new GoalXZ(x, z));
        } else if (cmd.length === 2) { // goto y
          const y = parseInt(cmd[1], 10);

          bot.pathfinder.setMovements(defaultMove);
          bot.pathfinder.setGoal(new GoalY(y));
        }
      } else if (message === 'follow') {
        if (isTargetNull(bot)) return;
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalFollow(target, 3), true);
        // follow is a dynamic goal: setGoal(goal, dynamic=true)
        // when reached, the goal will stay active and will not
        // emit an event
      } else if (message === 'avoid') {
        if (isTargetNull(bot)) return;
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalInvert(new GoalFollow(target, 5)), true);
      } else if (message === 'stop') {
        bot.pvp.stop();
        bot.pathfinder.setGoal(null);
      }
    };

    bot.on('chat', chatFunctionality(false));
    bot.on('whisper', chatFunctionality(true));
  });
}

function launchBot(options) {
  const bot = mineflayer.createBot(options);
  bot.on('login', () => {
    console.log('I logged in.');
    console.log('settings', bot.settings);
  });

  bot.on('kicked', (reason) => {
    console.log('I got kicked for', reason, 'lol');
  });

  bot.on('error', (err) => {
    console.log(err);
  });

  setBehavior(bot);
}

launchBot(USER_OPTIONS);
