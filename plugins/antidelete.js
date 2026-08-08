const { cmd } = require("../command");

const msgStore = new Map();

module.exports = {
  saveMessage: (mek) => {
    if (mek && mek.key && mek.message) {
      msgStore.set(mek.key.id, mek);
      if (msgStore.size > 1000) {
        const firstKey = msgStore.keys().next().value;
        msgStore.delete(firstKey);
      }
    }
  },

  handleDelete: async (chathubro, deletedData) => {
    try {
      const key = deletedData.keys ? deletedData.keys[0] : deletedData;
      if (!key || !key.id) return;

      const originalMessage = msgStore.get(key.id);
      if (!originalMessage) return;

      const sender = originalMessage.key.participant || originalMessage.key.remoteJid;
      const senderNumber = sender.split("@")[0];
      const isGroup = originalMessage.key.remoteJid.endsWith("@g.us");
      const groupName = isGroup ? "Group Chat" : "Private Chat";

      let msgType = Object.keys(originalMessage.message)[0];
      let msgContent = originalMessage.message;

      let alertText = `╭───────────────◆
│   ⚠️ *ANTI-DELETE DETECTED* ⚠️
├───────────────◆
│ 👤 *Sender:* @${senderNumber}
│ 📍 *Chat Type:* ${groupName}
└───────────────◆

> *The user deleted the message below:* 👇`;

      await chathubro.sendMessage(originalMessage.key.remoteJid, {
        text: alertText,
        mentions: [sender]
      });

      await chathubro.sendMessage(originalMessage.key.remoteJid, {
        forward: originalMessage
      }, { quoted: originalMessage });

    } catch (e) {
      console.log("Anti-delete error:", e);
    }
  }
};
