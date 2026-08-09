const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const tempFolder = path.join(__dirname, '../temp');
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder, { recursive: true });
}

const viewOnceStore = new Map();

function unwrapMessage(message) {
  if (!message) return null;
  if (message.ephemeralMessage) return unwrapMessage(message.ephemeralMessage.message);
  if (message.viewOnceMessageV2) return unwrapMessage(message.viewOnceMessageV2.message);
  if (message.viewOnceMessage) return unwrapMessage(message.viewOnceMessage.message);
  return message;
}

module.exports = {
  name: "antiviewonce",

  onMessage: async (conn, mek) => {
    try {
      if (!mek?.message || mek.key.fromMe) return;

      const cleanMsg = unwrapMessage(mek.message);
      if (!cleanMsg) return;

      const type = Object.keys(cleanMsg)[0];
      if (!['imageMessage', 'videoMessage'].includes(type)) return;

      const mediaMsg = cleanMsg[type];
      if (!mediaMsg || !mediaMsg.viewOnce) return;

      viewOnceStore.set(mek.key.id, {
         mek,
         mediaMsg,
         type,
         sender: mek.key.participant || mek.key.remoteJid,
         from: mek.key.remoteJid
      });

      setTimeout(() => {
        viewOnceStore.delete(mek.key.id);
      }, 60 * 60 * 1000);

    } catch (err) {
      console.log("AntiViewOnce store error:", err.message);
    }
  },

  replyHandlers: [
    {
      filter: (text) => {
        const t = text.trim().toLowerCase();
        return t === "get" || t === "vv" || t === ".get" || t === ".vv";
      },
      function: async (conn, mek, m, { from, reply }) => {
        try {
          const quotedId = mek.message?.extendedTextMessage?.contextInfo?.stanzaId;
          if (!quotedId) return;

          const storedData = viewOnceStore.get(quotedId);
          if (!storedData) {
            return reply("❌ *මෙම View Once මැසේජ් එක මගේ ස්ටෝර් එකේ නැත, නැතහොත් කාලය ඉක්ම ගොස් ඇත!*");
          }

          const { mediaMsg, type, sender } = storedData;

          const stream = await downloadContentFromMessage(
            mediaMsg,
            type === 'imageMessage' ? 'image' : 'video'
          );

          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          if (!buffer.length) {
            return reply("❌ *අපොයි! මීඩියා ඩේටා ඩවුන්ලෝඩ් කරගැනීමට නොහැකි විය.*");
          }

          const ext = type === 'imageMessage' ? '.jpg' : '.mp4';
          const filePath = path.join(tempFolder, `grabbed_${Date.now()}${ext}`);
          await fs.promises.writeFile(filePath, buffer);

          let caption = 
`╭━━━〔 *👁️ GRABBED VIEW ONCE* 〕━━━╮
┃
┃ 👤 *Sender:* @${sender.split('@')[0]}
┃ 🕒 *Recovered Time:* ${new Date().toLocaleTimeString()}
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
          console.log("AntiViewOnce grab error:", err.message);
          reply("❌ *Error occurred while grabbing view once!*");
        }
      }
    }
  ]
};
