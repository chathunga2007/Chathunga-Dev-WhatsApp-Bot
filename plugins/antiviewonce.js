const { cmd } = require("../command");
const { downloadContentFromMessage, jidNormalizedUser } = require('@whiskeysockets/baileys');
const config = require("../config");
const fs = require('fs');
const path = require('path');

const tempFolder = path.join(__dirname, '../temp');
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder, { recursive: true });
}

const storeFilePath = path.join(tempFolder, 'viewonce_store.json');
const viewOnceStore = new Map();
const processedMsgIds = new Set();

function loadPersistentStore() {
  try {
    if (fs.existsSync(storeFilePath)) {
      const data = JSON.parse(fs.readFileSync(storeFilePath, 'utf-8'));
      const now = Math.floor(Date.now() / 1000);
      for (const [id, item] of Object.entries(data)) {
        if (now - (item.timestamp || 0) < 24 * 60 * 60) {
          if (item.cacheFileName && fs.existsSync(path.join(tempFolder, item.cacheFileName))) {
            item.buffer = fs.readFileSync(path.join(tempFolder, item.cacheFileName));
          }
          viewOnceStore.set(id, item);
        } else {
          if (item.cacheFileName && fs.existsSync(path.join(tempFolder, item.cacheFileName))) {
            try { fs.unlinkSync(path.join(tempFolder, item.cacheFileName)); } catch {}
          }
        }
      }
    }
  } catch (e) {
    console.error("❌ Failed loading ViewOnce persistent store:", e.message);
  }
}

