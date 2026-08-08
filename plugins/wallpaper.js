const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "wall",
    alias: ["wallpaper", "photo"],
    react: "🖼️",
    desc: "Download HD Wallpapers",
    category: "download",
    filename: __filename,
  },
  async (
    conn,
    mek,
    m,
    {
      from,
      q,
      reply,
    }
  ) => {
    try {
      if (!q) return reply("*🖼️ Please enter a keyword to search HD wallpapers!*");

      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      const res = await axios.get(`https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(q)}&sorting=random&resolutions=1920x1080,2560x1440,3840x2160`);
      const wallpapers = res.data.data;

      if (!wallpapers || wallpapers.length === 0) {
        return reply("*❌ No HD wallpapers found for that keyword.*");
      }

      const selected = wallpapers.slice(0, 5);

      const header = `╭───────────────◆
│   🖼️ *WALLPAPER DOWNLOADER* 🖼️
├───────────────◆
│ 🔍 *Query:* ${q}
│ 📊 *Found:* ${wallpapers.length} Wallpapers
│ 📥 *Sending:* Top 5 HD Images
└───────────────◆

> *© 2026 | Powered by Chathunga Bimsara*`;

      await conn.sendMessage(
        from,
        {
          image: {
            url: "https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot/blob/main/images/Chathunga-Dev-Wallpaper-Downloader.png?raw=true",
          },
          caption: header,
        },
        { quoted: mek }
      );

      for (const wallpaper of selected) {
        const caption = `╭───────────────◆
│   📥 *HD WALLPAPER* 📥
├───────────────◆
│ 📐 *Resolution:* ${wallpaper.resolution}
│ 🔗 *Source:* ${wallpaper.url}
└───────────────◆

> *© 2026 | Powered by Chathunga Bimsara*`;

        await conn.sendMessage(
          from,
          {
            image: { url: wallpaper.path },
            caption: caption,
          },
          { quoted: mek }
        );
      }

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
      console.error(e);
      reply(`*❌ Error:* ${e.message || e}`);
    }
  }
);
