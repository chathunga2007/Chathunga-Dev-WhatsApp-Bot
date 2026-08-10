const thanksPlugin = require('./plugins/thanks');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const express = require('express');
const axios = require('axios');
const path = require('path');
const qrcode = require('qrcode-terminal');

const config = require('./config');
const { sms, downloadMediaMessage } = require('./lib/msg');
const {
  getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson
} = require('./lib/functions');
const { File } = require('megajs');
const { commands, replyHandlers } = require('./command');

// 🛡️ Process Safety Guard to prevent Railway auto-restart crash loops
process.on('uncaughtException', (err) => {
  console.error('🛡️ [CRASH GUARD] Uncaught Exception:', err?.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🛡️ [CRASH GUARD] Unhandled Rejection at:', promise, 'reason:', reason);
});

// 🌐 Express Web Server for Railway Health Check & Keep-Alive
const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.status(200).send("✅ Chathunga-Dev WhatsApp Bot is Online & Healthy!");
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

app.listen(port, () => {
  console.log(`🌐 Server active & listening on port: ${port}`);
});

// Keep-Alive self-ping to prevent service idling
setInterval(() => {
  axios.get(`http://localhost:${port}/`).catch(() => { });
}, 4 * 60 * 1000);

const prefix = '';
const ownerNumber = ['94767945968'];
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

async function ensureSessionFile() {
  if (!fs.existsSync(credsPath)) {
    if (!config.SESSION_ID || !config.SESSION_ID.trim()) {
      console.error('❌ SESSION_ID environment variable is missing or empty! Please add SESSION_ID in Railway variables.');
      return;
    }

    console.log("🔄 creds.json not found. Extracting/Downloading session...");
    fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });

    let sessdata = config.SESSION_ID.trim().replace(/^["']|["']$/g, '');
    if (sessdata.includes('~')) {
      sessdata = sessdata.split('~')[1];
    }

    try {
      if (sessdata.startsWith('{')) {
        fs.writeFileSync(credsPath, sessdata);
        console.log("✅ Session restored from raw JSON!");
        setTimeout(() => connectToWA(), 1000);
        return;
      }
      const decoded = Buffer.from(sessdata, 'base64').toString('utf-8');
      if (decoded.startsWith('{') && decoded.includes('noiseKey')) {
        fs.writeFileSync(credsPath, decoded);
        console.log("✅ Session restored from base64 string!");
        setTimeout(() => connectToWA(), 1000);
        return;
      }
    } catch (e) {
      // Continue to Mega download if base64 decoding fails
    }

    try {
      const megaUrl = sessdata.startsWith('https://mega.nz/')
        ? sessdata
        : `https://mega.nz/file/${sessdata}`;

      console.log(`🌐 Downloading session from MEGA URL: ${megaUrl}`);
      const filer = File.fromURL(megaUrl);

      filer.download((err, data) => {
        if (err) {
          console.error("❌ Failed to download session file from MEGA:", err);
          console.error("💡 Please check if your SESSION_ID is correct and valid!");
          return;
        }

        fs.writeFileSync(credsPath, data);
        console.log("✅ Session downloaded and saved successfully! Connecting to WhatsApp...");
        setTimeout(() => {
          connectToWA();
        }, 1500);
      });
    } catch (err) {
      console.error("❌ Error parsing SESSION_ID or MEGA URL:", err.message);
      console.error("💡 Please verify your SESSION_ID format in Railway environment variables.");
    }
  } else {
    setTimeout(() => {
      connectToWA();
    }, 1000);
  }
}

const antiDeletePlugin = require('./plugins/antidelete.js');
global.pluginHooks = global.pluginHooks || [];
global.pluginHooks.push(antiDeletePlugin);

async function connectToWA() {
  console.log("Connecting Chathunga-Dev 🧬...");
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '/auth_info_baileys/'));
  const { version } = await fetchLatestBaileysVersion();

  const chathunga_dev = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    auth: state,
    version,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  chathunga_dev.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      console.log(`⚠️ Connection closed. Status Code: ${statusCode}. Logged out: ${isLoggedOut}`);

      if (isLoggedOut) {
        console.error("❌ WhatsApp Session is logged out or expired! Please generate a new SESSION_ID.");
        try {
          fs.rmSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true, force: true });
        } catch (e) { }
      } else {
        // Wait 3 seconds before reconnecting to prevent crash loops
        console.log("🔄 Reconnecting in 3 seconds...");
        setTimeout(() => {
          connectToWA();
        }, 3000);
      }
    } else if (connection === 'open') {
      console.log('✅ Chathunga-Dev connected to WhatsApp successfully!');

      const up = `Chathunga-Dev Connected ✅`;
      await chathunga_dev.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
        image: { url: `https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot/blob/main/images/Chathunga-Dev-WhatsApp-Bot.png?raw=true` },
        caption: up
      }).catch(() => { });

      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          try {
            require(`./plugins/${plugin}`);
          } catch (err) {
            console.error(`❌ Error loading plugin ${plugin}:`, err);
          }
        }
      });
    }
  });

  chathunga_dev.ev.on('creds.update', saveCreds);

  chathunga_dev.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.messageStubType === 68) {
        await chathunga_dev.sendMessageAck(msg.key).catch(() => { });
      }
    }

    const mek = messages[0];
    if (!mek || !mek.message) return;

    mek.message = getContentType(mek.message) === 'ephemeralMessage' ? mek.message.ephemeralMessage.message : mek.message;

    if (global.pluginHooks) {
      for (const plugin of global.pluginHooks) {
        if (plugin.onMessage) {
          try {
            await plugin.onMessage(chathunga_dev, mek);
          } catch (e) {
            console.log("onMessage error:", e);
          }
        }
      }
    }

    if (mek.key?.remoteJid === 'status@broadcast') {
      if (config.AUTO_STATUS_SEEN === "true") {
        try {
          await chathunga_dev.readMessages([mek.key]);
          console.log(`[✓] Status seen: ${mek.key.id}`);
        } catch (e) {
          console.error("❌ Failed to mark status as seen:", e);
        }
      }

      if (config.AUTO_STATUS_REACT === "true" && mek.key.participant) {
        try {
          const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '<ctrl42>', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '💜', '💙', '🌝', '🖤', '💚'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

          await chathunga_dev.sendMessage(mek.key.participant, {
            react: {
              text: randomEmoji,
              key: mek.key,
            }
          });

          console.log(`[✓] Reacted to status of ${mek.key.participant} with ${randomEmoji}`);
        } catch (e) {
          console.error("❌ Failed to react to status:", e);
        }
      }
    }

    const m = sms(chathunga_dev, mek);
    const type = getContentType(mek.message);
    const from = mek.key.remoteJid;
    const body = type === 'conversation' ? mek.message.conversation : mek.message[type]?.text || mek.message[type]?.caption || '';

    if (!mek.key?.fromMe && thanksPlugin.thanksFilter(body, mek)) {
      thanksPlugin.thanksSessionReply(chathunga_dev, mek, m, { from });
      return;
    }

    const cleanBody = body.trim();
    const prefixMatch = cleanBody.match(/^[\.\/#!]/);
    const hasPrefix = Boolean(prefixMatch);
    const rawCmd = hasPrefix ? cleanBody.slice(prefixMatch[0].length) : cleanBody;
    const args = rawCmd.split(/ +/);
    const commandName = args.shift()?.toLowerCase() || '';
    const q = args.join(' ');
    const isCmd = Boolean(commandName);

    const sender = mek.key.fromMe ? chathunga_dev.user.id : (mek.key.participant || mek.key.remoteJid);
    const senderNumber = sender ? sender.split('@')[0].split(':')[0] : '';
    const botNumber = chathunga_dev.user.id ? chathunga_dev.user.id.split('@')[0].split(':')[0] : '';

    const isGroup = from.endsWith('@g.us');
    const pushname = mek.pushName || 'Sin Nombre';
    const isMe = Boolean(mek.key.fromMe) || (senderNumber !== '' && senderNumber === botNumber);
    const isOwner = isMe || ownerNumber.includes(senderNumber) || (config.BOT_OWNER && config.BOT_OWNER.includes(senderNumber));
    const botNumber2 = await jidNormalizedUser(chathunga_dev.user.id);

    const groupMetadata = isGroup ? await chathunga_dev.groupMetadata(from).catch(() => { }) : '';
    const groupName = isGroup ? groupMetadata?.subject || '' : '';
    const participants = isGroup ? groupMetadata?.participants || [] : [];
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : [];
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

    const reply = (text) => chathunga_dev.sendMessage(from, { text }, { quoted: mek });

    if (isCmd) {
      const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
      if (cmd) {
        const publicCommands = ["botai", 'owner', 'system', 'ping'];
        if (!publicCommands.includes(cmd.pattern) && !isOwner) return;
        if (cmd.react) chathunga_dev.sendMessage(from, { react: { text: cmd.react, key: mek.key } }).catch(() => { });
        try {
          cmd.function(chathunga_dev, mek, m, {
            from, quoted: mek, body, isCmd, command: commandName, args, q,
            isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
            isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
            isBotAdmins, isAdmins, reply,
          });
        } catch (e) {
          console.error("[PLUGIN ERROR]", e);
        }
      }
    }

    const replyText = body;
    for (const handler of replyHandlers) {
      if (handler.filter(replyText, { sender, message: mek })) {
        if (!isOwner) break;
        try {
          await handler.function(chathunga_dev, mek, m, {
            from, quoted: mek, body: replyText, sender, reply,
          });
          break;
        } catch (e) {
          console.log("Reply handler error:", e);
        }
      }
    }
  });

  chathunga_dev.ev.on('messages.update', async (updates) => {
    if (global.pluginHooks) {
      for (const plugin of global.pluginHooks) {
        if (plugin.onDelete) {
          try {
            await plugin.onDelete(chathunga_dev, updates);
          } catch (e) {
            console.log("onDelete error:", e);
          }
        }
      }
    }
  });
}

ensureSessionFile();