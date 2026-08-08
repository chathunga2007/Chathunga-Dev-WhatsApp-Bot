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

      await reply("⏳ *Downloading status... Please wait!*");

      const buffer = await downloadMediaMessage(
        quoted,
        "buffer",
        {},
        { logger: console }
      );

      let mtype = quoted.mtype || "";
      let sendType = "image";

      if (mtype.includes("video") || (quoted.message && quoted.message.videoMessage)) {
        sendType = "video";
      }

      await chathubro.sendMessage(from, {
        [sendType]: buffer,
        caption: "✅ *Status Saved Successfully!*\n\n> *© Powered by Chathunga Bimsara*",
      }, { quoted: mek });

    } catch (e) {
      console.error("Status Save Error:", e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
