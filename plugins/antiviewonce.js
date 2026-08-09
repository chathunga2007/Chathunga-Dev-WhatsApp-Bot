const { cmd } = require("../command");
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
  if (message.viewOnceMessageV2Extension) return unwrapMessage(message.viewOnceMessageV2Extension.message);
  if (message.viewOnceMessage) return unwrapMessage(message.viewOnceMessage.message);
  return message;
}

async function processAndSendViewOnce(conn, mek, from, mediaMsg, mediaType, sender) {
  const typeKey = mediaType === 'image' ? 'imageMessage' : mediaType === 'video' ? 'videoMessage' : 'audioMessage';
  const stream = await downloadContentFromMessage(mediaMsg, mediaType);

  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  if (!buffer.length) {
    throw new Error("Empty media buffer received.");
  }

  const ext = mediaType === 'image' ? '.jpg' : mediaType === 'video' ? '.mp4' : '.mp3';
  const filePath = path.join(tempFolder, `viewonce_${Date.now()}${ext}`);
  await fs.promises.writeFile(filePath, buffer);

  const senderTag = sender ? `@${sender.split('@')[0]}` : "User";
  const caption = `╭━━━〔 *👁️ VIEW ONCE RECOVERED* 〕━━━╮
┃
┃ 👤 *Sender:* ${senderTag}
┃ 📁 *Type:* ${mediaType.toUpperCase()}
┃ 🕒 *Time:* ${new Date().toLocaleTimeString()}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

  if (mediaType === 'image') {
    await conn.sendMessage(from, { image: { url: filePath }, caption, mentions: sender ? [sender] : [] }, { quoted: mek });
  } else if (mediaType === 'video') {
    await conn.sendMessage(from, { video: { url: filePath }, caption, mentions: sender ? [sender] : [] }, { quoted: mek });
  } else if (mediaType === 'audio') {
    await conn.sendMessage(from, { audio: { url: filePath }, mimetype: 'audio/mp4', ptt: true, caption, mentions: sender ? [sender] : [] }, { quoted: mek });
  }

  setTimeout(() => {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }, 10000);
}

const antiviewoncePlugin = {
  name: "antiviewonce",

  onMessage: async (conn, mek) => {
    try {
      if (!mek?.message || mek.key.fromMe) return;

      const cleanMsg = unwrapMessage(mek.message);
      if (!cleanMsg) return;

      const type = Object.keys(cleanMsg)[0];
      if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) return;

      const mediaMsg = cleanMsg[type];
      if (!mediaMsg || (!mediaMsg.viewOnce && !cleanMsg.viewOnce)) return;

      viewOnceStore.set(mek.key.id, {
        mek,
        mediaMsg,
        type,
        sender: mek.key.participant || mek.key.remoteJid,
        from: mek.key.remoteJid
      });

      setTimeout(() => {
        viewOnceStore.delete(mek.key.id);
      }, 24 * 60 * 60 * 1000); // Store for 24 hours

    } catch (err) {
      console.log("AntiViewOnce store error:", err.message);
    }
  }
};

cmd({
  pattern: "vv",
  alias: ["viewonce", "getvv", "retrieve", "getonce"],
  react: "👁️",
  desc: "Download and view WhatsApp View Once (One-Time) messages",
  category: "tools",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const quoted = m.quoted ? m.quoted : null;
    const quotedId = quoted ? quoted.id : null;

    let mediaData = null;

    if (quotedId && viewOnceStore.has(quotedId)) {
      mediaData = viewOnceStore.get(quotedId);
    }

    if (!mediaData && quoted) {
      const cleanQuoted = unwrapMessage(quoted.fakeObj?.message || quoted.msg || quoted);
      if (cleanQuoted) {
        const type = Object.keys(cleanQuoted)[0];
        if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
          const mediaMsg = cleanQuoted[type];
          mediaData = {
            mediaMsg,
            type,
            sender: quoted.sender || from
          };
        }
      }
    }

    if (!mediaData) {
      return reply("❌ *Please reply to a View Once (One-Time) photo, video, or voice message with .vv!*");
    }

    await reply("👁️ *Fetching & recovering View Once media...*");

    const mediaType = mediaData.type === 'imageMessage' ? 'image' : mediaData.type === 'videoMessage' ? 'video' : 'audio';
    await processAndSendViewOnce(conn, mek, from, mediaData.mediaMsg, mediaType, mediaData.sender);

  } catch (e) {
    console.error("ViewOnce Command Error:", e);
    reply(`❌ *Failed to retrieve View Once message:* ${e.message}`);
  }
});

// Also register reply handlers for typing 'vv' or 'get' replying to view-once message
antiviewoncePlugin.replyHandlers = [
  {
    filter: (text) => {
      const t = text.trim().toLowerCase();
      return t === "vv" || t === "get" || t === ".vv" || t === ".get";
    },
    function: async (conn, mek, m, { from, reply }) => {
      try {
        const quotedId = mek.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (!quotedId) return;

        const storedData = viewOnceStore.get(quotedId);
        if (!storedData) {
          return reply("❌ *View Once message not found in memory store or has expired! Try replying with .vv command.*");
        }

        const mediaType = storedData.type === 'imageMessage' ? 'image' : storedData.type === 'videoMessage' ? 'video' : 'audio';
        await processAndSendViewOnce(conn, mek, from, storedData.mediaMsg, mediaType, storedData.sender);
      } catch (err) {
        console.log("AntiViewOnce reply grab error:", err.message);
        reply(`❌ *Failed to retrieve View Once message:* ${err.message}`);
      }
    }
  }
];

if (global.pluginHooks && !global.pluginHooks.includes(antiviewoncePlugin)) {
  global.pluginHooks.push(antiviewoncePlugin);
}

module.exports = antiviewoncePlugin;
