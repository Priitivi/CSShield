const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const sudo = require('sudo-prompt');

const options = {
  name: 'CSShield'
};

const hostsPath = process.platform === 'win32'
  ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
  : '/etc/hosts';

const blocklistPath = path.join(__dirname, '../blocklist.json');
const logsPath = path.join(__dirname, '../logs.json');
const backupPath = path.join(__dirname, '../hosts_backup_original');
const settingsPath = path.join(__dirname, '../settings.json');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function writeLog(action, details = '') {
  const timestamp = new Date().toLocaleString();
  const entry = { action, timestamp, details };

  let logs = [];
  try {
    const data = fs.readFileSync(logsPath, 'utf8');
    logs = JSON.parse(data);
  } catch (err) {
    console.error('Failed to read logs:', err);
  }
  logs.unshift(entry);
  fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-blacklist', async () => {
    try {
      const data = fs.readFileSync(blocklistPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  });

  ipcMain.handle('add-domain', async (event, domain) => {
    try {
      const data = fs.readFileSync(blocklistPath, 'utf8');
      const list = JSON.parse(data);
      if (!list.includes(domain)) {
        list.push(domain);
        fs.writeFileSync(blocklistPath, JSON.stringify(list, null, 2));
      }
      return list;
    } catch {
      return [];
    }
  });

  ipcMain.handle('remove-domain', async (event, domain) => {
    try {
      const data = fs.readFileSync(blocklistPath, 'utf8');
      let list = JSON.parse(data);
      list = list.filter(d => d !== domain);
      fs.writeFileSync(blocklistPath, JSON.stringify(list, null, 2));
      return list;
    } catch {
      return [];
    }
  });

  ipcMain.handle('block-domains', async () => {
    const data = fs.readFileSync(blocklistPath, 'utf8');
    const blockList = JSON.parse(data);

    if (blockList.length === 0) {
      return 'No domains to block.';
    }

    let blockEntries = '';
    blockList.forEach(domain => {
      blockEntries += `127.0.0.1 ${domain}\n`;
    });

    const tempFile = path.join(app.getPath('temp'), 'cs_blocklist.txt');

    return new Promise((resolve, reject) => {
      if (!fs.existsSync(backupPath)) {
        fs.copyFile(hostsPath, backupPath, (err) => {
          if (err) {
            console.error('Backup failed:', err);
          } else {
            console.log('Backup created.');
            writeLog('Backup Created', 'Original hosts file backed up.');
          }
        });
      }

      fs.writeFile(tempFile, blockEntries, (err) => {
        if (err) {
          reject('Failed to create blocklist file');
          return;
        }

        const command = `type "${tempFile}" >> "${hostsPath}"`;

        sudo.exec(command, options, (error) => {
          if (error) {
            reject('Failed to block domains');
          } else {
            writeLog('Blocked Domains', `${blockList.length} domains`);
            resolve(`Blocked ${blockList.length} domains successfully`);
          }
        });
      });
    });
  });

  ipcMain.handle('restore-hosts', async () => {
    return new Promise((resolve, reject) => {
      fs.readFile(hostsPath, 'utf8', (err, data) => {
        if (err) {
          reject('Failed to read hosts file');
          return;
        }

        const dataObj = fs.readFileSync(blocklistPath, 'utf8');
        const list = JSON.parse(dataObj);
        const regexParts = list.map(domain => `127\\.0\\.0\\.1\\s+${domain.replace('.', '\\.')}`);
        const blockRegex = new RegExp(`(${regexParts.join('|')})\\s*\\n?`, 'g');
        const cleaned = data.replace(blockRegex, '');

        const tmpFile = path.join(app.getPath('temp'), 'hosts_tmp');

        fs.writeFile(tmpFile, cleaned, (err) => {
          if (err) {
            reject('Failed to write temp file');
            return;
          }

          sudo.exec(`move "${tmpFile}" "${hostsPath}"`, options, (error) => {
            if (error) {
              reject('Failed to restore hosts file');
            } else {
              writeLog('Restored Hosts File');
              resolve('Hosts file restored');
            }
          });
        });
      });
    });
  });

  ipcMain.handle('restore-original', async () => {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(backupPath)) {
        reject('No backup found.');
        return;
      }

      const command = `copy "${backupPath}" "${hostsPath}"`;

      sudo.exec(command, options, (error) => {
        if (error) {
          reject('Failed to restore original hosts file');
        } else {
          writeLog('Restored Original Hosts File');
          resolve('Original hosts file restored from backup');
        }
      });
    });
  });

  ipcMain.handle('get-logs', async () => {
    try {
      const data = fs.readFileSync(logsPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  });

  // === Settings IPC ===
  ipcMain.handle('get-settings', async () => {
    try {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  });

  ipcMain.handle('save-settings', async (event, newSettings) => {
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
      return true;
    } catch {
      return false;
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
