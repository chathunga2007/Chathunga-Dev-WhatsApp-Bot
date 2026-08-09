const { cmd } = require("../command");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

cmd(
  {
    pattern: "save",
    alias: ["status", "savestatus", "getstatus"],
    react: "📥",
    desc: "Save WhatsApp Status",
    category: "download",
    filename: __filename,
  },
  async (
    chathubro,
    mek,
    m,
    {
      from,
      quoted,
      reply,
    }
  ) => {
    try {
      if (!quoted) {
        return reply("❌ *Please reply to a WhatsApp status to save it!*");
      }
      let mediaMsg = quoted.message ? quoted.message : quoted;
      if (quoted.msg) mediaMsg = quoted.msg;

      let type = '';
      if (mediaMsg.imageMessage || quoted.mtype === 'imageMessage') type = 'image';
      else if (mediaMsg.videoMessage || quoted.mtype === 'videoMessage') type = 'video';
      else if (mediaMsg.audioMessage || quoted.mtype === 'audioMessage') type = 'audio';

      if (!type) {
        if (quoted.mtype?.includes('image')) type = 'image';
        else if (quoted.mtype?.includes('video')) type = 'video';
        else if (quoted.mtype?.includes('audio')) type = 'audio';
      }

      if (!type) {
        return reply("❌ *This is not a valid media status! Please reply to an image or video status.*");
      }

      await reply("⏳ *Downloading status... Please wait!*");

      const stream = await downloadContentFromMessage(mediaMsg, type);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      let caption = quoted.text || quoted.caption || "✨ *Saved Status by Chathunga-Dev*";

      if (type === 'image') {
        await chathubro.sendMessage(
          from,
          {
            image: buffer,
            caption: caption,
          },
          { quoted: mek }
        );
      } else if (type === 'video') {
        await chathubro.sendMessage(
          from,
          {
            video: buffer,
            caption: caption,
            mimetype: "video/mp4",
            gifPlayback: false
          },
          { quoted: mek }
        );
      } else if (type === 'audio') {
        await chathubro.sendMessage(
          from,
          {
            audio: buffer,
            mimetype: 'audio/mp4',
            ptt: false
          },
          { quoted: mek }
        );
      }

      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Status Save Error:", e);
      reply(`❌ *Failed to download status media:* ${e.message}`);
    }
  }
);
