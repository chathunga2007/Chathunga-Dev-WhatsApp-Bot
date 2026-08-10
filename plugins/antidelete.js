const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

const tempFolder = path.join(__dirname, '../temp');
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder, { recursive: true });
}

const messageStore = new Map();
const mediaStore = new Map();

const CLEANUP_TIME = 24 * 60 * 60 * 1000; // Store for 24 hours

function unwrapMessage(message) {
  if (!message) return null;

  if (message.ephemeralMessage) {
    return unwrapMessage(message.ephemeralMessage.message);
  }

  if (message.viewOnceMessageV2) {
    return unwrapMessage(message.viewOnceMessageV2.message);
  }

  if (message.viewOnceMessage) {
    return unwrapMessage(message.viewOnceMessage.message);
  }

  return message;
}

function getOwnerJid() {
  const num = (config.BOT_OWNER || "94XXXXXXXXX").replace(/[^0-9]/g, "");
  return num + "@s.whatsapp.net";
}

function formatTime(timestamp) {
  const rawSec = timestamp ? (typeof timestamp === 'object' ? timestamp.low || timestamp.toNumber() : timestamp) : Math.floor(Date.now() / 1000);
  const date = new Date(rawSec > 1e11 ? rawSec : rawSec * 1000);
  return date.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function getExtension(type, msg) {
  switch (type) {
    case 'imageMessage': return '.jpg';
    case 'videoMessage': return '.mp4';
    case 'audioMessage': return '.ogg';
    case 'stickerMessage': return '.webp';
    case 'documentMessage':
      return msg.documentMessage?.fileName
        ? path.extname(msg.documentMessage.fileName)
        : '.bin';
    default:
      return '.bin';
  }
}

module.exports = {
  name: 'antidelete',

  onMessage: async (conn, msg) => {
    if (!msg?.message || msg.key.fromMe) return;

    const keyId = msg.key.id;
    const remoteJid = msg.key.remoteJid;

    const cleanMessage = unwrapMessage(msg.message);
    if (!cleanMessage) return;

    messageStore.set(keyId, {
      key: msg.key,
      message: cleanMessage,
      remoteJid,
      timestamp: msg.messageTimestamp || Math.floor(Date.now() / 1000)
    });

    const type = Object.keys(cleanMessage)[0];
    if (!type) return;

    const mediaTypes = [
      'imageMessage',
      'videoMessage',
      'audioMessage',
      'stickerMessage',
      'documentMessage'
    ];

    if (!mediaTypes.includes(type)) return;

    try {
      const stream = await downloadContentFromMessage(
        cleanMessage[type],
        type.replace('Message', '')
      );

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (!buffer.length) return;

      const ext = getExtension(type, cleanMessage);
      const filePath = path.join(tempFolder, `${keyId}${ext}`);

      await fs.promises.writeFile(filePath, buffer);
      mediaStore.set(keyId, filePath);

      setTimeout(() => {
        messageStore.delete(keyId);
        if (mediaStore.has(keyId)) {
          try { fs.unlinkSync(mediaStore.get(keyId)); } catch { }
          mediaStore.delete(keyId);
        }
      }, CLEANUP_TIME);

    } catch (err) {
      console.log('❌ AntiDelete media download error:', err.message);
    }
  },

  onDelete: async (conn, updates) => {
    for (const update of updates) {
      const key = update?.key;
      if (!key?.id) continue;

      const isDelete =
        update.action === 'delete' ||
        update.update?.message === null;

      if (!isDelete) continue;

      const keyId = key.id;
      const stored = messageStore.get(keyId);
      if (!stored) continue;

      const fromChat = key.remoteJid;
      const sender = key.participant || fromChat;
      const ownerJid = getOwnerJid();
      const isGroup = fromChat && fromChat.endsWith('@g.us');
      const chatType = isGroup ? "Group Chat" : "Direct DM";
      const sentTime = formatTime(stored.timestamp);

      let caption =
        `╭━━━〔 *⚠️ DELETED MESSAGE RECOVERED* 〕━━━╮
┃
┃ 👤 *Sender:* @${sender.split('@')[0]}
┃ 💬 *Chat:* ${chatType}
┃ 🕒 *Sent Time:* ${sentTime}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`;

      try {
        const mediaPath = mediaStore.get(keyId);
        if (mediaPath && fs.existsSync(mediaPath)) {
          const opts = { caption, mentions: [sender] };

          if (mediaPath.endsWith('.jpg')) {
            await conn.sendMessage(ownerJid, { image: { url: mediaPath }, ...opts });
          } else if (mediaPath.endsWith('.mp4')) {
            await conn.sendMessage(ownerJid, { video: { url: mediaPath }, ...opts });
          } else if (mediaPath.endsWith('.webp')) {
            await conn.sendMessage(ownerJid, { sticker: { url: mediaPath } });
            await conn.sendMessage(ownerJid, { text: caption, mentions: [sender] });
          } else if (mediaPath.endsWith('.ogg')) {
            await conn.sendMessage(ownerJid, {
              audio: { url: mediaPath },
              mimetype: 'audio/ogg; codecs=opus'
            });
            await conn.sendMessage(ownerJid, { text: caption, mentions: [sender] });
          } else {
            await conn.sendMessage(ownerJid, {
              document: { url: mediaPath },
              ...opts
            });
          }

          console.log(`[✓] Deleted media message from ${sender} recovered and sent to Owner WhatsApp.`);
          continue;
        }

        const msgObj = stored.message;
        let text =
          msgObj.conversation ||
          msgObj.extendedTextMessage?.text ||
          msgObj.imageMessage?.caption ||
          msgObj.videoMessage?.caption ||
          msgObj.documentMessage?.caption ||
          '';

        let fullText = text
          ? `${caption}\n\n╭━━━〔 *📝 RECOVERED TEXT* 〕━━━╮\n┃\n> ${text}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`
          : caption;

        await conn.sendMessage(ownerJid, {
          text: fullText,
          mentions: [sender]
        });

        console.log(`[✓] Deleted text message from ${sender} recovered and sent to Owner WhatsApp.`);

      } catch (err) {
        console.log('❌ AntiDelete resend error:', err.message);
      }
    }
  }
};
