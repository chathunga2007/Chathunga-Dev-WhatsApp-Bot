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

      let statusText = quoted.text || quoted.caption || mek.quoted?.msg?.caption || "No caption available";

      let responseText = 
`╭━━━〔 *📥 SAVED STATUS* 〕━━━╮
┃
┃ 📝 *Caption / Text:* 
┃ ${statusText}
┃
┃ ⚠️ *(WhatsApp privacy restrictions prevent direct media downloading)*
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯`;

      await chathubro.sendMessage(from, { text: responseText }, { quoted: mek });
      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Status Save Error:", e);
      reply("❌ *Error: Could not process status.*");
    }
  }
);
