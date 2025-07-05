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
    if (connectionProcess && !connectionProcess.killed) { // Check if killed, though kill() is idempotent
        connectionProcess.kill();
    }
    if (livePingInterval) {
        clearInterval(livePingInterval);
        livePingInterval = null;
    }

    // Attempt to disable system proxy, but don't let errors here prevent app exit or other cleanup.
    disableSystemProxy()
        .catch(err => {
            console.warn("Failed to disable system proxy during app quit (this might be non-critical):", err.message);
        })
        .finally(() => {
            // This ensures tempDir cleanup happens even if disableSystemProxy had issues or was skipped.
            if (fs.existsSync(tempDir)) {
                try {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    // console.log("Temporary directory cleaned up.");
                } catch (e) {
                    console.error("Failed to clean up temporary directory:", e);
                }
            }
            // app.quit(); // This is implicitly handled by the 'before-quit' event completing unless event.preventDefault() is called.
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

ipcMain.handle('file:import-json', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Data from JSON',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (canceled || !filePaths.length) {
        return { success: false, error: 'File selection canceled.' };
    }
    try {
        const filePath = filePaths[0];
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return { success: true, data: fileContent };
    } catch (error) {
        console.error(`Failed to read JSON file: ${error.message}`);
        return { success: false, error: `Failed to read file: ${error.message}` };
    }
});

ipcMain.handle('file:export', async (event, { defaultPath, content, isJson = false }) => {
    const filters = isJson ? [{ name: 'JSON Files', extensions: ['json'] }] : [{ name: 'Text Files', extensions: ['txt'] }];
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, { title: 'ذخیره فایل', defaultPath, filters });
    if (!canceled && filePath) {
        try {
            fs.writeFileSync(filePath, content);
            return true;
        } catch (error) {
            console.error(`Failed to write file '${filePath}':`, error);
            // Optionally, communicate this error back to the renderer process
            // For example, by throwing the error or returning an object like { success: false, error: message }
            // For now, returning false is consistent with cancellation. The console error provides debug info.
            return false;
        }
    }
    return false;
});

