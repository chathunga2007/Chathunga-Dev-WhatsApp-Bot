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

      let mediaPath;
      try {
        mediaPath = await chathubro.downloadAndSaveMediaMessage(quoted);
      } catch (err) {
        console.log("Download Error 1:", err);
      }

      if (!mediaPath) {
        try {
          const stream = await quoted.download();
        } catch (err2) {
          console.log("Download Error 2:", err2);
        }
      }

      if (!mediaPath) {
        return reply("❌ *Failed to download status! Please make sure you are replying directly to an image or video status.*");
      }

      let mime = quoted.mtype || quoted.msg?.mimetype || "";
      let caption = quoted.text || quoted.caption || "✨ *Saved Status by Chathunga-Dev*";

      if (mime.includes("image") || quoted.msg?.imageMessage) {
        await chathubro.sendMessage(
          from,
          {
            image: { url: mediaPath },
            caption: caption,
          },
          { quoted: mek }
        );
      } else if (mime.includes("video") || quoted.msg?.videoMessage) {
        await chathubro.sendMessage(
          from,
          {
            video: { url: mediaPath },
            caption: caption,
            mimetype: "video/mp4",
            gifPlayback: false
          },
          { quoted: mek }
        );
      } else {
        await chathubro.sendMessage(
          from,
          {
            document: { url: mediaPath },
            mimetype: mime || "application/octet-stream",
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
