const { cmd } = require("../command");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd(
  {
    pattern: "save",
    alias: ["status", "savestatus", "getstatus"],
    react: "📥",
    desc: "Save WhatsApp Status",
    category: "download",
    filename: __filename,
  },
  async (chathubro, mek, m, { from, quoted, reply }) => {
    try {
      if (!quoted) return reply("❌ *Please reply to a WhatsApp status!*");

      await reply("⏳ *Saving status...*");

      let qMsg = quoted.fakeObj ? quoted.fakeObj : mek.quoted;
      let msgType = Object.keys(qMsg.message || {})[0];

      if (msgType === 'ephemeralMessage') {
        qMsg = qMsg.message.ephemeralMessage;
        msgType = Object.keys(qMsg.message || {})[0];
      }

      const innerMsg = qMsg.message[msgType];
      
      if (['imageMessage', 'videoMessage'].includes(msgType)) {
        const mediaType = msgType === 'imageMessage' ? 'image' : 'video';
        const stream = await downloadContentFromMessage(innerMsg, mediaType);
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        const caption = innerMsg.caption || "";

        if (mediaType === 'image') {
          await chathubro.sendMessage(from, { image: buffer, caption: caption }, { quoted: mek });
        } else {
          await chathubro.sendMessage(from, { video: buffer, caption: caption }, { quoted: mek });
        }
      } else if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
        const text = innerMsg.text || innerMsg;
        await chathubro.sendMessage(from, { text: `📥 *Saved Status:* \n\n${text}` }, { quoted: mek });
      } else {
        await chathubro.sendMessage(from, { forward: qMsg }, { quoted: mek });
      }

      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
      console.error("Status Save Error:", e);
      reply("❌ *Error: Could not save status.*");
    }
  }
);
