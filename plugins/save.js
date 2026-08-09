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

      await reply("⏳ *Downloading status... Please wait!*");

      let mime = quoted.mtype || "";
      let type = mime.replace(/Message/i, "").toLowerCase();

      if (!['image', 'video', 'audio'].some(v => type.includes(v))) {
        return reply("❌ *Please reply to a valid image or video status!*");
      }

      const stream = await downloadContentFromMessage(quoted.msg, type);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      let caption = quoted.text || "✨ *Saved Status by Chathunga-Dev*";

      if (type.includes("image")) {
        await chathubro.sendMessage(
          from,
          {
            image: buffer,
            caption: caption,
          },
          { quoted: mek }
        );
      } else if (type.includes("video")) {
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
      } else if (type.includes("audio")) {
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
