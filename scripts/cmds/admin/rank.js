const Canvas = require("canvas");
const path = require("path");
const { uploadZippyshare, randomString } = global.utils;

const defaultFontName = "BeVietnamPro-SemiBold";
const pathAssets = path.join(__dirname, '..', 'assets');
const defaultPathFontName = path.join(pathAssets, 'font', 'BeVietnamPro-SemiBold.ttf');


Canvas.registerFont(path.join(pathAssets, 'font', 'BeVietnamPro-Bold.ttf'), {
        family: "BeVietnamPro-Bold"
});
Canvas.registerFont(defaultPathFontName, {
        family: defaultFontName
});

let deltaNext;
const expToLevel = (exp, deltaNextLevel = deltaNext) => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNextLevel)) / 2);
const levelToExp = (level, deltaNextLevel = deltaNext) => Math.floor(((Math.pow(level, 2) - level) * deltaNextLevel) / 2);
global.client.makeRankCard = makeRankCard;

module.exports = {
        config: {
                name: "rank",
                version: "2.0", 
                author: "NoobCore Team",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Xem level của bạn hoặc người được tag. Có thể tag nhiều người",
                        en: "View your level or the level of the tagged person. You can tag many people"
                },
                category: "rank",
                guide: {
                        vi: "   {pn} [để trống | @tags | leaderboard]",
                        en: "   {pn} [empty | @tags | leaderboard]"
                },
                envConfig: {
                        deltaNext: 5,
                        maxLevel: 100, 
                        xpPerMessage: 1 
                }
        },

        ncStart: async function ({ message, event, usersData, threadsData, commandName, envCommands, api, args }) {
                deltaNext = envCommands[commandName].deltaNext;
                
                // Check for leaderboard command
                if (args[0] === "leaderboard" || args[0] === "top") {
                        return await showLeaderboard({ message, usersData, threadsData, event, deltaNext });
                }
                
                let targetUsers;
                const arrayMentions = Object.keys(event.mentions);

                if (arrayMentions.length === 0)
                        targetUsers = [event.senderID];
                else
                        targetUsers = arrayMentions;

                const rankCards = await Promise.all(targetUsers.map(async userID => {
                        try {
                                const rankCard = await makeRankCard(userID, usersData, threadsData, event.threadID, deltaNext, api);
                                rankCard.path = `${randomString(10)}.png`;
                                return rankCard;
                        } catch (error) {
                                console.error("Error generating rank card for user:", userID, error);
                                return null;
                        }
                }));

                // Filter out failed cards
                const validCards = rankCards.filter(card => card !== null);
                
                if (validCards.length === 0) {
                        return message.reply("❌ An error occurred while generating rank cards.");
                }

                return message.reply({
                        attachment: validCards
                });
        },

        ncChat: async function ({ usersData, event, envCommands }) {
                try {
                        const { exp } = await usersData.get(event.senderID);
                        const currentExp = isNaN(exp) || typeof exp !== "number" ? 0 : exp;
                        const maxLevel = envCommands?.rank?.maxLevel || 100;
                        
                        // Check if user has reached max level
                        const currentLevel = expToLevel(currentExp, deltaNext);
                        if (currentLevel >= maxLevel) {
                                return; // Stop giving XP at max level
                        }
                        
                        await usersData.set(event.senderID, {
                                exp: currentExp + (envCommands?.rank?.xpPerMessage || 1)
                        });
                } catch (error) {
                        console.error("Error updating user XP:", error);
                }
        }
};

const defaultDesignCard = {
        widthCard: 2000,
        heightCard: 500,
        main_color: "#474747",
        sub_color: "rgba(255, 255, 255, 0.5)",
        alpha_subcard: 0.9,
        exp_color: "#e1e1e1",
        expNextLevel_color: "#3f3f3f",
        text_color: "#000000",
        avatar_shape: "circle", // Added: circle or square
        show_progress_percentage: true, // Added: Show percentage on progress bar
        bar_style: "rounded", // Added: rounded or flat
        shadow_enabled: true, // Added: Enable shadow effects
        glow_effect: false, // Added: Glow effect for level
        theme: "default" // Added: default, dark, light, gradient
};

