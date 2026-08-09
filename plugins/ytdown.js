const { cmd } = require("../command");
const yts = require("yt-search");
const ytdl = require("ytdl-core");

cmd(
  {
    pattern: "ytmp4",
    alias: ["ytv", "video"],
    desc: "Download YouTube MP4",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 *Please provide a video name or YouTube link!*");

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      const search = await yts(q);
      const video = search.videos[0];
      if (!video) return reply("❌ *No results found!*");

      const caption = `╭───────────────◆
│   🎬 *YOUTUBE VIDEO* 🎬
├───────────────◆
│ 📌 *Title:* ${video.title}
│ 👤 *Channel:* ${video.author.name}
│ ⏱ *Duration:* ${video.timestamp}
│ 🔗 *Link:* ${video.url}
└───────────────◆

> *© 2026 | Powered by Chathunga Bimsara*`;

      await bot.sendMessage(from, { image: { url: video.thumbnail }, caption: caption }, { quoted: mek });

      await bot.sendMessage(from, { react: { text: "📥", key: mek.key } });

      const stream = ytdl(video.url, { quality: 'highest', filter: 'audioandvideo' });

      await bot.sendMessage(
        from,
        {
          video: { url: video.url },
          mimetype: "video/mp4",
          fileName: `${video.title}.mp4`,
          caption: `🎬 *${video.title}*\n\n> *© 2026 | Powered by Chathunga Bimsara*`
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
      console.log("YTMP4 ERROR:", e);
      reply("❌ *Error while downloading video!*");
    }
  }
);

cmd(
  {
    pattern: "tiktok",
    alias: ["tt", "tiktokdownload"],
    desc: "Download TikTok video",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("📱 *Please provide a valid TikTok link!*");

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      const apiUrl = `https://deliriussapi-oficial.vercel.app/download/tiktok?url=${encodeURIComponent(q)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.data) {
        return reply("❌ *Failed to download TikTok video!*");
      }

      const resData = data.data;
      const videoUrl = resData.meta?.media?.noWatermark || resData.url;

      if (!videoUrl) {
        return reply("❌ *Could not find the video download link!*");
      }

      const title = resData.meta?.title || "TikTok Video";
      const author = resData.author?.nickname || resData.author?.username || "Unknown";

      const caption = `╭───────────────◆
│   🎵 *TIKTOK DOWNLOADER* 🎵
├───────────────◆
│ 📌 *Title:* ${title}
│ 👤 *Author:* ${author}
└───────────────◆

> *© 2026 | Powered by Chathunga Bimsara*`;

      await bot.sendMessage(
        from,
        {
          video: { url: videoUrl },
          caption: caption,
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
      console.log("TIKTOK ERROR:", e);
      reply("❌ *Error while downloading TikTok video!*");
    }
  }
);
