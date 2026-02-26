const A = require("axios");
const nix = "https://raw.githubusercontent.com/noobcore404/NC-STORE/refs/heads/main/NCApiUrl.json";

module.exports = {
  config: {
    name: "gpt",
    aliases: ["chatgpt", "gpt5"],
    version: "0.0.1",
    author: "ArYAN",
    role: 0,
    category: "Ai"
  },

  ncStart: async function ({ api, message, args, event }) {
    const Q = args.join(" ");
    if (!Q) return message.reply("Please ask a question 🍌");

    api.setMessageReaction("⏳", event.messageID, event.threadID);

    try {
      const { data: J } = await A.get(nix);
      const B = J.aryan;
      const { data: R } = await A.get(`${B}/aryan/ask?prompt=${encodeURIComponent(Q)}`);
      const Ans = R.answer.replace(/\*/g, "");

      message.reply(Ans, (err, info) => {
        api.setMessageReaction("✅", event.messageID, event.threadID);
        global.noobCore.ncReply.set(info.messageID, {
          commandName: "gpt",
          author: event.senderID
        });
      });
    } catch {
      api.setMessageReaction("❌", event.messageID, event.threadID);
      message.reply("API error 😈");
    }
  },

  ncReply: async function ({ api, message, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    api.setMessageReaction("⏳", event.messageID, event.threadID);

    try {
      const { data: J } = await A.get(nix);
      const B = J.aryan;
      const { data: R } = await A.get(`${B}/aryan/ask?prompt=${encodeURIComponent(event.body)}`);
      const Ans = R.answer.replace(/\*/g, "");

      message.reply(Ans, (err, info) => {
        api.setMessageReaction("✅", event.messageID, event.threadID);
        global.noobCore.ncReply.set(info.messageID, {
          commandName: "gpt",
          author: event.senderID
        });
      });
    } catch {
      api.setMessageReaction("❌", event.messageID, event.threadID);
      message.reply("API error 😈");
    }
  }
};