const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const tempFolder = path.join(__dirname, '../temp');
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder, { recursive: true });
}

module.exports = {
  name: "antiviewonce",

  onMessage: async (conn, mek) => {
    try {
      if (!mek?.message || mek.key.fromMe) return;

      let msg = mek.message;
      if (msg.ephemeralMessage) msg = msg.ephemeralMessage.message;
      if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
      if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message;

      const type = Object.keys(msg)[0];
      if (!['imageMessage', 'videoMessage'].includes(type)) return;

      const mediaMsg = msg[type];
      if (!mediaMsg || !mediaMsg.viewOnce) return;

      const from = mek.key.remoteJid;
      const sender = mek.key.participant || from;

      const stream = await downloadContentFromMessage(
        mediaMsg,
        type === 'imageMessage' ? 'image' : 'video'
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
      } else {
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
