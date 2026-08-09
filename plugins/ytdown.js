const { cmd } = require("../command");
const yts = require("yt-search");
const { ytmp4 } = require("@vreden/youtube_scraper");
const axios = require("axios");

async function getYoutube(query) {
  const isUrl = /(youtube\.com|youtu\.be)/i.test(query);
  if (isUrl) {
    const id = query.split("v=")[1] || query.split("/").pop();
    const info = await yts({ videoId: id });
    return info;
  }
  const search = await yts(query);
  if (!search.videos.length) return null;
  return search.videos[0];
}

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

      const video = await getYoutube(q);
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

      const data = await ytmp4(video.url);
      if (!data || !data.download || !data.download.url) {
        return reply("❌ *Failed to download video!*");
      }

      await bot.sendMessage(
        from,
        {
          video: { url: data.download.url },
          mimetype: "video/mp4",
          fileName: `${video.title}.mp4`,
          caption: `🎬 *${video.title}*\n\n> *© 2026 | Powered by Chathunga Bimsara*`,
          gifPlayback: false
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

      let cleanUrl = q.split("?")[0];
      let videoUrl = null;
      let title = "TikTok Video";
      let author = "Unknown";

      try {
        const res = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`);
        if (res.data && res.data.code === 0 && res.data.data?.play) {
          videoUrl = res.data.data.play;
          title = res.data.data.title || title;
          author = res.data.data.author?.nickname || author;
        }
      } catch (e) {}

      if (!videoUrl) {
        try {
          const res2 = await axios.get(`https://kaiz-apis.gleeze.com/api/tiktok?url=${encodeURIComponent(cleanUrl)}`);
          if (res2.data && res2.data.url) {
            videoUrl = res2.data.url;
          }
        } catch (e) {}
      }

      if (!videoUrl) {
        return reply("❌ *Failed to download TikTok video! All servers are busy.*");
      }

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
