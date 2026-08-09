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

      if (targetObj.message && targetObj.message.ephemeralMessage) {
        targetObj = targetObj.message.ephemeralMessage;
      }

      await chathubro.sendMessage(
        from,
        { forward: targetObj },
        { quoted: mek }
      );
      
      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
      console.error("Status Save Error:", e);
      
      try {
        const textContent = quoted.text || quoted.caption || "Saved WhatsApp Status";
        await chathubro.sendMessage(from, { text: `📥 *Status:* \n\n${textContent}` }, { quoted: mek });
        await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
      } catch (err) {
        reply("❌ *Error: Could not save status.*");
      }
    }
  }
);
