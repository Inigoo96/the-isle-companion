const { app, BrowserWindow, globalShortcut, ipcMain, clipboard } = require('electron');
const path = require('path');

let overlayWindow = null;
let clipboardInterval = null;
let lastClipboard = '';

function createOverlay() {
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 500,
    x: 20,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  overlayWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');

  if (process.argv.includes('--dev')) {
    overlayWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function parseIsleCoordinates(text) {
  // The Isle formats: "X: -123456.78 Y: 987654.32 Z: 1234.56"
  // or variations like "X:-123456.78 Y:987654.32 Z:1234.56"
  const match = text.match(/X[:\s]*(-?[\d.]+)\s*Y[:\s]*(-?[\d.]+)\s*Z[:\s]*(-?[\d.]+)/i);
  if (match) {
    return {
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      z: parseFloat(match[3])
    };
  }
  return null;
}

function startClipboardWatch() {
  clipboardInterval = setInterval(() => {
    const current = clipboard.readText();
    if (current && current !== lastClipboard) {
      lastClipboard = current;
      const coords = parseIsleCoordinates(current);
      if (coords && overlayWindow) {
        overlayWindow.webContents.send('coordinates-update', coords);
      }
    }
  }, 500);
}

app.whenReady().then(() => {
  createOverlay();
  startClipboardWatch();

  // Toggle overlay visibility
  globalShortcut.register('F9', () => {
    if (overlayWindow) {
      if (overlayWindow.isVisible()) {
        overlayWindow.hide();
      } else {
        overlayWindow.show();
      }
    }
  });

  // Toggle click-through mode (so you can click through the overlay to the game)
  let clickThrough = false;
  globalShortcut.register('F10', () => {
    clickThrough = !clickThrough;
    if (overlayWindow) {
      overlayWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
      overlayWindow.webContents.send('click-through-changed', clickThrough);
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (clipboardInterval) clearInterval(clipboardInterval);
});

app.on('window-all-closed', () => app.quit());
