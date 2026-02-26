const fs = require("fs-extra");

module.exports = {
  config: {
    name: "prefix",
    version: "3.1",
    author: "NoobCore Team | NC-Saim",
    team: "NoobCore",
    countDown: 5,
    role: 0,
    description: "Change the bot prefix in this chat or globally",
    guide: {
      en:
        "👋 Need help with prefixes? Here's what I can do:\n" +
        "╰‣ Type: {pn} <newPrefix>\n" +
        "   ↪ Set a new prefix for this chat only\n" +
        "   ↪ Example: {pn} $\n" +
        "╰‣ Type: {pn} <newPrefix> -g\n" +
        "   ↪ Set a new global prefix (admin only)\n" +
        "   ↪ Example: {pn} ! -g\n" +
        "╰‣ Type: {pn} reset\n" +
        "   ↪ Reset to default prefix from config\n" +
        "╰‣ Type: {pn} refresh\n" +
        "   ↪ Refresh prefix cache for this chat\n" +
        "╰‣ Just type: prefix\n" +
        "   ↪ Shows current prefix info\n" +
        "🤖 I'm NoobCore V3, ready to help!"
    }
  },


  ncStart: async function ({ message, role, args, commandName, event, threadsData, usersData }) {
    const globalPrefix = global.noobCore.ncsetting.prefix;
    
    
    const userName = await usersData.getName(event.senderID) || "there";

  
    if (!args[0]) {
      const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;
      
      return message.reply(
        `👋 Hey ${userName}, did you ask for my prefix?\n` +
        `╭‣ 🌐 Global: ${globalPrefix}\n` +
        `╰‣ 💬 This Chat: ${threadPrefix}\n` +
        `🤖 I'm NoobCore V3\n📂 try "${threadPrefix}help" to see all commands.`
      );
    }

    
    if (args[0] === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(
        `✅ Hey ${userName}, chat prefix has been reset!\n` +
        `╭‣ 🌐 Global: ${globalPrefix}\n` +
        `╰‣ 💬 This Chat: ${globalPrefix}\n` +
        `🤖 I'm NoobCore V3\n📂 try "${globalPrefix}help" to see all commands.`
      );
    }

    
    if (args[0] === "refresh") {
      try {
        const threadID = event.threadID;
        
        
        if (threadsData.cache && threadsData.cache[threadID]) {
          delete threadsData.cache[threadID].data?.prefix;
        }
        
        const refreshedPrefix = await threadsData.get(threadID, "data.prefix") || globalPrefix;
        
        return message.reply(
          `🔄 Hey ${userName}, prefix cache has been refreshed!\n` +
          `╭‣ 🌐 Global: ${globalPrefix}\n` +
          `╰‣ 💬 This Chat: ${refreshedPrefix}\n` +
          `🤖 I'm NoobCore V3\n📂 try "${refreshedPrefix}help" to see all commands.`
        );
      } catch (error) {
        console.error("Refresh error:", error);
        return message.reply(
          `❌ Hey ${userName}, I couldn't refresh the prefix!\n` +
          `╭‣ Error: Cache refresh failed\n` +
          `╰‣ Solution: Try again in a moment\n` +
          `🤖 I'm NoobCore V3\n📂 try "${globalPrefix}help" to see all commands.`
        );
      }
    }

    
    const newPrefix = args[0];
    const setGlobal = args[1] === "-g";

    
    if (setGlobal && role < 2) {
      return message.reply(
        `⛔ Hey ${userName}, I can't do that for you!\n` +
        `╭‣ Action: Change global prefix\n` +
        `╰‣ Reason: Admin privileges required\n` +
        `🤖 I'm NoobCore V3\n📂 try "${globalPrefix}help" to see all commands.`
      );
    }

    
    const currentPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;
    
    
    const confirmMessage = setGlobal 
      ? `⚙️ Hey ${userName}, confirm global prefix change?\n` +
        `╭‣ Current Global: ${globalPrefix}\n` +
        `╰‣ New Global: ${newPrefix}\n` +
        `🤖 React to confirm this change!`
      : `⚙️ Hey ${userName}, confirm chat prefix change?\n` +
        `╭‣ Current Chat: ${currentPrefix}\n` +
        `╰‣ New Chat: ${newPrefix}\n` +
        `🤖 React to confirm this change!`;
    
    
    return message.reply(confirmMessage, (err, info) => {
      if (err) {
        console.error("Error sending confirmation message:", err);
        return;
      }
      
      global.noobCore.onReaction.set(info.messageID, {
        author: event.senderID,
        newPrefix,
        setGlobal,
        commandName
      });
    });
  },


  onReaction: async function ({ message, event, Reaction, threadsData, usersData }) {
    const { author, newPrefix, setGlobal } = Reaction;
    
    
    if (event.userID !== author) return;

    
    const userName = await usersData.getName(event.userID) || "there";

    
    if (setGlobal) {
      try {
        global.noobCore.ncsetting.prefix = newPrefix;
        fs.writeFileSync(
          global.client.dirConfig,
          JSON.stringify(global.noobCore.ncsetting, null, 2)
        );
        
        return message.reply(
          `✅ Hey ${userName}, global prefix has been updated!\n` +
          `╭‣ New Global Prefix: ${newPrefix}\n` +
          `╰‣ Scope: All chats will use this prefix\n` +
          `🤖 I'm NoobCore V3\n📂 try "${newPrefix}help" to see all commands.`
        );
      } catch (error) {
        console.error("Global prefix save error:", error);
        return message.reply(
          `❌ Hey ${userName}, failed to save global prefix!\n` +
          `╭‣ Error: Configuration file error\n` +
          `╰‣ Solution: Check file permissions\n` +
          `🤖 I'm NoobCore V3\n📂 try "${global.noobCore.ncsetting.prefix}help" to see all commands.`
        );
      }
    }

    
    try {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      
      return message.reply(
        `✅ Hey ${userName}, chat prefix has been updated!\n` +
        `╭‣ New Chat Prefix: ${newPrefix}\n` +
        `╰‣ Scope: This chat only\n` +
        `🤖 I'm NoobCore V3\n📂 try "${newPrefix}help" to see all commands.`
      );
    } catch (error) {
      console.error("Chat prefix save error:", error);
      return message.reply(
        `❌ Hey ${userName}, failed to save chat prefix!\n` +
        `╭‣ Error: Database error\n` +
        `╰‣ Solution: Try again later\n` +
        `🤖 I'm NoobCore V3\n📂 try "${global.noobCore.ncsetting.prefix}help" to see all commands.`
      );
    }
  },

  

  ncPrefix: async function ({ event, message, threadsData, usersData }) {
    const triggerText = event.body?.toLowerCase().trim();
    
    
    if (!triggerText) return;
    
    const isTrigger = 
      triggerText === "prefix" || 
      triggerText === "ňč" || 
      triggerText === "nøøbcore" ||
      (triggerText.includes("ňč") && triggerText.includes("nøøbcore"));
    
    if (!isTrigger) return;
    
    
    const userName = await usersData.getName(event.senderID) || "there";
    const globalPrefix = global.noobCore.ncsetting.prefix;
    const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;
    
    return message.reply(
      `👋 Hey ${userName}, did you ask for my prefix?\n` +
      `╭‣ 🌐 Global: ${globalPrefix}\n` +
      `╰‣ 💬 This Chat: ${threadPrefix}\n` +
      `🤖 I'm NoobCore V3\n📂 try "${threadPrefix}help" to see all commands.`
    );
  }
};