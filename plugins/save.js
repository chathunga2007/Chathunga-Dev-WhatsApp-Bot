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

      const targetObj = quoted.fakeObj ? quoted.fakeObj : mek.quoted;
      
      try {
        const buffer = await downloadMediaMessage(
          targetObj,
          "buffer",
          {},
          { 
            logger: console,
            reconnect: chathubro 
          }
        );

        if (!buffer) throw new Error("Buffer is empty");

        const type = quoted.mtype || targetObj.mtype || "";
        const caption = quoted.text || quoted.caption || targetObj.body || "";

        if (type.includes("video") || quoted.msg?.seconds || targetObj.message?.videoMessage) {
          await chathubro.sendMessage(from, { video: buffer, caption: caption }, { quoted: mek });
        } else {
          await chathubro.sendMessage(from, { image: buffer, caption: caption }, { quoted: mek });
        }

        await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
        return;

      } catch (innerErr) {
        console.log("Media download fallback trying...", innerErr.message);
        
        await chathubro.sendMessage(
          from,
          { forward: targetObj },
          { quoted: mek }
        );
        
        await chathubro.sendMessage(from, { react: { text: "✅", key: mek.key } });
      }

    } catch (e) {
      console.error("Status Save Error:", e);
      reply("❌ *Error: Could not save status.*");
    }
  }
);
