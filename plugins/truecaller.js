const { cmd } = require("../command");

cmd(
  {
    pattern: "truecaller",
    alias: ["number", "true", "whois", "caller"],
    react: "🔍",
    desc: "Check phone number details via WhatsApp",
    category: "tools",
    filename: __filename,
  },
  async (
    chathubro,
    mek,
    m,
    {
      from,
      q,
      reply,
    }
  ) => {
    try {
      if (!q) {
        return reply("❌ *Please provide a phone number!*\n\n*Example:* `.number 94767945968`");
      }

      const number = q.replace(/[^0-9]/g, "");
      const jid = number + "@s.whatsapp.net";

      await reply("🔍 *Checking number details... Please wait!*");

      let profileName = "Unknown";
      let about = "Not Available";

      try {
        const nameData = await chathubro.getName(jid);
        if (nameData) profileName = nameData;
      } catch (err) {}

      try {
        const statusData = await chathubro.fetchStatus(jid);
        if (statusData && statusData.status) about = statusData.status;
      } catch (err) {}

      let desc = `╭───────────────◆
│   🔍 *NUMBER INFO (WHATSAPP)* 🔍
├───────────────◆
│ 👤 *Name:* ${profileName}
│ 📞 *Number:* +${number}
│ 💬 *About/Bio:* ${about}
│ 🌐 *Platform:* WhatsApp Database
└───────────────◆

> *© 2026 | Powered by Chathunga Bimsara*`;

      await chathubro.sendMessage(from, {
        text: desc
      }, { quoted: mek });

    } catch (e) {
      console.error("Number Info Error:", e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
