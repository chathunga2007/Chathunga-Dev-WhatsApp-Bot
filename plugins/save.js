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
      if (!quoted) return reply("❌ *Please reply to a WhatsApp status!*");

      await reply("⏳ *Saving status...*");

      let targetObj = quoted.fakeObj ? quoted.fakeObj : mek.quoted;
      if (!targetObj) targetObj = mek;

      await chathubro.sendMessage(
        from,
        { forward: targetObj },
        { quoted: mek }
      );

      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
      console.error("Status Save Error:", e);
      
      try {
        if (quoted && quoted.download) {
          let media = await quoted.download();
          let type = quoted.mtype || "image";
          if (type.includes("image")) {
            await chathubro.sendMessage(from, { image: media }, { quoted: mek });
          } else if (type.includes("video")) {
            await chathubro.sendMessage(from, { video: media }, { quoted: mek });
          }
          await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
          return;
        }
      } catch (err) {
        console.error("Fallback error:", err);
      }

      reply("❌ *Error: Could not save status.*");
    }
  }
);
