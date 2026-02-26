const axios = require("axios");
try {
  require("ts-node/register/transpile-only");
} catch (e) {}
const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const { client } = global;

const { configCommands } = global.noobCore;
const { log, loading, removeHomeDir } = global.utils;

function getAllCommandFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      files = files.concat(getAllCommandFiles(full));
    }
    else if (item.endsWith(".js") || item.endsWith(".ts")) {
      files.push(full);
    }
  }

  return files;
}

function getDomain(url) {
        const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
        const match = url.match(regex);
        return match ? match[1] : null;
}

function isURL(str) {
        try {
                new URL(str);
                return true;
        }
        catch (e) {
                return false;
        }
}

module.exports = {
        config: {
                name: "cmd",
                version: "1.17",
                author: "NTKhang",
                countDown: 5,
                role: 3,
                description: {
                        vi: "Quản lý các tệp lệnh của bạn",
                        en: "Manage your command files"
                },
                category: "owner",
                guide: {
                        vi: "   {pn} load <tên file lệnh>"
                                + "\n   {pn} loadAll"
                                + "\n   {pn} install <category> <tên file lệnh> <url>: Cài đặt một tệp lệnh từ một url vào category"
                                + "\n   {pn} install <category> <tên file lệnh> <code>: Cài đặt một tệp lệnh từ code vào category"
                                + "\n   {pn} install <url> <tên file lệnh>: Tải xuống và cài đặt một tệp lệnh từ một url, url là đường dẫn đến tệp lệnh (raw)"
                                + "\n   {pn} install <tên file lệnh> <code>: Tải xuống và cài đặt một tệp lệnh từ một code, code là mã của lệnh",
                        en: "   {pn} load <command file name>"
                                + "\n   {pn} loadAll"
                                + "\n   {pn} install <category> <command file name> <url>: Install a command from url into category"
                                + "\n   {pn} install <category> <command file name> <code>: Install a command from code into category"
                                + "\n   {pn} install <url> <command file name>: Download and install a command file from a url, url is the path to the file (raw)"
                                + "\n   {pn} install <command file name> <code>: Download and install a command file from a code, code is the code of the command"
                }
        },

        langs: {
                vi: {
                        missingFileName: "⚠️ | Vui lòng nhập vào tên lệnh bạn muốn reload",
                        loaded: "✅ | Đã load command \"%1\" thành công",
                        loadedError: "❌ | Load command \"%1\" thất bại với lỗi\n%2: %3",
                        loadedSuccess: "✅ | Đã load thành công (%1) command",
                        loadedFail: "❌ | Load thất bại (%1) command\n%2",
                        openConsoleToSeeError: "👀 | Hãy mở console để xem chi tiết lỗi",
                        missingCommandNameUnload: "⚠️ | Vui lòng nhập vào tên lệnh bạn muốn unload",
                        unloaded: "✅ | Đã unload command \"%1\" thành công",
                        unloadedError: "❌ | Unload command \"%1\" thất bại với lỗi\n%2: %3",
                        missingUrlCodeOrFileName: "⚠️ | Vui lòng nhập vào url hoặc code và tên file lệnh bạn muốn cài đặt",
                        missingUrlOrCode: "⚠️ | Vui lòng nhập vào url hoặc code của tệp lệnh bạn muốn cài đặt",
                        missingFileNameInstall: "⚠️ | Vui lòng nhập vào tên file để lưu lệnh (đuôi .js)",
                        invalidUrl: "⚠️ | Vui lòng nhập vào url hợp lệ",
                        invalidUrlOrCode: "⚠️ | Không thể lấy được mã lệnh",
                        alreadExist: "⚠️ | File lệnh đã tồn tại, bạn có chắc chắn muốn ghi đè lên file lệnh cũ không?\nThả cảm xúc bất kì vào tin nhắn này để tiếp tục",
                        installed: "✅ | Đã cài đặt command \"%1\" thành công, file lệnh được lưu tại %2",
                        installedError: "❌ | Cài đặt command \"%1\" thất bại với lỗi\n%2: %3",
                        missingFile: "⚠️ | Không tìm thấy tệp lệnh \"%1\"",
                        invalidFileName: "⚠️ | Tên tệp lệnh không hợp lệ",
                        unloadedFile: "✅ | Đã unload lệnh \"%1\""
                },
                en: {
                        missingFileName: "⚠️ | Please enter the command name you want to reload",
                        loaded: "✅ | Loaded command \"%1\" successfully",
                        loadedError: "❌ | Failed to load command \"%1\" with error\n%2: %3",
                        loadedSuccess: "✅ | Loaded successfully (%1) command",
                        loadedFail: "❌ | Failed to load (%1) command\n%2",
                        openConsoleToSeeError: "👀 | Open console to see error details",
                        missingCommandNameUnload: "⚠️ | Please enter the command name you want to unload",
                        unloaded: "✅ | Unloaded command \"%1\" successfully",
                        unloadedError: "❌ | Failed to unload command \"%1\" with error\n%2: %3",
                        missingUrlCodeOrFileName: "⚠️ | Please enter the url or code and command file name you want to install",
                        missingUrlOrCode: "⚠️ | Please enter the url or code of the command file you want to install",
                        missingFileNameInstall: "⚠️ | Please enter the file name to save the command (with .js extension)",
                        invalidUrl: "⚠️ | Please enter a valid url",
                        invalidUrlOrCode: "⚠️ | Unable to get command code",
                        alreadExist: "⚠️ | The command file already exists, are you sure you want to overwrite the old command file?\nReact to this message to continue",
                        installed: "✅ | Installed command \"%1\" successfully, the command file is saved at %2",
                        installedError: "❌ | Failed to install command \"%1\" with error\n%2: %3",
                        missingFile: "⚠️ | Command file \"%1\" not found",
                        invalidFileName: "⚠️ | Invalid command file name",
                        unloadedFile: "✅ | Unloaded command \"%1\""
                }
        },

        ncStart: async ({ args, message, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, event, commandName, getLang }) => {
                const { unloadScripts, loadScripts } = global.utils;
                if (
                        args[0] == "load"
                        && args.length == 2
                ) {
                        if (!args[1])
                                return message.reply(getLang("missingFileName"));
                        const fileName = args[1];
                        const infoLoad = loadScripts(
                                "cmds",
                                fileName,
                                log,
                                configCommands,
                                api,
                                threadModel,
                                userModel,
                                dashBoardModel,
                                globalModel,
                                threadsData,
                                usersData,
                                dashBoardData,
                                globalData,
                                getLang
                        );
                        if (infoLoad.status == "success")
                                message.reply(getLang("loaded", infoLoad.name));
                        else {
                                message.reply(
                                        getLang("loadedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message)
                                        + "\n" + infoLoad.error.stack
                                );
                                console.log(infoLoad.errorWithThoutRemoveHomeDir);
                        }
                }
                else if (
                        (args[0] || "").toLowerCase() == "loadall"
                        || (args[0] == "load" && args.length > 2)
                ) {
                        const cmdsPath = path.join(process.cwd(), 'scripts', 'cmds');
                        const fileNeedToLoad = args[0].toLowerCase() == "loadall" ?
                                getAllCommandFiles(cmdsPath)
                                        .map(fullPath => {
                                                // Get relative path from cmds folder and remove .js extension
                                                const relPath = path.relative(cmdsPath, fullPath);
                                                return relPath.replace(/\.(js|ts)$/, '');
                                        })
                                        .filter(file =>
                                                !file.match(/(eg)$/g) &&
                                                (process.env.NODE_ENV == "development" ? true : !file.match(/(dev)$/g)) &&
                                                !configCommands.commandUnload?.includes(path.basename(file) + '.js')
                                        ) :
                                args.slice(1);
                        const arraySucces = [];
                        const arrayFail = [];

                        for (const fileName of fileNeedToLoad) {
                                const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
                                if (infoLoad.status == "success")
                                        arraySucces.push(fileName);
                                else
                                        arrayFail.push(` ❗ ${fileName} => ${infoLoad.error.name}: ${infoLoad.error.message}`);
                        }

                        let msg = "";
                        if (arraySucces.length > 0)
                                msg += getLang("loadedSuccess", arraySucces.length);
                        if (arrayFail.length > 0) {
                                msg += (msg ? "\n" : "") + getLang("loadedFail", arrayFail.length, arrayFail.join("\n"));
                                msg += "\n" + getLang("openConsoleToSeeError");
                        }

                        message.reply(msg);
                }
                else if (args[0] == "unload") {
                        if (!args[1])
                                return message.reply(getLang("missingCommandNameUnload"));
                        const infoUnload = unloadScripts("cmds", args[1], configCommands, getLang);
                        infoUnload.status == "success" ?
                                message.reply(getLang("unloaded", infoUnload.name)) :
                                message.reply(getLang("unloadedError", infoUnload.name, infoUnload.error.name, infoUnload.error.message));
                }
                else if (args[0] == "install") {
                        let category = null;
                        let url = args[1];
                        let fileName = args[2];
                        let rawCode;

                        // Detect if first param after "install" is a category (3+ args with .js in second position)
                        if (
  args.length >= 3 &&
  (args[2].endsWith(".js") || args[2].endsWith(".ts")) &&
  !isURL(args[1])
) {
                                category = args[1];
                                fileName = args[2];
                                url = args[3]; // Third arg could be URL or start of code
                        }

                        if (!url || !fileName)
                                return message.reply(getLang("missingUrlCodeOrFileName"));

                        if (!fileName.endsWith(".js") && !fileName.endsWith(".ts"))
                                return message.reply(getLang("missingFileNameInstall"));

                        if (url.match(/(https?:\/\/(?:www\.|(?!www)))/)) {
                                global.utils.log.dev("install", "url", url);

                                const domain = getDomain(url);
                                if (!domain)
                                        return message.reply(getLang("invalidUrl"));

                                if (domain == "pastebin.com") {
                                        const regex = /https:\/\/pastebin\.com\/(?!raw\/)(.*)/;
                                        if (url.match(regex))
                                                url = url.replace(regex, "https://pastebin.com/raw/$1");
                                        if (url.endsWith("/"))
                                                url = url.slice(0, -1);
                                }
                                else if (domain == "github.com") {
                                        const regex = /https:\/\/github\.com\/(.*)\/blob\/(.*)/;
                                        if (url.match(regex))
                                                url = url.replace(regex, "https://raw.githubusercontent.com/$1/$2");
                                }

                                rawCode = (await axios.get(url)).data;

                                if (domain == "savetext.net") {
                                        const $ = cheerio.load(rawCode);
                                        rawCode = $("#content").text();
                                }
                        }
                        else {
                                global.utils.log.dev("install", "code", args.slice(category ? 3 : 1).join(" "));
                                // Extract code from the message body
                                const fileNameIndex = event.body.indexOf(fileName);
                                if (fileNameIndex !== -1) {
                                        rawCode = event.body.slice(fileNameIndex + fileName.length).trim();
                                } else {
                                        return message.reply(getLang("missingFileNameInstall"));
                                }
                        }

                        if (!rawCode)
                                return message.reply(getLang("invalidUrlOrCode"));

                        const cmdsPath = path.join(process.cwd(), 'scripts', 'cmds');
                        const categoryPath = category ? path.join(cmdsPath, category) : path.join(cmdsPath, 'admin');

                        // Create category folder if it doesn't exist
                        if (!fs.existsSync(categoryPath))
                                fs.mkdirSync(categoryPath, { recursive: true });

                        const commandPath = path.join(categoryPath, fileName);

                        if (fs.existsSync(commandPath) || fs.existsSync(path.join(cmdsPath, fileName)))
                                return message.reply(getLang("alreadExist"), (err, info) => {
                                        global.noobCore.ncReaction.set(info.messageID, {
                                                commandName,
                                                messageID: info.messageID,
                                                type: "install",
                                                author: event.senderID,
                                                data: {
                                                        fileName,
                                                        rawCode,
                                                        category
                                                }
                                        });
                                });
                        else {
                                const infoLoad = loadScripts("cmds", category ? `${category}/${fileName}` : fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
                                infoLoad.status == "success" ?
                                        message.reply(getLang("installed", infoLoad.name, categoryPath.replace(process.cwd(), ""))) :
                                        message.reply(getLang("installedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message));
                        }
                }
                else
                        message.SyntaxError();
        },

        ncReaction: async function ({ Reaction, message, event, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang }) {
          try {
            if (event.type !== "message_reaction") return;

            const { loadScripts } = global.utils;
            const { author, data: { fileName, rawCode, category } } = Reaction;

            // ✅ FIXED compare
            if (String(event.userID) !== String(author)) return;

            const cmdsPath = path.join(process.cwd(), 'scripts', 'cmds');
            const categoryPath = category ? path.join(cmdsPath, category) : path.join(cmdsPath, 'admin');

            const infoLoad = loadScripts(
              "cmds",
              category ? `${category}/${fileName}` : fileName,
              log,
              configCommands,
              api,
              threadModel,
              userModel,
              dashBoardModel,
              globalModel,
              threadsData,
              usersData,
              dashBoardData,
              globalData,
              getLang,
              rawCode
            );

            infoLoad.status == "success"
              ? message.reply(getLang("installed", infoLoad.name, categoryPath.replace(process.cwd(), "")))
              : message.reply(getLang("installedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message));
          }
          catch (e) {
            console.log("ncReaction error:", e);
          }
        }
};

// do not edit this code because it use for obfuscate code
const packageAlready = [];
const spinner = "\\|/-";
let count = 0;

function loadScripts(folder, fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode, category) {
        // global.noobCore[folderModules == "cmds" ? "commandFilesPath" : "eventCommandsFilesPath"].push({
        //      filePath: pathCommand,
        //      commandName: [commandName, ...validAliases]
        // });
        const storageCommandFilesPath = global.noobCore[folder == "cmds" ? "commandFilesPath" : "eventCommandsFilesPath"];

        try {
                if (rawCode) {
                        const cmdsPath = path.join(process.cwd(), 'scripts', folder);
                        const savePath = category
                                ? path.join(cmdsPath, category, fileName)
                                : path.join(cmdsPath, fileName);

                        fs.mkdirSync(path.dirname(savePath), { recursive: true });
                        fs.writeFileSync(path.normalize(savePath), rawCode);
                }
                const regExpCheckPackage = /require(\s+|)\((\s+|)[`'"]([^`'"]+)[`'"](\s+|)\)/g;
                const { noobCore } = global;
                const { ncFirstChat: allncFirstChat, ncPrefix: allOnChat, ncEvent: allncEvent, ncAnyEvent: allncAnyEvent } = noobCore;
                let setMap, typeEnvCommand, commandType;
                if (folder == "cmds") {
                        typeEnvCommand = "envCommands";
                        setMap = "commands";
                        commandType = "command";
                }
                else if (folder == "events") {
                        typeEnvCommand = "envEvents";
                        setMap = "eventCommands";
                        commandType = "event command";
                }
                // const pathCommand = path.normalize(path.normalize(process.cwd() + `/${folder}/${fileName}.js`));
                let pathCommand;
                const cmdsPath = path.join(process.cwd(), "scripts", folder);

                // normalize filename
                let baseFileName = fileName;
                if (!baseFileName.endsWith(".js") && !baseFileName.endsWith(".ts")) {
                  const tryTs = path.join(cmdsPath, fileName + ".ts");
                  const tryJs = path.join(cmdsPath, fileName + ".js");
                  baseFileName = fs.existsSync(tryTs) ? fileName + ".ts" : fileName + ".js";
                }

                const basePath = path.join(cmdsPath, baseFileName);

                // 1️⃣ direct hit
                if (fs.existsSync(basePath)) {
                  pathCommand = basePath;
                }
                else {
                  // 2️⃣ deep search (safe)
                  const allFiles = getAllCommandFiles(cmdsPath);
                  const found = allFiles.find(f => path.basename(f) === baseFileName);
                  pathCommand = found || basePath;
                }

                // 3️⃣ FINAL SAFETY (VERY IMPORTANT)
                if (!pathCommand || typeof pathCommand !== "string" || !fs.existsSync(pathCommand)) {
                  throw new Error(`Command file not found: ${fileName}`);
                }

                // Try direct path first
                if (fs.existsSync(basePath)) {
                        pathCommand = basePath;
                } else if (process.env.NODE_ENV == "development") {
                        // Try .dev.js version
                        const devPath = path.normalize(process.cwd() + `/scripts/${folder}/${fileName}.dev.js`);
                        if (fs.existsSync(devPath)) {
                                pathCommand = devPath;
                        } else {
                                // Search in subdirectories
                                const allFiles = getAllCommandFiles(cmdsPath);
                                const found = allFiles.find(f =>
        f.endsWith('/' + baseFileName) ||
        f.endsWith('\\' + baseFileName) ||
        f.endsWith('/' + fileName + '.ts') ||
        f.endsWith('\\' + fileName + '.ts')
);
                                pathCommand = found || basePath;
                        }// 1️⃣ direct hit
if (fs.existsSync(basePath)) {
  pathCommand = basePath;
}
else {
  const allFiles = getAllCommandFiles(cmdsPath);
  const found = allFiles.find(f => path.basename(f) === baseFileName);
  pathCommand = found || basePath;
}
                } else {
                        // Search in subdirectories
                        const allFiles = getAllCommandFiles(cmdsPath);
                        const found = allFiles.find(f =>
        f.endsWith('/' + baseFileName) ||
        f.endsWith('\\' + baseFileName) ||
        f.endsWith('/' + fileName + '.ts') ||
        f.endsWith('\\' + fileName + '.ts')
);
                        pathCommand = found || basePath;
                }

                // ————————————————— CHECK PACKAGE ————————————————— //
                if (!pathCommand || typeof pathCommand !== "string" || !fs.existsSync(pathCommand)) {
                  throw new Error(`Command file not found: ${fileName}`);
                }

                const contentFile = fs.readFileSync(pathCommand, "utf8");
                let allPackage = contentFile.match(regExpCheckPackage);
                if (allPackage) {
                        allPackage = allPackage
                                .map(p => p.match(/[`'"]([^`'"]+)[`'"]/)[1])
                                .filter(p => p.indexOf("/") !== 0 && p.indexOf("./") !== 0 && p.indexOf("../") !== 0 && p.indexOf(__dirname) !== 0);
                        for (let packageName of allPackage) {
                                // @user/abc => @user/abc
                                // @user/abc/dist/xyz.js => @user/abc
                                // @user/abc/dist/xyz => @user/abc
                                if (packageName.startsWith('@'))
                                        packageName = packageName.split('/').slice(0, 2).join('/');
                                else
                                        packageName = packageName.split('/')[0];

                                if (!packageAlready.includes(packageName)) {
                                        packageAlready.push(packageName);
                                        if (!fs.existsSync(`${process.cwd()}/node_modules/${packageName}`)) {
                                                let wating;
                                                try {
                                                        wating = setInterval(() => {
                                                                count++;
                                                                loading.info("PACKAGE", `Installing ${packageName} ${spinner[count % spinner.length]}`);
                                                        }, 80);
                                                        execSync(`npm install ${packageName} --save`, { stdio: "pipe" });
                                                        clearInterval(wating);
                                                        process.stderr.clearLine();
                                                }
                                                catch (error) {
                                                        clearInterval(wating);
                                                        process.stderr.clearLine();
                                                        throw new Error(`Can't install package ${packageName}`);
                                                }
                                        }
                                }
                        }
                }
                // ———————————————— GET OLD COMMAND ———————————————— //
                const oldCommandModule = require(pathCommand);
                const oldCommand = oldCommandModule.default || oldCommandModule;
                const oldCommandName = oldCommand?.config?.name;
                // —————————————— CHECK COMMAND EXIST ——————————————— //
                if (!oldCommandName) {
                        if (noobCore[setMap].get(oldCommandName)?.location != pathCommand)
                                throw new Error(`${commandType} name "${oldCommandName}" is already exist in command "${removeHomeDir(noobCore[setMap].get(oldCommandName)?.location || "")}"`);
                }
                // ————————————————— CHECK ALIASES ————————————————— //
                if (oldCommand.config.aliases) {
                        let oldAliases = oldCommand.config.aliases;
                        if (typeof oldAliases == "string")
                                oldAliases = [oldAliases];
                        for (const alias of oldAliases)
                                noobCore.aliases.delete(alias);
                }
                // ——————————————— DELETE OLD COMMAND ——————————————— //
                delete require.cache[require.resolve(pathCommand)];
                // —————————————————————————————————————————————————— //



                // ———————————————— GET NEW COMMAND ———————————————— //
                const commandModule = require(pathCommand);
const command = commandModule.default || commandModule;

command.location = pathCommand;
                const configCommand = command.config;
                configCommand.filePath = pathCommand;
                if (!configCommand || typeof configCommand != "object")
                        throw new Error("config of command must be an object");
                // —————————————————— CHECK SYNTAX —————————————————— //
                const scriptName = configCommand.name;

                // Check ncPrefix function
                const indexOnChat = allOnChat.findIndex(item => item == oldCommandName);
                if (indexOnChat != -1)
                        allOnChat.splice(indexOnChat, 1);

                // Check ncFirstChat function
                const indexncFirstChat = allOnChat.findIndex(item => item == oldCommandName);
                let oldncFirstChat;
                if (indexncFirstChat != -1) {
                        oldncFirstChat = allncFirstChat[indexncFirstChat];
                        allncFirstChat.splice(indexncFirstChat, 1);
                }

                // Check ncEvent function
                const indexncEvent = allncEvent.findIndex(item => item == oldCommandName);
                if (indexncEvent != -1)
                        allncEvent.splice(indexncEvent, 1);

                // Check ncAnyEvent function
                const indexncAnyEvent = allncAnyEvent.findIndex(item => item == oldCommandName);
                if (indexncAnyEvent != -1)
                        allncAnyEvent.splice(indexncAnyEvent, 1);

                // Check onLoad function
                if (command.onLoad)
                        command.onLoad({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData });

                const { envGlobal, envConfig } = configCommand;
                if (!command.ncStart)
                        throw new Error('Function ncStart is missing!');
                if (typeof command.ncStart != "function")
                        throw new Error('Function ncStart must be a function!');
                if (!scriptName)
                        throw new Error('Name of command is missing!');
                // ————————————————— CHECK ALIASES ————————————————— //
                if (configCommand.aliases) {
                        let { aliases } = configCommand;
                        if (typeof aliases == "string")
                                aliases = [aliases];
                        for (const alias of aliases) {
                                if (aliases.filter(item => item == alias).length > 1)
                                        throw new Error(`alias "${alias}" duplicate in ${commandType} "${scriptName}" with file name "${removeHomeDir(pathCommand || "")}"`);
                                if (noobCore.aliases.has(alias))
                                        throw new Error(`alias "${alias}" is already exist in ${commandType} "${noobCore.aliases.get(alias)}" with file name "${removeHomeDir(noobCore[setMap].get(noobCore.aliases.get(alias))?.location || "")}"`);
                                noobCore.aliases.set(alias, scriptName);
                        }
                }
                // ————————————————— CHECK ENVCONFIG ————————————————— //
                // env Global
                if (envGlobal) {
                        if (typeof envGlobal != "object" || Array.isArray(envGlobal))
                                throw new Error("envGlobal must be an object");
                        for (const key in envGlobal)
                                configCommands.envGlobal[key] = envGlobal[key];
                }
                // env Config
                if (envConfig && typeof envConfig == "object" && !Array.isArray(envConfig)) {
                        if (!configCommands[typeEnvCommand][scriptName])
                                configCommands[typeEnvCommand][scriptName] = {};
                        configCommands[typeEnvCommand][scriptName] = envConfig;
                }
                noobCore[setMap].delete(oldCommandName);
                noobCore[setMap].set(scriptName, command);
                fs.writeFileSync(client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
                const keyUnloadCommand = folder == "cmds" ? "commandUnload" : "commandEventUnload";
                const findIndex = (configCommands[keyUnloadCommand] || []).indexOf(`${fileName}.js`);
                if (findIndex != -1)
                        configCommands[keyUnloadCommand].splice(findIndex, 1);
                fs.writeFileSync(client.dirConfigCommands, JSON.stringify(configCommands, null, 2));


                if (command.ncPrefix)
                        allOnChat.push(scriptName);

                if (command.ncFirstChat)
                        allncFirstChat.push({ commandName: scriptName, threadIDsChattedFirstTime: oldncFirstChat?.threadIDsChattedFirstTime || [] });

                if (command.ncEvent)
                        allncEvent.push(scriptName);

                if (command.ncAnyEvent)
                        allncAnyEvent.push(scriptName);

                const indexStorageCommandFilesPath = storageCommandFilesPath.findIndex(item => item.filePath == pathCommand);
                if (indexStorageCommandFilesPath != -1)
                        storageCommandFilesPath.splice(indexStorageCommandFilesPath, 1);
                storageCommandFilesPath.push({
                        filePath: pathCommand,
                        commandName: [scriptName, ...configCommand.aliases || []]
                });

                return {
                        status: "success",
                        name: fileName,
                        command
                };
        }
        catch (err) {
                const defaultError = new Error();
                defaultError.name = err.name;
                defaultError.message = err.message;
                defaultError.stack = err.stack;

                err.stack ? err.stack = removeHomeDir(err.stack || "") : "";
                fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
                return {
                        status: "failed",
                        name: fileName,
                        error: err,
                        errorWithThoutRemoveHomeDir: defaultError
                };
        }
}

function unloadScripts(folder, fileName, configCommands, getLang) {
        const pathCommand = `${process.cwd()}/scripts/${folder}/${fileName}.js`;
        if (!fs.existsSync(pathCommand)) {
                const err = new Error(getLang("missingFile", `${fileName}.js`));
                err.name = "FileNotFound";
                throw err;
        }
        const command = require(pathCommand);
        const commandName = command.config?.name;
        if (!commandName)
                throw new Error(getLang("invalidFileName", `${fileName}.js`));
        const { noobCore } = global;
        const { ncPrefix: allOnChat, ncEvent: allncEvent, ncAnyEvent: allncAnyEvent } = noobCore;
        const indexOnChat = allOnChat.findIndex(item => item == commandName);
        if (indexOnChat != -1)
                allOnChat.splice(indexOnChat, 1);
        const indexncEvent = allncEvent.findIndex(item => item == commandName);
        if (indexncEvent != -1)
                allncEvent.splice(indexncEvent, 1);
        const indexncAnyEvent = allncAnyEvent.findIndex(item => item == commandName);
        if (indexncAnyEvent != -1)
                allncAnyEvent.splice(indexncAnyEvent, 1);
        // ————————————————— CHECK ALIASES ————————————————— //
        if (command.config.aliases) {
                let aliases = command.config?.aliases || [];
                if (typeof aliases == "string")
                        aliases = [aliases];
                for (const alias of aliases)
                        noobCore.aliases.delete(alias);
        }
        const setMap = folder == "cmds" ? "commands" : "eventCommands";
        delete require.cache[require.resolve(pathCommand)];
        noobCore[setMap].delete(commandName);
        log.master("UNLOADED", getLang("unloaded", commandName));
        const commandUnload = configCommands[folder == "cmds" ? "commandUnload" : "commandEventUnload"] || [];
        if (!commandUnload.includes(`${fileName}.js`))
                commandUnload.push(`${fileName}.js`);
        configCommands[folder == "cmds" ? "commandUnload" : "commandEventUnload"] = commandUnload;
        fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
        return {
                status: "success",
                name: fileName
        };
}

global.utils.loadScripts = loadScripts;
global.utils.unloadScripts = unloadScripts;