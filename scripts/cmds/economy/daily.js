const moment = require("moment-timezone");

module.exports = {
	config: {
		name: "daily",
		version: "2.0",
		author: "NoobCore Team", // NC-FAHAD FIX
		countDown: 5,
		role: 0,
		description: {
			vi: "Nhận quà hàng ngày với streak, bonus và nhiều tính năng mới",
			en: "Receive daily gifts with streak system, bonuses and new features"
		},
		guide: {
			vi: "   {pn}: Nhận quà hàng ngày"
				+ "\n   {pn} info: Xem thông tin quà và streak"
				+ "\n   {pn} streak: Xem thông tin streak hiện tại"
				+ "\n   {pn} leaderboard: Bảng xếp hạng daily streak",
			en: "   {pn}: Claim daily gift"
				+ "\n   {pn} info: View gift information and streak"
				+ "\n   {pn} streak: View current streak info"
				+ "\n   {pn} leaderboard: Daily streak leaderboard"
		},
		envConfig: {
			rewardFirstDay: {
				coin: 1500,
				exp: 450
			},
			weeklyBonus: {
				coin: 3500,
				exp: 630
			},
			maxStreakBonus: 2.0, // Maximum bonus multiplier at 30 days streak
			timezone: "Asia/Ho_Chi_Minh"
		}
	},

	langs: {
		vi: {
			monday: "Thứ 2",
			tuesday: "Thứ 3",
			wednesday: "Thứ 4",
			thursday: "Thứ 5",
			friday: "Thứ 6",
			saturday: "Thứ 7",
			sunday: "Chủ nhật",
			alreadyReceived: "Bạn đã nhận quà hôm nay rồi!",
			received: "🎁 Bạn đã nhận được %1 coin và %2 exp!",
			streakInfo: "🔥 Streak: %1 ngày liên tiếp\n📊 Bonus hiện tại: x%2",
			streakReward: "✨ +%1 coin và +%2 exp từ streak bonus!",
			weeklyBonus: "🎉 CHÚC MỪNG! Bạn đã nhận được bonus tuần: %1 coin và %2 exp!",
			streakLost: "⚠️ Streak của bạn đã bị reset vì nhận quà trễ!",
			newStreak: "🆕 Bắt đầu streak mới!",
			leaderboard: "🏆 BẢNG XẾP HẠNG STREAK 🏆\n\n%1\n━━━━━━━━━━━━━",
			lbEntry: "%1. %2 - %3 ngày 🔥",
			noStreakData: "Chưa có dữ liệu streak nào!",
			yourPosition: "Vị trí của bạn: #%1",
			multiLogin: "⚠️ Phát hiện đăng nhập từ thiết bị khác, streak vẫn được giữ nguyên.",
			streakMilestone: "🎊 KỶ LỤC MỚI! %1 ngày streak!",
			totalReceived: "📈 Tổng đã nhận: %1 coin, %2 exp",
			nextRewardIn: "⏰ Phần thưởng tiếp theo sau: %1 giờ %2 phút"
		},
		en: {
			monday: "Monday",
			tuesday: "Tuesday",
			wednesday: "Wednesday",
			thursday: "Thursday",
			friday: "Friday",
			saturday: "Saturday",
			sunday: "Sunday",
			alreadyReceived: "You have already received today's gift!",
			received: "🎁 You have received %1 coin and %2 exp!",
			streakInfo: "🔥 Streak: %1 consecutive days\n📊 Current bonus: x%2",
			streakReward: "✨ +%1 coin and +%2 exp from streak bonus!",
			weeklyBonus: "🎉 CONGRATULATIONS! You received weekly bonus: %1 coin and %2 exp!",
			streakLost: "⚠️ Your streak has been reset for claiming late!",
			newStreak: "🆕 Starting new streak!",
			leaderboard: "🏆 STREAK LEADERBOARD 🏆\n\n%1\n━━━━━━━━━━━━━",
			lbEntry: "%1. %2 - %3 days 🔥",
			noStreakData: "No streak data yet!",
			yourPosition: "Your position: #%1",
			multiLogin: "⚠️ Multiple login detected, streak maintained.",
			streakMilestone: "🎊 NEW MILESTONE! %1 days streak!",
			totalReceived: "📈 Total received: %1 coin, %2 exp",
			nextRewardIn: "⏰ Next reward in: %1 hours %2 minutes"
		}
	},

	ncStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang, api, threadModel, userModel, globalModel }) {
		const config = envCommands[commandName];
		const reward = config.rewardFirstDay;
		const timezone = config.timezone || "Asia/Ho_Chi_Minh";
		
		if (args[0] == "info") {
			let msg = "📅 DAILY REWARD SCHEDULE 📅\n\n";
			for (let i = 1; i <= 7; i++) {
				const getCoin = Math.floor(reward.coin * (1 + 20 / 1500) ** ((i == 7 ? 0 : i) - 1));
				const getExp = Math.floor(reward.exp * (1 + 20 / 1500) ** ((i == 7 ? 0 : i) - 1));
				const day = i == 7 ? getLang("sunday") :
					i == 6 ? getLang("saturday") :
						i == 5 ? getLang("friday") :
							i == 4 ? getLang("thursday") :
								i == 3 ? getLang("wednesday") :
									i == 2 ? getLang("tuesday") :
										getLang("monday");
				msg += `${day}: ${getCoin} coin, ${getExp} exp\n`;
			}
			msg += "\n━━━━━━━━━━━━━\n";
			msg += "🌟 STREAK BONUS SYSTEM 🌟\n";
			msg += "1-7 days: x1.0 - x1.2 bonus\n";
			msg += "8-14 days: x1.3 - x1.5 bonus\n";
			msg += "15-30 days: x1.6 - x2.0 bonus\n";
			msg += "Weekly bonus every 7 days!\n";
			msg += "━━━━━━━━━━━━━";
			return message.reply(msg);
		}

		if (args[0] == "streak") {
			const { senderID } = event;
			const userData = await usersData.get(senderID);
			const streakData = userData.data.dailyStreak || { current: 0, lastClaim: null };
			const bonusMultiplier = calculateStreakBonus(streakData.current);
			
			let msg = getLang("streakInfo", streakData.current, bonusMultiplier.toFixed(1));
			
			if (streakData.lastClaim) {
				const lastClaim = moment(streakData.lastClaim);
				const now = moment().tz(timezone);
				const hoursDiff = now.diff(lastClaim, 'hours');
				const minutesDiff = now.diff(lastClaim, 'minutes') % 60;
				msg += `\n⏰ ${getLang("nextRewardIn", hoursDiff < 24 ? 24 - hoursDiff : 0, minutesDiff > 0 ? 60 - minutesDiff : 0)}`;
			}
			
			// Total stats
			msg += `\n${getLang("totalReceived", userData.data.totalCoinReceived || 0, userData.data.totalExpReceived || 0)}`;
			return message.reply(msg);
		}

		if (args[0] == "leaderboard") {
			const allUsers = await usersData.getAll();
			const streakList = [];
			
			for (const user of allUsers) {
				if (user.data?.dailyStreak?.current > 0) {
					streakList.push({
						name: user.name,
						streak: user.data.dailyStreak.current,
						id: user.id
					});
				}
			}
			
			streakList.sort((a, b) => b.streak - a.streak);
			
			let leaderboardMsg = "";
			const top10 = streakList.slice(0, 10);
			
			if (top10.length === 0) {
				leaderboardMsg = getLang("noStreakData");
			} else {
				top10.forEach((user, index) => {
					leaderboardMsg += getLang("lbEntry", index + 1, user.name, user.streak) + "\n";
				});
			}
			
			// Add user's position
			const senderID = event.senderID;
			const userIndex = streakList.findIndex(u => u.id === senderID);
			if (userIndex !== -1) {
				leaderboardMsg += `\n${getLang("yourPosition", userIndex + 1)}`;
			}
			
			return message.reply(getLang("leaderboard", leaderboardMsg));
		}

		// Main daily claim function
		const dateTime = moment().tz(timezone).format("YYYY-MM-DD");
		const date = new Date();
		const currentDay = date.getDay(); // 0: sunday, 1: monday, etc.
		const { senderID } = event;

		const userData = await usersData.get(senderID);
		
		// Initialize streak data if not exists
		if (!userData.data.dailyStreak) {
			userData.data.dailyStreak = {
				current: 0,
				lastClaim: null,
				longestStreak: 0
			};
		}
		
		if (!userData.data.totalCoinReceived) userData.data.totalCoinReceived = 0;
		if (!userData.data.totalExpReceived) userData.data.totalExpReceived = 0;

		const streakData = userData.data.dailyStreak;
		const lastClaimDate = streakData.lastClaim ? moment(streakData.lastClaim) : null;
		const currentDate = moment().tz(timezone);
		
		// Check if already claimed today
		if (lastClaimDate && lastClaimDate.format("YYYY-MM-DD") === dateTime) {
			const nextClaim = lastClaimDate.clone().add(1, 'day');
			const hoursLeft = nextClaim.diff(currentDate, 'hours');
			const minutesLeft = nextClaim.diff(currentDate, 'minutes') % 60;
			
			let msg = getLang("alreadyReceived");
			msg += `\n⏰ ${getLang("nextRewardIn", hoursLeft, minutesLeft)}`;
			return message.reply(msg);
		}

		// Calculate streak
		let isStreakContinued = false;
		if (lastClaimDate) {
			const daysDiff = currentDate.diff(lastClaimDate, 'days');
			if (daysDiff === 1) {
				// Perfect streak
				streakData.current++;
				isStreakContinued = true;
			} else if (daysDiff <= 3) {
				// Grace period: 3 days max
				message.reply(getLang("multiLogin"));
				isStreakContinued = true;
			} else {
				// Streak broken
				message.reply(getLang("streakLost"));
				streakData.current = 1;
				message.reply(getLang("newStreak"));
			}
		} else {
			// First time claim
			streakData.current = 1;
			message.reply(getLang("newStreak"));
		}

		// Update longest streak
		if (streakData.current > streakData.longestStreak) {
			streakData.longestStreak = streakData.current;
			if (streakData.current % 7 === 0) {
				message.reply(getLang("streakMilestone", streakData.current));
			}
		}

		// Calculate base reward
		let getCoin = Math.floor(reward.coin * (1 + 20 / 1500) ** ((currentDay == 0 ? 7 : currentDay) - 1));
		let getExp = Math.floor(reward.exp * (1 + 20 / 1500) ** ((currentDay == 0 ? 7 : currentDay) - 1));

		// Apply streak bonus
		const streakMultiplier = calculateStreakBonus(streakData.current);
		const streakBonusCoin = Math.floor(getCoin * (streakMultiplier - 1));
		const streakBonusExp = Math.floor(getExp * (streakMultiplier - 1));
		
		getCoin += streakBonusCoin;
		getExp += streakBonusExp;

		// Weekly bonus (every 7 days)
		let weeklyBonusMsg = "";
		if (streakData.current % 7 === 0) {
			const weeklyBonus = config.weeklyBonus;
			getCoin += weeklyBonus.coin;
			getExp += weeklyBonus.exp;
			weeklyBonusMsg = `\n${getLang("weeklyBonus", weeklyBonus.coin, weeklyBonus.exp)}`;
		}

		// Update user data
		streakData.lastClaim = dateTime;
		
		await usersData.set(senderID, {
			money: userData.money + getCoin,
			exp: userData.exp + getExp,
			data: {
				...userData.data,
				dailyStreak: streakData,
				totalCoinReceived: (userData.data.totalCoinReceived || 0) + getCoin,
				totalExpReceived: (userData.data.totalExpReceived || 0) + getExp,
				lastTimeGetReward: dateTime
			}
		});

		// Prepare response message
		let responseMsg = getLang("received", getCoin, getExp);
		
		if (streakBonusCoin > 0 || streakBonusExp > 0) {
			responseMsg += `\n${getLang("streakReward", streakBonusCoin, streakBonusExp)}`;
		}
		
		if (weeklyBonusMsg) {
			responseMsg += weeklyBonusMsg;
		}
		
		responseMsg += `\n${getLang("streakInfo", streakData.current, streakMultiplier.toFixed(1))}`;
		
		message.reply(responseMsg);
	}
};

function calculateStreakBonus(streakDays) {
	if (streakDays <= 7) {
		return 1 + (streakDays - 1) * 0.2 / 6; // 1.0 to 1.2
	} else if (streakDays <= 14) {
		return 1.2 + (streakDays - 7) * 0.3 / 7; // 1.3 to 1.5
	} else {
		const maxBonus = 2.0;
		const additionalDays = Math.min(streakDays - 14, 16); // Cap at 30 days
		return 1.5 + additionalDays * 0.5 / 16; // 1.6 to 2.0
	}
}