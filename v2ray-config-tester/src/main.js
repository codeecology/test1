/*
 * Ultimate V2Ray Tester - Main Process
 * Version: 3.0.0
 * Description: The core logic of the application, handling tests, connections, and system interactions.
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const dns = require('dns').promises;
const Store = require('electron-store');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const qrcode = require('qrcode');
const ipCountry = require('ip-country');

// --- Setup ---
const isDev = !app.isPackaged;
const store = new Store();
let mainWindow;
let tray = null;
let activeTestProcesses = new Map();
let connectionProcess = null;
let livePingInterval = null;

const xrayPath = isDev 
    ? path.join(__dirname, '..', 'core', 'xray.exe')
    : path.join(process.resourcesPath, 'core', 'xray.exe');
const tempDir = path.join(app.getPath('userData'), 'temp_configs');
const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');

// --- App Lifecycle ---
app.on('ready', () => {
    createWindow();
    createTray();
});

app.on('window-all-closed', () => {
    // On macOS, the app stays in the dock. On other platforms, we don't quit
    // because the app should live in the tray.
    if (process.platform === 'darwin') {
        app.dock.hide();
    }
});

app.on('before-quit', () => {
    // Clean up everything before quitting
    stopAllTests();
    if (connectionProcess) connectionProcess.kill();
    if (livePingInterval) clearInterval(livePingInterval);
    disableSystemProxy().finally(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
});

function createWindow() {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    mainWindow = new BrowserWindow({
        width: 1366, height: 768, minWidth: 1024, minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, nodeIntegration: false,
        },
        icon: iconPath,
        show: false,
        title: "Ultimate V2Ray Tester"
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (isDev) mainWindow.webContents.openDevTools();
    });

    mainWindow.on('close', (event) => {
        // Instead of quitting, hide the window to the tray
        event.preventDefault();
        mainWindow.hide();
    });

    Menu.setApplicationMenu(null);
}

// FEATURE: System Tray (Idea #41)
function createTray() {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'نمایش برنامه', click: () => mainWindow.show() },
        { type: 'separator' },
        { label: 'خروج کامل', click: () => { app.isQuitting = true; app.quit(); } }
    ]);
    tray.setToolTip('Ultimate V2Ray Tester');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow.show());
}

// --- IPC Handlers ---

// Data Management
ipcMain.handle('data:get-all', () => ({
    configs: store.get('configs', []),
    groups: store.get('groups', []),
    settings: store.get('settings', { concurrentTests: 10, testTimeout: 8, testUrl: 'http://cp.cloudflare.com/generate_204' })
}));
ipcMain.on('data:save-all', (event, { configs, groups, settings }) => {
    store.set({ configs, groups, settings });
});
ipcMain.handle('data:clear-all', () => store.clear());

// File System
ipcMain.handle('file:import-text', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'ورود کانفیگ از فایل متنی', properties: ['openFile'], filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });
    if (canceled || !filePaths.length) return null;
    return fs.readFileSync(filePaths[0], 'utf-8');
});
ipcMain.handle('file:export', async (event, { defaultPath, content, isJson = false }) => {
    const filters = isJson ? [{ name: 'JSON Files', extensions: ['json'] }] : [{ name: 'Text Files', extensions: ['txt'] }];
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, { title: 'ذخیره فایل', defaultPath, filters });
    if (!canceled && filePath) {
        fs.writeFileSync(filePath, content);
        return true;
    }
    return false;
});

// Network & Helpers
ipcMain.handle('network:fetch-sub', async (event, url) => {
    try {
        const response = await axios.get(url, { timeout: 15000 });
        return { success: true, data: Buffer.from(response.data, 'base64').toString('utf-8') };
    } catch (error) { return { success: false, error: error.message }; }
});
ipcMain.handle('qr:generate', async (event, link) => qrcode.toDataURL(link, { width: 300, margin: 2 }));
// FEATURE: Get Country from Hostname (Idea #8)
ipcMain.handle('system:get-country', async (event, hostname) => {
    try {
        const { address } = await dns.lookup(hostname);
        const countryData = ipCountry.lookup(address);
        return countryData ? countryData.country : 'XX';
    } catch (error) {
        return 'XX'; // Return a placeholder on error
    }
});

// --- Advanced Testing Engine ---
const isTesting = () => activeTestProcesses.size > 0;

ipcMain.on('test:start', (event, { configs, settings }) => {
    if (isTesting()) return;
    let configsToTest = [...configs];
    let completedCount = 0;

    const runSingleTest = async (config) => {
        const port = 11000 + Math.floor(Math.random() * 50000);
        const configPath = generateTempConfig(config.link, port);
        if (!configPath) {
            mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: 'Invalid Format' });
            return;
        }

        const testProcess = spawn(xrayPath, ['run', '-c', configPath]);
        activeTestProcesses.set(config.id, testProcess);
        
        await new Promise(resolve => setTimeout(resolve, 800)); // Wait for xray to start

        const startTime = Date.now();
        const agent = new SocksProxyAgent(`socks5://127.0.0.1:${port}`);
        try {
            const response = await axios.get(settings.testUrl, { httpAgent: agent, httpsAgent: agent, timeout: settings.testTimeout * 1000 });
            if (response.status >= 200 && response.status < 300) {
                mainWindow.webContents.send('test:result', { id: config.id, delay: Date.now() - startTime });
            } else {
                mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: `Status ${response.status}` });
            }
        } catch (error) {
            mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: error.code || 'Timeout' });
        } finally {
            if (!testProcess.killed) testProcess.kill();
            fs.unlink(configPath, () => {});
            activeTestProcesses.delete(config.id);
            completedCount++;
            mainWindow.webContents.send('test:progress', { progress: (completedCount / configs.length) * 100, total: configs.length, completed: completedCount });
        }
    };

    const pool = new Set();
    function runNextInQueue() {
        while (pool.size < settings.concurrentTests && configsToTest.length > 0) {
            const config = configsToTest.shift();
            const promise = runSingleTest(config).finally(() => {
                pool.delete(promise);
                if (isTesting() && activeTestProcesses.size > 0) runNextInQueue();
            });
            pool.add(promise);
        }
        if (configsToTest.length === 0 && pool.size === 0) {
            mainWindow.webContents.send('test:finish');
        }
    }
    runNextInQueue();
});

ipcMain.on('test:stop', stopAllTests);
function stopAllTests() {
    activeTestProcesses.forEach(proc => { if (!proc.killed) proc.kill(); });
    activeTestProcesses.clear();
    mainWindow.webContents.send('test:finish');
}

// --- System Proxy & Connection Management ---
const PROXY_PORT = 10808;
ipcMain.on('proxy:connect', (event, configLink) => {
    if (connectionProcess) connectionProcess.kill();
    
    const configPath = generateTempConfig(configLink, PROXY_PORT, 'main_connection.json');
    if (!configPath) return;

    connectionProcess = spawn(xrayPath, ['run', '-c', configPath]);
    connectionProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Xray started')) {
            enableSystemProxy(PROXY_PORT).then(() => {
                mainWindow.webContents.send('proxy:status', { isConnected: true });
                startLivePing();
            });
        }
    });
    connectionProcess.on('close', () => {
        disableSystemProxy().then(() => {
            mainWindow.webContents.send('proxy:status', { isConnected: false });
            stopLivePing();
            connectionProcess = null;
        });
    });
});
ipcMain.on('proxy:disconnect', () => {
    if (connectionProcess) connectionProcess.kill();
});

// FEATURE: Live Ping (Idea #2)
function startLivePing() {
    stopLivePing(); // Ensure no multiple intervals are running
    livePingInterval = setInterval(async () => {
        const agent = new SocksProxyAgent(`socks5://127.0.0.1:${PROXY_PORT}`);
        const startTime = Date.now();
        try {
            await axios.head('http://cp.cloudflare.com/generate_204', { httpAgent: agent, httpsAgent: agent, timeout: 5000 });
            mainWindow.webContents.send('proxy:live-ping-result', { delay: Date.now() - startTime });
        } catch (error) {
            mainWindow.webContents.send('proxy:live-ping-result', { delay: -1 });
        }
    }, 5000); // Ping every 5 seconds
}
function stopLivePing() {
    if (livePingInterval) clearInterval(livePingInterval);
    livePingInterval = null;
}

function enableSystemProxy(port) {
    const command = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f && reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "socks=127.0.0.1:${port}" /f`;
    return new Promise(resolve => exec(command, () => resolve()));
}
function disableSystemProxy() {
    const command = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`;
    return new Promise(resolve => exec(command, () => resolve()));
}

// --- Helper Functions ---
function generateTempConfig(link, port, filename) {
    const configObject = parseConfigLink(link, port);
    if (!configObject) return null;
    const tempConfigPath = path.join(tempDir, filename || `temp_${port}.json`);
    fs.writeFileSync(tempConfigPath, JSON.stringify(configObject, null, 2));
    return tempConfigPath;
}

function parseConfigLink(link, port) {
    try {
        const url = new URL(link);
        const protocol = url.protocol.slice(0, -1);
        let outbound = { protocol, settings: {}, streamSettings: {
            network: url.searchParams.get('type') || 'tcp',
            security: url.searchParams.get('security') || 'none',
        }};
        
        if (protocol === 'vless') {
            outbound.settings.vnext = [{ address: url.hostname, port: +url.port, users: [{ id: url.username, encryption: 'none', flow: url.searchParams.get('flow') || '' }] }];
        } else if (protocol === 'trojan') {
            outbound.settings.vnext = [{ address: url.hostname, port: +url.port, users: [{ password: url.password }] }];
        } else if (protocol === 'vmess') {
            const decoded = JSON.parse(Buffer.from(link.substring(8), 'base64').toString());
            outbound.settings.vnext = [{ address: decoded.add, port: +decoded.port, users: [{ id: decoded.id, alterId: decoded.aid, security: decoded.scy || 'auto' }] }];
            outbound.streamSettings = { network: decoded.net || 'tcp', security: decoded.tls || 'none' };
        } else if (protocol === 'ss') {
            const firstHash = link.indexOf('#');
            const parts = link.substring(5, firstHash > -1 ? firstHash : undefined);
            const [userInfo, serverInfo] = parts.split('@');
            const [address, port] = serverInfo.split(':');
            const decodedUser = Buffer.from(userInfo, 'base64').toString().split(':');
            outbound.settings.servers = [{ address, port: +port, method: decodedUser[0], password: decodedUser[1] }];
        } else { 
            return null; 
        }
        
        // Common Stream Settings
        if (outbound.streamSettings.security === 'tls') {
            outbound.streamSettings.tlsSettings = { serverName: url.searchParams.get('sni') || url.hostname, allowInsecure: true };
        }
        if (outbound.streamSettings.network === 'ws') {
            outbound.streamSettings.wsSettings = { path: url.searchParams.get('path') || '/', headers: { Host: url.searchParams.get('host') || url.hostname }};
        }

        return {
            log: { loglevel: 'warning' },
            inbounds: [{ port, listen: '127.0.0.1', protocol: 'socks', settings: { auth: 'noauth', udp: true } }],
            outbounds: [outbound]
        };
    } catch (e) { 
        console.error("Config Parse Error:", link, e); 
        return null; 
    }
}
