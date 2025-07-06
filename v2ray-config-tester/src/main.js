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
        // if (isDev) mainWindow.webContents.openDevTools(); // Keep DevTools closed by default, can be opened via View menu
    });

    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    // Create Application Menu
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Add Config...',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow.webContents.send('menu-action', 'open-add-config-modal')
                },
                {
                    label: 'Import Data (JSON)...',
                    click: () => mainWindow.webContents.send('menu-action', 'open-import-data-modal')
                },
                {
                    label: 'Export Data (JSON)...',
                    click: () => mainWindow.webContents.send('menu-action', 'open-export-data-modal')
                },
                { type: 'separator' },
                {
                    label: 'Settings...',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => mainWindow.webContents.send('menu-action', 'open-settings-modal')
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Theme',
                    click: () => mainWindow.webContents.send('menu-action', 'toggle-theme')
                },
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Ultimate V2Ray Tester',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Ultimate V2Ray Tester',
                            message: `Ultimate V2Ray Tester\nVersion: ${app.getVersion()}\n\nAn Electron application for testing V2Ray configurations.`,
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    // On macOS, add an empty first menu item for app-specific actions like "About", "Hide", etc.
    if (process.platform === 'darwin') {
        menuTemplate.unshift({
            label: app.getName(), // Or app.name on older Electron versions
            submenu: [
                { role: 'about' }, // This will use the 'About' from Help menu if not defined here, or a default one
                { type: 'separator' },
                { role: 'services', submenu: [] },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
        // Correct "About" role for macOS if a custom one is in Help menu
        // Find the custom About menu item and assign it to the app menu's 'about' role
        const helpMenu = menuTemplate.find(m => m.label === 'Help');
        if (helpMenu && helpMenu.submenu[0] && helpMenu.submenu[0].label.includes('About')) {
            const aboutItem = helpMenu.submenu[0];
            // Ensure the app menu 'about' role points to our custom dialog
             menuTemplate[0].submenu.find(item => item.role === 'about').click = aboutItem.click;
        }

    }


    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

// FEATURE: System Tray
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
    if (isDev) console.log(`[system:get-country] Received hostname: ${hostname}`);
    if (!hostname || typeof hostname !== 'string') {
        if (isDev) console.warn(`[system:get-country] Invalid hostname received: ${hostname}. Returning 'XX'.`);
        return 'XX';
    }
    try {
        const { address, family } = await dns.lookup(hostname);
        if (isDev) console.log(`[system:get-country] DNS lookup for ${hostname}: IP Address = ${address}, Family = ${family}`);

        // ip-country might not support IPv6 well, or hostnames that resolve to IPv6 first.
        // Let's prefer IPv4 if available, or check what ipCountry supports.
        // For now, we use what dns.lookup gives by default.

        const countryData = ipCountry.lookup(address); // 'address' (the IP) is passed to ip-country

        if (countryData && typeof countryData.country === 'string' && countryData.country.length === 2 && countryData.country.toUpperCase() !== 'XX') {
            if (isDev) console.log(`[system:get-country] ipCountry.lookup for ${address} (from ${hostname}): Found country = ${countryData.country.toUpperCase()}`);
            return countryData.country.toUpperCase(); // Standardize to uppercase
        } else {
            if (isDev) console.warn(`[system:get-country] ipCountry.lookup for ${address} (from ${hostname}): No valid 2-letter country code found. Data:`, countryData);
            return 'XX';
        }
    } catch (error) {
        // Keep this console.warn as it indicates a potentially user-impactful failure (country not found)
        console.warn(`[system:get-country] DNS lookup failed for hostname "${hostname}": ${error.message}. Returning 'XX'.`);
        return 'XX'; // Return a placeholder on error
    }
});

// --- Advanced Testing Engine ---

// Helper function to manage Xray process for a single test
async function runXrayTest(config, settings, testType, port, testLogicCallback) {
    const genConfigResponse = generateTempConfig(config.link, port);
    if (!genConfigResponse.success) {
        return { success: false, error: genConfigResponse.error };
    }
    const configPath = genConfigResponse.path;
    let xrayProcess;

    try {
        xrayProcess = spawn(xrayPath, ['run', '-c', configPath]);
        activeTestProcesses.set(config.id + '_' + testType, xrayProcess); // Unique key for active processes

        // Error handling for spawn itself
        await new Promise((resolve, reject) => { // Wrap spawn and startup in a promise
            xrayProcess.on('error', (spawnError) => {
                console.error(`Failed to start Xray for ${testType} test (config ${config.id}):`, spawnError);
                reject(new Error(`Xray start error: ${spawnError.message}`));
            });

            // Wait for Xray to signal it has started
            const xrayStartTimeoutMs = settings.testTimeout > 5 ? (settings.testTimeout * 1000 / 2) : 5000;
            const startupTimeoutId = setTimeout(() => {
                reject(new Error(`Xray startup timeout for ${testType} test`));
            }, xrayStartTimeoutMs);

            let outputBuffer = '';
            const onData = (data) => {
                outputBuffer += data.toString();
                if (isDev && testType !== 'main_connection') console.log(`Xray stdout (${testType}, config ${config.id}, port ${port}): ${data.toString().trim()}`);
                if (/Xray.*started/i.test(outputBuffer)) {
                    clearTimeout(startupTimeoutId);
                    xrayProcess.stdout.removeListener('data', onData);
                    resolve();
                }
            };
            xrayProcess.stdout.on('data', onData);

            xrayProcess.once('exit', (code, signal) => {
                clearTimeout(startupTimeoutId);
                xrayProcess.stdout.removeListener('data', onData);
                if (!/Xray.*started/i.test(outputBuffer)) { // If exited before starting properly
                    reject(new Error(`Xray exited prematurely (${testType}, code ${code}, signal ${signal})`));
                }
            });
        });

        // If Xray started successfully, execute the specific test logic
        const agent = new SocksProxyAgent(`socks5://127.0.0.1:${port}`);
        const testResult = await testLogicCallback(agent, settings);
        return { success: true, ...testResult };

    } catch (error) {
        // This catches errors from spawn, startup promise, or testLogicCallback
        return { success: false, error: error.message || `General error in ${testType} test` };
    } finally {
        if (xrayProcess && !xrayProcess.killed) {
            xrayProcess.kill();
        }
        if (configPath) {
            fs.unlink(configPath, (err) => {
                if (err) console.error(`Failed to delete temp config for ${testType} test '${configPath}':`, err);
            });
        }
        activeTestProcesses.delete(config.id + '_' + testType);
    }
}


const isTesting = () => activeTestProcesses.size > 0;

ipcMain.on('test:start', (event, { configs, settings }) => {
    if (isTesting()) { // Basic check, more granular control might be needed if multiple test types can run
        const isStandardTestRunning = Array.from(activeTestProcesses.keys()).some(key => key.endsWith('_standard'));
        if (isStandardTestRunning) {
            console.warn("[Main] Standard test is already running.");
            return;
        }
    }
    let configsToTest = [...configs];
    let completedCount = 0;
    const totalToTest = configsToTest.length;

    mainWindow.webContents.send('test:progress', { progress: 0, total: totalToTest, completed: 0 });


    const runSingleStandardTest = async (config) => {
        const port = 11000 + Math.floor(Math.random() * 10000); // Port range for standard tests

        const result = await runXrayTest(config, settings, 'standard', port, async (agent, currentSettings) => {
            const startTime = Date.now();
            const response = await axios.get(currentSettings.testUrl, {
                httpAgent: agent, httpsAgent: agent, timeout: currentSettings.testTimeout * 1000
            });
            if (response.status >= 200 && response.status < 300) {
                return { delay: Date.now() - startTime };
            } else {
                return { delay: -1, error: `Status ${response.status}` };
            }
        });

        if (result.success) {
            mainWindow.webContents.send('test:result', { id: config.id, delay: result.delay, error: result.error, testType: 'standard' });
        } else {
            mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: result.error, testType: 'standard' });
        }

        completedCount++;
        mainWindow.webContents.send('test:progress', { progress: (completedCount / totalToTest) * 100, total: totalToTest, completed: completedCount });
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

// IPC Handler for Real Delay Test (Phase 2 - Network Logic)
ipcMain.on('test:real-delay', async (event, { configs, settings }) => {
    if (isDev) {
        console.log(`[Main] Received 'test:real-delay' for ${configs.length} configs.`);
        console.log('[Main] Real Delay Test Settings:', settings.realDelayTestUrl, settings.realDelayTestPings, settings.realDelayTestTimeout);
    }

    const { realDelayTestUrl, realDelayTestPings, realDelayTestTimeout } = settings;
    let completedCount = 0;
    const totalToTest = configs.length;
    mainWindow.webContents.send('test:progress', { progress: 0, total: totalToTest, completed: 0 });

    const runSingleRealDelayTest = async (config) => {
        const port = 21000 + Math.floor(Math.random() * 10000); // Port range for real delay tests

        const result = await runXrayTest(config, settings, 'real-delay', port, async (agent, currentSettings) => {
            let totalDelay = 0;
            let successfulPings = 0;
            let firstError = null;

            for (let i = 0; i < currentSettings.realDelayTestPings; i++) {
                const startTime = Date.now();
                try {
                    await axios.head(currentSettings.realDelayTestUrl, {
                        httpAgent: agent, httpsAgent: agent, timeout: currentSettings.realDelayTestTimeout
                    });
                    totalDelay += (Date.now() - startTime);
                    successfulPings++;
                } catch (pingError) {
                    if (isDev) console.warn(`Real delay ping ${i + 1} failed for ${config.name}: ${pingError.message}`);
                    if (!firstError) firstError = pingError.message || 'Ping failed';
                }
                if (i < currentSettings.realDelayTestPings - 1) await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (successfulPings > 0) {
                return { delay: Math.round(totalDelay / successfulPings) };
            } else {
                return { delay: -1, error: firstError || 'All pings failed' };
            }
        });

        if (result.success) {
            mainWindow.webContents.send('test:result', { id: config.id, delay: result.delay, error: result.error, testType: 'real-delay' });
        } else {
            mainWindow.webContents.send('test:result', { id: config.id, delay: -1, error: result.error, testType: 'real-delay' });
        }

        completedCount++;
        mainWindow.webContents.send('test:progress', { progress: (completedCount / totalToTest) * 100, total: totalToTest, completed: completedCount });
        if (completedCount === totalToTest) {
            mainWindow.webContents.send('test:finish');
            if(isDev) console.log("[Main] Real Delay Test sequence finished.");
        }
    };

    (async () => {
        for (const config of configs) {
            if (!isTesting()) { // Check if main testing flag was turned off (e.g. by stopAllTests)
                console.log("[Main] Real delay test loop interrupted by stop signal.");
                break;
            }
            await runSingleRealDelayTest(config);
        }
    })();
});

ipcMain.on('test:speed', async (event, { configs, settings }) => {
    if (isDev) {
        console.log(`[Main] Received 'test:speed' for ${configs.length} configs.`);
        console.log('[Main] Speed Test Settings:', settings.speedTestFileUrl);
    }
    let completedCount = 0;
    const totalToTest = configs.length;
    mainWindow.webContents.send('test:progress', { progress: 0, total: totalToTest, completed: 0 });

    const runSingleSpeedTest = async (config) => {
        const port = 31000 + Math.floor(Math.random() * 10000); // Port range for speed tests

        const result = await runXrayTest(config, settings, 'speed', port, async (agent, currentSettings) => {
            const startTime = Date.now();
            let fileSize = 0;
            try {
                const response = await axios.get(currentSettings.speedTestFileUrl, {
                    httpAgent: agent, httpsAgent: agent,
                    responseType: 'arraybuffer',
                    timeout: currentSettings.testTimeout * 1000 * 2, // Longer timeout for speed test
                    onDownloadProgress: (progressEvent) => {
                        if (progressEvent.total) fileSize = progressEvent.total;
                        else if (progressEvent.loaded) fileSize = progressEvent.loaded;
                    }
                });
                const endTime = Date.now();
                const durationSeconds = (endTime - startTime) / 1000;
                if (!fileSize && response.data) fileSize = response.data.byteLength;

                if (durationSeconds > 0 && fileSize > 0) {
                    const speedBps = (fileSize * 8) / durationSeconds;
                    const speedMbps = (speedBps / (1024 * 1024)).toFixed(2);
                    return { downloadSpeed: parseFloat(speedMbps) };
                } else {
                    throw new Error('Invalid duration or file size.');
                }
            } catch (dlError) {
                if (isDev) console.warn(`Speed test download failed for ${config.name}: ${dlError.message}`);
                return { downloadSpeed: -1, error: dlError.message || 'Download failed' };
            }
        });

        if (result.success) {
            mainWindow.webContents.send('test:result', { id: config.id, downloadSpeed: result.downloadSpeed, error: result.error, testType: 'speed' });
        } else {
            mainWindow.webContents.send('test:result', { id: config.id, downloadSpeed: -1, error: result.error, testType: 'speed' });
        }

        completedCount++;
        mainWindow.webContents.send('test:progress', { progress: (completedCount / totalToTest) * 100, total: totalToTest, completed: completedCount });
        if (completedCount === totalToTest) {
            mainWindow.webContents.send('test:finish');
            if(isDev) console.log("[Main] Speed Test sequence finished.");
        }
    };

    (async () => {
        for (const config of configs) {
            if (!isTesting()) {
                console.log("[Main] Speed test loop interrupted by stop signal.");
                break;
            }
            await runSingleSpeedTest(config);
        }
    })();
});


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
        if (isDev) console.log(`Xray stdout (Connection Process): ${output}`); // For debugging Xray startup messages
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
                console.error(enableErrorMsg); // Keep this error as it's critical for functionality
                if (stderr) console.error(`Enable proxy stderr: ${stderr}`); // Keep this too
                reject(new Error(enableErrorMsg));
                return;
            }
            if (isDev) console.log(`System proxy enabled: ${stdout}`);
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
                if (stderr) console.warn(`Disable proxy stderr: ${stderr}`); // Keep this warn
                // Resolve still, as failing to disable (especially if already disabled) is often non-critical for app shutdown.
                // If strict error handling is needed, this could be a reject.
                resolve();
                return;
            }
            if (isDev) console.log(`System proxy disabled: ${stdout}`);
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
    } catch (writeError) { // Changed variable name for clarity
        console.error(`Failed to write temporary config file '${tempConfigPath}':`, writeError);
        return { success: false, error: `Failed to write temp config file: ${writeError.message}` };
    }
}

