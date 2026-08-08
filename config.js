const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "WbBB2bRK#aiumGjXHqmSfOO03G5fWcHu1ZZKFGA645iuz30mxq-0",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot/blob/main/images/Chathunga-Dev-WhatsApp-Bot-Image.png?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 Chathunga-Dev Chat Bot Is Live Now😍*",
BOT_OWNER: '94767945968',
};
