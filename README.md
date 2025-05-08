# CSShield – Local CS Gambling Blocker 🛡️

CSShield is a local desktop app that **blocks Counter-Strike-related gambling websites** to help users protect themselves from harmful gambling content.

Built with ❤️ using **Electron + Node.js**, this app modifies your system's `hosts` file to block known gambling domains and provides a clean, user-friendly dashboard.

---

## ✅ Features

- 🚫 **Block Gambling Sites**  
  Easily block a blacklist of gambling domains with one click.

- ♻️ **Restore Hosts File**  
  Revert changes made to your `hosts` file while keeping a backup for safety.

- 💾 **Restore Original Hosts File**  
  Fully restore your **original** hosts file from a secure backup (auto-created the first time you block).

- 📝 **Manage Blacklist**  
  Add or remove gambling domains from your custom blacklist directly in the app.

- 📊 **Logs**  
  View a history of all actions: blocked domains, restores, errors, and more.

- 💰 **Money Saved**  
  Enter your weekly gambling spend + quit date to see how much you've saved over time, including a live-updating graph.

---

## 🛠 Planned Features

- 🔒 **Password-Protected Settings**  
- ⚙️ **Auto-start on Boot**  
- 🎨 **Theme Toggle (Dark/Light Mode)**  
- 🌐 **Auto-updating Online Blacklist**  
- 📖 **Info Tab** (in progress)

---

## 🚀 Tech Stack

- **Electron.js** (for the desktop app)
- **Node.js + IPC** (for backend logic)
- **Chart.js** (for the Money Saved chart)
- **sudo-prompt** (for admin permission handling)
- **JSON file storage** (for settings + logs)

---

## 💻 Setup & Run

```bash
# Install dependencies
npm install

# Start the app
npm start
```

The app will launch in a desktop window. If it's your first time blocking domains, the app will automatically back up your original hosts file for safety.
---
## 📂 File Structure
```
/CSShield
├── blocklist.json       # Your blacklist of domains
├── logs.json            # Action logs
├── settings.json        # User settings (Money Saved section)
├── hosts_backup_original# Backup of your original hosts file (auto-created)
├── /src
│   ├── index.js         # Electron main process
│   ├── preload.js       # Exposes backend API to the frontend
│   └── index.html       # Frontend UI
├── README.md            # This file
├── package.json
└── .gitignore
```
---
## ⚠️ Disclaimer
Use at your own risk.
CSShield works by modifying your system's hosts file, which requires administrator privileges. The app automatically backs up your original hosts file to allow full restoration at any time.

We do not take responsibility for unintended side effects. Please review and understand what the app does before using.