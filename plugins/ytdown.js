const { cmd } = require("../command");
const yts = require("yt-search");
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
    desc: "Download YouTube MP4 by name or link",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("🎬 *Please provide a video name or YouTube link!*");

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      const video = await getYoutube(q);
      if (!video) return reply("❌ *No results found for your query!*");

      const caption = `╭───────────────◆
│   🎬 *YOUTUBE VIDEO* 🎬
├───────────────◆
│ 📌 *Title:* ${video.title}
│ 👤 *Channel:* ${video.author.name}
│ ⏱ *Duration:* ${video.timestamp}
│ 👀 *Views:* ${video.views.toLocaleString()}
│ 📅 *Uploaded:* ${video.ago}
│ 🔗 *Link:* ${video.url}
└───────────────◆

> *© 2026 | Powered by Chathunga Bimsara*`;

      await bot.sendMessage(
        from,
        {
          image: { url: video.thumbnail },
          caption: caption,
        },
        { quoted: mek }
      );

      await bot.sendMessage(from, { react: { text: "📥", key: mek.key } });

      const apiUrl = `https://deliriussapi-oficial.vercel.app/download/ytmp4?url=${encodeURIComponent(video.url)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.data || (!data.data.download?.url && !data.data.url)) {
        return reply("❌ *Failed to download video!*");
      }

      const downloadUrl = data.data.download?.url || data.data.url;

      await bot.sendMessage(
        from,
        {
          video: { url: downloadUrl },
          mimetype: "video/mp4",
          fileName: `${video.title}.mp4`,
          caption: `🎬 *${video.title}*\n\n> *© 2026 | Powered by Chathunga Bimsara*`,
          gifPlayback: false,
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
