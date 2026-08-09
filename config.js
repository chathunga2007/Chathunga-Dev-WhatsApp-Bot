const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "2eZ03YSC#UwdC1ICGHD0bDaoDOnDaWR8tMzYQadhWVlvGZ00Z6oo",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot/blob/main/images/Chathunga-Dev-WhatsApp-Bot-Image.png?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || `╔═════════════════════════╗
║     ✨ *CHATHUNGA-DEV* ✨      
╚═════════════════════════╝

╭───────────────◆
│ 👋 *Hey there! I am Online & Ready!*
├───────────────◆
│ 🤖 *Bot Name:* Chathunga-Dev
│ 💻 *Platform:* Linux / Cloud Server
│ ⚡ *Status:* Active & Stable
│ 👤 *Owner:* Chathunga Bimsara
│ 📞 *Contact:* 94767945968
│ 🚀 *Speed:* Lightning Fast 
│ 🛡 *Mode:* Public / Multi-Device
└───────────────◆

> *🔥 The Ultimate WhatsApp Bot Powered by Advanced Node.js Architecture!*
> *© 2026 | Powered by Chathunga Bimsara*`,
BOT_OWNER: '94767945968',
AUTO_STATUS_SEEN: 'false',
AUTO_STATUS_REACT: 'false',
};
