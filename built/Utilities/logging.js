"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBasicLogging = void 0;
function addBasicLogging(bot) {
    bot.on('login', function () {
        console.log('I logged in.');
        console.log('settings', bot.settings);
    });
    bot.on('kicked', function (reason) {
        console.log('I got kicked for', reason, 'lol');
    });
    bot.on('error', function (err) {
        console.log(err);
    });
}
exports.addBasicLogging = addBasicLogging;