// Network & Helpers
ipcMain.handle('network:fetch-sub', async (event, url) => {
    try {
        const response = await axios.get(url, { timeout: 15000 });
        return { success: true, data: Buffer.from(response.data, 'base64').toString('utf-8') };
    } catch (error) {
        console.error(`Failed to fetch subscription from ${url}:`, error.message);
        return { success: false, error: error.message };
    }
});
ipcMain.handle('qr:generate', async (event, link) => {
    try {
        return await qrcode.toDataURL(link, { width: 300, margin: 2 });
    } catch (error) {
        console.error(`Failed to generate QR code for link "${link}":`, error.message);
        throw error; // Re-throw to be caught by IPC caller if it handles errors
    }
});
// FEATURE: Get Country from Hostname (Idea #8)
ipcMain.handle('system:get-country', async (event, hostname) => {
    console.log(`[system:get-country] Received hostname: ${hostname}`);
    if (!hostname || typeof hostname !== 'string') {
        console.warn(`[system:get-country] Invalid hostname received: ${hostname}. Returning 'XX'.`);
        return 'XX';
    }
    try {
        const { address, family } = await dns.lookup(hostname);
        console.log(`[system:get-country] DNS lookup for ${hostname}: IP Address = ${address}, Family = ${family}`);

        // ip-country might not support IPv6 well, or hostnames that resolve to IPv6 first.
        // Let's prefer IPv4 if available, or check what ipCountry supports.
        // For now, we use what dns.lookup gives by default.

        const countryData = ipCountry.lookup(address);

        if (countryData) {
            console.log(`[system:get-country] ipCountry.lookup for ${address} (from ${hostname}): Found country = ${countryData.country}`);
            return countryData.country;
        } else {
            console.warn(`[system:get-country] ipCountry.lookup for ${address} (from ${hostname}): No country data found. Returning 'XX'.`);
            return 'XX';
        }
    } catch (error) {
        console.warn(`[system:get-country] DNS lookup failed for hostname "${hostname}": ${error.message}. Returning 'XX'.`);
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
        const port = 11000 + Math.floor(Math.random() * 50000); // TODO: Consider a port manager for more robust port allocation
        const genConfigResponse = generateTempConfig(config.link, port);

        if (!genConfigResponse.success) {
            mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: genConfigResponse.error });
            // Ensure completedCount is incremented and progress is updated even for parse failures
            completedCount++;
            mainWindow.webContents.send('test:progress', { progress: (completedCount / configs.length) * 100, total: configs.length, completed: completedCount });
            activeTestProcesses.delete(config.id); // Remove from active if it was added optimistically, though it shouldn't be
            return;
        }
        const configPath = genConfigResponse.path;

        let testProcess; // Define testProcess here to be accessible in finally block
        try {
            testProcess = spawn(xrayPath, ['run', '-c', configPath]);
            activeTestProcesses.set(config.id, testProcess);

            // Error handling for spawn itself (e.g., xrayPath not found, permissions)
            testProcess.on('error', (spawnError) => {
                console.error(`Failed to start Xray process for config ${config.id}:`, spawnError);
                mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: `Xray start error: ${spawnError.message}` });
                // Cleanup is handled in 'close' or 'exit' event if spawn fails this way
                return; // Exit before trying to use the process
            });

            // Optional: Listen to stderr for early Xray errors
            // testProcess.stderr.on('data', (data) => {
            // console.error(`Xray stderr (config ${config.id}): ${data}`);
            // });

            // Wait for Xray to signal it has started
            const xrayStartTimeoutMs = settings.testTimeout > 5 ? (settings.testTimeout * 1000 / 2) : 5000; // Use half of test timeout or 5s min for xray start
            try {
                await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error('Xray startup timeout'));
                    }, xrayStartTimeoutMs);

                    let outputBuffer = '';
                    const onData = (data) => {
                        outputBuffer += data.toString();
                        // console.log(`Xray stdout (config ${config.id}, port ${port}): ${data.toString()}`); // Debug output
                        if (/Xray.*started/i.test(outputBuffer)) { // Regex to match "Xray ... started" case-insensitively
                            clearTimeout(timeoutId);
                            testProcess.stdout.removeListener('data', onData); // Clean up listener
                            resolve();
                        }
                    };
                    testProcess.stdout.on('data', onData);
                    testProcess.once('exit', (code, signal) => { // Handle early exit
                        clearTimeout(timeoutId);
                        testProcess.stdout.removeListener('data', onData);
                        reject(new Error(`Xray exited prematurely with code ${code}, signal ${signal}`));
                    });
                });
            } catch (startupError) {
                console.error(`Xray startup error for config ${config.id} on port ${port}:`, startupError.message);
                mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: startupError.message });
                // Cleanup is handled in the main finally block
                return;
            }

            const startTime = Date.now();
            const agent = new SocksProxyAgent(`socks5://127.0.0.1:${port}`);

            const response = await axios.get(settings.testUrl, { httpAgent: agent, httpsAgent: agent, timeout: settings.testTimeout * 1000 });
            if (response.status >= 200 && response.status < 300) {
                mainWindow.webContents.send('test:result', { id: config.id, delay: Date.now() - startTime });
            } else {
                mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: `Status ${response.status}` });
            }
        } catch (error) {
            let errorMessage = 'Timeout'; // Default error message
            if (error.code) {
                errorMessage = error.code;
            } else if (error.response && error.response.status) {
                errorMessage = `Status ${error.response.status}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: errorMessage });
        } finally {
            if (testProcess && !testProcess.killed) {
                testProcess.kill();
            }
            if (configPath) { // Only attempt to unlink if configPath was successfully created
                fs.unlink(configPath, (err) => {
                    if (err) console.error(`Failed to delete temp config '${configPath}':`, err);
                });
            }
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
    if (connectionProcess) {
        connectionProcess.kill();
        connectionProcess = null; // Ensure it's reset before attempting a new connection
    }

    const genConfigResponse = generateTempConfig(configLink, PROXY_PORT, 'main_connection.json');
    if (!genConfigResponse.success) {
        console.error('Failed to generate config for proxy connection:', genConfigResponse.error);
        mainWindow.webContents.send('proxy:status', { isConnected: false, error: `Config error: ${genConfigResponse.error}` });
        return;
    }
    const configPath = genConfigResponse.path;

    try {
        connectionProcess = spawn(xrayPath, ['run', '-c', configPath]);
    } catch (spawnError) {
        console.error('Failed to spawn Xray for proxy connection:', spawnError);
        mainWindow.webContents.send('proxy:status', { isConnected: false, error: `Xray spawn error: ${spawnError.message}` });
        if (configPath) fs.unlink(configPath, e => e && console.error('Failed to delete temp main_connection.json after spawn error:', e));
        return;
    }
    
    connectionProcess.on('error', (spawnError) => { // Handles errors after spawn like ENOENT
        console.error('Xray connection process error:', spawnError);
        mainWindow.webContents.send('proxy:status', { isConnected: false, error: `Xray error: ${spawnError.message}` });
        if (connectionProcess && !connectionProcess.killed) connectionProcess.kill(); // Ensure kill
        connectionProcess = null;
        if (configPath) fs.unlink(configPath, e => e && console.error('Failed to delete temp main_connection.json after process error:', e));
    });

    connectionProcess.stdout.on('data', (data) => {
        const output = data.toString();
        // console.log(`Xray stdout: ${output}`); // For debugging Xray startup messages
        if (output.includes('Xray') && output.includes('started')) { // Make matching more robust
            enableSystemProxy(PROXY_PORT)
                .then(() => {
                    mainWindow.webContents.send('proxy:status', { isConnected: true });
                    startLivePing();
                })
                .catch(err => {
                    console.error("Failed to enable system proxy:", err);
                    mainWindow.webContents.send('proxy:status', { isConnected: false, error: `Failed to enable system proxy: ${err.message}` });
                    // If proxy enabling fails, we should probably kill the connection process
                    // as the app state is inconsistent (Xray running but proxy not set).
                    if (connectionProcess && !connectionProcess.killed) {
                        connectionProcess.kill();
                    }
                    // No need to call disableSystemProxy here as it was never enabled.
                });
        }
    });
    connectionProcess.on('close', () => { // This is called when Xray process exits for any reason
        disableSystemProxy()
            .catch(err => {
                console.warn("Failed to disable system proxy on connection close (this might be non-critical):", err.message);
            })
            .finally(() => { // Ensure UI update and cleanup happens regardless of disableSystemProxy outcome
                mainWindow.webContents.send('proxy:status', { isConnected: false });
                stopLivePing();
                if (configPath) { // Clean up the temp config file used for connection
                    fs.unlink(configPath, e => e && console.error('Failed to delete temp main_connection.json after connection close:', e));
                }
                connectionProcess = null;
            });
    });
});
ipcMain.on('proxy:disconnect', () => {
    if (connectionProcess) connectionProcess.kill();
});

ipcMain.handle('config:get-full-details', async (event, configLink) => {
    // We use a dummy port because parseConfigLink requires it, but it's not used for details display.
    // The primary purpose here is to get the parsed structure of the outbound config.
    const parseResult = parseConfigLink(configLink, 0); // Port 0 is arbitrary here
    if (parseResult.success && parseResult.config && parseResult.config.outbounds && parseResult.config.outbounds.length > 0) {
        // We only need the first outbound and its streamSettings for details.
        // The main 'config' object returned by parseConfigLink includes inbounds, log settings etc.
        // which are not needed for just displaying the outbound details.
        const outboundConfig = parseResult.config.outbounds[0];
        return {
            success: true,
            details: {
                protocol: outboundConfig.protocol,
                settings: outboundConfig.settings,
                streamSettings: outboundConfig.streamSettings,
                // Potentially add other top-level useful info from the link if not directly in outboundConfig
                // For example, the original name from hash if parseConfigLink doesn't include it here
            }
        };
    } else {
        return { success: false, error: parseResult.error || "Failed to parse config link for details." };
    }
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
    if (process.platform !== 'win32') {
        const unsupportedPlatformError = "Automatic system proxy setting is only supported on Windows. Please configure your system proxy manually.";
        console.warn(unsupportedPlatformError);
        return Promise.reject(new Error(unsupportedPlatformError));
    }
    const command = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f && reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "socks=127.0.0.1:${port}" /f`;
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                const enableErrorMsg = `Failed to enable system proxy. Please check if you have the necessary permissions or if another program is controlling proxy settings. Error: ${error.message}`;
                console.error(enableErrorMsg);
                if (stderr) console.error(`Enable proxy stderr: ${stderr}`);
                reject(new Error(enableErrorMsg));
                return;
            }
            // console.log(`System proxy enabled: ${stdout}`);
            resolve();
        });
    });
}

