const { cmd } = require("../command");

const thanksKeywords = ["thank", "thanks", "tq", "thnx", "thankyou", "ස්තූතියි", "Thank you"];

module.exports = {
  thanksFilter: (body) => {
    if (!body) return false;
    const text = body.toLowerCase();
    return thanksKeywords.some(keyword => text.includes(keyword));
  },
  
  sendThanksReply: async (chathubro, mek, m, { from }) => {
    const thankMsg = `╭━━━〔 *✨ YOU'RE WELCOME* 〕━━━╮\n┃\n┃ 🙌 *You're most welcome, bro!* \n┃ 🚀 Always happy to help you out.\n┃ ✨ Have a great day ahead!\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n> *© 2026 | Powered by Chathunga Bimsara*`;
    
    await chathubro.sendMessage(from, { text: thankMsg }, { quoted: mek });
  }
};
