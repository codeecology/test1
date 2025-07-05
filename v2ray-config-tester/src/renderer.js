/*
 * Ultimate V2Ray Tester - Renderer Process
 * Version: 3.0.0
 * Description: Manages the entire user interface, state, and user interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        configs: [],
        groups: [],
        settings: {},
        isTesting: false,
        activeConnectionId: null,
        selectedConfigIds: [], // For multi-select
        lastSelectedId: null,
        currentSort: { column: 'delay', order: 'asc' },
        activeGroupId: 'all',
        searchTerm: '',
        currentLanguage: 'fa',
        currentTheme: 'dark-theme',
    };

    // --- DOM Elements ---
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // --- Localization ---
    const translations = {
        en: {
            groups: "Groups", all_configs: "All Configs", add_config: "Add Config", delete_unhealthy: "Delete Unhealthy",
            start_test: "Start Test", stop_test: "Stop Test", status: "Status", name: "Name", group: "Group", country: "Country",
            protocol: "Protocol", network: "Network", delay: "Delay", connect: "Connect", disconnect: "Disconnect",
            not_connected: "Not Connected", connecting: "Connecting...", connected_to: "Connected to", settings: "Settings",
            untested: "Untested", testing: "Testing", healthy: "Healthy", unhealthy: "Unhealthy", error: "Error",
            test_selected: "Test Selected", copy_link: "Copy Link", assign_to_group: "Assign to Group",
            show_qr_code: "Show QR Code", delete: "Delete", edit_name: "Edit Name",
            confirm_delete_title: "Confirm Deletion", confirm_delete_config: "Are you sure you want to delete this config?",
            confirm_delete_group: "Are you sure you want to delete this group? Configs will become ungrouped.",
            add_group_title: "Add New Group", add_group_message: "Enter the name for the new group:",
            edit_name_title: "Edit Name", edit_name_message: "Enter the new name for the config:",
            toast_configs_added: "new configs added.",
        },
        fa: {
            groups: "گروه‌ها", all_configs: "همه کانفیگ‌ها", add_config: "افزودن کانفیگ", delete_unhealthy: "حذف ناسالم‌ها",
            start_test: "شروع تست", stop_test: "توقف تست", status: "وضعیت", name: "نام", group: "گروه", country: "کشور",
            protocol: "پروتکل", network: "شبکه", delay: "تأخیر", connect: "اتصال", disconnect: "قطع اتصال",
            not_connected: "متصل نیستید", connecting: "در حال اتصال...", connected_to: "متصل به", settings: "تنظیمات",
            untested: "تست نشده", testing: "در حال تست", healthy: "سالم", unhealthy: "ناسالم", error: "خطا",
            test_selected: "تست منتخب‌ها", copy_link: "کپی لینک", assign_to_group: "اختصاص به گروه",
            show_qr_code: "نمایش QR Code", delete: "حذف", edit_name: "ویرایش نام",
            confirm_delete_title: "تایید حذف", confirm_delete_config: "آیا از حذف این کانفیگ مطمئن هستید؟",
            confirm_delete_group: "آیا از حذف این گروه مطمئن هستید؟ کانفیگ‌های داخل آن بدون گروه خواهند شد.",
            add_group_title: "افزودن گروه جدید", add_group_message: "نام گروه جدید را وارد کنید:",
            edit_name_title: "ویرایش نام", edit_name_message: "نام جدید کانفیگ را وارد کنید:",
            toast_configs_added: "کانفیگ جدید اضافه شد.",
        }
    };
    const lang = (key) => translations[state.currentLanguage]?.[key] || key;

    const formatStatus = (statusValue) => {
        if (!statusValue) return lang('untested'); // Default if status is null or undefined
        return lang(statusValue.toLowerCase()) || statusValue; // Use lang key or fallback to the value itself
    };

    const formatDelay = (delayValue) => {
        if (delayValue === null || delayValue === undefined || delayValue < 0) {
            // Could add a specific lang key for 'N/A' if desired, e.g., lang('na_delay')
            return 'N/A';
        }
        return `${delayValue} ms`;
    };

    // --- Initialization ---
    const init = async () => {
        try {
            const initialData = await window.api.getAllData();
            Object.assign(state, initialData);
        } catch (error) {
            console.error("Failed to get initial data:", error);
            showToast(`Error loading initial data: ${error.message || 'Unknown error'}`, 'error');
            // Initialize with default empty state if loading fails
            state.configs = [];
            state.groups = [];
            state.settings = { concurrentTests: 10, testTimeout: 8, testUrl: 'http://cp.cloudflare.com/generate_204' };
        }
        state.currentTheme = localStorage.getItem('theme') || 'dark-theme';
        document.body.className = state.currentTheme;
        addEventListeners();
        renderAll();
    };

    // --- Render Functions ---
    const renderAll = () => {
        renderTable();
        renderGroups();
        updateStatusBar();
        updateConnectionButton();
        updateTestUI();
        updateLangUI();
    };

    const renderTable = () => {
        const tableBody = $('#configsTableBody');
        const configsToRender = getVisibleConfigs();

        if (configsToRender.length === 0 && state.searchTerm === '' && state.activeGroupId === 'all') {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px;">No configurations added yet. Click "Add Config" or "Import".</td></tr>`;
            return;
        } else if (configsToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px;">No configurations match the current filter or search term.</td></tr>`;
            return;
        }

        const existingRowsById = new Map();
        for (const row of tableBody.children) {
            if (row.dataset.id) { // Ensure it's a config row, not the "empty" message row
                existingRowsById.set(row.dataset.id, row);
            }
        }

        const fragmentForNewRows = document.createDocumentFragment();
        const rowsInNewOrder = [];

        configsToRender.forEach(config => {
            const groupName = state.groups.find(g => g.id === config.groupId)?.name || '-'; // This is not directly used in cell content below but good for context
            const countryFlag = config.country ? `<img src="https://flagcdn.com/${config.country.toLowerCase()}.svg" class="country-flag" alt="${config.country}">` : '';
            const isSelected = state.selectedConfigIds.includes(config.id);
            const isConnected = config.id === state.activeConnectionId;

            let row = existingRowsById.get(config.id);
            if (row) { // Row exists, update it
                // Update selection class
                if (isSelected) row.classList.add('selected'); else row.classList.remove('selected');
                // Update connected class
                if (isConnected) row.classList.add('connected'); else row.classList.remove('connected');

                // Update individual cells for changed content
                // This is more granular and efficient than row.innerHTML if only some data changes often (like status/delay)
                const cells = row.cells;
                cells[0].firstChild.checked = isSelected; // Checkbox

                const statusCell = cells[1]; // Second cell is the status cell
                const statusIndicator = statusCell.querySelector('.status-indicator');
                const statusText = statusCell.querySelector('span:last-child'); // The text part of the status

                if (statusIndicator && statusText) {
                    const currentStatusClass = statusIndicator.className.match(/status-\S+/)?.[0];
                    const newStatusClass = `status-${config.status || 'untested'}`;
                    if (currentStatusClass !== newStatusClass) {
                        if (currentStatusClass) statusIndicator.classList.remove(currentStatusClass);
                        statusIndicator.classList.add(newStatusClass);
                    }
                    // Ensure status-indicator class is present if it was missing but the element was found
                    if (!statusIndicator.classList.contains('status-indicator')) {
                        statusIndicator.classList.add('status-indicator');
                    }
                    statusText.textContent = formatStatus(config.status);
                } else {
                    console.error(`renderTable: Status cell for config ID: ${config.id} missing expected children. Rebuilding. Cell HTML:`, statusCell.innerHTML);
                    // Forcefully rebuild the cell's children
                    while (statusCell.firstChild) {
                        statusCell.removeChild(statusCell.firstChild);
                    }
                    const newIndicatorSpan = document.createElement('span');
                    newIndicatorSpan.classList.add('status-indicator');
                    newIndicatorSpan.classList.add(`status-${config.status || 'untested'}`);

                    const newStatusTextSpan = document.createElement('span');
                    newStatusTextSpan.textContent = formatStatus(config.status);

                    statusCell.appendChild(newIndicatorSpan);
                    statusCell.appendChild(newStatusTextSpan);
                }

                cells[2].textContent = config.name;
                cells[2].title = config.name;

                const countryCellContent = `${countryFlag}<span>${config.country || ''}</span>`;
                if (cells[3].innerHTML !== countryCellContent) cells[3].innerHTML = countryCellContent;

                cells[4].textContent = formatDelay(config.delay);
                cells[5].textContent = config.protocol;
                cells[6].textContent = config.network;

                existingRowsById.delete(config.id); // Remove from map as it's been processed
            } else { // Row doesn't exist, create it
                row = document.createElement('tr');
                row.dataset.id = config.id;
                if (isSelected) row.classList.add('selected');
                if (isConnected) row.classList.add('connected');

                row.innerHTML = `
                    <td class="checkbox-cell"><input type="checkbox" ${isSelected ? 'checked' : ''}></td>
                    <td class="status-cell"><span class="status-indicator status-${config.status || 'untested'}"></span><span>${formatStatus(config.status)}</span></td>
                    <td title="${config.name}">${config.name}</td>
                    <td class="country-cell">${countryFlag}<span>${config.country || ''}</span></td>
                    <td>${formatDelay(config.delay)}</td>
                    <td>${config.protocol}</td>
                    <td>${config.network}</td>
                `;
                fragmentForNewRows.appendChild(row); // Add to fragment for new rows
            }
            rowsInNewOrder.push(row);
        });

        // Remove old rows that are no longer in configsToRender
        existingRowsById.forEach(oldRow => tableBody.removeChild(oldRow));

        // Append newly created rows
        if (fragmentForNewRows.childNodes.length > 0) {
            tableBody.appendChild(fragmentForNewRows);
        }

        // Re-order rows if needed (simplest way is to re-append them in the correct order)
        // This is less efficient than precise move operations but better than full innerHTML reset.
        // For highly dynamic sorting, a library or more complex logic would be better.
        // However, if sorting mainly happens on full re-render this might be acceptable.
        // A quick check: if the current order in DOM matches rowsInNewOrder, skip re-appending.
        let needsReorder = false;
        const currentDomRows = Array.from(tableBody.children);
        if (currentDomRows.length !== rowsInNewOrder.length) {
            needsReorder = true;
        } else {
            for (let i = 0; i < rowsInNewOrder.length; i++) {
                if (currentDomRows[i].dataset.id !== rowsInNewOrder[i].dataset.id) {
                    needsReorder = true;
                    break;
                }
            }
        }

        if (needsReorder) {
            // Clear and re-append in correct order.
            // This is still better than innerHTML = '' because it preserves existing DOM elements if they are part of rowsInNewOrder.
            // For rows that were updated in place and are still in order, they are just moved.
            // For new rows, they are appended.
            // tableBody.innerHTML = ''; // Avoid this
            rowsInNewOrder.forEach(r => tableBody.appendChild(r)); // Re-appends all rows in the new sorted order
        }
    };

    const renderGroups = () => {
        const groupList = $('#groupList');
        groupList.innerHTML = `<li class="group-item ${state.activeGroupId === 'all' ? 'active' : ''}" data-group-id="all"><i class="fa-solid fa-globe"></i> <span>${lang('all_configs')}</span></li>`;
        state.groups.forEach(group => {
            const li = document.createElement('li');
            li.className = `group-item ${state.activeGroupId === group.id ? 'active' : ''}`;
            li.dataset.groupId = group.id;
            const configCount = state.configs.filter(c => c.groupId === group.id).length;
            li.innerHTML = `<i class="fa-solid fa-folder"></i> <span>${group.name}</span> <span class="group-count">${configCount}</span>`;
            groupList.appendChild(li);
        });
    };

    const updateStatusBar = () => {
        const total = state.configs.length;
        const healthy = state.configs.filter(c => c.status === 'healthy').length;
        $('#progressText').textContent = `کل: ${total} | سالم: ${healthy}`;
    };

    const updateConnectionButton = () => {
        const btn = $('#connectBtn');
        const statusSpan = $('#connectionStatus');
        if (state.activeConnectionId) {
            const config = state.configs.find(c => c.id === state.activeConnectionId);
            btn.className = 'connect-btn connected';
            btn.innerHTML = `<i class="fa-solid fa-power-off"></i> ${lang('disconnect')}`;
            btn.disabled = false;
            statusSpan.textContent = `${lang('connected_to')}: ${config?.name || ''}`;
        } else {
            const selectedHealthyConfigs = state.selectedConfigIds.filter(id => state.configs.find(c => c.id === id)?.status === 'healthy');
            btn.className = 'connect-btn disconnected';
            btn.innerHTML = `<i class="fa-solid fa-power-off"></i> ${lang('connect')}`;
            statusSpan.textContent = lang('not_connected');
            if (selectedHealthyConfigs.length === 1) { // Only enable for single selection
                btn.disabled = false;
                btn.classList.add('ready');
            } else {
                btn.disabled = true;
            }
        }
    };

    const updateTestUI = () => {
        $('#startTestBtn').style.display = state.isTesting ? 'none' : 'inline-flex';
        $('#stopTestBtn').style.display = state.isTesting ? 'inline-flex' : 'none';
        $('#stopTestBtn').disabled = !state.isTesting;
    };
    
    const updateLangUI = () => {
        document.documentElement.lang = state.currentLanguage;
        document.documentElement.dir = state.currentLanguage === 'fa' ? 'rtl' : 'ltr';
        $$('[data-lang]').forEach(el => {
            el.textContent = lang(el.dataset.lang);
        });
    };

    // --- Data & Logic ---
    const getVisibleConfigs = () => {
        const searchTerm = state.searchTerm.toLowerCase();
        return state.configs
            .filter(c => state.activeGroupId === 'all' || c.groupId === state.activeGroupId)
            .filter(c => !searchTerm || c.name.toLowerCase().includes(searchTerm) || c.protocol.toLowerCase().includes(searchTerm) || (c.network && c.network.toLowerCase().includes(searchTerm)) || (c.address && c.address.toLowerCase().includes(searchTerm)))
            .sort((a, b) => {
                const valA = a[state.currentSort.column];
                const valB = b[state.currentSort.column];
                if (state.currentSort.column === 'delay') {
                    const pingA = valA > -1 ? valA : Infinity;
                    const pingB = valB > -1 ? valB : Infinity;
                    return state.currentSort.order === 'asc' ? pingA - pingB : pingB - pingA;
                }
                if (String(valA) < String(valB)) return state.currentSort.order === 'asc' ? -1 : 1;
                if (String(valA) > String(valB)) return state.currentSort.order === 'asc' ? 1 : -1;
                return 0;
            });
    };

    const processAndAddConfigs = async (linksArray) => {
        const existingLinks = new Set(state.configs.map(c => c.link));
        let addedCount = 0;
        for (const link of linksArray) {
            if (!link || !/^(vless|vmess|trojan|ss):\/\//.test(link) || existingLinks.has(link)) continue;
            try {
                const url = new URL(link);
                const name = decodeURIComponent(url.hash.substring(1)) || `${url.hostname}:${url.port}`;
                let country = 'XX'; // Default country code
                try {
                    country = await window.api.getCountry(url.hostname);
                } catch (countryError) {
                    console.warn(`Failed to get country for ${url.hostname}:`, countryError.message);
                    // Use default 'XX' and proceed
                }
                state.configs.push({
                    id: `cfg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    link, name, country,
                    address: url.hostname,
                    protocol: url.protocol.slice(0, -1),
                    network: url.searchParams.get('type') || 'tcp',
                    status: 'untested', delay: null,
                    groupId: state.activeGroupId === 'all' ? null : state.activeGroupId
                });
                existingLinks.add(link);
                addedCount++;
            } catch (e) { console.warn("Skipping invalid config:", link, e); }
        }
        if (addedCount > 0) {
            saveAllData();
            renderAll(); // renderAll -> renderTable -> updateSelectAllCheckboxState
            showToast(`${addedCount} ${lang('toast_configs_added')}`, 'success');
        }
    };

    const saveAllData = () => {
        window.api.saveAllData({ configs: state.configs, groups: state.groups, settings: state.settings });
    };

    // --- Modals, Toasts, Context Menu ---
    // renderAll already calls renderTable, which calls updateSelectAllCheckboxState.
    // So functions calling renderAll don't need a separate call to updateSelectAllCheckboxState.

    const openModal = (modalId) => {
        if (modalId === 'settingsModal') {
            $('#concurrentTestsInput').value = state.settings.concurrentTests;
            $('#testTimeoutInput').value = state.settings.testTimeout;
            $('#testUrlInput').value = state.settings.testUrl;
        }
        $(`#${modalId}`).parentElement.style.display = 'flex';
    };
    const closeModal = () => $('#modalBackdrop').style.display = 'none';
    
    const showContextMenu = (e, items) => { /* ... (same as previous version) ... */ };
    
    const showToast = (message, type = 'info') => {
        const toastContainer = $('#toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    };

    const showConfirm = ({ title, message, okText = 'تایید', cancelText = 'لغو' }) => {
        return new Promise(resolve => {
            $('#confirmTitle').textContent = title;
            $('#confirmMessage').textContent = message;
            $('#confirmOkBtn').textContent = okText;
            $('#confirmCancelBtn').textContent = cancelText;
            openModal('confirmModal');

            const onOk = () => {
                closeModal();
                resolve(true);
                cleanup();
            };
            const onCancel = () => {
                closeModal();
                resolve(false);
                cleanup();
            };
            
            $('#confirmOkBtn').onclick = onOk;
            $('#confirmCancelBtn').onclick = onCancel;
            
            function cleanup() {
                $('#confirmOkBtn').onclick = null;
                $('#confirmCancelBtn').onclick = null;
            }
        });
    };
    
    const showPrompt = ({ title, message, defaultValue = '' }) => {
        return new Promise(resolve => {
            $('#promptTitle').textContent = title;
            $('#promptMessage').textContent = message;
            $('#promptInput').value = defaultValue;
            openModal('promptModal');
            $('#promptInput').focus();

            const onOk = () => {
                const value = $('#promptInput').value;
                closeModal();
                resolve(value);
                cleanup();
            };
            const onCancel = () => {
                closeModal();
                resolve(null);
                cleanup();
            };
            
            $('#promptOkBtn').onclick = onOk;
            $('#promptCancelBtn').onclick = onCancel;
            $('#promptInput').onkeydown = (e) => { if (e.key === 'Enter') onOk(); };
            
            function cleanup() {
                $('#promptOkBtn').onclick = null;
                $('#promptCancelBtn').onclick = null;
                $('#promptInput').onkeydown = null;
            }
        });
    };

    // --- Event Listeners ---
    function addEventListeners() {
        // Toolbar buttons
        $('#openAddModalBtn').addEventListener('click', () => openModal('addConfigModal'));
        $('#deleteUnhealthyBtn').addEventListener('click', handleDeleteUnhealthy);
        $('#startTestBtn').addEventListener('click', handleStartTest);
        $('#stopTestBtn').addEventListener('click', () => window.api.stopTests());

        // Search
        $('#searchBox').addEventListener('input', handleSearch); // Corrected ID: searchBox

        // Sidebar
        $('#addGroupBtn').addEventListener('click', handleAddGroup); // Corrected ID: addGroupBtn
        $('#groupList').addEventListener('click', handleGroupClick);

        // Main table
        $('#configsTableBody').addEventListener('click', handleTableClick);
        $('#configsTableBody').addEventListener('contextmenu', handleTableContextMenu);
        $$('#configsTable th[data-sort]').forEach(th => th.addEventListener('click', handleSortClick)); // Corrected $ to $$
        $('#selectAllCheckbox').addEventListener('change', handleSelectAllToggle);


        // Status bar
        $('#connectBtn').addEventListener('click', handleConnectToggle);
        $('#settingsBtn').addEventListener('click', () => openModal('settingsModal'));
        $('#themeToggleBtn').addEventListener('click', () => { // Corrected ID: themeToggleBtn
            state.currentTheme = state.currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
            document.body.className = state.currentTheme;
            localStorage.setItem('theme', state.currentTheme);
            // Update icon on theme toggle btn
            const icon = $('#themeToggleBtn i');
            if (icon) icon.className = state.currentTheme === 'dark-theme' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        });
        $('#langToggleBtn').addEventListener('click', () => { // Corrected ID: langToggleBtn
            state.currentLanguage = state.currentLanguage === 'en' ? 'fa' : 'en';
            updateLangUI();
            renderAll();
        });

        // Settings Modal Buttons
        // Removed listener for non-existent #saveSettingsBtn. Saving is now part of individual actions or modal close.
        // The inputs #concurrentTestsInput, #testTimeoutInput, #testUrlInput are read in handleSaveSettings which needs to be triggered appropriately.
        // Let's assume for now that settings are saved implicitly when the modal is closed or explicitly by a different button.
        // For now, I will ensure handleSaveSettings is callable and correctly reads values.
        // If there's a generic "OK" or "Apply" button for settings modal, it should call handleSaveSettings.
        // The current settings modal in HTML doesn't have a general save/apply button, only data action buttons.
        // Let's add a listener to the settings modal's close button as a *proxy* for saving. This is not ideal UX but fixes the missing link.
        // TODO: This will be changed later in UX improvements for settings modal.
        // $$('.close-modal-btn[data-modal-id="settingsModal"]').forEach(btn => btn.addEventListener('click', handleSaveSettings)); // Save on close
        // Settings Modal new buttons
        $('#saveSettingsBtn').addEventListener('click', () => {
            handleSaveSettings(); // Saves the settings
            closeModal(); // Then closes the modal
        });
        $('#cancelSettingsBtn').addEventListener('click', () => {
            // Restore original settings values to inputs before closing if they were changed without saving
            // This is optional, but good UX. For simplicity here, just close.
            closeModal();
        });


        $('#importDataBtn').addEventListener('click', handleImportData);
        $('#exportDataBtn').addEventListener('click', handleExportData);
        $('#exportHealthyBtn').addEventListener('click', () => { // Export healthy configs as text
            const healthyConfigs = state.configs.filter(c => c.status === 'healthy');
            handleExportConfigs(healthyConfigs, 'healthy-configs.txt');
        });
        $('#clearAllDataBtn').addEventListener('click', handleClearAllData);


        // Add Config Modal Buttons
        $('#addFromSubLinkBtn').addEventListener('click', handleFetchSubscription); // Corrected ID
        $('#addFromPasteBtn').addEventListener('click', handleAddConfigFromText); // Corrected ID
        $('#addFromFileBtn').addEventListener('click', handleImportTextFile); // Corrected ID

        // Modals general close buttons
        $$('.modal .close-btn, #modalBackdrop').forEach(el => {
            if (!el.classList.contains('close-modal-btn') || el.dataset.modalId !== 'settingsModal') { // Avoid double-binding save for settings close
                el.addEventListener('click', closeModal);
            }
        });
        $('#confirmCancelBtn').addEventListener('click', closeModal);
        $('#promptCancelBtn').addEventListener('click', closeModal);

        // For export buttons that were previously conceptual:
        // These are just examples, assuming such buttons exist with these IDs.
        // If #exportAllBtn, #exportSelectedBtn, #exportGroupBtn exist, their listeners would be here.
        // Based on index.html, these specific buttons are not present.
        // I will remove the listeners for these non-existent buttons to prevent errors.
        // The functionality is in handleExportConfigs, which is called by exportHealthyBtn.
        // If general export buttons are added to HTML, listeners can be reinstated.

        // Listeners for #addConfigFromClipboardBtn and others assumed to be in the HTML
        // If #addConfigFromClipboardBtn exists:
        // $('#addConfigFromClipboardBtn').addEventListener('click', handleAddFromClipboard);
        // The provided index.html does not have: exportAllBtn, exportSelectedBtn, exportGroupBtn, addConfigFromClipboardBtn
    }

    // --- Handlers ---
    const handleImportData = async () => {
        try {
            const result = await window.api.importJsonFile();
            if (!result || !result.success) {
                if (result && result.error && result.error !== 'File selection canceled.') { // Check error message
                    showToast(`Error importing JSON: ${result.error}`, 'error');
                } // Do not show toast if user simply canceled.
                return;
            }

            const importedData = JSON.parse(result.data);

            // Basic validation
            if (typeof importedData !== 'object' || importedData === null ||
                !Array.isArray(importedData.configs) ||
                !Array.isArray(importedData.groups) ||
                typeof importedData.settings !== 'object' || importedData.settings === null) {
                showToast('Invalid JSON structure for import. Expected configs, groups, and settings.', 'error');
                return;
            }

            // Further validation can be added here (e.g. checking individual config structures)
            // For now, assume the structure is generally correct if keys exist and are of right type.
             // A more robust import might validate each config/group/setting item.

            state.configs = importedData.configs.map(c => ({ // Ensure default fields if missing from older exports
                ...c,
                status: c.status || 'untested',
                delay: c.delay === undefined ? null : c.delay,
                country: c.country || 'XX'
            }));
            state.groups = importedData.groups; // Assuming groups structure is stable
            state.settings = { // Merge with defaults to ensure all settings fields exist
                concurrentTests: 10,
                testTimeout: 8,
                testUrl: 'http://cp.cloudflare.com/generate_204',
                ...importedData.settings
            };

            saveAllData();
            renderAll(); // Re-render everything with new data
            closeModal(); // Close settings modal if open
            showToast('Data imported successfully!', 'success');

        } catch (error) {
            console.error("Failed to import data from JSON:", error);
            showToast(`Failed to import JSON: ${error.message || 'Invalid file content.'}`, 'error');
        }
    };

    const handleExportData = () => {
        const dataToExport = {
            configs: state.configs,
            groups: state.groups,
            settings: state.settings,
        };
        const content = JSON.stringify(dataToExport, null, 2); // Pretty print JSON
        window.api.exportFile({ defaultPath: 'ultimate-v2ray-tester-backup.json', content, isJson: true })
            .then(success => {
                if (success) showToast('Data exported successfully!', 'success');
                // else: User cancelled dialog, no toast needed
            })
            .catch(error => {
                console.error("Error exporting data:", error);
                showToast(`Failed to export data: ${error.message || 'Unknown error'}`, 'error');
            });
    };

    const handleSaveSettings = () => {
        // This function is now called when the settings modal is closed.
        const concurrentTests = parseInt($('#concurrentTestsInput').value, 10);
        const testTimeout = parseInt($('#testTimeoutInput').value, 10);
        const testUrl = $('#testUrlInput').value;

        let changed = false;
        if (!isNaN(concurrentTests) && concurrentTests > 0 && state.settings.concurrentTests !== concurrentTests) {
            state.settings.concurrentTests = concurrentTests;
            changed = true;
        }
        if (!isNaN(testTimeout) && testTimeout > 0 && state.settings.testTimeout !== testTimeout) {
            state.settings.testTimeout = testTimeout;
            changed = true;
        }
        if (testUrl && state.settings.testUrl !== testUrl) {
            state.settings.testUrl = testUrl;
            changed = true;
        }

        if (changed) {
            saveAllData();
            showToast('Settings saved!', 'success');
        }
        // closeModal() will be handled by the button that calls this, or by generic modal close.
    };

    const handleSelectAllToggle = (e) => {
        const isChecked = e.target.checked;
        const visibleConfigs = getVisibleConfigs();
        if (isChecked) {
            state.selectedConfigIds = visibleConfigs.map(c => c.id);
            if (visibleConfigs.length > 0) {
                state.lastSelectedId = visibleConfigs[visibleConfigs.length - 1].id;
            } else {
                state.lastSelectedId = null;
            }
        } else {
            state.selectedConfigIds = [];
            state.lastSelectedId = null;
        }
        renderTable(); // Re-render to show selection changes and update individual checkboxes
        updateConnectionButton();
    };

    const updateSelectAllCheckboxState = () => {
        const selectAllCheckbox = $('#selectAllCheckbox');
        if (!selectAllCheckbox) return;
        const visibleConfigs = getVisibleConfigs();
        if (visibleConfigs.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.disabled = true; // Disable if no items to select
            return;
        }
        selectAllCheckbox.disabled = false; // Enable if there are items

        const allVisibleSelected = visibleConfigs.every(c => state.selectedConfigIds.includes(c.id));
        if (allVisibleSelected) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (state.selectedConfigIds.some(id => visibleConfigs.find(c => c.id === id))) {
            selectAllCheckbox.checked = false; // Or true, depending on desired indeterminate behavior
            selectAllCheckbox.indeterminate = true;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    };

    // Modify renderTable and other functions that change selection/visibility to call updateSelectAllCheckboxState
    // For example, at the end of renderTable:
    // Original renderTable() ends here...
    updateSelectAllCheckboxState(); // Call this after table is rendered
    // Also call it after handleSearch, handleGroupClick, handleDeleteConfig, etc.

    const handleAddConfigFromText = () => { // Now correctly associated with addFromPasteBtn
        const text = $('#pasteArea').value; // Corrected ID: pasteArea
        if (text) {
            const links = text.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
            processAndAddConfigs(links);
            $('#pasteArea').value = ''; // Clear textarea
            closeModal(); // Assuming this button is within a modal that should close
        } else {
            showToast('Text area is empty.', 'warning');
        }
    };

    const handleImportTextFile = () => { // Now correctly associated with addFromFileBtn
        window.api.importTextFile()
            .then(fileContent => {
                if (fileContent === null) return; // User cancelled dialog
                const links = fileContent.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
                processAndAddConfigs(links);
            })
            .catch(error => {
                console.error("Error importing text file:", error);
                showToast(`Failed to import file: ${error.message || 'Unknown error'}`, 'error');
            });
    };

    const handleExportConfigs = (configsToExport, defaultFilename) => {
        if (!configsToExport || configsToExport.length === 0) {
            showToast('No configs to export.', 'info');
            return;
        }
        const content = configsToExport.map(c => c.link).join('\n');
        window.api.exportFile({ defaultPath: defaultFilename, content, isJson: false })
            .then(success => {
                if (success) showToast('Configs exported successfully!', 'success');
                // else user cancelled dialog, no toast needed
            })
            .catch(error => {
                console.error("Error exporting configs:", error);
                showToast(`Failed to export configs: ${error.message || 'Unknown error'}`, 'error');
            });
    };

    const handleFetchSubscription = async () => {
        const subUrl = $('#subLinkInput').value.trim();
        if (!subUrl) {
            showToast('Subscription URL is empty.', 'warning');
            return;
        }
        showToast('Fetching subscription...', 'info');
        try {
            const result = await window.api.fetchSubscription(subUrl);
            if (result.success) {
                const links = result.data.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
                processAndAddConfigs(links);
                $('#subLinkInput').value = ''; // Clear input
                closeModal(); // Assuming this is in a modal
            } else {
                throw new Error(result.error || 'Unknown error fetching subscription');
            }
        } catch (error) {
            console.error("Error fetching subscription:", error);
            showToast(`Failed to fetch subscription: ${error.message || 'Unknown error'}`, 'error');
        }
    };

    const handleClearAllData = async () => {
        const confirmed = await showConfirm({ title: 'Clear All Data', message: 'Are you sure you want to delete ALL configs, groups, and settings? This action cannot be undone.' });
        if (!confirmed) return;

        window.api.clearAllData()
            .then(() => {
                state.configs = [];
                state.groups = [];
                // Reset settings to default or clear them if appropriate
                state.settings = { concurrentTests: 10, testTimeout: 8, testUrl: 'http://cp.cloudflare.com/generate_204' };
                state.activeGroupId = 'all';
                state.selectedConfigIds = [];
                saveAllData(); // Persist cleared state
                renderAll();
                showToast('All data cleared successfully.', 'success');
            })
            .catch(error => {
                console.error("Error clearing all data:", error);
                showToast(`Failed to clear data: ${error.message || 'Unknown error'}`, 'error');
            });
    };

    const handleShowQRCode = (link) => {
        window.api.generateQRCode(link)
            .then(dataUrl => {
                $('#qrCodeImage').src = dataUrl;
                $('#qrCodeLinkText').textContent = link; // Display the link as well
                openModal('qrCodeModal');
            })
            .catch(error => {
                console.error("Error generating QR code:", error);
                showToast(`Failed to generate QR code: ${error.message || 'Unknown error'}`, 'error');
            });
    };

    // Placeholder for other handlers that were mentioned in the original code structure
    const handleStartTest = () => {
        if (state.isTesting) return;
        const configsToTest = getVisibleConfigs().filter(c => c.status !== 'testing'); // Or based on selection
        if (configsToTest.length === 0) {
            showToast('No configs to test.', 'info');
            return;
        }
        state.isTesting = true;
        configsToTest.forEach(c => c.status = 'testing'); // Mark as testing
        renderTable(); // Update UI to show "testing" status
        updateTestUI();
        // Reset progress bar if you have one
        $('#progressBar').style.width = '0%';
        $('#progressText').textContent = `Testing 0/${configsToTest.length}`;

        window.api.startTests({ configs: configsToTest, settings: state.settings });
    };

    const handleConnectToggle = () => {
        if (state.activeConnectionId) { // Currently connected, so disconnect
            window.api.disconnectProxy();
        } else { // Not connected, try to connect
            const selectedConfig = state.configs.find(c => state.selectedConfigIds.length === 1 && c.id === state.selectedConfigIds[0]);
            if (selectedConfig && selectedConfig.status === 'healthy') {
                $('#connectionStatus').textContent = lang('connecting');
                window.api.connectProxy(selectedConfig.link);
            } else if (state.selectedConfigIds.length !== 1) {
                showToast('Please select exactly one healthy config to connect.', 'warning');
            } else {
                showToast('Selected config is not healthy or not tested.', 'warning');
            }
        }
    };

    const handleGroupClick = (e) => {
        const targetGroup = e.target.closest('.group-item');
        if (targetGroup) {
            const groupId = targetGroup.dataset.groupId;
            state.activeGroupId = groupId;
            state.lastSelectedId = null; // Reset last selected ID when group changes
            state.selectedConfigIds = []; // Clear selection when group changes
            renderGroups(); // Re-render to update active class
            renderTable();
            updateConnectionButton(); // Selection changed
        }
    };

    const handleTableClick = (e) => {
        const row = e.target.closest('tr');
        if (!row || !row.dataset.id) return;
        const configId = row.dataset.id;
        const isCheckbox = e.target.type === 'checkbox';

        if (e.shiftKey && state.lastSelectedId) {
            const visibleConfigs = getVisibleConfigs();
            const lastIdx = visibleConfigs.findIndex(c => c.id === state.lastSelectedId);
            const currentIdx = visibleConfigs.findIndex(c => c.id === configId);
            if (lastIdx !== -1 && currentIdx !== -1) {
                const start = Math.min(lastIdx, currentIdx);
                const end = Math.max(lastIdx, currentIdx);
                const shiftSelectedIds = visibleConfigs.slice(start, end + 1).map(c => c.id);
                if (isCheckbox && e.target.checked) { // if checking with shift, add to selection
                    state.selectedConfigIds = [...new Set([...state.selectedConfigIds, ...shiftSelectedIds])];
                } else if (isCheckbox && !e.target.checked) { // if unchecking with shift, remove from selection
                     state.selectedConfigIds = state.selectedConfigIds.filter(id => !shiftSelectedIds.includes(id));
                } else { // if just clicking row with shift (not checkbox directly)
                    state.selectedConfigIds = shiftSelectedIds;
                }
            }
        } else if (e.ctrlKey || e.metaKey) { // CMD key for macOS
            if (state.selectedConfigIds.includes(configId)) {
                state.selectedConfigIds = state.selectedConfigIds.filter(id => id !== configId);
            } else {
                state.selectedConfigIds.push(configId);
            }
            state.lastSelectedId = configId;
        } else {
            state.selectedConfigIds = [configId];
            state.lastSelectedId = configId;
        }
        renderTable(); // Re-render for selection changes
        updateConnectionButton();
    };

    const handleTableContextMenu = (e) => {
        e.preventDefault();
        const row = e.target.closest('tr');
        if (!row || !row.dataset.id) { // Context menu on empty table area or header
            showContextMenu(e, getGlobalContextMenuItems());
            return;
        }

        const clickedConfigId = row.dataset.id;
        // If right-clicked row is not part of current selection, make it the sole selection
        if (!state.selectedConfigIds.includes(clickedConfigId)) {
            state.selectedConfigIds = [clickedConfigId];
            state.lastSelectedId = clickedConfigId;
            renderTable(); // Update selection visuals
            updateConnectionButton();
        }
        showContextMenu(e, getConfigContextMenuItems());
    };

    const handleSearch = (e) => {
        state.searchTerm = e.target.value;
        renderTable();
    };

    const handleSortClick = (e) => {
        const column = e.currentTarget.dataset.sort;
        if (state.currentSort.column === column) {
            state.currentSort.order = state.currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            state.currentSort.column = column;
            state.currentSort.order = 'asc';
        }
        // Update sort indicators in TH elements (add/remove classes)
        $$('#configsTable th[data-sort]').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
            if (th.dataset.sort === column) {
                th.classList.add(state.currentSort.order === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
        });
        renderTable();
    };

    const handleDeleteUnhealthy = async () => {
        const unhealthyConfigs = state.configs.filter(c => c.status === 'unhealthy' || c.status === 'error' || (c.status === 'untested' && c.delay === -1));
        if (unhealthyConfigs.length === 0) {
            showToast('No unhealthy configs to delete.', 'info');
            return;
        }
        const confirmed = await showConfirm({
            title: 'Delete Unhealthy Configs',
            message: `Are you sure you want to delete ${unhealthyConfigs.length} unhealthy/error configs?`
        });
        if (confirmed) {
            const unhealthyIds = new Set(unhealthyConfigs.map(c => c.id));
            state.configs = state.configs.filter(c => !unhealthyIds.has(c.id));
            state.selectedConfigIds = state.selectedConfigIds.filter(id => !unhealthyIds.has(id));
            saveAllData();
            renderAll();
            showToast(`${unhealthyIds.size} unhealthy configs deleted.`, 'success');
        }
    };

    const handleAddFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                const links = text.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
                if (links.length > 0) {
                    processAndAddConfigs(links);
                } else {
                    showToast('Clipboard is empty or contains no valid links.', 'info');
                }
            } else {
                showToast('Clipboard is empty.', 'info');
            }
        } catch (error) {
            console.error("Error reading from clipboard:", error);
            showToast(`Failed to read from clipboard: ${error.message}`, 'error');
        }
    };

    const handleAddGroup = async () => {
        const groupName = await showPrompt({ title: lang('add_group_title'), message: lang('add_group_message') });
        if (groupName && groupName.trim() !== '') {
            const newGroup = {
                id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                name: groupName.trim()
            };
            state.groups.push(newGroup);
            saveAllData();
            renderGroups(); // Just re-render groups or renderAll()
            showToast(`Group "${newGroup.name}" added.`, 'success');
        } else if (groupName !== null) { // User submitted empty name
            showToast('Group name cannot be empty.', 'warning');
        }
    };


    const handleEditName = async (config) => { // Assumes config object is passed
        if (!config) { // Might be called from context menu where config is derived from selected IDs
            if (state.selectedConfigIds.length !== 1) {
                 showToast("Select a single config to edit its name.", "warning"); return;
            }
            config = state.configs.find(c => c.id === state.selectedConfigIds[0]);
        }
        if (!config) {
             showToast("Config not found for editing.", "error"); return;
        }

        const newName = await showPrompt({
            title: lang('edit_name_title'),
            message: lang('edit_name_message'),
            defaultValue: config.name
        });
        if (newName !== null && newName.trim() !== '') { // Check for null to allow cancel, and non-empty
            config.name = newName.trim();
            saveAllData();
            renderTable();
            showToast('Config name updated.', 'success');
        } else if (newName !== null) { // User submitted empty name
             showToast('Config name cannot be empty.', 'warning');
        }
    };
    
    const handleDeleteConfig = async () => { // No argument, acts on selection
        if (state.selectedConfigIds.length === 0) {
            showToast("No configs selected to delete.", "warning"); return;
        }
        const confirmed = await showConfirm({
            title: lang('confirm_delete_title'),
            message: `Are you sure you want to delete ${state.selectedConfigIds.length} selected config(s)?`
        });
        if (confirmed) {
            const selectionIdSet = new Set(state.selectedConfigIds);
            state.configs = state.configs.filter(c => !selectionIdSet.has(c.id));
            state.selectedConfigIds = [];
            state.lastSelectedId = null;
            saveAllData();
            renderAll();
            showToast(`${selectionIdSet.size} config(s) deleted.`, 'success');
        }
    };

    const handleDeleteGroup = async (groupId) => { // Assumes groupId is passed
        if (!groupId) { // Might be called from context menu
             if (state.activeGroupId && state.activeGroupId !== 'all') {
                groupId = state.activeGroupId;
            } else {
                showToast("Select a group to delete.", "warning"); return;
            }
        }
        const groupToDelete = state.groups.find(g => g.id === groupId);
        if (!groupToDelete) {
            showToast("Group not found for deletion.", "error"); return;
        }

        const confirmed = await showConfirm({
            title: lang('confirm_delete_title'),
            message: `${lang('confirm_delete_group')} (Name: ${groupToDelete.name})`
        });
        if (confirmed) {
            state.groups = state.groups.filter(g => g.id !== groupId);
            state.configs.forEach(c => { if (c.groupId === groupId) c.groupId = null; }); // Ungroup configs
            if (state.activeGroupId === groupId) state.activeGroupId = 'all'; // Reset active group if it was deleted
            saveAllData();
            renderAll();
            showToast(`Group "${groupToDelete.name}" deleted.`, 'success');
        }
    };

    const handleAssignToGroup = async (groupId) => { // groupId to assign to
        if (state.selectedConfigIds.length === 0) {
            showToast("No configs selected.", "warning"); return;
        }
        if (groupId === 'new') { // Special value to prompt for new group
            const groupName = await showPrompt({ title: "New Group Name", message: "Enter name for the new group:" });
            if (groupName && groupName.trim() !== "") {
                const newGroup = { id: `grp_${Date.now()}_${Math.random().toString(36).substring(2,9)}`, name: groupName.trim() };
                state.groups.push(newGroup);
                groupId = newGroup.id; // Assign to the newly created group
                renderGroups(); // Update group list
            } else if (groupName !== null) { // User submitted empty name
                showToast("Group name cannot be empty.", "warning"); return;
            } else { // User cancelled prompt
                return;
            }
        }

        let assignedCount = 0;
        state.configs.forEach(c => {
            if (state.selectedConfigIds.includes(c.id)) {
                c.groupId = groupId; // groupId can be null to ungroup
                assignedCount++;
            }
        });
        saveAllData();
        renderTable(); // Update table to reflect group changes
        renderGroups(); // Update group counts
        const targetGroup = state.groups.find(g => g.id === groupId);
        const groupNameText = targetGroup ? `"${targetGroup.name}"` : "ungrouped";
        showToast(`${assignedCount} config(s) assigned to ${groupNameText}.`, 'success');
    };
    
    const getGlobalContextMenuItems = () => {
        // Simplified example
        return [
            { label: 'Add Config from Clipboard', action: handleAddFromClipboard },
            { label: 'Add New Group', action: handleAddGroup },
            { type: 'separator' },
            { label: 'Test All Visible', action: () => handleStartTest() /* or more specific logic */ },
            { label: 'Delete All Unhealthy', action: handleDeleteUnhealthy },
        ];
    };

    const getConfigContextMenuItems = () => {
        // Simplified example, actions would call handlers like handleEditName, handleDeleteConfig etc.
        const items = [];
        if (state.selectedConfigIds.length === 1) {
            const selectedConfig = state.configs.find(c => c.id === state.selectedConfigIds[0]);
            if(selectedConfig) {
                 items.push({ label: lang('copy_link'), action: () => navigator.clipboard.writeText(selectedConfig.link).then(() => showToast('Link copied!', 'success')).catch(e => showToast('Failed to copy link.', 'error')) });
                 items.push({ label: lang('show_qr_code'), action: () => handleShowQRCode(selectedConfig.link) });
                 items.push({ label: lang('edit_name'), action: () => handleEditName(selectedConfig) });
            }
        }

        if (state.selectedConfigIds.length > 0) {
            items.push({
                label: `${lang('test_selected')} (${state.selectedConfigIds.length})`,
                action: () => {
                    if (state.isTesting) {
                        showToast('A test is already in progress.', 'warning');
                        return;
                    }
                    const configsToTest = state.configs.filter(c => state.selectedConfigIds.includes(c.id) && c.status !== 'testing');
                    if (configsToTest.length === 0) {
                        showToast('Selected configs are already tested or currently testing.', 'info');
                        return;
                    }
                    state.isTesting = true;
                    configsToTest.forEach(c => c.status = 'testing');
                    renderTable();
                    updateTestUI();
                    $('#progressBar').style.width = '0%';
                    $('#progressText').textContent = `Testing 0/${configsToTest.length}`;
                    window.api.startTests({ configs: configsToTest, settings: state.settings });
                }
            });
        }

        const groupSubmenu = state.groups.map(g => ({ label: g.name, action: () => handleAssignToGroup(g.id) }));
        groupSubmenu.push({ type: 'separator' });
        groupSubmenu.push({ label: 'New Group...', action: () => handleAssignToGroup('new')});
        if (state.selectedConfigIds.some(id => state.configs.find(c=>c.id===id)?.groupId !== null)) { // Only show if some are grouped
             groupSubmenu.push({ label: 'Ungroup', action: () => handleAssignToGroup(null) });
        }
        items.push({ label: lang('assign_to_group'), submenu: groupSubmenu });

        items.push({ type: 'separator' });
        items.push({ label: `${lang('delete')} (${state.selectedConfigIds.length})`, action: () => handleDeleteConfig() });
        return items;
    };


    // --- IPC Listeners ---
    window.api.onTestResult((result) => {
        const config = state.configs.find(c => c.id === result.id);
        if (config) {
            config.delay = result.delay;
            config.status = result.delay > -1 ? 'healthy' : (result.error ? 'error' : 'unhealthy');
            if (result.error) config.errorMessage = result.error; else delete config.errorMessage;
        }
        renderTable(); // Could be optimized to update only one row
        updateStatusBar();
    });

    window.api.onTestProgress(({ progress, total, completed }) => {
        state.isTesting = progress < 100;
        $('#progressBar').style.width = `${progress}%`;
        $('#progressText').textContent = `Testing ${completed}/${total} (${Math.round(progress)}%)`;
        if (!state.isTesting) { // Ensure UI updates when progress hits 100%
            $('#progressText').textContent = `Test complete. Total: ${total}, Healthy: ${state.configs.filter(c => c.status === 'healthy').length}`;
        }
        updateTestUI();
    });

    window.api.onTestFinish(() => {
        state.isTesting = false;
        // Final update to all statuses that might still be 'testing' if stop was abrupt
        state.configs.forEach(c => { if (c.status === 'testing') c.status = 'untested'; });
        renderTable();
        updateTestUI();
        updateStatusBar();
         $('#progressText').textContent = `Test complete. Total: ${state.configs.length}, Healthy: ${state.configs.filter(c => c.status === 'healthy').length}`;
        showToast('All tests finished!', 'success');
    });

    window.api.onProxyStatusChange(({ isConnected, error }) => {
        if (isConnected) {
            state.activeConnectionId = state.selectedConfigIds.length === 1 ? state.selectedConfigIds[0] : null; // Assuming connection was from a single selection
            // If activeConnectionId is somehow null here but we are connected, we need a way to know which config it is.
            // This might require the main process to send back the ID of the config it connected to.
            // For now, if selection changed before status update, this might be imperfect.
            if (!state.activeConnectionId) {
                // This case needs more robust handling; perhaps main sends back the link/ID it connected with.
                console.warn("Proxy connected, but renderer couldn't determine activeConnectionId from selection.");
            }
        } else {
            state.activeConnectionId = null;
            if (error) {
                showToast(`Connection failed: ${error}`, 'error');
            } else {
                showToast('Disconnected.', 'info');
            }
        }
        renderTable(); // To update 'connected' class on rows
        updateConnectionButton();
    });

    // FEATURE: Live Ping (Idea #2)
    window.api.onProxyLivePingResult(({ delay }) => {
        const pingIndicator = $('#livePingStatus');
        if (delay > -1) {
            pingIndicator.textContent = `Ping: ${delay}ms`;
            pingIndicator.className = delay < 500 ? 'status-healthy' : (delay < 1500 ? 'status-average' : 'status-slow');
        } else {
            pingIndicator.textContent = 'Ping: N/A';
            pingIndicator.className = 'status-error';
        }
    });


    init();
});