function disableSystemProxy() {
    if (process.platform !== 'win32') {
        // For non-Windows, if we didn't enable it, we arguably don't need to disable it.
        // However, if called, it should indicate it's a no-op or unsupported.
        const unsupportedPlatformError = "Automatic system proxy setting is only supported on Windows.";
        console.warn(unsupportedPlatformError);
        return Promise.resolve(); // Resolve gracefully as no action is taken or needed.
    }
    const command = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`;
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // This might not always be critical, e.g., if proxy was already disabled.
                const disableErrorMsg = `Warning: Failed to automatically disable system proxy. It might already be disabled, or there could be a permission issue. Error: ${error.message}`;
                console.warn(disableErrorMsg);
                if (stderr) console.warn(`Disable proxy stderr: ${stderr}`);
                // Resolve still, as failing to disable (especially if already disabled) is often non-critical for app shutdown.
                // If strict error handling is needed, this could be a reject.
                resolve();
                return;
            }
            // console.log(`System proxy disabled: ${stdout}`);
            resolve();
        });
    });
}

// --- Helper Functions ---
function generateTempConfig(link, port, filename) {
    const parseResult = parseConfigLink(link, port);
    if (!parseResult.success) {
        // Propagate the detailed error message from parseConfigLink
        return { success: false, error: parseResult.error };
    }
    const configObject = parseResult.config;
    // Add timestamp to filename for more uniqueness, helping avoid potential conflicts.
    const uniqueFilename = filename || `temp_${Date.now()}_${port}.json`;
    const tempConfigPath = path.join(tempDir, uniqueFilename);

    try {
        fs.writeFileSync(tempConfigPath, JSON.stringify(configObject, null, 2));
        return { success: true, path: tempConfigPath };
    } catch (e) {
        console.error(`Failed to write temporary config file '${tempConfigPath}':`, e);
        return { success: false, error: `Failed to write temp config file: ${e.message}` };
    }
}

function parseConfigLink(link, port) {
    if (!link || typeof link !== 'string' || link.trim() === '') {
        return { success: false, error: "Config link is empty or invalid." };
    }

    let url;
    try {
        url = new URL(link);
    } catch (e) {
        // This catch handles fundamentally invalid URL structures before protocol-specific parsing
        console.error(`Invalid URL structure for link "${link}": ${e.message}`);
        return { success: false, error: `Invalid link format: ${e.message}` };
    }

    const protocol = url.protocol.slice(0, -1).toLowerCase();

    let outbound = {
        protocol,
        settings: {},
        streamSettings: {
            // Common defaults, might be overridden by specific protocol logic or URL params
            network: url.searchParams.get('type') || 'tcp', // Default network type
            security: url.searchParams.get('security') || 'none', // Default security
        }
    };

    try { // Wrap protocol-specific parsing in a try-catch for unexpected errors
        switch (protocol) {
            case 'vless':
                if (!url.username) return { success: false, error: "Invalid VLESS link: User ID (UUID) is missing." };
                if (!url.hostname) return { success: false, error: "Invalid VLESS link: Address (hostname) is missing." };
                if (!url.port) return { success: false, error: "Invalid VLESS link: Port is missing." };

                outbound.settings.vnext = [{
                    address: url.hostname,
                    port: +url.port,
                    users: [{
                        id: url.username, // UUID
                        encryption: url.searchParams.get('encryption') || 'none',
                        flow: url.searchParams.get('flow') || undefined
                    }]
                }];
                // VLESS specific stream settings from URL parameters
                // network and security are already pre-filled from searchParams or defaulted
                if (outbound.streamSettings.security === 'tls' || outbound.streamSettings.security === 'xtls') {
                    outbound.streamSettings.tlsSettings = {
                        serverName: url.searchParams.get('sni') || url.searchParams.get('host') || url.hostname,
                        allowInsecure: (url.searchParams.get('allowInsecure') === '1' || url.searchParams.get('allowInsecure') === 'true'),
                    };
                    if (url.searchParams.get('fp')) {
                        outbound.streamSettings.tlsSettings.fingerprint = url.searchParams.get('fp');
                    }
                    const alpnParamVless = url.searchParams.get('alpn');
                    if (alpnParamVless) {
                        outbound.streamSettings.tlsSettings.alpn = alpnParamVless.split(',').map(s => s.trim()).filter(Boolean);
                    }
                    if (url.searchParams.get('pbk')) {
                        outbound.streamSettings.tlsSettings.publicKey = url.searchParams.get('pbk');
                    }
                    if (url.searchParams.get('sid')) {
                        outbound.streamSettings.tlsSettings.shortId = url.searchParams.get('sid');
                    }
                }
                break;
            case 'trojan':
                if (!url.password && !url.username) return { success: false, error: "Invalid Trojan link: Password is missing." };
                if (!url.hostname) return { success: false, error: "Invalid Trojan link: Address (hostname) is missing." };
                if (!url.port) return { success: false, error: "Invalid Trojan link: Port is missing." };

                outbound.settings.servers = [{
                    address: url.hostname,
                    port: +url.port,
                    password: url.password || url.username
                }];
                // Trojan specific stream settings
                if (outbound.streamSettings.security === 'tls') {
                    outbound.streamSettings.tlsSettings = {
                        serverName: url.searchParams.get('sni') || url.searchParams.get('host') || url.hostname,
                        allowInsecure: (url.searchParams.get('allowInsecure') === '1' || url.searchParams.get('allowInsecure') === 'true'),
                    };
                    const alpnParamTrojan = url.searchParams.get('alpn');
                    if (alpnParamTrojan) {
                        outbound.streamSettings.tlsSettings.alpn = alpnParamTrojan.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                break;
            case 'vmess':
                let decoded;
                try {
                    const b64decoded = Buffer.from(link.substring(8), 'base64').toString('utf-8');
                    decoded = JSON.parse(b64decoded);
                } catch (e) {
                    return { success: false, error: `Invalid VMess link: Base64/JSON parsing failed - ${e.message}` };
                }

                if (!decoded.add) return { success: false, error: "Invalid VMess link: Address (add) is missing in JSON." };
                if (!decoded.port) return { success: false, error: "Invalid VMess link: Port (port) is missing in JSON." };
                if (!decoded.id) return { success: false, error: "Invalid VMess link: User ID (id) is missing in JSON." };

                outbound.settings.vnext = [{
                    address: decoded.add,
                    port: +decoded.port,
                    users: [{
                        id: decoded.id,
                        alterId: decoded.aid !== undefined ? +decoded.aid : 0,
                        security: decoded.scy || 'auto',
                        level: decoded.level !== undefined ? +decoded.level : 0
                    }]
                }];
                // VMess specific stream settings from the JSON object
                outbound.streamSettings.network = decoded.net || 'tcp';
                outbound.streamSettings.security = decoded.tls === 'tls' ? 'tls' : 'none';

                if (outbound.streamSettings.security === 'tls') {
                    outbound.streamSettings.tlsSettings = {
                        serverName: decoded.sni || decoded.host || decoded.add,
                        allowInsecure: (decoded.allowInsecure === true || decoded.allowInsecure === '1' || decoded.verify_certificate === false),
                    };
                    if (decoded.alpn) {
                        outbound.streamSettings.tlsSettings.alpn = decoded.alpn.split(',').map(s => s.trim()).filter(Boolean);
                    }
                    if (decoded.fp) {
                        outbound.streamSettings.tlsSettings.fingerprint = decoded.fp;
                    }
                }
                // Transport specific settings
                if (outbound.streamSettings.network === 'ws') {
                    outbound.streamSettings.wsSettings = {
                        path: decoded.path || '/',
                        headers: { Host: decoded.host || decoded.add }
                    };
                } else if (outbound.streamSettings.network === 'tcp' && decoded.type === 'http') { // HTTP Obfuscation
                    outbound.streamSettings.tcpSettings = {
                        header: {
                            type: 'http',
                            request: {
                                path: (decoded.path && Array.isArray(decoded.path)) ? decoded.path : (decoded.path ? [decoded.path] : ["/"]),
                                headers: {
                                    Host: (decoded.host && Array.isArray(decoded.host)) ? decoded.host : (decoded.host ? [decoded.host] : [decoded.add])
                                }
                            }
                        }
                    };
                } else if (outbound.streamSettings.network === 'kcp' || outbound.streamSettings.network === 'mkcp') {
                    outbound.streamSettings.kcpSettings = {
                        mtu: decoded.mtu !== undefined ? +decoded.mtu : 1350,
                        tti: decoded.tti !== undefined ? +decoded.tti : 50,
                        uplinkCapacity: decoded.uplinkCapacity !== undefined ? +decoded.uplinkCapacity : 5,
                        downlinkCapacity: decoded.downlinkCapacity !== undefined ? +decoded.downlinkCapacity : 20,
                        congestion: decoded.congestion === true || decoded.congestion === 'true', // Ensure boolean
                        readBufferSize: decoded.readBufferSize !== undefined ? +decoded.readBufferSize : 2,
                        writeBufferSize: decoded.writeBufferSize !== undefined ? +decoded.writeBufferSize : 2,
                        header: { type: decoded.headerType || 'none' },
                        seed: decoded.seed || undefined
                    };
                } else if (outbound.streamSettings.network === 'quic') {
                    outbound.streamSettings.quicSettings = {
                        security: decoded.quicSecurity || 'none',
                        key: decoded.quicKey || '',
                        header: { type: decoded.headerType || 'none' }
                    };
                } else if (outbound.streamSettings.network === 'grpc') {
                     outbound.streamSettings.grpcSettings = {
                        serviceName: decoded.path || decoded.serviceName || "",
                        multiMode: decoded.mode === 'multi' || decoded.multiMode === true // check for multiMode
                    };
                }
                break;
            case 'ss':
                const firstHashIdx = link.indexOf('#');
                // Ensure linkContent is correctly extracted even if # is not present
                const linkContent = link.substring(5, firstHashIdx > -1 ? firstHashIdx : link.length);

                const atSymbolIdx = linkContent.lastIndexOf('@');
                if (atSymbolIdx === -1) return { success: false, error: "Invalid Shadowsocks link: Missing '@' separator between user_info and server_info." };

                const userInfo = linkContent.substring(0, atSymbolIdx);
                const serverInfo = linkContent.substring(atSymbolIdx + 1);

                let decodedCredentials;
                try {
                    // Attempt to decode Base64 user info part first
                    let tempDecoded = Buffer.from(decodeURIComponent(userInfo), 'base64').toString('utf-8');
                    decodedCredentials = tempDecoded.split(':');
                    if (decodedCredentials.length < 2) { // method:password
                        // If split results in less than 2 parts, it might not be base64 or malformed
                        // Fallback to plain (non-base64) decoding
                        throw new Error("Potentially not Base64 or malformed.");
                    }
                } catch (e) {
                     // If base64 decoding fails or indicates non-base64, try plain split
                    decodedCredentials = decodeURIComponent(userInfo).split(':');
                    if (decodedCredentials.length < 2) {
                        return { success: false, error: `Invalid Shadowsocks link: Credentials (method:password) are malformed. Error: ${e.message}` };
                    }
                }

                const method = decodedCredentials[0];
                const password = decodedCredentials.slice(1).join(':'); // Handle passwords with colons

                const portSeparatorIdx = serverInfo.lastIndexOf(':');
                if (portSeparatorIdx === -1) return { success: false, error: "Invalid Shadowsocks link: Server info (address:port) is malformed." };

                const address = serverInfo.substring(0, portSeparatorIdx);
                const portStr = serverInfo.substring(portSeparatorIdx + 1);

                if (!address) return { success: false, error: "Invalid Shadowsocks link: Address is missing." };
                const parsedPort = parseInt(portStr, 10);
                if (!portStr || isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
                    return { success: false, error: "Invalid Shadowsocks link: Port is invalid or missing." };
                }

                outbound.settings.servers = [{
                    address,
                    port: parsedPort,
                    method: method,
                    password: password
                }];
                outbound.streamSettings = { network: 'tcp', security: 'none' }; // SS typically defaults to TCP
                break;
            default:
                return { success: false, error: `Unsupported protocol: ${protocol}` };
        }

        // Apply common stream settings from URL parameters if not already handled by protocol specific logic (e.g. VMess JSON)
        // This is primarily for VLESS and Trojan if they use URL query parameters for these.
        if (protocol === 'vless' || protocol === 'trojan') {
            // network and security are already pre-filled from searchParams or defaulted.
            // This section refines them or adds transport-specific settings like wsSettings, grpcSettings.

            if (outbound.streamSettings.security === 'tls' || outbound.streamSettings.security === 'xtls') {
                // tlsSettings might have been partially initialized by VLESS/Trojan specific logic.
                // Ensure all relevant params are captured.
                outbound.streamSettings.tlsSettings = outbound.streamSettings.tlsSettings || {};
                outbound.streamSettings.tlsSettings.serverName = url.searchParams.get('sni') || url.searchParams.get('host') || outbound.streamSettings.tlsSettings.serverName || outbound.settings.vnext?.[0]?.address || outbound.settings.servers?.[0]?.address || url.hostname;
                outbound.streamSettings.tlsSettings.allowInsecure = (url.searchParams.get('allowInsecure') === '1' || url.searchParams.get('allowInsecure') === 'true') || outbound.streamSettings.tlsSettings.allowInsecure || false;

                const alpnParamCommon = url.searchParams.get('alpn');
                if (alpnParamCommon) outbound.streamSettings.tlsSettings.alpn = alpnParamCommon.split(',').map(s => s.trim()).filter(Boolean);

                const fpParam = url.searchParams.get('fp');
                if (fpParam) outbound.streamSettings.tlsSettings.fingerprint = fpParam;
            }

            if (outbound.streamSettings.network === 'ws') {
                outbound.streamSettings.wsSettings = outbound.streamSettings.wsSettings || {};
                outbound.streamSettings.wsSettings.path = url.searchParams.get('path') || '/';
                let hostHeader = url.searchParams.get('host'); // 'host' param for WebSocket Host header
                if (hostHeader) {
                    outbound.streamSettings.wsSettings.headers = { Host: hostHeader };
                } else if (outbound.settings.vnext?.[0]?.address) {
                     outbound.streamSettings.wsSettings.headers = { Host: outbound.settings.vnext[0].address };
                } else if (outbound.settings.servers?.[0]?.address) {
                    outbound.streamSettings.wsSettings.headers = { Host: outbound.settings.servers[0].address };
                } else {
                    outbound.streamSettings.wsSettings.headers = { Host: url.hostname };
                }
            } else if (outbound.streamSettings.network === 'grpc') {
                outbound.streamSettings.grpcSettings = outbound.streamSettings.grpcSettings || {};
                outbound.streamSettings.grpcSettings.serviceName = url.searchParams.get('serviceName') || url.searchParams.get('path') || ''; // 'path' can also be used for serviceName
                if (url.searchParams.get('mode') === 'multi' || url.searchParams.get('multiMode') === 'true') {
                    outbound.streamSettings.grpcSettings.multiMode = true;
                }
            }
            // TODO: Add other transport types like httpupgrade, kcp, quic if they are commonly configured via URL params for VLESS/Trojan
        }

        return {
            success: true,
            config: {
                log: { loglevel: 'warning' },
                inbounds: [{
                    port: port,
                    listen: '127.0.0.1',
                    protocol: 'socks',
                    settings: {
                        auth: 'noauth',
                        udp: true,
                        ip: '127.0.0.1'
                    }
                }],
                outbounds: [outbound]
            }
        };
    } catch (e) {
        // This top-level catch handles unexpected errors during protocol-specific parsing.
        console.error(`Critical Config Parse Error for link "${link}" during protocol ${protocol} processing:`, e.message, e.stack);
        return { success: false, error: `Error parsing ${protocol} config: ${e.message}` };
    }
}
