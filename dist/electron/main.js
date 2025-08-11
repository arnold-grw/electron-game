import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import * as path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function createWindow() {
    const win = new BrowserWindow({
        fullscreen: true, //fullscreen mode
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js'), // optional
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.resolve(app.isPackaged
            ? path.join(process.resourcesPath, 'assets', 'icon.ico')
            : path.join(__dirname, '../../assets/icon.ico'))
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        // dev mode loads the Vite dev server
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        // production mode loads the built renderer files (index.html)
        win.loadFile(path.join(__dirname, '../renderer/index.html'));
        win.webContents.openDevTools({ mode: 'detach' }); // Open the DevTools in detached mode
    }
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
