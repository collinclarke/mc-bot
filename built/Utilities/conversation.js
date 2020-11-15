"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFeelingsMessage = exports.generateDisobidienceMessage = void 0;
function generateDisobidienceMessage() {
    var messageIndex = Math.floor(Math.random() * 10);
    var messages = [
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
exports.generateDisobidienceMessage = generateDisobidienceMessage;
function generateFeelingsMessage() {
    var messageIndex = Math.floor(Math.random() * 10);
    var messages = [
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
exports.generateFeelingsMessage = generateFeelingsMessage;
