const { cmd } = require("../command");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

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

      let msg = quoted.fakeObj ? quoted.fakeObj : mek.quoted;
      if (!msg) msg = mek;

      let buffer;
      try {
        buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: console });
      } catch (err) {
        if (quoted.message) {
          buffer = await downloadMediaMessage({ key: quoted.key, message: quoted.message }, "buffer", {}, { logger: console });
        }
      }

      if (!buffer) {
        return reply("❌ *අපොයි! මෙම ස්ටේටස් එකේ මීඩියා ඩවුන්ලෝඩ් කරගැනීමට WhatsApp Privacy Restrict නිසා නොහැකි විය.*");
      }

      const isVideo = quoted.mtype === 'videoMessage' || (quoted.message && quoted.message.videoMessage);
      const caption = quoted.text || quoted.caption || "📥 *Saved Status*";

      if (isVideo) {
        await chathubro.sendMessage(from, { video: buffer, caption: caption }, { quoted: mek });
      } else {
        await chathubro.sendMessage(from, { image: buffer, caption: caption }, { quoted: mek });
      }

      await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Status Save Error:", e);
      reply("❌ *Error: Could not save status due to WhatsApp restrictions.*");
    }
  }
);
