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
      isOwner,
    }
  ) => {
    try {
      if (!quoted) {
        return reply("❌ *Please reply to a WhatsApp status to save it!*");
      }

      const mediaMessage = quoted.message;
      if (!mediaMessage) {
        return reply("❌ *Could not find any media in the quoted message.*");
      }

      await reply("⏳ *Downloading status... Please wait!*");

      const mime = Object.keys(mediaMessage)[0];
      const buffer = await chathubro.downloadAndSaveMediaMessage(quoted); 

      let mediaType = "";
      if (mediaMessage.imageMessage) mediaType = "image";
      else if (mediaMessage.videoMessage) mediaType = "video";
      else if (mediaMessage.audioMessage) mediaType = "audio";
      else return reply("❌ *Unsupported media type!*");

      await chathubro.sendMessage(from, {
        [mediaType]: { url: buffer },
        caption: "✅ *Status Saved Successfully!*\n\n> *© Powered by Chathunga Bimsara*",
      }, { quoted: mek });

    } catch (e) {
      console.error("Status Save Error:", e);
      try {
        await chathubro.sendMessage(from, {
          forward: quoted,
          caption: "✅ *Status Saved (Forwarded)*\n\n> *© Powered by Chathunga Bimsara*"
        }, { quoted: mek });
      } catch (err) {
        reply(`❌ *Error:* ${e.message}`);
      }
    }
  }
);
