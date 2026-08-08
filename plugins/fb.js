const { cmd, commands } = require("../command");
const getFbVideoInfo = require("@xaviabot/fb-downloader");

cmd(
  {
    pattern: "fb",
    alias: ["facebook", "fbdownload"],
    react: "✅",
    desc: "Download Facebook Video",
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
      body,
      isCmd,
      command,
      args,
      q,
      isGroup,
      sender,
      senderNumber,
      botNumber2,
      botNumber,
      pushname,
      isMe,
      isOwner,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      reply,
    }
  ) => {
    try {
      if (!q) return reply("*Please provide a valid Facebook video URL!* ❤️");

      const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb)\.com\/.+/;
      if (!fbRegex.test(q))
        return reply("*Invalid Facebook URL! Please check and try again.* ☹️");

      reply("*Downloading your video...* ❤️");

      const result = await getFbVideoInfo(q);
      if (!result || (!result.sd && !result.hd)) {
        return reply("*Failed to download video. Please try again later.* ☹️");
      }

      const { title, sd, hd } = result;
      const bestQualityUrl = hd || sd;
      const qualityText = hd ? "HD" : "SD";

     let desc = `╭───────────────◆
    │   🎥 *FACEBOOK DOWNLOADER* 🎥
    ├───────────────◆
    │ 📌 *Title:* ${title || "Unknown"}
    │ 💎 *Quality:* ${qualityText}
    │ 🚀 *Status:* Success
    └───────────────◆
    
    > 📥 *Downloading your video... Please wait!* ⏳
    
    > *© 2026 | Powered by Chathunga Bimsara*`;

      await chathubro.sendMessage(
        from,
        {
          image: {
            url: "https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot/blob/main/images/Chathunga-Dev-FB-Download.png?raw=true",
          },
          caption: desc,
        },
        { quoted: mek }
      );

      await chathubro.sendMessage(
        from,
        {
          video: { url: bestQualityUrl },
          caption: `*📥 Downloaded in ${qualityText} quality*`,
        },
        { quoted: mek }
      );

      return reply("Thank you for using Chathunga-Dev");
    } catch (e) {
      console.error(e);
      reply(`*Error:* ${e.message || e}`);
    }
  }
);
