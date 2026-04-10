<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Orbitron&size=32&duration=4000&color=00F5FF&center=true&vCenter=true&width=700&lines=⚔️+Vanguards+Discord+Bot;Moderation+%7C+Levels+%7C+Utilities;Built+for+the+Vanguards+Community" />
</p>

<p align="center">

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge)
![discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-purple?style=for-the-badge)

</p>

---

# ⚔️ Vanguards Discord Bot

A powerful **Discord bot built for the Vanguards community** designed to provide:

* Moderation tools
* Utility commands
* Leveling system
* Voice moderation
* Custom image cards

Built using **Node.js + discord.js + MongoDB**.

---

# 🚀 Bot Features

## 🛡 Moderation

* `/ban` – ban users
* `/mute` – mute members
* `/warn` – warn users
* `/warnings` – view warnings
* `/purge` – delete messages
* `/lockdown` – lock channels
* `/roles` – manage roles
* `/welcome-setup` – configure welcome system

---

## ⚙ Utilities

| Command    | Description              |
| ---------- | ------------------------ |
| `/afk`     | Set AFK status           |
| `/avatar`  | Show user avatar         |
| `/echo`    | Make bot repeat text     |
| `/info`    | Show server/user info    |
| `/remind`  | Create reminders         |
| `/snipe`   | View deleted messages    |
| `/trigger` | Custom trigger responses |

---

## 📊 Level System

Features:

* Automatic XP gain
* Level tracking
* Leaderboards
* Custom rank cards

---

## 🔊 Voice Tools

| Command       | Description     |
| ------------- | --------------- |
| `/vcmute`     | Mute user in VC |
| `/vcunmute`   | Unmute user     |
| `/disconnect` | Disconnect user |

---

# 🖼 Image Systems

The bot generates dynamic graphics:

* Welcome cards
* Level cards
* User info cards

Using **Canvas rendering**.

---

# 📂 Project Structure

```
discord-bot
│
├── package.json
├── .env.example
│
└── src
    ├── index.js
    ├── deploy-commands.js
    │
    ├── commands
    │   ├── admin
    │   ├── moderation
    │   ├── utility
    │   └── voice
    │
    ├── events
    │   ├── guildMemberAdd.js
    │   ├── interactionCreate.js
    │   ├── messageCreate.js
    │   └── messageDelete.js
    │
    ├── models
    │   ├── Config.js
    │   ├── Level.js
    │   ├── Mute.js
    │   ├── Reminder.js
    │   └── Warning.js
    │
    └── utils
        ├── helpers.js
        ├── levelCard.js
        ├── welcomeCard.js
        ├── stats.js
        └── infoCard.js
```

---

# ⚙ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/divyam007142/Vanguards.git
cd Vanguards
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Environment

Create `.env` file:

```
TOKEN=your_bot_token
MONGO_URI=your_mongodb_uri
CLIENT_ID=your_client_id
GUILD_ID=your_server_id
```

---

## 4️⃣ Deploy Slash Commands

```
node src/deploy-commands.js
```

---

## 5️⃣ Start Bot

```
node src/index.js
```

---

# 📊 GitHub Stats

![Repo Stats](https://github-readme-stats.vercel.app/api/pin/?username=divyam007142\&repo=Vanguards\&theme=tokyonight)

---

# 📈 Activity Graph

![Activity Graph](https://github-readme-activity-graph.vercel.app/graph?username=divyam007142\&theme=tokyo-night)

---

# 🌐 About Vanguards

**Vanguards** is a community centered around:

* Brawl Stars discussions
* Esports
* Gaming community interactions

The bot helps automate moderation and improve server engagement.

---

# 🔮 Future Plans

Planned features:

* 🤖 AI assistant for server members
* 📊 Brawl Stars API integration
* 💰 Server economy system
* 🌐 Web dashboard

---

# 👨‍💻 Developer

**Lunar Vibes**

GitHub
https://github.com/divyam007142

---

# 📜 License

This project is licensed under the **MIT License**.
