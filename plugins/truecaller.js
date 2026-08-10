const { cmd } = require("../command");
const axios = require("axios");

// Helper function to detect country and network operator
function getCountryAndCarrier(number) {
  let country = "🌍 International";
  let carrier = "Unknown Operator";

  if (number.startsWith("94")) {
    country = "🇱🇰 Sri Lanka";
    const pref = number.substring(0, 4);
    if (pref === "9477" || pref === "9476") {
      carrier = "Dialog Axiata PLC";
    } else if (pref === "9471" || pref === "9470") {
      carrier = "SLT-Mobitel Mobile";
    } else if (pref === "9478" || pref === "9475") {
      carrier = "Hutchison Telecom (Hutch)";
    } else if (pref === "9472") {
      carrier = "Airtel Lanka (Dialog)";
    } else if (number.startsWith("9411")) {
      carrier = "SLT Landline / Fiber (Colombo)";
    } else if (number.startsWith("9433")) {
      carrier = "SLT Landline / Fiber (Gampaha)";
    } else if (number.startsWith("9481")) {
      carrier = "SLT Landline / Fiber (Kandy)";
    } else if (number.startsWith("9491")) {
      carrier = "SLT Landline / Fiber (Galle)";
    } else if (number.startsWith("9421")) {
      carrier = "SLT Landline / Fiber (Jaffna)";
    } else if (number.startsWith("9452")) {
      carrier = "SLT Landline / Fiber (Nuwara Eliya)";
    } else if (number.startsWith("9438")) {
      carrier = "SLT Landline / Fiber (Kalutara)";
    } else if (number.startsWith("9437")) {
      carrier = "SLT Landline / Fiber (Kurunegala)";
    } else if (number.startsWith("9445")) {
      carrier = "SLT Landline / Fiber (Ratnapura)";
    } else if (number.startsWith("9455")) {
      carrier = "SLT Landline / Fiber (Badulla)";
    } else if (number.startsWith("9441")) {
      carrier = "SLT Landline / Fiber (Matara)";
    } else {
      carrier = "Sri Lanka Telecom / Mobile";
    }
  } else if (number.startsWith("91")) {
    country = "🇮🇳 India";
  } else if (number.startsWith("1")) {
    country = "🇺🇸 USA / Canada 🇨🇦";
  } else if (number.startsWith("44")) {
    country = "🇬🇧 United Kingdom";
  } else if (number.startsWith("92")) {
    country = "🇵🇰 Pakistan";
  } else if (number.startsWith("880")) {
    country = "🇧🇩 Bangladesh";
  } else if (number.startsWith("966")) {
    country = "🇸🇦 Saudi Arabia";
  } else if (number.startsWith("971")) {
    country = "🇦🇪 United Arab Emirates";
  } else if (number.startsWith("974")) {
    country = "🇶🇦 Qatar";
  } else if (number.startsWith("965")) {
    country = "🇰🇼 Kuwait";
  } else if (number.startsWith("960")) {
    country = "🇲🇻 Maldives";
  } else if (number.startsWith("61")) {
    country = "🇦🇺 Australia";
  } else if (number.startsWith("65")) {
    country = "🇸🇬 Singapore";
  } else if (number.startsWith("60")) {
    country = "🇲🇾 Malaysia";
  }

  return { country, carrier };
}

