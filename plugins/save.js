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

      await chathubro.sendMessage(from, { forward: mek.quoted.fakeObj }, { quoted: mek });
      
      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
      console.error("Status Save Error:", e);
      reply("❌ *Error: Could not save status.*");
    }
  }
);
