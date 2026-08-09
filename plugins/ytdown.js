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

      let downloadUrl = null;

      // 1st API: SaveTube / YMP4 Alternative
      try {
        const res = await axios.get(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(video.url)}`);
        if (res.data && res.data.status && res.data.data?.dl) {
          downloadUrl = res.data.data.dl;
        }
      } catch (e) {}

      // 2nd API: Ryzendesu Backup
      if (!downloadUrl) {
        try {
          const res2 = await axios.get(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(video.url)}`);
          if (res2.data && res2.data.url) {
            downloadUrl = res2.data.url;
          }
        } catch (e) {}
      }

      // 3rd API: Vyuh / External Backup
      if (!downloadUrl) {
        try {
          const res3 = await axios.get(`https://kaiz-apis.gleeze.com/api/ytmp4?url=${encodeURIComponent(video.url)}`);
          if (res3.data && res3.data.downloadUrl) {
            downloadUrl = res3.data.downloadUrl;
          }
        } catch (e) {}
      }

      if (!downloadUrl) {
        return reply("❌ *Failed to download video! All download servers are currently busy.*");
      }

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
    alias: ["tt"],
    desc: "Download TikTok video",
    category: "download",
    filename: __filename,
  },
  async (bot, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("📱 *Please provide a valid TikTok link!*");

      await bot.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      let videoUrl = null;
      let title = "TikTok Video";
      let author = "Unknown";

      try {
        const res = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(q)}`);
        if (res.data && res.data.status && res.data.data?.nowm) {
          videoUrl = res.data.data.nowm;
          title = res.data.data.title || title;
          author = res.data.data.author?.nickname || author;
        }
      } catch (e) {}

      if (!videoUrl) {
        try {
          const res2 = await axios.get(`https://api.ryzendesu.vip/api/downloader/tiktok?url=${encodeURIComponent(q)}`);
          if (res2.data && res2.data.data?.no_watermark) {
            videoUrl = res2.data.data.no_watermark;
            title = res2.data.data.title || title;
            author = res2.data.data.author || author;
          }
        } catch (e) {}
      }

      if (!videoUrl) {
        return reply("❌ *Failed to download TikTok video!*");
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