async function makeRankCard(userID, usersData, threadsData, threadID, deltaNext, api = global.GoatBot.fcaApi) {
        try {
                const { exp } = await usersData.get(userID);
                const levelUser = expToLevel(exp, deltaNext);

                const expNextLevel = levelToExp(levelUser + 1, deltaNext) - levelToExp(levelUser, deltaNext);
                const currentExp = expNextLevel - (levelToExp(levelUser + 1, deltaNext) - exp);
                const expPercentage = Math.min(100, Math.round((currentExp / expNextLevel) * 100));

                const allUser = await usersData.getAll();
                allUser.sort((a, b) => b.exp - a.exp);
                const rank = allUser.findIndex(user => user.userID == userID) + 1;

                const customRankCard = await threadsData.get(threadID, "data.customRankCard") || {};
                
                // Apply theme if specified
                if (customRankCard.theme) {
                        applyTheme(customRankCard);
                }

                const userData = await usersData.get(userID);
                const dataLevel = {
                        exp: currentExp,
                        expNextLevel,
                        expPercentage,
                        name: userData.name,
                        rank: `#${rank}/${allUser.length}`,
                        level: levelUser,
                        avatar: await usersData.getAvatarUrl(userID),
                        totalExp: exp, // Added total experience
                        nextLevelExp: levelToExp(levelUser + 1, deltaNext) // Added exp needed for next level
                };

                const configRankCard = {
                        ...defaultDesignCard,
                        ...customRankCard
                };

                // Handle image URLs for colors
                const checkImgKey = [
                        "main_color",
                        "sub_color",
                        "line_color",
                        "exp_color",
                        "expNextLevel_color"
                ];

                for (const key of checkImgKey) {
                        if (configRankCard[key] && !isNaN(configRankCard[key])) {
                                try {
                                        const url = await api.resolvePhotoUrl(configRankCard[key]);
                                        if (url) configRankCard[key] = url;
                                } catch (e) {
                                        console.error(`Failed to resolve image URL for ${key}:`, e);
                                }
                        }
                }

                const image = new RankCard({
                        ...configRankCard,
                        ...dataLevel
                });
                
                return await image.buildCard();
        } catch (error) {
                console.error("Error in makeRankCard:", error);
                throw error;
        }
}

function applyTheme(config) {
        const themes = {
                dark: {
                        main_color: "#1a1a1a",
                        sub_color: "rgba(40, 40, 40, 0.8)",
                        text_color: "#ffffff",
                        exp_color: "#4CAF50",
                        expNextLevel_color: "#333333",
                        name_color: "#4CAF50",
                        level_color: "#FF9800"
                },
                light: {
                        main_color: "#f0f0f0",
                        sub_color: "rgba(255, 255, 255, 0.9)",
                        text_color: "#333333",
                        exp_color: "#2196F3",
                        expNextLevel_color: "#e0e0e0",
                        name_color: "#2196F3",
                        level_color: "#FF5722"
                },
                gradient: {
                        main_color: ["#667eea", "#764ba2"],
                        sub_color: "rgba(255, 255, 255, 0.2)",
                        text_color: "#ffffff",
                        exp_color: ["#f093fb", "#f5576c"],
                        expNextLevel_color: "rgba(255, 255, 255, 0.2)"
                },
                neon: {
                        main_color: "#0a0a0a",
                        sub_color: "rgba(20, 20, 20, 0.8)",
                        text_color: "#00ff9d",
                        exp_color: "#00ff9d",
                        expNextLevel_color: "#1a1a1a",
                        name_color: "#00ff9d",
                        level_color: "#ff00ff",
                        glow_effect: true
                }
        };

        if (themes[config.theme]) {
                Object.assign(config, themes[config.theme]);
        }
}

