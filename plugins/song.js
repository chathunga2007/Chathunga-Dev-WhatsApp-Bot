const { cmd, commands } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

cmd(
  {
    pattern: "song",
    alias: ["Song", "songdownload", "downloadsong", "Song Download"],
    react: "🎶",
    desc: "Download Song",
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
      if (!q) return reply("❌ *Please provide a song name or YouTube link*");

      const search = await yts(q);
      const data = search.videos[0];
      const url = data.url;

      let desc = `╭───────────────◆
│   🎧 *CHATHUNGA-DEV MUSIC* 🎧
├───────────────◆
│ 📌 *Title:* ${data.title}
│ ⏱️ *Duration:* ${data.timestamp}
│ 👁️ *Views:* ${data.views.toLocaleString()}
│ 📅 *Uploaded:* ${data.ago}
│ 🔗 *YouTube:* ${data.url}
└───────────────◆

> 📥 *Downloading your song... Please wait!* ⏳

> *© 2026 | Powered by Chathunga Bimsara*`;

      await chathubro.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      const quality = "192";
      const songData = await ytmp3(url, quality);

      let durationParts = data.timestamp.split(":").map(Number);
      let totalSeconds =
        durationParts.length === 3
          ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
          : durationParts[0] * 60 + durationParts[1];

      if (totalSeconds > 1800) {
        return reply("⏳ *Sorry, audio files longer than 30 minutes are not supported.*");
      }

      await chathubro.sendMessage(
        from,
        {
          audio: { url: songData.download.url },
          mimetype: "audio/mpeg",
        },
        { quoted: mek }
      );

      await chathubro.sendMessage(
        from,
        {
          document: { url: songData.download.url },
          mimetype: "audio/mpeg",
          fileName: `${data.title}.mp3`,
          caption: "🎶 *Your song is ready to be played!*",
        },
        { quoted: mek }
      );

      return reply("✅ Thank you");
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e.message} 😞`);
    }
  }
);
