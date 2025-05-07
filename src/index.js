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

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 700,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // OPTIONAL: Open DevTools (commented out)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // 🔗 Get Blacklist
  ipcMain.handle('get-blacklist', async () => {
    try {
      const data = fs.readFileSync(blocklistPath, 'utf8');
      const list = JSON.parse(data);
      return list;
    } catch (err) {
      console.error('Error reading blocklist:', err);
      return [];
    }
  });

  // 🔗 Add Domain
  ipcMain.handle('add-domain', async (event, domain) => {
    try {
      const data = fs.readFileSync(blocklistPath, 'utf8');
      const list = JSON.parse(data);
      if (!list.includes(domain)) {
        list.push(domain);
        fs.writeFileSync(blocklistPath, JSON.stringify(list, null, 2));
      }
      return list;
    } catch (err) {
      console.error('Error adding domain:', err);
      return [];
    }
  });

  // 🔗 Remove Domain
  ipcMain.handle('remove-domain', async (event, domain) => {
    try {
      const data = fs.readFileSync(blocklistPath, 'utf8');
      let list = JSON.parse(data);
      list = list.filter(d => d !== domain);
      fs.writeFileSync(blocklistPath, JSON.stringify(list, null, 2));
      return list;
    } catch (err) {
      console.error('Error removing domain:', err);
      return [];
    }
  });

  // 🔗 Block Domains (reads real JSON file)
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
      // 1️⃣ Write blocklist to a temp file
      fs.writeFile(tempFile, blockEntries, (err) => {
        if (err) {
          console.error('Error writing temp blocklist file:', err);
          reject('Failed to create blocklist file');
          return;
        }

        // 2️⃣ Append temp file to hosts
        const command = `type "${tempFile}" >> "${hostsPath}"`; // Windows style

        sudo.exec(command, options, (error, stdout, stderr) => {
          if (error) {
            console.error('Error blocking domains:', error);
            reject('Failed to block domains');
          } else {
            console.log('Domains blocked successfully.');
            resolve('Blocked domains successfully');
          }
        });
      });
    });
  });

  // 🔗 Restore Hosts File
  ipcMain.handle('restore-hosts', async () => {
    return new Promise((resolve, reject) => {
      fs.readFile(hostsPath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading hosts file:', err);
          reject('Failed to read hosts file');
          return;
        }

        const dataObj = fs.readFileSync(blocklistPath, 'utf8');
        const list = JSON.parse(dataObj);

        // Remove blocked domains
        const regexParts = list.map(domain => `127\\.0\\.0\\.1\\s+${domain.replace('.', '\\.')}`);
        const blockRegex = new RegExp(`(${regexParts.join('|')})\\s*\\n?`, 'g');
        const cleaned = data.replace(blockRegex, '');

        const tmpFile = path.join(app.getPath('temp'), 'hosts_tmp');

        fs.writeFile(tmpFile, cleaned, (err) => {
          if (err) {
            console.error('Error writing temp hosts file:', err);
            reject('Failed to write temp file');
            return;
          }

          sudo.exec(`move "${tmpFile}" "${hostsPath}"`, options, (error, stdout, stderr) => {
            if (error) {
              console.error('Error restoring hosts file:', error);
              reject('Failed to restore hosts file');
            } else {
              console.log('Hosts file restored.');
              resolve('Restored hosts file');
            }
          });
        });
      });
    });
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
