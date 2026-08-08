const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "DDRXXLzK#_aTe5gg0oXCszvxFaqS4XfKcxxkz__K2yeLrKSeFR6s",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot/blob/main/images/Chathunga-Dev-WhatsApp-Bot-Image.png?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 Chathunga-Dev Is Alive Now😍*",
BOT_OWNER: '94767945968',
};