// Multi-provider Truecaller API search
async function fetchTruecallerDetails(number) {
  const providers = [
    {
      url: `https://api.vreden.web.id/api/truecaller?number=${number}`,
      parse: (d) => d?.result || d?.data
    },
    {
      url: `https://api.nexoracle.com/tools/truecaller?number=${number}`,
      parse: (d) => d?.result || d?.data
    },
    {
      url: `https://api.giftedtech.my.id/api/tools/truecaller?number=${number}`,
      parse: (d) => d?.result || d?.data
    },
    {
      url: `https://api.davidcyriltech.my.id/v1/truecaller?number=${number}`,
      parse: (d) => d?.result || d?.data
    },
    {
      url: `https://deliriussapi-oficial.vercel.app/tools/truecaller?number=${number}`,
      parse: (d) => d?.data || d?.result
    },
    {
      url: `https://api.siputzx.my.id/api/tools/truecaller?number=${number}`,
      parse: (d) => d?.data || d?.result
    },
    {
      url: `https://itzpire.site/tools/truecaller?number=${number}`,
      parse: (d) => d?.data || d?.result
    }
  ];

  for (const p of providers) {
    try {
      const res = await axios.get(p.url, {
        timeout: 4000,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (res.data) {
        const parsed = p.parse(res.data);
        if (parsed && (parsed.name || parsed.callerName || parsed.display_name)) {
          return parsed;
        }
      }
    } catch (e) {
      // Continue to next fallback provider
    }
  }
  return null;
}

cmd(
  {
    pattern: "truecaller",
    alias: ["number", "true", "whois", "caller", "num"],
    react: "🔍",
    desc: "Check phone number, Truecaller & WhatsApp profile details (Owner Only)",
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
      quoted,
      isOwner,
    }
  ) => {
    try {
      // 🔒 Owner-only security permission check
      if (!isOwner) {
        return reply("❌ *This command is restricted to the Bot Owner only!*");
      }

      let rawNumber = "";

      // Safe extraction of number from quoted message, mention, or input text
      if (quoted && typeof quoted.sender === "string" && quoted.sender) {
        rawNumber = quoted.sender.split("@")[0];
      } else if (
        mek &&
        mek.message?.extendedTextMessage?.contextInfo?.mentionedJid &&
        Array.isArray(mek.message.extendedTextMessage.contextInfo.mentionedJid) &&
        mek.message.extendedTextMessage.contextInfo.mentionedJid.length > 0
      ) {
        const mention = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        if (typeof mention === "string" && mention) {
          rawNumber = mention.split("@")[0];
        }
      } else if (q && typeof q === "string") {
        rawNumber = q;
      }

      rawNumber = rawNumber.replace(/[^0-9]/g, "");

      // Handle Sri Lankan local format (e.g., 0767945968 -> 94767945968)
      if (rawNumber.startsWith("0") && rawNumber.length === 10) {
        rawNumber = "94" + rawNumber.substring(1);
      }

      if (!rawNumber || rawNumber.length < 7) {
        return reply(
          "❌ *Please provide a valid phone number, mention a user, or reply to a message!*\n\n" +
          "*Examples:*\n" +
          "• `.truecaller 94717845865`\n" +
          "• `.truecaller 0717845865`\n" +
          "• `.truecaller @user` (or reply to a message)"
        );
      }

      await reply("🔍 *Searching Caller & WhatsApp database... Please wait!*");

      const { country: defaultCountry, carrier: defaultCarrier } = getCountryAndCarrier(rawNumber);

      // 1. Fetch Truecaller details from online fallback APIs
      const tcData = await fetchTruecallerDetails(rawNumber);

      let callerName = tcData?.name || tcData?.callerName || tcData?.display_name || null;
      let callerCarrier = tcData?.carrier || tcData?.sim || defaultCarrier;
      let callerCountry = tcData?.country || tcData?.countryCode || defaultCountry;
      let callerEmail = tcData?.email || tcData?.eMail || "Not Available";
      let callerAddress = tcData?.address || tcData?.city || "Not Available";

      // 2. Fetch WhatsApp Real-Time Profile & Status info via Baileys
      const jid = `${rawNumber}@s.whatsapp.net`;
      let isWhatsApp = "Unknown";
      let waBio = "Not Available / Private";
      let waBioDate = "";
      let profilePicUrl = null;
      let isBusiness = false;
      let businessInfo = "";
      let waContactName = null;

      try {
        // Attempt WhatsApp contact name lookup via Baileys
        if (quoted && quoted.pushName && quoted.pushName !== "Sin Nombre") {
          waContactName = quoted.pushName;
        }
        if (!waContactName && typeof chathubro.getName === "function") {
          const n = await chathubro.getName(jid);
          if (n && n !== jid.split("@")[0] && !n.includes("@s.whatsapp.net")) {
            waContactName = n;
          }
        }
        if (!waContactName && chathubro.contacts && chathubro.contacts[jid]) {
          const c = chathubro.contacts[jid];
          waContactName = c.name || c.notify || c.vname || null;
        }
      } catch (err) {}

      try {
        const onWa = await chathubro.onWhatsApp(jid);
        if (onWa && onWa.length > 0 && onWa[0].exists) {
          isWhatsApp = "✅ Registered on WhatsApp";

          // Fetch WhatsApp Bio status
          try {
            const statusObj = await chathubro.fetchStatus(jid);
            if (statusObj && statusObj.status) {
              waBio = statusObj.status;
              if (statusObj.setAt) {
                waBioDate = new Date(statusObj.setAt).toLocaleDateString("en-GB");
              }
            }
          } catch (err) {}

          // Fetch Profile Picture URL
          try {
            profilePicUrl = await chathubro.profilePictureUrl(jid, "image");
          } catch (err) {}

          // Fetch Business Profile details if available
          try {
            const biz = await chathubro.getBusinessProfile(jid);
            if (biz) {
              isBusiness = true;
              if (biz.name) callerName = biz.name;
              if (biz.description) businessInfo += `\n│ 🏢 *Biz Info:* ${biz.description.trim()}`;
              if (biz.category) businessInfo += `\n│ 🏷️ *Category:* ${biz.category}`;
              if (biz.email) callerEmail = biz.email;
            }
          } catch (err) {}
        } else {
          isWhatsApp = "❌ Not Registered on WhatsApp";
        }
      } catch (e) {
        console.error("WhatsApp check error:", e);
      }

      // Final Name resolution order: Truecaller Name -> WhatsApp Contact/Profile Name -> Business Name -> Fallback Label
      const finalName =
        callerName ||
        waContactName ||
        (isBusiness ? "WhatsApp Business User" : "Not Publicly Listed");

      let report = `╭───────────────◆
│   🔍 *CALLER & NUMBER LOOKUP* 🔍
├───────────────◆
│ 👤 *Name:* ${finalName}
│ 📞 *Number:* +${rawNumber}
│ 🌐 *Country:* ${callerCountry}
│ 📡 *Network:* ${callerCarrier}
│ 💬 *WhatsApp:* ${isWhatsApp}
│ 📝 *WA Status:* ${waBio}${waBioDate ? ` (${waBioDate})` : ""}
│ 📧 *Email:* ${callerEmail}
│ 📍 *Location:* ${callerAddress}${businessInfo}
└───────────────◆

> *© 2026 | Powered by Chathunga Bimsara*`;

      if (profilePicUrl) {
        await chathubro.sendMessage(
          from,
          {
            image: { url: profilePicUrl },
            caption: report
          },
          { quoted: mek }
        );
      } else {
        await chathubro.sendMessage(
          from,
          {
            text: report
          },
          { quoted: mek }
        );
      }
    } catch (e) {
      console.error("Truecaller Error:", e);
      reply(`❌ *Lookup Error:* ${e.message}`);
    }
  }
);
