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
  async (chathubro, mek, m, { from, quoted, reply }) => {
    try {
      if (!quoted) {
        return reply("❌ *Please reply to a WhatsApp status!*");
      }

      await reply("⏳ *Saving status...*");

      let targetChat = m.sender || from;
      
      await chathubro.sendMessage(
        targetChat,
        {
          forward: quoted
        },
        { quoted: mek }
      );

      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("STATUS SAVE ERROR:", e);
      
      try {
        let media = await chathubro.downloadAndSaveMediaMessage(quoted);
        if (media) {
          await chathubro.sendMessage(from, { 
            video: { url: media }, 
            caption: "✨ *Saved by Chathunga-Dev*",
            gifPlayback: false 
          }, { quoted: mek });
          await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
          return;
        }
      } catch (err) {
        console.log("Backup download also failed:", err);
      }

      reply("❌ *Error: WhatsApp blocks status forwarding on this bot version. Try downloading via media link.*");
    }
  }
);