async function showLeaderboard({ message, usersData, threadsData, event, deltaNext }) {
        try {
                const allUsers = await usersData.getAll();
                allUsers.sort((a, b) => b.exp - a.exp);
                
                const topUsers = allUsers.slice(0, 10); // Top 10 users
                
                let leaderboardText = "🏆 LEADERBOARD 🏆\n\n";
                
                topUsers.forEach((user, index) => {
                        const level = expToLevel(user.exp, deltaNext);
                        const rankEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
                        leaderboardText += `${rankEmoji} ${user.name}\n`;
                        leaderboardText += `   Level: ${level} | XP: ${user.exp}\n\n`;
                });
                
                // Add current user's position if not in top 10
                const currentUserIndex = allUsers.findIndex(user => user.userID === event.senderID);
                if (currentUserIndex >= 10) {
                        const currentUser = allUsers[currentUserIndex];
                        const currentLevel = expToLevel(currentUser.exp, deltaNext);
                        leaderboardText += `\nYour position: #${currentUserIndex + 1}\n`;
                        leaderboardText += `Level: ${currentLevel} | XP: ${currentUser.exp}`;
                }
                
                return message.reply(leaderboardText);
        } catch (error) {
                console.error("Error showing leaderboard:", error);
                return message.reply("❌ An error occurred while generating leaderboard.");
        }
}

class RankCard {
        constructor(options) {
                // Default values
                this.widthCard = 2000;
                this.heightCard = 500;
                this.main_color = "#474747";
                this.sub_color = "rgba(255, 255, 255, 0.5)";
                this.alpha_subcard = 0.9;
                this.exp_color = "#e1e1e1";
                this.expNextLevel_color = "#3f3f3f";
                this.text_color = "#000000";
                this.fontName = "BeVietnamPro-Bold";
                this.textSize = 0;
                this.avatar_shape = "circle";
                this.show_progress_percentage = true;
                this.bar_style = "rounded";
                this.shadow_enabled = true;
                this.glow_effect = false;

                // Apply options
                for (const key in options)
                        this[key] = options[key];
        }

        // ... (keep all setter methods from original code, but add new ones)

        /**
         * Set avatar shape (circle or square)
         */
        setAvatarShape(shape) {
                if (!["circle", "square", "rounded"].includes(shape)) {
                        throw new Error("Avatar shape must be 'circle', 'square', or 'rounded'");
                }
                this.avatar_shape = shape;
                return this;
        }

        /**
         * Enable/disable progress percentage
         */
        setShowProgressPercentage(show) {
                this.show_progress_percentage = Boolean(show);
                return this;
        }

        /**
         * Set progress bar style
         */
        setBarStyle(style) {
                if (!["rounded", "flat", "gradient"].includes(style)) {
                        throw new Error("Bar style must be 'rounded' or 'flat'");
                }
                this.bar_style = style;
                return this;
        }

        /**
         * Enable/disable shadow effects
         */
        setShadowEnabled(enabled) {
                this.shadow_enabled = Boolean(enabled);
                return this;
        }

        /**
         * Enable/disable glow effect
         */
        setGlowEffect(enabled) {
                this.glow_effect = Boolean(enabled);
                return this;
        }