function parseConfigLink(link, port) { // port argument is for the inbound SOCKS proxy, not from the config link itself.
    if (!link || typeof link !== 'string' || link.trim() === '') {
        console.warn('parseConfigLink received an empty or invalid link string.');
        return { success: false, error: "Config link is empty or invalid." };
    }

    let url;
    try {
        url = new URL(link);
    } catch (e) {
        // This catch handles fundamentally invalid URL structures before protocol-specific parsing
        // console.error is important here as it's a config processing error.
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
                if (!url.username) {
                    console.error(`Parse Error (VLESS): User ID (UUID) is missing in link: ${link}`);
                    return { success: false, error: "Invalid VLESS link: User ID (UUID) is missing." };
                }
                if (!url.hostname) return { success: false, error: "Invalid VLESS link: Address (hostname) is missing." };
                if (!url.port) return { success: false, error: "Invalid VLESS link: Port is missing." };

                outbound.settings.vnext = [{
                    address: url.hostname,
                    port: +url.port,
                    users: [{
                        id: url.username, // UUID
                        encryption: url.searchParams.get('encryption') || 'none',
                        flow: url.searchParams.get('flow') || undefined // Keep undefined if not present
                    }]
                }];
                // VLESS specific stream settings
                if (outbound.streamSettings.security === 'tls' || outbound.streamSettings.security === 'xtls') {
                    outbound.streamSettings.tlsSettings = {
                        serverName: url.searchParams.get('sni') || url.searchParams.get('host') || url.hostname, // SNI is critical
                        allowInsecure: (url.searchParams.get('allowInsecure') === '1' || url.searchParams.get('allowInsecure') === 'true') || false, // Default to false
                    };
                    const fp = url.searchParams.get('fp');
                    if (fp) outbound.streamSettings.tlsSettings.fingerprint = fp;

                    const alpn = url.searchParams.get('alpn');
                    if (alpn) outbound.streamSettings.tlsSettings.alpn = alpn.split(',').map(s => s.trim()).filter(Boolean);

                    const pbk = url.searchParams.get('pbk');
                    if (pbk) outbound.streamSettings.tlsSettings.publicKey = pbk;

                    const sid = url.searchParams.get('sid');
                    if (sid) outbound.streamSettings.tlsSettings.shortId = sid;

                    // REALITY settings (often use xtls security)
                    if (outbound.streamSettings.security === 'xtls' && url.searchParams.get('publicKey')) { // Assuming 'publicKey' indicates REALITY
                         outbound.streamSettings.realitySettings = { // Xray uses realitySettings under streamSettings
                            serverName: outbound.streamSettings.tlsSettings.serverName, // SNI might be reused or a specific one for REALITY
                            fingerprint: fp || 'chrome', // Default fingerprint if not provided
                            shortId: sid || '',
                            publicKey: pbk || '', // publicKey is essential for REALITY
                            spiderX: url.searchParams.get('spiderX') || '/',
                         };
                         // For REALITY, tlsSettings might not be strictly needed by Xray core if realitySettings is present and complete
                         // but some clients might still populate them. Keeping tlsSettings for now.
                    }
                }
                break;
            case 'trojan':
                if (!url.password && !url.username) {
                    console.error(`Parse Error (Trojan): Password is missing in link: ${link}`);
                    return { success: false, error: "Invalid Trojan link: Password is missing." };
                }
                if (!url.hostname) {
                     console.error(`Parse Error (Trojan): Address (hostname) is missing in link: ${link}`);
                    return { success: false, error: "Invalid Trojan link: Address (hostname) is missing." };
                }
                if (!url.port) {
                    console.error(`Parse Error (Trojan): Port is missing in link: ${link}`);
                    return { success: false, error: "Invalid Trojan link: Port is missing." };
                }

                outbound.settings.servers = [{
                    address: url.hostname,
                    port: +url.port,
                    password: url.password || url.username // Prefer password, fallback to username for trojan password
                }];
                // Trojan specific stream settings
                if (outbound.streamSettings.security === 'tls') {
                    outbound.streamSettings.tlsSettings = {
                        serverName: url.searchParams.get('sni') || url.searchParams.get('host') || url.hostname, // SNI is critical
                        allowInsecure: (url.searchParams.get('allowInsecure') === '1' || url.searchParams.get('allowInsecure') === 'true') || false, // Default to false
                    };
                    const alpn = url.searchParams.get('alpn');
                    if (alpn) outbound.streamSettings.tlsSettings.alpn = alpn.split(',').map(s => s.trim()).filter(Boolean);

                    // Trojan doesn't typically use fp, pbk, sid for standard TLS, but if they were present for some reason:
                    const fp = url.searchParams.get('fp');
                    if (fp) outbound.streamSettings.tlsSettings.fingerprint = fp;
                }
                break;
            case 'vmess':
                let decodedVmessJson;
                try {
                    const b64decoded = Buffer.from(link.substring(8), 'base64').toString('utf-8');
                    decodedVmessJson = JSON.parse(b64decoded);
                } catch (e) {
                    console.error(`Parse Error (VMess): Base64/JSON parsing failed for link ${link}: ${e.message}`);
                    return { success: false, error: `Invalid VMess link: Base64/JSON parsing failed - ${e.message}` };
                }

                if (!decodedVmessJson.add) {
                     console.error(`Parse Error (VMess): Address (add) is missing in JSON for link: ${link}`);
                    return { success: false, error: "Invalid VMess link: Address (add) is missing in JSON." };
                }
                if (!decodedVmessJson.port) {
                    console.error(`Parse Error (VMess): Port (port) is missing in JSON for link: ${link}`);
                    return { success: false, error: "Invalid VMess link: Port (port) is missing in JSON." };
                }
                if (!decodedVmessJson.id) {
                    console.error(`Parse Error (VMess): User ID (id) is missing in JSON for link: ${link}`);
                    return { success: false, error: "Invalid VMess link: User ID (id) is missing in JSON." };
                }

                outbound.settings.vnext = [{
                    address: decodedVmessJson.add,
                    port: +decodedVmessJson.port,
                    users: [{
                        id: decodedVmessJson.id,
                        alterId: decodedVmessJson.aid !== undefined ? +decodedVmessJson.aid : 0,
                        security: decodedVmessJson.scy || 'auto', // 'security' is the Xray field, 'scy' is common in links
                        level: decodedVmessJson.level !== undefined ? +decodedVmessJson.level : 0
                    }]
                }];
                // VMess specific stream settings from the JSON object
                outbound.streamSettings.network = decodedVmessJson.net || 'tcp';
                outbound.streamSettings.security = decodedVmessJson.tls === 'tls' ? 'tls' : 'none';

                if (outbound.streamSettings.security === 'tls') {
                    outbound.streamSettings.tlsSettings = {
                        serverName: decodedVmessJson.sni || decodedVmessJson.host || decodedVmessJson.add, // SNI is critical
                        allowInsecure: (decodedVmessJson.allowInsecure === true || decodedVmessJson.allowInsecure === '1' || decodedVmessJson.verify_certificate === false) || false, // Default to false
                    };
                    if (decodedVmessJson.alpn) {
                        outbound.streamSettings.tlsSettings.alpn = decodedVmessJson.alpn.split(',').map(s => s.trim()).filter(Boolean);
                    }
                    if (decodedVmessJson.fp) {
                        outbound.streamSettings.tlsSettings.fingerprint = decodedVmessJson.fp;
                    }
                    // REALITY for VMess (less common but possible)
                    if (decodedVmessJson.publicKey && decodedVmessJson.shortId) { // Basic check for REALITY fields
                        outbound.streamSettings.realitySettings = {
                           serverName: outbound.streamSettings.tlsSettings.serverName,
                           fingerprint: decodedVmessJson.fp || 'chrome',
                           shortId: decodedVmessJson.shortId,
                           publicKey: decodedVmessJson.publicKey,
                           spiderX: decodedVmessJson.spiderX || '/',
                        };
                         outbound.streamSettings.security = 'reality'; // Explicitly set security to reality
                    }
                }
                // Transport specific settings
                if (outbound.streamSettings.network === 'ws') {
                    outbound.streamSettings.wsSettings = {
                        path: decodedVmessJson.path || '/',
                        headers: { Host: decodedVmessJson.host || decodedVmessJson.add }
                    };
                } else if (outbound.streamSettings.network === 'tcp' && decodedVmessJson.type === 'http') { // HTTP Obfuscation
                    outbound.streamSettings.tcpSettings = {
                        header: {
                            type: 'http',
                            request: { // Ensure path and Host are arrays if they are provided as such
                                path: (decodedVmessJson.path && Array.isArray(decodedVmessJson.path)) ? decodedVmessJson.path : (decodedVmessJson.path ? [decodedVmessJson.path] : ["/"]),
                                headers: { // Host header for HTTP Obfuscation
                                    Host: (decodedVmessJson.host && Array.isArray(decodedVmessJson.host)) ? decodedVmessJson.host : (decodedVmessJson.host ? [decodedVmessJson.host] : [decodedVmessJson.add])
                                }
                            }
                        }
                    };
                } else if (outbound.streamSettings.network === 'kcp' || outbound.streamSettings.network === 'mkcp') { // 'mkcp' is often used in links
                    outbound.streamSettings.kcpSettings = {
                        mtu: decodedVmessJson.mtu !== undefined ? +decodedVmessJson.mtu : 1350,
                        tti: decodedVmessJson.tti !== undefined ? +decodedVmessJson.tti : 50,
                        uplinkCapacity: decodedVmessJson.uplinkCapacity !== undefined ? +decodedVmessJson.uplinkCapacity : 5,
                        downlinkCapacity: decodedVmessJson.downlinkCapacity !== undefined ? +decodedVmessJson.downlinkCapacity : 20,
                        congestion: decodedVmessJson.congestion === true || decodedVmessJson.congestion === 'true', // Ensure boolean
                        readBufferSize: decodedVmessJson.readBufferSize !== undefined ? +decodedVmessJson.readBufferSize : 2,
                        writeBufferSize: decodedVmessJson.writeBufferSize !== undefined ? +decodedVmessJson.writeBufferSize : 2,
                        header: { type: decodedVmessJson.headerType || decodedVmessJson.type || 'none' }, // 'type' is sometimes used for kcp headerType in links
                        seed: decodedVmessJson.seed || undefined
                    };
                } else if (outbound.streamSettings.network === 'quic') {
                    outbound.streamSettings.quicSettings = {
                        security: decodedVmessJson.quicSecurity || decodedVmessJson.host || 'none', // 'host' sometimes used as QUIC security name
                        key: decodedVmessJson.quicKey || decodedVmessJson.path || '', // 'path' sometimes used as QUIC key
                        header: { type: decodedVmessJson.headerType || decodedVmessJson.type ||'none' } // 'type' for QUIC header
                    };
                } else if (outbound.streamSettings.network === 'grpc') {
                     outbound.streamSettings.grpcSettings = {
                        serviceName: decodedVmessJson.path || decodedVmessJson.serviceName || "", // 'path' is often used as serviceName
                        multiMode: decodedVmessJson.mode === 'multi' || decodedVmessJson.multiMode === true // check for multiMode
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
                    decodedCredentials = tempDecoded.split(':'); // method:password format
                    if (decodedCredentials.length < 2) {
                        throw new Error("Decoded credentials part count less than 2, potentially not Base64 or malformed.");
                    }
                } catch (e) {
                     // If base64 decoding fails or indicates non-base64, try plain split
                    decodedCredentials = decodeURIComponent(userInfo).split(':');
                    if (decodedCredentials.length < 2) {
                        console.error(`Parse Error (SS): Credentials (method:password) are malformed for link ${link}. Error: ${e.message}`);
                        return { success: false, error: `Invalid Shadowsocks link: Credentials (method:password) are malformed. Error: ${e.message}` };
                    }
                }

                const method = decodedCredentials[0];
                const password = decodedCredentials.slice(1).join(':'); // Handle passwords that might contain colons

                const portSeparatorIdx = serverInfo.lastIndexOf(':');
                if (portSeparatorIdx === -1) {
                    console.error(`Parse Error (SS): Server info (address:port) is malformed for link: ${link}`);
                    return { success: false, error: "Invalid Shadowsocks link: Server info (address:port) is malformed." };
                }

                const address = serverInfo.substring(0, portSeparatorIdx);
                const portStr = serverInfo.substring(portSeparatorIdx + 1);

                if (!address) {
                    console.error(`Parse Error (SS): Address is missing for link: ${link}`);
                    return { success: false, error: "Invalid Shadowsocks link: Address is missing." };
                }
                const parsedPort = parseInt(portStr, 10);
                if (!portStr || isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
                     console.error(`Parse Error (SS): Port is invalid or missing for link: ${link}`);
                    return { success: false, error: "Invalid Shadowsocks link: Port is invalid or missing." };
                }

                outbound.settings.servers = [{
                    address, // Already decoded if it was percent-encoded in the original URL string
                    port: parsedPort,
                    method: method,
                    password: password
                }];
                outbound.streamSettings = { network: 'tcp', security: 'none' }; // SS typically defaults to TCP, no complex stream settings from URL.
                // Shadowsocks 2022 with AEAD ciphers might have some stream settings if used over transports,
                // but standard ss:// links usually don't encode these.
                break;
            default:
                console.warn(`Unsupported protocol encountered: ${protocol} for link: ${link}`);
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
