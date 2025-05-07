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

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
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

  // 🔗 IPC: Handle Block command
  ipcMain.handle('block-domains', async () => {
    const blockList = [
      'csgoempire.com',
      'csgoroll.com',
      'csgolive.com',
      'gamdom.com',
      'csgobetting.com'
      // Add more domains if you want
    ];
  
    let blockEntries = '';
    blockList.forEach(domain => {
      blockEntries += `127.0.0.1 ${domain}\n`;
    });
  
    const tempFile = path.join(app.getPath('temp'), 'cs_blocklist.txt');
  
    return new Promise((resolve, reject) => {
      // 1️⃣ Write to a temp file
      fs.writeFile(tempFile, blockEntries, (err) => {
        if (err) {
          console.error('Error writing temp blocklist file:', err);
          reject('Failed to create blocklist file');
          return;
        }
  
        // 2️⃣ Append the temp file to the hosts file (as admin)
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
  

  

  // 🔗 IPC: Handle Restore command
  ipcMain.handle('restore-hosts', async () => {
    return new Promise((resolve, reject) => {
      fs.readFile(hostsPath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading hosts file:', err);
          reject('Failed to read hosts file');
          return;
        }

        // Remove blocked domains
        const blockRegex = /(127\.0\.0\.1\s+(csgoempire\.com|csgoroll\.com|csgolive\.com|gamdom\.com|csgobetting\.com)\s*\n?)/g;
        const cleaned = data.replace(blockRegex, '');

        const tmpFile = path.join(app.getPath('temp'), 'hosts_tmp');

        fs.writeFile(tmpFile, cleaned, (err) => {
          if (err) {
            console.error('Error writing temp hosts file:', err);
            reject('Failed to write temp file');
            return;
          }

          sudo.exec(`mv "${tmpFile}" "${hostsPath}"`, options, (error, stdout, stderr) => {
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