        async buildCard() {
                try {
                        let {
                                widthCard,
                                heightCard,
                                avatar_shape,
                                show_progress_percentage,
                                bar_style,
                                shadow_enabled,
                                glow_effect,
                                expPercentage
                        } = this;
                        
                        const {
                                main_color,
                                sub_color,
                                alpha_subcard,
                                exp_color,
                                expNextLevel_color,
                                text_color,
                                name_color,
                                level_color,
                                rank_color,
                                line_color,
                                exp_text_color,
                                exp,
                                expNextLevel,
                                name,
                                level,
                                rank,
                                avatar
                        } = this;

                        widthCard = Number(widthCard);
                        heightCard = Number(heightCard);

                        const canvas = Canvas.createCanvas(widthCard, heightCard);
                        const ctx = canvas.getContext("2d");

                        // Add shadow if enabled
                        if (shadow_enabled) {
                                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                                ctx.shadowBlur = 10;
                                ctx.shadowOffsetX = 2;
                                ctx.shadowOffsetY = 2;
                        }

                        // Draw main background
                        ctx.globalAlpha = 1;
                        await checkColorOrImageAndDraw(0, 0, widthCard, heightCard, ctx, main_color, 20);
                        
                        if (shadow_enabled) {
                                ctx.shadowBlur = 0;
                                ctx.shadowOffsetX = 0;
                                ctx.shadowOffsetY = 0;
                        }

                        // Draw subcard with transparency
                        const alignRim = 3 * percentage(widthCard);
                        const Alpha = parseFloat(alpha_subcard || 0);

                        ctx.globalAlpha = Alpha;
                        await checkColorOrImageAndDraw(alignRim, alignRim, widthCard - alignRim * 2, heightCard - alignRim * 2, ctx, sub_color, 20, alpha_subcard);
                        ctx.globalAlpha = 1;

                        // Draw avatar with selected shape
                        const xyAvatar = heightCard / 2;
                        const resizeAvatar = 60 * percentage(heightCard);
                        
                        ctx.save();
                        if (avatar_shape === "circle") {
                                ctx.beginPath();
                                ctx.arc(xyAvatar, xyAvatar, resizeAvatar / 2, 0, Math.PI * 2);
                                ctx.clip();
                        } else if (avatar_shape === "rounded") {
                                roundedImage(xyAvatar - resizeAvatar / 2, xyAvatar - resizeAvatar / 2, resizeAvatar, resizeAvatar, 20, ctx);
                                ctx.clip();
                        }
                        // For square, no clipping needed
                        
                        try {
                                const avatarImage = await Canvas.loadImage(avatar);
                                ctx.drawImage(avatarImage, xyAvatar - resizeAvatar / 2, xyAvatar - resizeAvatar / 2, resizeAvatar, resizeAvatar);
                        } catch (error) {
                                console.error("Error loading avatar:", error);
                                // Draw default avatar
                                ctx.fillStyle = "#cccccc";
                                ctx.fillRect(xyAvatar - resizeAvatar / 2, xyAvatar - resizeAvatar / 2, resizeAvatar, resizeAvatar);
                        }
                        ctx.restore();

                        // Add border to avatar
                        ctx.strokeStyle = line_color || text_color;
                        ctx.lineWidth = 3;
                        if (avatar_shape === "circle") {
                                ctx.beginPath();
                                ctx.arc(xyAvatar, xyAvatar, resizeAvatar / 2, 0, Math.PI * 2);
                                ctx.stroke();
                        } else if (avatar_shape === "rounded") {
                                roundedImage(xyAvatar - resizeAvatar / 2, xyAvatar - resizeAvatar / 2, resizeAvatar, resizeAvatar, 20, ctx);
                                ctx.stroke();
                        } else {
                                ctx.strokeRect(xyAvatar - resizeAvatar / 2, xyAvatar - resizeAvatar / 2, resizeAvatar, resizeAvatar);
                        }

                        // Draw progress bar
                        const radius = bar_style === "flat" ? 0 : 6 * percentage(heightCard);
                        const xStartExp = (25 + 1.5) * percentage(widthCard),
                                yStartExp = 67 * percentage(heightCard),
                                widthExp = 40.5 * percentage(widthCard),
                                heightExp = radius * 2 || 12 * percentage(heightCard);
                        
                        const widthExpCurrent = (100 / expNextLevel * exp) * percentage(widthExp);

                        // Background bar
                        ctx.fillStyle = checkGradientColor(ctx, expNextLevel_color, xStartExp, yStartExp, xStartExp + widthExp, yStartExp);
                        drawRoundedRect(ctx, xStartExp, yStartExp, widthExp, heightExp, radius);
                        ctx.fill();

                        // Progress bar
                        ctx.fillStyle = checkGradientColor(ctx, exp_color, xStartExp, yStartExp, xStartExp + widthExp, yStartExp);
                        drawRoundedRect(ctx, xStartExp, yStartExp, widthExpCurrent, heightExp, radius);
                        ctx.fill();

                        // Add glow effect to level if enabled
                        if (glow_effect && level_color) {
                                ctx.shadowColor = level_color;
                                ctx.shadowBlur = 15;
                        }

                        // Set text properties
                        const maxSizeFont_Name = 4 * percentage(widthCard) + this.textSize;
                        const maxSizeFont_Exp = 2 * percentage(widthCard) + this.textSize;
                        const maxSizeFont_Level = 3.25 * percentage(widthCard) + this.textSize;
                        const maxSizeFont_Rank = 4 * percentage(widthCard) + this.textSize;

                        ctx.textAlign = "end";

                        // Draw rank
                        ctx.font = autoSizeFont(18.4 * percentage(widthCard), maxSizeFont_Rank, rank, ctx, this.fontName);
                        const metricsRank = ctx.measureText(rank);
                        ctx.fillStyle = checkGradientColor(ctx, rank_color || text_color,
                                94 * percentage(widthCard) - metricsRank.width,
                                76 * percentage(heightCard) + metricsRank.emHeightDescent,
                                94 * percentage(widthCard),
                                76 * percentage(heightCard) - metricsRank.actualBoundingBoxAscent
                        );
                        ctx.fillText(rank, 94 * percentage(widthCard), 76 * percentage(heightCard));

                        // Draw level with optional glow
                        const textLevel = `Lv ${level}`;
                        ctx.font = autoSizeFont(9.8 * percentage(widthCard), maxSizeFont_Level, textLevel, ctx, this.fontName);
                        const metricsLevel = ctx.measureText(textLevel);
                        const xStartLevel = 94 * percentage(widthCard);
                        const yStartLevel = 32 * percentage(heightCard);
                        ctx.fillStyle = checkGradientColor(ctx, level_color || text_color,
                                xStartLevel - ctx.measureText(textLevel).width,
                                yStartLevel + metricsLevel.emHeightDescent,
                                xStartLevel,
                                yStartLevel - metricsLevel.actualBoundingBoxAscent
                        );
                        ctx.fillText(textLevel, xStartLevel, yStartLevel);
                        
                        // Reset glow effect
                        ctx.shadowBlur = 0;

                        // Draw name
                        ctx.font = autoSizeFont(52.1 * percentage(widthCard), maxSizeFont_Name, name, ctx, this.fontName);
                        ctx.textAlign = "center";
                        const metricsName = ctx.measureText(name);
                        ctx.fillStyle = checkGradientColor(ctx, name_color || text_color,
                                47.5 * percentage(widthCard) - metricsName.width / 2,
                                40 * percentage(heightCard) + metricsName.emHeightDescent,
                                47.5 * percentage(widthCard) + metricsName.width / 2,
                                40 * percentage(heightCard) - metricsName.actualBoundingBoxAscent
                        );
                        ctx.fillText(name, 47.5 * percentage(widthCard), 40 * percentage(heightCard));

                        // Draw exp text with optional percentage
                        let textExp = `Exp ${exp}/${expNextLevel}`;
                        if (show_progress_percentage && expPercentage !== undefined) {
                                textExp += ` (${expPercentage}%)`;
                        }
                        
                        ctx.font = autoSizeFont(49 * percentage(widthCard), maxSizeFont_Exp, textExp, ctx, this.fontName);
                        const metricsExp = ctx.measureText(textExp);
                        ctx.fillStyle = checkGradientColor(ctx, exp_text_color || text_color,
                                47.5 * percentage(widthCard) - metricsExp.width / 2,
                                61.4 * percentage(heightCard) + metricsExp.emHeightDescent,
                                47.5 * percentage(widthCard) + metricsExp.width / 2,
                                61.4 * percentage(heightCard) - metricsExp.actualBoundingBoxAscent
                        );
                        ctx.fillText(textExp, 47.5 * percentage(widthCard), 61.4 * percentage(heightCard));

                        return canvas.createPNGStream();
                } catch (error) {
                        console.error("Error building rank card:", error);
                        throw error;
                }
        }
}

