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

      await chathubro.sendMessage(from, {
        forward: quoted
      }, { quoted: mek });

    } catch (e) {
      console.error("Status Save Error:", e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
