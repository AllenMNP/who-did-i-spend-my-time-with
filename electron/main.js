const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Data directory for JSON files
const dataDir = isDev 
  ? path.join(__dirname, '..', 'data')
  : path.join(app.getPath('userData'), 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'public', 'vite.svg'),
    title: 'Friend Time Tracker'
  });

  if (isDev) {
    // Try port 5173 first, fallback to 5174
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadURL('http://localhost:5174');
    });
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// Get list of backup files sorted by date (newest first)
function getBackupFiles() {
  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(dataDir, f),
      time: fs.statSync(path.join(dataDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  return files;
}

// Load data from the most recent backup
function loadData() {
  const backups = getBackupFiles();
  if (backups.length === 0) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(backups[0].path, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading data:', err);
    return null;
  }
}

// Save data to a new backup file and maintain only last 10
function saveData(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.json`;
  const filepath = path.join(dataDir, filename);
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    // Remove old backups, keep only last 10
    const backups = getBackupFiles();
    if (backups.length > 10) {
      backups.slice(10).forEach(backup => {
        fs.unlinkSync(backup.path);
      });
    }
    
    return { success: true, filename };
  } catch (err) {
    console.error('Error saving data:', err);
    return { success: false, error: err.message };
  }
}

// IPC handlers
ipcMain.handle('load-data', () => {
  return loadData();
});

ipcMain.handle('save-data', (event, data) => {
  return saveData(data);
});

ipcMain.handle('get-data-path', () => {
  return dataDir;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