// Helper function to draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
        if (radius === 0) {
                ctx.rect(x, y, width, height);
                return;
        }
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
}

// ... (keep all helper functions from original code: checkColorOrImageAndDraw, drawSquareRounded, 
// roundedImage, centerImage, autoSizeFont, checkGradientColor, isUrl, checkFormatColor)

// Add percentage function if not exists
const percentage = total => total / 100;

// Helper function to draw square with rounded corners (keep from original)
function drawSquareRounded(ctx, x, y, w, h, r, color, defaultGlobalCompositeOperation, notChangeColor) {
        ctx.save();
        if (defaultGlobalCompositeOperation)
                ctx.globalCompositeOperation = "source-over";
        if (w < 2 * r)
                r = w / 2;
        if (h < 2 * r)
                r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (!notChangeColor)
                ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
}

async function checkColorOrImageAndDraw(xStart, yStart, width, height, ctx, colorOrImage, r) {
        if (!colorOrImage) return;
        
        if (typeof colorOrImage === 'string' && colorOrImage.match?.(/^https?:\/\//)) {
                try {
                        const imageLoad = await Canvas.loadImage(colorOrImage);
                        ctx.save();
                        roundedImage(xStart, yStart, width, height, r, ctx);
                        ctx.clip();
                        ctx.drawImage(imageLoad, xStart, yStart, width, height);
                        ctx.restore();
                } catch (error) {
                        console.error("Error loading background image:", error);
                        // Fallback to color
                        ctx.fillStyle = Array.isArray(colorOrImage) ? 
                                checkGradientColor(ctx, colorOrImage, xStart, yStart, xStart + width, yStart + height) :
                                colorOrImage;
                        drawSquareRounded(ctx, xStart, yStart, width, height, r, colorOrImage);
                }
        } else {
                ctx.fillStyle = Array.isArray(colorOrImage) ? 
                        checkGradientColor(ctx, colorOrImage, xStart, yStart, xStart + width, yStart + height) :
                        colorOrImage;
                drawSquareRounded(ctx, xStart, yStart, width, height, r, colorOrImage);
        }
}

function roundedImage(x, y, width, height, radius, ctx) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
}

