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

      await reply("🔍 *Searching number details... Please wait!*");

      let response = await axios.get(`https://api.popcat.xyz/truecaller?number=${number}`).catch(() => null);

      if (!response || !response.data || response.data.error) {
        
        response = await axios.get(`https://deliriussapi-oficial.vercel.app/tools/truecaller?number=${number}`).catch(() => null);
      }

      if (!response || !response.data) {
        return reply("❌ *Could not find any details for this number. Try again later!*");
      }

      const data = response.data;
      
      let name = data.name || data.result?.name || "Unknown";
      let carrier = data.carrier || data.result?.carrier || "Unknown";
      let country = data.country || data.result?.country || "Unknown";
      let email = data.email || data.result?.email || "Not Available";

      let desc = `╭───────────────◆
│   🔍 *TRUECALLER INFO* 🔍
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
