const { cmd } = require("../command");

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

      let mediaBuffer;
      try {
        mediaBuffer = await quoted.download();
      } catch (err) {
        mediaBuffer = await chathubro.downloadMediaMessage(quoted);
      }

      if (!mediaBuffer) {
        return reply("❌ *Failed to download status media!*");
      }

      let mime = quoted.mtype || "";
      let caption = quoted.text || "✨ *Saved Status by Chathunga-Dev*";

      if (mime.includes("image") || quoted.msg?.mimetype?.includes("image")) {
        await chathubro.sendMessage(
          from,
          {
            image: mediaBuffer,
            caption: caption,
          },
          { quoted: mek }
        );
      } else if (mime.includes("video") || quoted.msg?.mimetype?.includes("video")) {
        await chathubro.sendMessage(
          from,
          {
            video: mediaBuffer,
            caption: caption,
            mimetype: "video/mp4",
            gifPlayback: false
          },
          { quoted: mek }
        );
      } else if (mime.includes("audio") || quoted.msg?.mimetype?.includes("audio")) {
        await chathubro.sendMessage(
          from,
          {
            audio: mediaBuffer,
            mimetype: "audio/mp4",
            ptt: false
          },
          { quoted: mek }
        );
      } else {
        await chathubro.sendMessage(
          from,
          {
            document: mediaBuffer,
            mimetype: quoted.msg?.mimetype || "application/octet-stream",
            fileName: "status_media",
            caption: caption
          },
          { quoted: mek }
        );
      }

      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Status Save Error:", e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
