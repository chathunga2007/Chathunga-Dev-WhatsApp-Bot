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
      const chatJid = originalMessage.key.remoteJid;

      let alertText = `╭───────────────◆
│   ⚠️ *ANTI-DELETE DETECTED* ⚠️
├───────────────◆
│ 👤 *Sender:* @${senderNumber}
│ 📍 *Chat Type:* ${groupName}
└───────────────◆

> *The user deleted the message below:* 👇`;

      await chathubro.sendMessage(chatJid, {
        text: alertText,
        mentions: [sender]
      });

      try {
        await chathubro.sendMessage(chatJid, {
          forward: originalMessage
        });
      } catch (err) {
        await chathubro.sendMessage(chatJid, { 
          text: "⚠️ *Could not forward directly, message object captured.*" 
        });
      }

    } catch (e) {
      console.log("Anti-delete error:", e);
    }
  }
};
