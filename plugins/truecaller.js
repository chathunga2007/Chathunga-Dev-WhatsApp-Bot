const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "truecaller",
    alias: ["number", "true", "whois", "caller"],
    react: "🔍",
    desc: "Check phone number details",
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
        return reply("❌ *Please provide a phone number!*\n\n*Example:* `.truecaller 94767945968`");
      }

      const number = q.replace(/[^0-9]/g, "");

      await reply("🔍 *Searching Truecaller database... Please wait!*");

      const response = await axios.get(`https://api.vyturex.com/truecaller?number=${number}`).catch(() => null);

      if (!response || !response.data || !response.data.name) {
        return reply("❌ *Could not find any details for this number. The number might not be registered on Truecaller.*");
      }

      const data = response.data;
      
      let name = data.name || "Unknown";
      let carrier = data.carrier || "Unknown";
      let country = data.country || "Sri Lanka";
      let email = data.email || "Not Available";

      let desc = `╭───────────────◆
│   🔍 *TRUECALLER SEARCH* 🔍
├───────────────◆
│ 👤 *Name:* ${name}
│ 📞 *Number:* +${number}
│ 🌐 *Country:* ${country}
│ 📡 *Carrier:* ${carrier}
│ 📧 *Email:* ${email}
└───────────────◆

> *© 2026 | Powered by Chathunga Bimsara*`;

      await chathubro.sendMessage(from, {
        text: desc
      }, { quoted: mek });

    } catch (e) {
      console.error("Truecaller Error:", e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
