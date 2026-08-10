# 🧬 CHATHUNGA-DEV WHATSAPP BOT 🚀

<div align="center">

  <img src="https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot/blob/main/images/Chathunga-Dev-WhatsApp-Bot-Image.png?raw=true" alt="Chathunga-Dev Banner" width="800" style="border-radius: 12px; box-shadow: 0px 4px 20px rgba(0,0,0,0.5);"/>

  <br/><br/>

  [![NodeJS](https://img.shields.io/badge/Node.js-v18%2B-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![Baileys](https://img.shields.io/badge/Baileys-v7.0.0-blue.svg?style=for-the-badge&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
  [![License](https://img.shields.io/badge/License-GPL--3.0-orange.svg?style=for-the-badge)](./LICENSE)
  [![Status](https://img.shields.io/badge/Bot%20Status-Active-brightgreen.svg?style=for-the-badge)](https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot)
  [![Developer](https://img.shields.io/badge/Developer-Chathunga%20Bimsara-purple.svg?style=for-the-badge&logo=github)](https://github.com/chathunga2007)

  <p align="center">
    <b>The Ultimate, Feature-Packed Multi-Device WhatsApp Bot Built on Modern Node.js Architecture!</b>
  </p>

  <sub>Created with ❤️ by <a href="https://github.com/chathunga2007">Chathunga Bimsara</a></sub>

</div>

---

## 🌟 Overview

**Chathunga-Dev WhatsApp Bot** is a state-of-the-art, high-performance WhatsApp Automation Bot designed for personal and group utility. Built using **@whiskeysockets/baileys**, it offers ultra-fast response times, rich multimedia downloaders, AI assistant integrations, group management tools, anti-delete features, status auto-react/saver, and custom logo generators.

---

## 🔥 Key Features

| Category | Highlights & Capabilities |
| :--- | :--- |
| 🎵 **Media Downloads** | YouTube MP3/MP4, TikTok No-Watermark, Facebook HD/SD, Movie Downloader (Sinhalasub.lk with quality selection), HD Wallpapers. |
| 🤖 **AI Assistant** | Integrated GPT-4 / AI Chat bot capable of answering complex questions in Sinhala, English, and other languages. |
| 🛡️ **Privacy & Recovery** | Anti-Delete (recovers deleted messages/media instantly) & Anti-ViewOnce (grabs View Once media). |
| 🎨 **Logo Studio** | 35+ 3D/Neon/Anime/Metal logo generators (Naruto, DragonBall, Marvel, Blackpink, Neon, Gold, Glitch, etc.). |
| 🛠️ **Utility Tools** | Image & Video Sticker Maker, WebP to Image Converter, Media to URL Uploader, Translator, QR Code Generator, Link Shortener. |
| 👥 **Group Control** | Kick, Add, Promote, Demote, Mute/Unmute Chat, Tag All Members, Change Group PP, Revoke Invite Links, Group Info. |
| 👁️ **Status Automations** | Auto-Status Seen, Auto-Status Reaction (Random Emojis), Status Saver (`.save`). |
| 🔍 **Search & Info** | Truecaller Phone Lookup, YouTube Search (`.yts`), System Latency (`.ping`), Hardware Info (`.system`). |

---

## 🚀 One-Click Deployments

Deploy your own instance of **Chathunga-Dev WhatsApp Bot** in seconds on your favorite cloud provider:

<div align="center">

### Deploy to Heroku
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot)

### Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot)

### Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy)

</div>

---

## 💻 Local Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [Git](https://git-scm.com/)
- [FFmpeg](https://ffmpeg.org/) (installed and added to system PATH)

### Quick Start (Terminal / Powershell / Linux)

```bash
# 1. Clone the repository
git clone https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot.git

# 2. Change directory
cd Chathunga-Dev-WhatsApp-Bot

# 3. Install dependencies
npm install

# 4. Set up environment variables
# Create a config.env file or set environment variables (see Configuration section below)

# 5. Start the bot
npm start
```

---

## ⚙️ Configuration & Environment Variables

You can configure the bot by creating a `config.env` file in the root directory:

```env
SESSION_ID=your session id
BOT_OWNER=your whatsapp number
ALIVE_IMG=https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot/blob/main/images/Chathunga-Dev-WhatsApp-Bot-Image.png?raw=true
ALIVE_MSG=╔═════════════════════════╗\n║ ✨ CHATHUNGA-DEV ✨\n╚═════════════════════════╝
AUTO_STATUS_SEEN=true
AUTO_STATUS_REACT=true
PORT=8000
```

### Environment Variable Details:

| Variable | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `SESSION_ID` | **Yes** | `MEGA_FILE_KEY` | MEGA link code for your session auth `creds.json`. |
| `BOT_OWNER` | **Yes** | `94767945968` | Owner phone number (without `+`). |
| `ALIVE_IMG` | No | Banner Image URL | Image sent when `.alive` or `.menu` is called. |
| `ALIVE_MSG` | No | Default Alive Text | Custom welcome/status caption. |
| `AUTO_STATUS_SEEN` | No | `false` | Automatically view all status updates. |
| `AUTO_STATUS_REACT` | No | `false` | Automatically react to statuses with random emojis. |
| `PORT` | No | `8000` | Port for web keep-alive server. |

---

## 📑 Command Directory

### 👑 Main & System Commands
- `.menu` / `.help` - Display interactive category menu.
- `.allmenu` - Show full command list.
- `.alive` - Check live status & system statistics.
- `.ping` - Test response latency in milliseconds.
- `.system` - Display RAM, CPU, OS, and Node.js info.
- `.owner` - Send developer contact card (vCard).
- `.restart` - Restart bot process (Owner only).

### 📥 Media Downloaders
- `.song [name/url]` - Download high quality MP3 song & document.
- `.ytmp4 [name/url]` - Download YouTube video.
- `.tiktok [url]` - Download TikTok video without watermark.
- `.fb [url]` - Download Facebook video in HD/SD.
- `.movie [name]` - Search & download movies from Sinhalasub.lk.
- `.wall [keyword]` - Search and download HD wallpapers.
- `.save` - Save quoted WhatsApp status.

### 🤖 AI & Tools
- `.ai [query]` - Ask AI Assistant any question.
- `.sticker` (reply image/video) - Convert media to WhatsApp WebP sticker.
- `.toimage` (reply sticker) - Convert WebP sticker to image.
- `.tourl` (reply media) - Upload media to direct URL.
- `.tr [lang] [text]` - Translate text to Sinhala or chosen language.
- `.qr [text/url]` - Generate QR code image.
- `.short [url]` - Shorten long web URL.
- `.truecaller [number]` - Search phone number details on Truecaller.

### 👥 Group Commands
- `.kick [@user / reply]` - Kick a member from group.
- `.add [number]` - Add a user to group.
- `.promote [@user / reply]` - Promote member to admin.
- `.demote [@user / reply]` - Demote admin to member.
- `.close` / `.mute` - Restrict group chat to admins only.
- `.open` / `.unmute` - Allow all members to send messages.
- `.tagall` - Tag every group participant.
- `.admins` - List all group admins.
- `.setpp` (reply image) - Change group profile picture.
- `.setsubject [name]` - Update group title.
- `.setdesc [desc]` - Update group description.
- `.grouplink` - Fetch group invite link.
- `.revoke` - Reset group invite link.

### 🎨 Logo Generators (35+ Effects)
- `.naruto [text]` | `.dragonball [text]` | `.marvel [text]` | `.onepiece [text]`
- `.neon [text]` | `.glitch [text]` | `.gold [text]` | `.silver [text]`
- `.diamond [text]` | `.fire [text]` | `.water [text]` | `.smoke [text]`
- `.blackpink [text]` | `.harrypotter [text]` | `.luxury [text]` | `.3dcomic [text]`
- `.logo list` - Show all 35+ available logo styles.
- `.logo batch [effect1,effect2] [text]` - Generate multiple logo styles at once.

### 🎉 Fun Commands
- `.weather [city]` - Check current weather forecast.
- `.joke` - Get a random funny joke.
- `.fact` - Get an interesting fact.
- `.quote` - Get daily motivational quote.
- `.flip` - Flip a coin.
- `.roll` - Roll a 6-sided dice.

---

## 📁 Repository Structure

```
Chathunga-Dev-WhatsApp-Bot/
├── auth_info_baileys/  # Baileys WhatsApp authentication credentials
├── images/             # Bot artwork and banners
├── lib/
│   ├── functions.js    # Utility helper functions
│   └── msg.js          # WhatsApp message serializer & downloader
├── plugins/
│   ├── alive.js        # Dynamic status & alive responder
│   ├── antidelete.js   # Anti-delete message recovery hook
│   ├── antiviewonce.js # Anti-viewonce grabber hook
│   ├── apk.js          # APK downloader plugin
│   ├── fb.js           # Facebook downloader plugin
│   ├── fun.js          # Weather, Jokes, Facts & Fun games
│   ├── group.js        # Group moderation & administration
│   ├── logo.js         # 35+ Photo360 logo generators
│   ├── menu.js         # Interactive command menu
│   ├── movie.js        # Sinhalasub movie downloader
│   ├── save.js         # WhatsApp status saver
│   ├── song.js         # YouTube MP3 downloader
│   ├── system.js       # Ping, hardware stats & owner info
│   ├── thanks.js       # Polite reply handler
│   ├── tools.js        # Sticker, ToImage, AI, ToURL, Translator
│   ├── truecaller.js   # Phone number lookup
│   ├── wallpaper.js    # Wallhaven HD wallpaper search
│   ├── ytdown.js       # YouTube MP4 & TikTok downloader
│   └── yts.js          # YouTube search plugin
├── app.json            # Heroku deployment configuration
├── command.js          # Command handler & registry
├── config.js           # Environment configuration loader
├── index.js            # Main entry point & WhatsApp connection socket
├── package.json        # Node.js dependencies & scripts
└── README.md           # Documentation
```

---

## 🤝 Contribution & Support

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/chathunga2007/Chathunga-Dev-WhatsApp-Bot/issues).

### Author & Developer
- **Chathunga Bimsara**
- 💬 **WhatsApp:** ChathuBro2007
- 🐙 **GitHub:** [@chathunga2007](https://github.com/chathunga2007)

---

## 📜 License

This project is licensed under the **GPL-3.0 License** - see the [LICENSE](./LICENSE) file for details.

<div align="center">

  **⭐ Don't forget to give a STAR to this repository if you find it useful! ⭐**

  <sub>© 2026 | Powered by Chathunga Bimsara</sub>

</div>
