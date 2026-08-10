const { cmd } = require("../command");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require("../config");
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

function getOwnerJid() {
  const num = (config.BOT_OWNER || "94767945968").replace(/[^0-9]/g, "");
  return num + "@s.whatsapp.net";
}

function formatTime(timestamp) {
  const rawSec = timestamp ? (typeof timestamp === 'object' ? timestamp.low || timestamp.toNumber() : timestamp) : Math.floor(Date.now() / 1000);
  const date = new Date(rawSec > 1e11 ? rawSec : rawSec * 1000);
  return date.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

async function processAndSendViewOnce(conn, mek, targetJid, mediaMsg, mediaType, sender, chatJid, msgTimestamp) {
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
  const isGroup = chatJid && chatJid.endsWith('@g.us');
  const chatType = isGroup ? "Group Chat" : "Direct DM";
  const sentTime = formatTime(msgTimestamp || mek?.messageTimestamp);

  const caption = `╭━━━〔 *👁️ VIEW ONCE RECOVERED* 〕━━━╮
┃
┃ 👤 *Sender:* ${senderTag}
┃ 💬 *Chat:* ${chatType}
┃ 📁 *Type:* ${mediaType.toUpperCase()}
┃ 🕒 *Sent Time:* ${sentTime}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

  const sendOptions = { mentions: sender ? [sender] : [] };

  if (mediaType === 'image') {
    await conn.sendMessage(targetJid, { image: { url: filePath }, caption, ...sendOptions });
  } else if (mediaType === 'video') {
    await conn.sendMessage(targetJid, { video: { url: filePath }, caption, ...sendOptions });
  } else if (mediaType === 'audio') {
    await conn.sendMessage(targetJid, { audio: { url: filePath }, mimetype: 'audio/mp4', ptt: true, caption, ...sendOptions });
  }

  setTimeout(() => {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }, 10000);
}

const antiviewoncePlugin = {
  name: "antiviewonce",

  onMessage: async (conn, mek) => {
    try {
      const rawMsg = mek?.message;
      if (!rawMsg || mek.key.fromMe) return;

      const isViewOnce = Boolean(
        rawMsg.viewOnceMessage ||
        rawMsg.viewOnceMessageV2 ||
        rawMsg.viewOnceMessageV2Extension ||
        rawMsg.imageMessage?.viewOnce ||
        rawMsg.videoMessage?.viewOnce ||
        rawMsg.audioMessage?.viewOnce
      );

      const cleanMsg = unwrapMessage(rawMsg);
      if (!cleanMsg) return;

      const type = Object.keys(cleanMsg)[0];
      if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) return;

      const mediaMsg = cleanMsg[type];
      if (!mediaMsg) return;

      const isValidViewOnce = isViewOnce || Boolean(mediaMsg.viewOnce || cleanMsg.viewOnce);
      if (!isValidViewOnce) return;

      const sender = mek.key.participant || mek.key.remoteJid;
      const chatJid = mek.key.remoteJid;
      const timestamp = mek.messageTimestamp || Math.floor(Date.now() / 1000);

      viewOnceStore.set(mek.key.id, {
        mek,
        mediaMsg,
        type,
        sender,
        from: chatJid,
        timestamp
      });

      setTimeout(() => {
        viewOnceStore.delete(mek.key.id);
      }, 24 * 60 * 60 * 1000); // Store for 24 hours

      // Automatically recover and send directly to Owner's WhatsApp private chat
      const mediaType = type === 'imageMessage' ? 'image' : type === 'videoMessage' ? 'video' : 'audio';
      const ownerJid = getOwnerJid();
      
      await processAndSendViewOnce(conn, mek, ownerJid, mediaMsg, mediaType, sender, chatJid, timestamp);
      console.log(`[✓] View Once media from ${sender} automatically recovered and sent to Owner WhatsApp.`);

    } catch (err) {
      console.log("AntiViewOnce auto recover error:", err.message);
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
            sender: quoted.sender || from,
            from,
            timestamp: quoted.messageTimestamp || mek.messageTimestamp
          };
        }
      }
    }

    if (!mediaData) {
      return reply("❌ *Please reply to a View Once (One-Time) photo, video, or voice message with .vv!*");
    }

    const ownerJid = getOwnerJid();
    const mediaType = mediaData.type === 'imageMessage' ? 'image' : mediaData.type === 'videoMessage' ? 'video' : 'audio';
    
    await processAndSendViewOnce(conn, mek, ownerJid, mediaData.mediaMsg, mediaType, mediaData.sender, mediaData.from || from, mediaData.timestamp);

    if (from !== ownerJid) {
      await reply("👁️ *View Once media recovered and sent directly to your Owner WhatsApp Chat!*");
    }

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

        const ownerJid = getOwnerJid();
        const mediaType = storedData.type === 'imageMessage' ? 'image' : storedData.type === 'videoMessage' ? 'video' : 'audio';
        
        await processAndSendViewOnce(conn, mek, ownerJid, storedData.mediaMsg, mediaType, storedData.sender, storedData.from || from, storedData.timestamp);

        if (from !== ownerJid) {
          await reply("👁️ *View Once media recovered and sent directly to your Owner WhatsApp Chat!*");
        }
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
