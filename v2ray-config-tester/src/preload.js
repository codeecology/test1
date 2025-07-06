const { contextBridge, ipcRenderer } = require('electron');

// یک API امن برای ارتباط بین پردازه رندر و پردازه اصلی ایجاد می‌کنیم
contextBridge.exposeInMainWorld('api', {
    // Data Management
    getAllData: () => ipcRenderer.invoke('data:get-all'),
    saveAllData: (data) => ipcRenderer.send('data:save-all', data),
    clearAllData: () => ipcRenderer.invoke('data:clear-all'),

    // File System & Dialogs
    importTextFile: () => ipcRenderer.invoke('file:import-text'),
    importJsonFile: () => ipcRenderer.invoke('file:import-json'),
    exportFile: (options) => ipcRenderer.invoke('file:export', options),

    // Network & QR
    fetchSubscription: (url) => ipcRenderer.invoke('network:fetch-sub', url),
    generateQRCode: (link) => ipcRenderer.invoke('qr:generate', link),
    getCountry: (hostname) => ipcRenderer.invoke('system:get-country', hostname), // Added missing function

    // Testing
    // Unified startTests: data should include { configs, settings, testType, groupId }
    startTests: (data) => ipcRenderer.send('test:start', data),
    stopTests: () => ipcRenderer.send('test:stop'),
    onTestResult: (callback) => ipcRenderer.on('test:result', (_event, ...args) => callback(...args)),
    onTestProgress: (callback) => ipcRenderer.on('test:progress', (_event, ...args) => callback(...args)),
    onTestFinish: (callback) => ipcRenderer.on('test:finish', (_event, ...args) => callback(...args)),

    // Proxy Connection
    connectProxy: (link) => ipcRenderer.send('proxy:connect', link),
    disconnectProxy: () => ipcRenderer.send('proxy:disconnect'),
    onProxyStatusChange: (callback) => ipcRenderer.on('proxy:status', (_event, ...args) => callback(...args)),
    // FEATURE: Live Ping (Idea #2)
    onProxyLivePingResult: (callback) => ipcRenderer.on('proxy:live-ping-result', (_event, ...args) => callback(...args)),
    // FEATURE: Config Details Panel (Idea #7)
    getFullConfigDetails: (link) => ipcRenderer.invoke('config:get-full-details', link),

    // Listen for menu actions
    onMenuAction: (callback) => ipcRenderer.on('menu-action', (_event, action) => callback(action)),

    // Get app environment
    getIsDev: () => ipcRenderer.invoke('app:get-is-dev'),
});
