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

      await reply("⏳ *Saving status... Please wait!*");

      await chathubro.sendMessage(
        from,
        {
          forward: quoted,
        },
        { quoted: mek }
      );

      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Status Save Error:", e);
      
      try {
        const media = await chathubro.downloadAndSaveMediaMessage(quoted);
        const mime = quoted.mtype || "";
        
        if (mime.includes("image")) {
          await chathubro.sendMessage(from, { image: { url: media }, caption: quoted.text || "✨ *Saved Status by Chathunga-Dev*" }, { quoted: mek });
        } else if (mime.includes("video")) {
          await chathubro.sendMessage(from, { video: { url: media }, caption: quoted.text || "✨ *Saved Status by Chathunga-Dev*" }, { quoted: mek });
        } else if (mime.includes("audio")) {
          await chathubro.sendMessage(from, { audio: { url: media }, mimetype: 'audio/mp4', ptt: true }, { quoted: mek });
        } else {
          await reply("❌ *Unsupported status media type!*");
        }
        
        await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
      } catch (err) {
        console.error("Backup Save Error:", err);
        reply(`❌ *Failed to save status:* ${e.message}`);
      }
    }
  }
);
