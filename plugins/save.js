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
        { 
          forward: targetObj 
        },
        { quoted: mek }
      );

      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Status Save Error:", e);
      
      try {
        const textContent = quoted.text || quoted.caption || "Saved WhatsApp Status";
        await chathubro.sendMessage(from, { text: `📥 *Status Content:* \n\n${textContent}` }, { quoted: mek });
      } catch (err) {
        reply("❌ *WhatsApp නව privacy updates නිසා මෙම ස්ටේටස් එක ඩවුන්ලෝඩ් කරගැනීමට නොහැක.*");
      }
    }
  }
);