function centerImage(ctx, img, xCenter, yCenter, w, h) {
        const x = xCenter - w / 2;
        const y = yCenter - h / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(xCenter, yCenter, w / 2, 0, 2 * Math.PI);
        ctx.clip();
        ctx.closePath();
        ctx.drawImage(img, x, y, w, h);
        ctx.restore();
}

function autoSizeFont(maxWidthText, maxSizeFont, text, ctx, fontName) {
        let sizeFont = 0;
        while (true) {
                sizeFont += 1;
                ctx.font = sizeFont + "px " + fontName;
                const widthText = ctx.measureText(text).width;
                if (widthText > maxWidthText || sizeFont > maxSizeFont) break;
        }
        return sizeFont + "px " + fontName;
}

function checkGradientColor(ctx, color, x1, y1, x2, y2) {
        if (!color) return "#000000";
        
        if (Array.isArray(color)) {
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                color.forEach((c, index) => {
                        gradient.addColorStop(index / (color.length - 1), c);
                });
                return gradient;
        } else {
                return color;
        }
}

function isUrl(string) {
        try {
                new URL(string);
                return true;
        } catch (err) {
                return false;
        }
}

function checkFormatColor(color, enableUrl = true) {
        if (!color) return;
        
        if (
                !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) &&
                !/^rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/.test(color) &&
                !/^rgba\((\d{1,3}), (\d{1,3}), (\d{1,3}), (\d{1,3})\)$/.test(color) &&
                (enableUrl ? !isUrl(color) : true) &&
                !Array.isArray(color)
        )
                throw new Error(`The color format must be a hex, rgb, rgba ${enableUrl ? ", url image" : ""} or an array of colors`);
}