const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const tempFolder = path.join(__dirname, '../temp');
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder, { recursive: true });
}

function unwrapViewOnce(message) {
  if (!message) return null;
  if (message.viewOnceMessage) return message.viewOnceMessage.message;
  if (message.viewOnceMessageV2) return message.viewOnceMessageV2.message;
  if (message.viewOnceMessageV2Extension) return message.viewOnceMessageV2Extension.message;
  if (message.ephemeralMessage) return unwrapViewOnce(message.ephemeralMessage.message);
  return message;
}

module.exports = {
  name: "antiviewonce",

  onMessage: async (conn, mek) => {
    try {
      if (!mek?.message || mek.key.fromMe) return;

      const msgContent = unwrapViewOnce(mek.message);
      if (!msgContent) return;

      const type = Object.keys(msgContent)[0];
      if (!type) return;

      const mediaMsg = msgContent[type];
      if (!mediaMsg || !mediaMsg.viewOnce) return;

      const from = mek.key.remoteJid;
      const sender = mek.key.participant || from;

      const stream = await downloadContentFromMessage(
        mediaMsg,
        type.replace('Message', '')
      );

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (!buffer.length) return;

      const ext = type === 'imageMessage' ? '.jpg' : '.mp4';
      const filePath = path.join(tempFolder, `vo_${Date.now()}${ext}`);
      await fs.promises.writeFile(filePath, buffer);

      let caption = 
`╭━━━〔 *👁️ VIEW ONCE RECOVERED* 〕━━━╮
┃
┃ 👤 *Sender:* @${sender.split('@')[0]}
┃ 🕒 *Time:* ${new Date().toLocaleTimeString()}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`;

      if (type === 'imageMessage') {
        await conn.sendMessage(from, { 
          image: { url: filePath }, 
          caption: caption,
          mentions: [sender]
        }, { quoted: mek });
      } else if (type === 'videoMessage') {
        await conn.sendMessage(from, { 
          video: { url: filePath }, 
          caption: caption,
          mentions: [sender]
        }, { quoted: mek });
      }

      setTimeout(() => {
        try { fs.unlinkSync(filePath); } catch {}
      }, 10000);

    } catch (err) {
      console.log("AntiViewOnce error:", err.message);
    }
  }
};