function savePersistentStore() {
  try {
    const obj = {};
    for (const [id, item] of viewOnceStore.entries()) {
      const { buffer, ...rest } = item;
      obj[id] = rest;
    }
    fs.writeFileSync(storeFilePath, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error("❌ Failed saving ViewOnce persistent store:", e.message);
  }
}

loadPersistentStore();

function unwrapMessage(msg) {
  if (!msg) return null;
  let current = msg;
  while (current) {
    if (current.ephemeralMessage?.message) {
      current = current.ephemeralMessage.message;
    } else if (current.viewOnceMessage?.message) {
      current = current.viewOnceMessage.message;
    } else if (current.viewOnceMessageV2?.message) {
      current = current.viewOnceMessageV2.message;
    } else if (current.viewOnceMessageV2Extension?.message) {
      current = current.viewOnceMessageV2Extension.message;
    } else if (current.documentWithCaptionMessage?.message) {
      current = current.documentWithCaptionMessage.message;
    } else {
      break;
    }
  }
  return current;
}

function getMediaKeyAndObj(cleanMsg) {
  if (!cleanMsg || typeof cleanMsg !== 'object') return { type: null, mediaMsg: null };

  const mediaKeys = ['imageMessage', 'videoMessage', 'audioMessage'];
  for (const k of mediaKeys) {
    if (cleanMsg[k]) {
      return { type: k, mediaMsg: cleanMsg[k] };
    }
  }

  return { type: null, mediaMsg: null };
}

function checkIsViewOnce(rawMsg) {
  if (!rawMsg) return false;
  if (rawMsg.viewOnceMessage || rawMsg.viewOnceMessageV2 || rawMsg.viewOnceMessageV2Extension) return true;

  const clean = unwrapMessage(rawMsg);
  if (!clean) return false;

  const { mediaMsg } = getMediaKeyAndObj(clean);
  if (mediaMsg && (mediaMsg.viewOnce || clean.viewOnce)) return true;
  if (clean.viewOnce) return true;

  return false;
}

function extractViewOnceMedia(rawMsg) {
  if (!rawMsg) return null;

  const isViewOnce = checkIsViewOnce(rawMsg);
  if (!isViewOnce) return null;

  const cleanMsg = unwrapMessage(rawMsg);
  if (!cleanMsg) return null;

  const { type, mediaMsg } = getMediaKeyAndObj(cleanMsg);
  if (!type || !mediaMsg) return null;

  const mediaType = type === 'imageMessage' ? 'image' : type === 'videoMessage' ? 'video' : 'audio';

  return { cleanMsg, type, mediaMsg, mediaType };
}

function extractContextInfo(rawMsg) {
  if (!rawMsg) return null;
  const clean = unwrapMessage(rawMsg);
  if (!clean) return null;

  for (const key of Object.keys(clean)) {
    if (clean[key] && typeof clean[key] === 'object' && clean[key].contextInfo) {
      return clean[key].contextInfo;
    }
  }

  if (clean.contextInfo) return clean.contextInfo;
  return null;
}

function getOwnerJids(conn) {
  const jids = new Set();

  if (config.BOT_OWNER) {
    const numbers = config.BOT_OWNER.split(/[,;]/);
    for (let num of numbers) {
      num = num.replace(/[^0-9]/g, "");
      if (num && !num.includes("X")) {
        jids.add(num + "@s.whatsapp.net");
      }
    }
  }

  if (conn?.user?.id) {
    jids.add(jidNormalizedUser(conn.user.id));
  }

  return Array.from(jids);
}

function formatTime(timestamp) {
  const rawSec = timestamp ? (typeof timestamp === 'object' ? timestamp.low || timestamp.toNumber() : timestamp) : Math.floor(Date.now() / 1000);
  const date = new Date(rawSec > 1e11 ? rawSec : rawSec * 1000);
  return date.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

async function downloadMediaBuffer(mediaMsg, mediaType) {
  const stream = await downloadContentFromMessage(mediaMsg, mediaType);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
}

async function processAndSendViewOnce(conn, mek, targetJid, mediaMsg, mediaType, sender, chatJid, msgTimestamp, cachedBuffer = null, triggerInfo = null) {
  let buffer = cachedBuffer;
  if (!buffer || !buffer.length) {
    buffer = await downloadMediaBuffer(mediaMsg, mediaType);
  }

  if (!buffer || !buffer.length) {
    throw new Error("Empty media buffer received.");
  }

  const ext = mediaType === 'image' ? '.jpg' : mediaType === 'video' ? '.mp4' : (mediaMsg.mimetype?.includes('ogg') ? '.ogg' : '.mp3');
  const filePath = path.join(tempFolder, `viewonce_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`);
  await fs.promises.writeFile(filePath, buffer);

  const senderTag = sender ? `@${sender.split('@')[0]}` : "User";
  const isGroup = chatJid && chatJid.endsWith('@g.us');
  const chatType = isGroup ? "Group Chat" : "Direct DM";
  const sentTime = formatTime(msgTimestamp || mek?.messageTimestamp);

  let headerTitle = "👁️ VIEW ONCE RECOVERED";
  let bodyLines = [];

  if (triggerInfo?.action === 'reaction') {
    headerTitle = "😍 VIEW ONCE REACTED";
    const reactorTag = triggerInfo.reactor ? `@${triggerInfo.reactor.split('@')[0]}` : "User";
    bodyLines = [
      `┃ 🎭 *Reaction:* ${triggerInfo.emoji || '❤️'}`,
      `┃ 👤 *Reacted By:* ${reactorTag}`,
      `┃ 📤 *Original Sender:* ${senderTag}`,
      `┃ 💬 *Chat:* ${chatType}`,
      `┃ 📁 *Type:* ${mediaType.toUpperCase()}`,
      `┃ 🕒 *Time:* ${sentTime}`
    ];
  } else if (triggerInfo?.action === 'reply') {
    headerTitle = "💬 VIEW ONCE REPLIED";
    const replierTag = triggerInfo.replier ? `@${triggerInfo.replier.split('@')[0]}` : "User";
    bodyLines = [
      `┃ 👤 *Replied By:* ${replierTag}`,
      `┃ 📤 *Original Sender:* ${senderTag}`,
      `┃ 💬 *Chat:* ${chatType}`,
      `┃ 📁 *Type:* ${mediaType.toUpperCase()}`,
      `┃ 🕒 *Time:* ${sentTime}`
    ];
  } else {
    bodyLines = [
      `┃ 👤 *Sender:* ${senderTag}`,
      `┃ 💬 *Chat:* ${chatType}`,
      `┃ 📁 *Type:* ${mediaType.toUpperCase()}`,
      `┃ 🕒 *Sent Time:* ${sentTime}`
    ];
  }

  const caption = `╭━━━〔 *${headerTitle}* 〕━━━╮
┃
${bodyLines.join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

  const mentionsSet = new Set();
  if (sender) mentionsSet.add(sender);
  if (triggerInfo?.reactor) mentionsSet.add(triggerInfo.reactor);
  if (triggerInfo?.replier) mentionsSet.add(triggerInfo.replier);

  const sendOptions = { mentions: Array.from(mentionsSet) };

  if (mediaType === 'image') {
    await conn.sendMessage(targetJid, { image: { url: filePath }, caption, ...sendOptions });
  } else if (mediaType === 'video') {
    await conn.sendMessage(targetJid, { video: { url: filePath }, caption, ...sendOptions });
  } else if (mediaType === 'audio') {
    await conn.sendMessage(targetJid, {
      audio: { url: filePath },
      mimetype: mediaMsg.mimetype || 'audio/mp4',
      ptt: Boolean(mediaMsg.ptt)
    });
    await conn.sendMessage(targetJid, { text: caption, ...sendOptions });
  }

  setTimeout(() => {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }, 10000);
}

async function sendToOwners(conn, mek, mediaMsg, mediaType, sender, chatJid, msgTimestamp, cachedBuffer = null, triggerInfo = null) {
  const ownerJids = getOwnerJids(conn);
  if (!ownerJids.length) {
    console.error("❌ AntiViewOnce: No owner JID available.");
    return;
  }

  for (const targetJid of ownerJids) {
    try {
      await processAndSendViewOnce(conn, mek, targetJid, mediaMsg, mediaType, sender, chatJid, msgTimestamp, cachedBuffer, triggerInfo);
      console.log(`[✓] View Once media (${mediaType}) sent to Owner (${targetJid}).`);
    } catch (err) {
      console.error(`❌ AntiViewOnce send error to ${targetJid}:`, err.message);
    }
  }
}

const antiviewoncePlugin = {
  name: "antiviewonce",

  onMessage: async (conn, mek) => {
    try {
      const rawMsg = mek?.message;
      if (!rawMsg) return;

      const msgId = mek.key?.id;
      const sender = mek.key.participant || mek.key.remoteJid;
      const chatJid = mek.key.remoteJid;
      const timestamp = mek.messageTimestamp || Math.floor(Date.now() / 1000);

      // 1. If incoming message is a View Once message itself (Photo, Video, or Voice Chat)
      const voData = extractViewOnceMedia(rawMsg);
      if (voData) {
        if (msgId && !processedMsgIds.has(msgId)) {
          processedMsgIds.add(msgId);
          setTimeout(() => processedMsgIds.delete(msgId), 10 * 60 * 1000);

          let buffer = null;
          try {
            buffer = await downloadMediaBuffer(voData.mediaMsg, voData.mediaType);
          } catch (e) {
            console.error("❌ Failed pre-downloading View Once buffer:", e.message);
          }

          let cacheFileName = null;
          if (buffer && buffer.length) {
            const ext = voData.mediaType === 'image' ? '.jpg' : voData.mediaType === 'video' ? '.mp4' : '.ogg';
            cacheFileName = `vo_cache_${msgId}${ext}`;
            try {
              fs.writeFileSync(path.join(tempFolder, cacheFileName), buffer);
            } catch (e) { cacheFileName = null; }
          }

          viewOnceStore.set(msgId, {
            cacheFileName,
            buffer,
            mediaMsg: voData.mediaMsg,
            type: voData.type,
            mediaType: voData.mediaType,
            sender,
            from: chatJid,
            timestamp
          });
          savePersistentStore();

          setTimeout(() => {
            const item = viewOnceStore.get(msgId);
            if (item?.cacheFileName) {
              try { if (fs.existsSync(path.join(tempFolder, item.cacheFileName))) fs.unlinkSync(path.join(tempFolder, item.cacheFileName)); } catch {}
            }
            viewOnceStore.delete(msgId);
            savePersistentStore();
          }, 24 * 60 * 60 * 1000);

          // Auto-recover and send to owner
          await sendToOwners(conn, mek, voData.mediaMsg, voData.mediaType, sender, chatJid, timestamp, buffer);
        }
        return;
      }

      // 2. Check if this incoming message is an EMOJI REACTION to a View Once message
      const cleanMsg = unwrapMessage(rawMsg) || rawMsg;
      const reactionMsg = cleanMsg.reactionMessage || cleanMsg.encReactionMessage || rawMsg.reactionMessage || rawMsg.encReactionMessage || rawMsg.ephemeralMessage?.message?.reactionMessage;

      if (reactionMsg) {
        const emoji = reactionMsg.text;
        if (!emoji) return; // reaction removed

        const targetId = reactionMsg.key?.id;
        const reactor = mek.key?.participant || (mek.key?.fromMe ? conn.user?.id : mek.key?.remoteJid) || reactionMsg.key?.participant;

        if (targetId) {
          let mediaData = viewOnceStore.get(targetId);
          if (mediaData) {
            if (!mediaData.buffer && mediaData.cacheFileName && fs.existsSync(path.join(tempFolder, mediaData.cacheFileName))) {
              mediaData.buffer = fs.readFileSync(path.join(tempFolder, mediaData.cacheFileName));
            }

            const reactKey = `react_${targetId}_${emoji}_${reactor}`;
            if (processedMsgIds.has(reactKey)) return;
            processedMsgIds.add(reactKey);
            setTimeout(() => processedMsgIds.delete(reactKey), 5 * 60 * 1000);

            console.log(`[✓] Reaction (${emoji}) to View Once detected (Target Msg ID: ${targetId}). Forwarding to Owner...`);
            await sendToOwners(
              conn,
              mek,
              mediaData.mediaMsg,
              mediaData.mediaType,
              mediaData.sender || sender,
              mediaData.from || chatJid,
              mediaData.timestamp || timestamp,
              mediaData.buffer || null,
              { action: 'reaction', reactor, emoji }
            );
          }
        }
        return;
      }

      // 3. If incoming message is a REPLY to ANY View Once message (text, sticker, voice, media, etc.)
      const ctx = extractContextInfo(rawMsg);
      const quotedId = ctx?.stanzaId;
      const quotedMsgObj = ctx?.quotedMessage;

      if (!quotedId && !quotedMsgObj) return;

      let mediaData = null;

      if (quotedId && viewOnceStore.has(quotedId)) {
        mediaData = viewOnceStore.get(quotedId);
        if (mediaData && !mediaData.buffer && mediaData.cacheFileName && fs.existsSync(path.join(tempFolder, mediaData.cacheFileName))) {
          mediaData.buffer = fs.readFileSync(path.join(tempFolder, mediaData.cacheFileName));
        }
      }

      if (!mediaData && quotedMsgObj) {
        const cleanQuoted = unwrapMessage(quotedMsgObj);
        if (cleanQuoted) {
          const quotedVoData = extractViewOnceMedia(cleanQuoted);
          if (quotedVoData) {
            mediaData = {
              mediaMsg: quotedVoData.mediaMsg,
              type: quotedVoData.type,
              mediaType: quotedVoData.mediaType,
              sender: ctx?.participant || sender,
              from: chatJid,
              timestamp
            };
          } else {
            const { type, mediaMsg } = getMediaKeyAndObj(cleanQuoted);
            if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type) && (checkIsViewOnce(quotedMsgObj) || mediaMsg?.viewOnce || cleanQuoted?.viewOnce)) {
              const mediaType = type === 'imageMessage' ? 'image' : type === 'videoMessage' ? 'video' : 'audio';
              mediaData = {
                mediaMsg,
                type,
                mediaType,
                sender: ctx?.participant || sender,
                from: chatJid,
                timestamp
              };
            }
          }
        }
      }

      if (mediaData && mediaData.mediaMsg) {
        if (quotedId && !viewOnceStore.has(quotedId)) {
          viewOnceStore.set(quotedId, mediaData);
          savePersistentStore();
        }

        const replyKey = `reply_${msgId}`;
        if (processedMsgIds.has(replyKey)) return;
        processedMsgIds.add(replyKey);
        setTimeout(() => processedMsgIds.delete(replyKey), 5 * 60 * 1000);

        console.log(`[✓] Reply to View Once detected (Reply Msg ID: ${msgId}). Forwarding to Owner...`);
        await sendToOwners(
          conn,
          mek,
          mediaData.mediaMsg,
          mediaData.mediaType,
          mediaData.sender || sender,
          mediaData.from || chatJid,
          mediaData.timestamp || timestamp,
          mediaData.buffer || null,
          { action: 'reply', replier: sender }
        );
      }

    } catch (err) {
      console.error("❌ AntiViewOnce hook error:", err.message);
    }
  },

  onReaction: async (conn, reactions) => {
    try {
      if (!Array.isArray(reactions)) return;
      for (const r of reactions) {
        const targetId = r.reaction?.key?.id || r.targetKey?.id || r.key?.id;
        const emoji = r.reaction?.text || r.text || r.emoji;
        if (!targetId || !emoji) continue;

        const reactor = r.key?.participant || (r.key?.fromMe ? conn.user?.id : r.key?.remoteJid) || r.reaction?.key?.participant;
        const chatJid = r.key?.remoteJid || r.reaction?.key?.remoteJid;

        let mediaData = viewOnceStore.get(targetId);
        if (mediaData) {
          if (!mediaData.buffer && mediaData.cacheFileName && fs.existsSync(path.join(tempFolder, mediaData.cacheFileName))) {
            mediaData.buffer = fs.readFileSync(path.join(tempFolder, mediaData.cacheFileName));
          }

          const reactKey = `react_${targetId}_${emoji}_${reactor}`;
          if (processedMsgIds.has(reactKey)) continue;
          processedMsgIds.add(reactKey);
          setTimeout(() => processedMsgIds.delete(reactKey), 5 * 60 * 1000);

          console.log(`[✓] Baileys reaction event (${emoji}) to View Once detected (Target Msg ID: ${targetId}). Forwarding to Owner...`);
          await sendToOwners(
            conn,
            null,
            mediaData.mediaMsg,
            mediaData.mediaType,
            mediaData.sender,
            chatJid || mediaData.from,
            mediaData.timestamp || Math.floor(Date.now() / 1000),
            mediaData.buffer || null,
            { action: 'reaction', reactor, emoji }
          );
        }
      }
    } catch (err) {
      console.error("❌ AntiViewOnce onReaction error:", err.message);
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
}, async (conn, mek, m, { from, reply, isOwner }) => {
  try {
    if (!isOwner) return;

    const quoted = m.quoted ? m.quoted : null;
    const quotedId = quoted ? quoted.id : null;

    let mediaData = null;

    if (quotedId && viewOnceStore.has(quotedId)) {
      mediaData = viewOnceStore.get(quotedId);
    }

    if (!mediaData && quoted) {
      const cleanQuoted = unwrapMessage(quoted.fakeObj?.message || quoted.msg || quoted);
      if (cleanQuoted) {
        const voData = extractViewOnceMedia(cleanQuoted);
        if (voData) {
          mediaData = {
            mediaMsg: voData.mediaMsg,
            type: voData.type,
            mediaType: voData.mediaType,
            sender: quoted.sender || from,
            from,
            timestamp: quoted.messageTimestamp || mek.messageTimestamp
          };
        } else {
          const { type, mediaMsg } = getMediaKeyAndObj(cleanQuoted);
          if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
            const mediaType = type === 'imageMessage' ? 'image' : type === 'videoMessage' ? 'video' : 'audio';
            mediaData = {
              mediaMsg,
              type,
              mediaType,
              sender: quoted.sender || from,
              from,
              timestamp: quoted.messageTimestamp || mek.messageTimestamp
            };
          }
        }
      }
    }

    if (!mediaData) {
      return reply("❌ *Please reply to a View Once (One-Time) photo, video, or voice message!*");
    }

    const mediaType = mediaData.mediaType || (mediaData.type === 'imageMessage' ? 'image' : mediaData.type === 'videoMessage' ? 'video' : 'audio');

    await sendToOwners(
      conn,
      mek,
      mediaData.mediaMsg,
      mediaType,
      mediaData.sender || from,
      mediaData.from || from,
      mediaData.timestamp || mek.messageTimestamp,
      mediaData.buffer || null
    );

  } catch (e) {
    console.error("ViewOnce Command Error:", e);
    reply(`❌ *Failed to retrieve View Once message:* ${e.message}`);
  }
});

if (global.pluginHooks && !global.pluginHooks.includes(antiviewoncePlugin)) {
  global.pluginHooks.push(antiviewoncePlugin);
}

module.exports = antiviewoncePlugin;

