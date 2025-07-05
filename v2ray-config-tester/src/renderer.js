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
        activeDetailConfigId: null, // For Config Details Panel
        lastTestCompletionTime: null, // For Dashboard (Feature 1)
    };

    // --- DOM Elements ---
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // --- Localization ---
    const translations = {
        en: {
            groups: "Groups", all_configs: "All Configs", add_config: "Add Config", delete_unhealthy: "Delete Unhealthy",
            start_test: "Start Test", stop_test: "Stop Test", status: "Status", name: "Name", group: "Group", country: "Country",
            protocol: "Protocol", network: "Network", delay: "Delay", port: "Port", details: "Details", connect: "Connect", disconnect: "Disconnect",
            not_connected: "Not Connected", connecting: "Connecting...", connected_to: "Connected to", settings: "Settings",
            untested: "Untested", testing: "Testing", healthy: "Healthy", unhealthy: "Unhealthy", error: "Error",
            test_selected: "Test Selected", copy_link: "Copy Link", assign_to_group: "Assign to Group",
            show_qr_code: "Show QR Code", delete: "Delete", edit_name: "Edit Name",
            confirm_delete_title: "Confirm Deletion", confirm_delete_config: "Are you sure you want to delete this config?",
            confirm_delete_group_title: "Delete Group", // New
            confirm_delete_group_message: "Are you sure you want to delete the group:", // New
            confirm_delete_group_message_configs_note: "Configs in this group will become ungrouped.", // New
            add_group_title: "Add New Group", add_group_message: "Enter the name for the new group:",
            edit_name_title: "Edit Name", edit_name_message: "Enter the new name for the config:",
            edit_group_name_title: "Edit Group Name", // New
            edit_group_name_message: "Enter the new name for the group:", // New
            toast_configs_added: "new configs added.",
            assign_to_new_group: "New Group...", // New
            ungroup_config: "Ungroup", // New
            port: "Port", // New
            // For Details Panel (Feature 7)
            config_details_title: "Config Details",
            select_config_to_view_details: "Select a config to view its details.",
            detail_name: "Name",
            detail_address: "Address",
            detail_port: "Port",
            detail_id_user: "ID/User",
            detail_password: "Password",
            detail_protocol: "Protocol",
            detail_network: "Network",
            detail_security: "Security",
            detail_tls_settings: "TLS Settings",
            detail_sni: "SNI (Server Name)",
            detail_alpn: "ALPN",
            detail_fingerprint: "TLS Fingerprint (fp)",
            detail_allow_insecure: "Allow Insecure",
            detail_ws_settings: "WebSocket Settings",
            detail_ws_path: "Path",
            detail_ws_host: "Host Header",
            detail_grpc_settings: "gRPC Settings",
            detail_service_name: "Service Name",
            detail_multi_mode: "Multi Mode",
            detail_kcp_settings: "KCP Settings",
            detail_header_type: "Header Type",
            detail_seed: "Seed",
            detail_quic_settings: "QUIC Settings",
            detail_quic_security: "QUIC Security",
            detail_quic_key: "QUIC Key",
            detail_ss_method: "Encryption Method",
            detail_flow: "Flow",
            detail_encryption: "Encryption (VLESS)",
            detail_xtls_settings: "XTLS Settings",
            detail_full_link: "Full Config Link",
            yes: "Yes",
            no: "No",
            // For Dashboard (Feature 1) - English
            db_total_configs_title: "Total Configs",
            db_healthy_configs_title: "Healthy Configs",
            db_last_test_time_title: "Last Test",
            db_connection_status_title: "Connection Status",
            never: "Never",
            moments_ago: "Moments ago",
            minutes_ago: "minutes ago",
            hours_ago: "hours ago",
            yesterday: "Yesterday",
        },
        fa: {
            groups: "گروه‌ها", all_configs: "همه کانفیگ‌ها", add_config: "افزودن کانفیگ", delete_unhealthy: "حذف ناسالم‌ها",
            start_test: "شروع تست", stop_test: "توقف تست", status: "وضعیت", name: "نام", group: "گروه", country: "کشور",
            protocol: "پروتکل", network: "شبکه", delay: "تأخیر", port: "پورت", details: "جزئیات", connect: "اتصال", disconnect: "قطع اتصال",
            not_connected: "متصل نیستید", connecting: "در حال اتصال...", connected_to: "متصل به", settings: "تنظیمات",
            untested: "تست نشده", testing: "در حال تست", healthy: "سالم", unhealthy: "ناسالم", error: "خطا",
            test_selected: "تست منتخب‌ها", copy_link: "کپی لینک", assign_to_group: "اختصاص به گروه",
            show_qr_code: "نمایش QR Code", delete: "حذف", edit_name: "ویرایش نام",
            confirm_delete_title: "تایید حذف", confirm_delete_config: "آیا از حذف این کانفیگ مطمئن هستید؟",
            confirm_delete_group_title: "حذف گروه", // New
            confirm_delete_group_message: "آیا از حذف گروه مطمئن هستید:", // New
            confirm_delete_group_message_configs_note: "کانفیگ‌های این گروه بدون گروه خواهند شد.", // New
            add_group_title: "افزودن گروه جدید", add_group_message: "نام گروه جدید را وارد کنید:",
            edit_name_title: "ویرایش نام", edit_name_message: "نام جدید کانفیگ را وارد کنید:",
            edit_group_name_title: "ویرایش نام گروه", // New
            edit_group_name_message: "نام جدید گروه را وارد کنید:", // New
            toast_configs_added: "کانفیگ جدید اضافه شد.",
            assign_to_new_group: "گروه جدید...", // New
            ungroup_config: "بدون گروه", // New
            // For Details Panel (Feature 7) - Farsi
            config_details_title: "جزئیات کانفیگ",
            select_config_to_view_details: "یک کانفیگ را برای مشاهده جزئیات انتخاب کنید.",
            detail_name: "نام",
            detail_address: "آدرس",
            detail_port: "پورت",
            detail_id_user: "شناسه/کاربر",
            detail_password: "رمز عبور",
            detail_protocol: "پروتکل",
            detail_network: "شبکه",
            detail_security: "امنیت",
            detail_tls_settings: "تنظیمات TLS",
            detail_sni: "SNI (نام سرور)",
            detail_alpn: "ALPN",
            detail_fingerprint: "اثر انگشت TLS (fp)",
            detail_allow_insecure: "Allow Insecure",
            detail_ws_settings: "تنظیمات WebSocket",
            detail_ws_path: "مسیر",
            detail_ws_host: "هدر Host",
            detail_grpc_settings: "تنظیمات gRPC",
            detail_service_name: "نام سرویس",
            detail_multi_mode: "حالت چندگانه",
            detail_kcp_settings: "تنظیمات KCP",
            detail_header_type: "نوع هدر",
            detail_seed: "Seed",
            detail_quic_settings: "تنظیمات QUIC",
            detail_quic_security: "امنیت QUIC",
            detail_quic_key: "کلید QUIC",
            detail_ss_method: "متد رمزنگاری",
            detail_flow: "Flow",
            detail_encryption: "رمزنگاری (VLESS)",
            detail_xtls_settings: "تنظیمات XTLS",
            detail_full_link: "لینک کامل کانفیگ",
            yes: "بله",
            no: "خیر",
            loading_details: "در حال بارگذاری جزئیات...",
            error_fetching_details: "خطا در دریافت جزئیات",
            error_config_not_found: "کانفیگ یافت نشد",
            detail_alter_id: "Alter ID",
            detail_security_vmess: "رمزنگاری (VMess)",
            detail_xtls_settings_shortid: "شناسه کوتاه (XTLS/REALITY)",
            detail_xtls_settings_publickey: "کلید عمومی (XTLS/REALITY)",
            // For Dashboard (Feature 1) - Farsi
            db_total_configs_title: "تعداد کل کانفیگ‌ها",
            db_healthy_configs_title: "کانفیگ‌های سالم",
            db_last_test_time_title: "آخرین تست",
            db_connection_status_title: "وضعیت اتصال",
            never: "هرگز", // For last test time if never run
            moments_ago: "لحظاتی پیش",
            minutes_ago: "دقیقه پیش",
            hours_ago: "ساعت پیش",
            yesterday: "دیروز",
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

    const formatDetails = (config) => {
        const parts = [];
        if (config.networkType) parts.push(`Net: ${config.networkType}`);
        if (config.security) parts.push(`Sec: ${config.security}`);
        if (config.sni) parts.push(`SNI: ${config.sni}`);
        if (config.fp) parts.push(`FP: ${config.fp}`);
        if (config.path) parts.push(`Path: ${config.path}`);
        if (config.serviceName) parts.push(`Svc: ${config.serviceName}`);
        // Add more details as needed, e.g., flow, encryption for VLESS, method for SS
        if (config.protocol === 'vless') {
            if (config.encryption && config.encryption !== 'none') parts.push(`Enc: ${config.encryption}`);
            if (config.flow) parts.push(`Flow: ${config.flow}`);
        } else if (config.protocol === 'ss') {
            if (config.method) parts.push(`Method: ${config.method}`);
        }

        let detailsStr = parts.join(', ');
        if (detailsStr.length > 30) { // Simple truncation for display
            detailsStr = detailsStr.substring(0, 27) + '...';
        }
        return detailsStr;
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
        // Retrieve last test time from loaded settings
        if (state.settings && state.settings.lastTestCompletionTime) {
            state.lastTestCompletionTime = state.settings.lastTestCompletionTime;
        }
        addEventListeners();
        renderAll();
        updateDashboard(); // Initial dashboard update
    };

    // --- Render Functions ---
    const renderAll = () => {
        renderTable();
        renderGroups();
        updateStatusBar(); // This updates the general status bar text
        updateConnectionButton(); // This updates the connect/disconnect button and its text
        updateTestUI();
        updateLangUI();
        // Note: updateDashboard() is called separately when specific data changes
    };

    const updateDashboard = () => {
        const dbTotalConfigs = $('#dbTotalConfigs');
        const dbHealthyConfigs = $('#dbHealthyConfigs');
        const dbLastTestTime = $('#dbLastTestTime');
        const dbConnectionStatus = $('#dbConnectionStatus');

        if (dbTotalConfigs) dbTotalConfigs.textContent = state.configs.length;

        if (dbHealthyConfigs) dbHealthyConfigs.textContent = state.configs.filter(c => c.status === 'healthy').length;

        if (dbLastTestTime) {
            if (state.lastTestCompletionTime) {
                const now = new Date();
                const lastTest = new Date(state.lastTestCompletionTime);
                const diffMs = now - lastTest;
                const diffSecs = Math.round(diffMs / 1000);
                const diffMins = Math.round(diffSecs / 60);
                const diffHours = Math.round(diffMins / 60);

                if (diffSecs < 60) {
                    dbLastTestTime.textContent = lang('moments_ago');
                } else if (diffMins < 60) {
                    dbLastTestTime.textContent = `${diffMins} ${lang('minutes_ago')}`;
                } else if (diffHours < 24) {
                    dbLastTestTime.textContent = `${diffHours} ${lang('hours_ago')}`;
                } else if (diffHours < 48) {
                    dbLastTestTime.textContent = lang('yesterday');
                } else {
                    dbLastTestTime.textContent = lastTest.toLocaleDateString();
                }
            } else {
                dbLastTestTime.textContent = lang('never');
            }
        }

        if (dbConnectionStatus) {
            if (state.activeConnectionId) {
                const config = state.configs.find(c => c.id === state.activeConnectionId);
                dbConnectionStatus.textContent = `${lang('connected_to')} ${config?.name || 'Unknown'}`;
                // Change icon color on dashboard stat for connection
                const iconEl = dbConnectionStatus.closest('.dashboard-stat')?.querySelector('.stat-icon i');
                const statBox = dbConnectionStatus.closest('.dashboard-stat');
                if(iconEl) iconEl.style.color = 'var(--success-color)';
                if(statBox) statBox.style.borderColor = 'var(--success-color)';


            } else {
                dbConnectionStatus.textContent = lang('not_connected');
                const iconEl = dbConnectionStatus.closest('.dashboard-stat')?.querySelector('.stat-icon i');
                const statBox = dbConnectionStatus.closest('.dashboard-stat');
                if(iconEl) iconEl.style.color = 'var(--disconnected-color)';
                if(statBox) statBox.style.borderColor = 'var(--disconnected-color)';
            }
        }
    };


    const renderTable = () => {
        const tableBody = $('#configsTableBody');
        const configsToRender = getVisibleConfigs();
        const colspanValue = 9; // 7 original columns + 1 for Port + 1 for Details

        if (configsToRender.length === 0 && state.searchTerm === '' && state.activeGroupId === 'all') {
            tableBody.innerHTML = `<tr><td colspan="${colspanValue}" style="text-align: center; padding: 40px;">No configurations added yet. Click "Add Config" or "Import".</td></tr>`;
            return;
        } else if (configsToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${colspanValue}" style="text-align: center; padding: 40px;">No configurations match the current filter or search term.</td></tr>`;
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

                // Country cell update - more granular to avoid broken img for 'XX'
                const countryCell = cells[3];
                const existingImg = countryCell.querySelector('img.country-flag');
                const existingSpan = countryCell.querySelector('span');

                if (config.country && config.country.toUpperCase() !== 'XX') {
                    if (existingImg) {
                        const newSrc = `https://flagcdn.com/${config.country.toLowerCase()}.svg`;
                        if (existingImg.src !== newSrc) existingImg.src = newSrc;
                        existingImg.alt = config.country;
                        existingImg.style.display = '';
                    } else {
                        const img = document.createElement('img');
                        img.src = `https://flagcdn.com/${config.country.toLowerCase()}.svg`;
                        img.alt = config.country;
                        img.className = 'country-flag';
                        countryCell.prepend(img); // Prepend to keep order if span exists
                    }
                    if (existingSpan) existingSpan.textContent = config.country;
                    else { // Create span if not exists
                        const span = document.createElement('span');
                        span.textContent = config.country;
                        countryCell.appendChild(span);
                    }
                } else { // 'XX' or no country
                    if (existingImg) existingImg.style.display = 'none';
                    if (existingSpan) existingSpan.textContent = config.country || ''; // Display 'XX' or empty
                    else { // Create span if not exists
                        const span = document.createElement('span');
                        span.textContent = config.country || '';
                        countryCell.appendChild(span);
                    }
                }

                cells[4].textContent = formatDelay(config.delay);
                cells[5].textContent = config.protocol;
                cells[6].textContent = config.network;
                cells[7].textContent = config.portToDisplay || '-'; // New Port cell
                cells[8].textContent = formatDetails(config);
                cells[8].title = formatDetails(config);

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
                    <td>${config.portToDisplay || '-'}</td>
                    <td title="${formatDetails(config)}">${formatDetails(config)}</td>
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
            li.dataset.groupId = group.id; // Keep this for selecting the group

            const groupNameSpan = document.createElement('span');
            groupNameSpan.textContent = group.name;

            const iconFolder = document.createElement('i');
            iconFolder.className = 'fa-solid fa-folder';

            li.appendChild(iconFolder);
            li.appendChild(document.createTextNode(' ')); // Add a space
            li.appendChild(groupNameSpan);

            const configCountSpan = document.createElement('span');
            configCountSpan.className = 'group-count';
            configCountSpan.textContent = state.configs.filter(c => c.groupId === group.id).length;
            li.appendChild(configCountSpan);

            const actionsSpan = document.createElement('span');
            actionsSpan.className = 'group-actions';

            const editBtn = document.createElement('i');
            editBtn.className = 'fa-solid fa-pencil btn-edit-group';
            editBtn.title = 'Edit group name';
            editBtn.dataset.groupId = group.id;
            actionsSpan.appendChild(editBtn);

            const deleteBtn = document.createElement('i');
            deleteBtn.className = 'fa-solid fa-trash-alt btn-delete-group';
            deleteBtn.title = 'Delete group';
            deleteBtn.dataset.groupId = group.id;
            actionsSpan.appendChild(deleteBtn);

            li.appendChild(actionsSpan);
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

                // Extract details for the new "Details" column
                const protocolName = url.protocol.slice(0, -1).toLowerCase();
                const searchParams = url.searchParams;

                const configDetails = {
                    port: url.port,
                    networkType: searchParams.get('type') || (protocolName === 'vmess' ? 'tcp' : 'tcp'), // vmess might have 'net' in JSON
                    security: searchParams.get('security') || 'none',
                    sni: searchParams.get('sni') || searchParams.get('host') || '',
                    fp: searchParams.get('fp') || '',
                    path: searchParams.get('path') || '',
                    serviceName: searchParams.get('serviceName') || '',
                    encryption: searchParams.get('encryption') || '', // VLESS
                    flow: searchParams.get('flow') || '',             // VLESS
                    // Note: For VMess, many details (like 'net', 'tls', 'sni', 'path') are in the base64 part.
                    // For SS, method is part of the userinfo.
                    // This simple extraction here is a baseline. True detailed parsing still relies on main.js::parseConfigLink.
                    // We are adding what's easily available from URL for display purposes.
                };
                 if (protocolName === 'vmess') { // VMess often has details in fragment or needs base64 decode
                    // A proper solution would be an IPC call to main process's parseConfigLink to get full details.
                    // For now, we'll rely on what's in searchParams or make educated guesses.
                    configDetails.networkType = searchParams.get('type') || searchParams.get('net') || 'tcp';
                    if (searchParams.get('tls') === 'tls') configDetails.security = 'tls';
                }


                state.configs.push({
                    id: `cfg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    link, name, country,
                    address: url.hostname,
                    protocol: protocolName,
                    // 'network' is used for the table column, 'networkType' for details to avoid conflict
                    network: configDetails.networkType, // Keep existing 'network' field for direct display
                    portToDisplay: url.port || '-', // Store port for direct display in table
                    status: 'untested', delay: null,
                    // Fix: Assign to active group if not 'all', otherwise null
                    groupId: state.activeGroupId && state.activeGroupId !== 'all' ? state.activeGroupId : null,
                    // Store extracted details (these are used by formatDetails)
                    port: configDetails.port, // Keep this for formatDetails consistency
                    security: configDetails.security,
                    sni: configDetails.sni,
                    fp: configDetails.fp,
                    path: configDetails.path,
                    serviceName: configDetails.serviceName,
                    encryption: configDetails.encryption, // VLESS specific
                    flow: configDetails.flow,             // VLESS specific
                    // method: extractedMethodForSS, // SS specific, harder to get from URL without full parsing
                });
                existingLinks.add(link);
                addedCount++;
            } catch (e) { console.warn("Skipping invalid config:", link, e); }
        }
        if (addedCount > 0) {
            saveAllData();
            renderAll();
            updateDashboard(); // Update dashboard after adding configs
            showToast(`${addedCount} ${lang('toast_configs_added')}`, 'success');
        }
    };

    const saveAllData = () => {
        // Persist lastTestCompletionTime with other settings
        const settingsToSave = {
            ...state.settings,
            lastTestCompletionTime: state.lastTestCompletionTime
        };
        window.api.saveAllData({ configs: state.configs, groups: state.groups, settings: settingsToSave });
    };

    // --- Modals, Toasts, Context Menu ---
    // renderAll already calls renderTable, which calls updateSelectAllCheckboxState.
    // So functions calling renderAll don't need a separate call to updateSelectAllCheckboxState.

    const openModal = (modalId) => {
        const backdrop = $('#modalBackdrop');
        if (!backdrop) {
            console.error('Modal backdrop (#modalBackdrop) not found.');
            showToast('Error: Modal system is broken (backdrop missing).', 'error');
            return;
        }

        const modalElement = $(`#${modalId}`);
        if (!modalElement) {
            console.error(`Modal element with ID #${modalId} not found.`);
            showToast(`Error: Modal #${modalId} not found.`, 'error');
            return;
        }

        // Hide any currently active modals first
        $$('.modal.active').forEach(activeModal => {
            if (activeModal.id !== modalId) { // Don't remove active from the one we are about to show
                activeModal.classList.remove('active');
            }
        });

        // Populate specific modal content before showing
        if (modalId === 'settingsModal') {
            const concurrentTestsInput = $('#concurrentTestsInput');
            const testTimeoutInput = $('#testTimeoutInput');
            const testUrlInput = $('#testUrlInput');
            if (concurrentTestsInput) concurrentTestsInput.value = state.settings.concurrentTests; else console.warn('#concurrentTestsInput not found');
            if (testTimeoutInput) testTimeoutInput.value = state.settings.testTimeout; else console.warn('#testTimeoutInput not found');
            if (testUrlInput) testUrlInput.value = state.settings.testUrl; else console.warn('#testUrlInput not found');
        } else if (modalId === 'promptModal') {
            const promptInput = $('#promptInput');
            if (promptInput) {
                // Value is set by showPrompt, focus after modal is displayed
            } else {
                console.warn('#promptInput not found');
            }
        } else if (modalId === 'qrCodeModal') {
            const qrCodeNameEl = $('#qrCodeName');
            if(qrCodeNameEl) qrCodeNameEl.textContent = '';
        }

        backdrop.style.display = 'flex'; // Make backdrop visible
        backdrop.classList.add('active');  // For opacity transition

        modalElement.classList.add('active'); // Make specific modal visible (CSS handles display:flex and animation)

        if (modalId === 'promptModal') {
            const promptInput = $('#promptInput');
            if (promptInput) promptInput.focus(); // Focus after modal is made visible
        }
    };

    const closeModal = () => {
        const backdrop = $('#modalBackdrop');
        if (backdrop) {
            backdrop.style.display = 'none'; // Hide backdrop immediately
            backdrop.classList.remove('active'); // For opacity transition
        } else {
            console.error("Modal backdrop #modalBackdrop not found during closeModal.");
        }
        // Remove .active from any modal that might have it
        $$('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    };
    
    const showContextMenu = (e, items) => {
        const menu = $('#contextMenu');
        if (!menu) {
            console.error('#contextMenu element not found.');
            return;
        }
        menu.innerHTML = ''; // Clear previous items
        menu.classList.remove('active'); // Remove active class before potential re-display

        const ul = document.createElement('ul');
        items.forEach(item => {
            if (item.type === 'separator') {
                const hr = document.createElement('hr');
                ul.appendChild(hr);
            } else {
                const li = document.createElement('li');
                if (item.iconClass) {
                    const icon = document.createElement('i');
                    item.iconClass.split(' ').forEach(cls => icon.classList.add(cls));
                    li.appendChild(icon); // Prepend icon
                }
                const textNode = document.createTextNode(item.label);
                li.appendChild(textNode);

                if (item.disabled) {
                    li.classList.add('disabled');
                } else if (typeof item.action === 'function') {
                    li.addEventListener('click', (clickEvent) => {
                        clickEvent.stopPropagation(); // Prevent click from bubbling to document listener immediately
                        item.action();
                        menu.style.display = 'none';
                        menu.classList.remove('active');
                    });
                } else if (item.submenu) {
                    // This is a submenu parent. For now, make it non-interactive or style it.
                    // Full submenu functionality is a later enhancement.
                    li.classList.add('submenu-parent'); // Add a class for styling
                    const arrow = document.createElement('span');
                    arrow.className = 'submenu-arrow'; // Style this with CSS
                    arrow.innerHTML = ' &raquo;'; // Example arrow
                    li.appendChild(arrow);
                    // Make it non-clickable for now, or setup hover to show submenu later
                }
                ul.appendChild(li);
            }
        });
        menu.appendChild(ul);

        // Position and display the menu
        const { innerWidth, innerHeight } = window;
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        let left = e.pageX;
        let top = e.pageY;

        if (left + menuWidth > innerWidth) {
            left = innerWidth - menuWidth - 5; // Adjust to stay within viewport
        }
        if (top + menuHeight > innerHeight) {
            top = innerHeight - menuHeight - 5; // Adjust to stay within viewport
        }

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        menu.style.display = 'block';
        requestAnimationFrame(() => { // Use rAF to ensure styles are applied before adding class for transition
             menu.classList.add('active');
        });


        const clickOutsideHandler = (event) => {
            if (!menu.contains(event.target)) {
                menu.style.display = 'none';
                menu.classList.remove('active');
                document.removeEventListener('click', clickOutsideHandler, true); // Use capture phase for reliable removal
            }
        };

        // Add timeout to allow current event loop to finish before adding listener
        setTimeout(() => {
            document.addEventListener('click', clickOutsideHandler, true); // Use capture phase
        }, 0);
    };
    
    const showToast = (message, type = 'info') => {
        const toastContainer = $('#toastContainer');
        if (!toastContainer) {
            console.error('Toast container #toastContainer not found.');
            // Fallback to console if toast system is broken
            console.log(`Toast (${type}): ${message}`);
            return;
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`; // e.g., toast info, toast success
        toast.textContent = message;

        // Add an icon based on type for better visual feedback
        const icon = document.createElement('i');
        const iconClasses = {
            success: 'fa-solid fa-check-circle',
            error: 'fa-solid fa-times-circle',
            info: 'fa-solid fa-info-circle',
            warning: 'fa-solid fa-exclamation-triangle'
        };
        icon.className = iconClasses[type] || iconClasses.info; // Default to info icon
        toast.prepend(icon); // Add icon before the message

        toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Set timeout to remove the toast
        setTimeout(() => {
            toast.classList.remove('show');
            // Wait for fade out animation to complete before removing from DOM
            toast.addEventListener('transitionend', () => {
                if (toast.parentElement) { // Check if still in DOM
                    toast.remove();
                }
            }, { once: true }); // Important: Use once to prevent multiple removals if transitionend fires multiple times
        }, 4600); // Start fade-out slightly before 5s total lifetime
    };

    const showConfirm = ({ title, message, okText = 'تایید', cancelText = 'لغو' }) => {
        return new Promise(resolve => {
            const confirmTitleEl = $('#confirmTitle');
            const confirmMessageEl = $('#confirmMessage');
            const confirmOkBtnEl = $('#confirmOkBtn');
            const confirmCancelBtnEl = $('#confirmCancelBtn');

            if (!confirmTitleEl || !confirmMessageEl || !confirmOkBtnEl || !confirmCancelBtnEl) {
                console.error("One or more elements for confirmModal are missing from the DOM.");
                showToast("Error: Confirmation dialog is broken.", "error");
                resolve(false); // Resolve with false as the dialog cannot be shown
                return;
            }

            confirmTitleEl.textContent = title;
            confirmMessageEl.textContent = message;
            confirmOkBtnEl.textContent = okText;
            confirmCancelBtnEl.textContent = cancelText;

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
            const promptTitleEl = $('#promptTitle');
            const promptMessageEl = $('#promptMessage');
            const promptInputEl = $('#promptInput');
            const promptOkBtnEl = $('#promptOkBtn');
            const promptCancelBtnEl = $('#promptCancelBtn');

            if (!promptTitleEl || !promptMessageEl || !promptInputEl || !promptOkBtnEl || !promptCancelBtnEl) {
                console.error("One or more elements for promptModal are missing from the DOM.");
                showToast("Error: Prompt dialog is broken.", "error");
                resolve(null); // Resolve with null as the dialog cannot be shown/used
                return;
            }

            promptTitleEl.textContent = title;
            promptMessageEl.textContent = message;
            promptInputEl.value = defaultValue;

            openModal('promptModal');
            promptInputEl.focus();
            // Ensure promptInputEl is not null before adding event listener to it
            // This is covered by the check above, but explicit check for keydown is fine
             if(promptInputEl) promptInputEl.onkeydown = (e) => { if (e.key === 'Enter') onOk(); };


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

    // --- Config Details Panel Logic (Feature 7) ---
    const showDetailsPanel = async (configId) => {
        const config = state.configs.find(c => c.id === configId);
        if (!config) {
            showToast(lang('error_config_not_found') || 'Config not found.', 'error');
            return;
        }

        // If panel is already open for this config, optionally toggle or do nothing. For now, just re-fetch and show.
        // if ($('#configDetailsPanel').classList.contains('open') && state.activeDetailConfigId === configId) {
        //     closeDetailsPanel();
        //     return;
        // }

        showToast(lang('loading_details') || 'Loading details...', 'info'); // Add translation
        try {
            const result = await window.api.getFullConfigDetails(config.link);
            if (result.success) {
                populateDetailsPanel(result.details, config); // Pass original config for name, link etc.
                $('#configDetailsPanel').classList.add('open');
                state.activeDetailConfigId = configId;
            } else {
                throw new Error(result.error || 'Failed to get config details.');
            }
        } catch (error) {
            console.error("Error fetching full config details:", error);
            showToast(`${lang('error_fetching_details') || 'Error fetching details'}: ${error.message}`, 'error'); // Add translation
            closeDetailsPanel(); // Close if it was trying to open, or clear if already open
        }
    };

    const closeDetailsPanel = () => {
        $('#configDetailsPanel').classList.remove('open');
        state.activeDetailConfigId = null;
        // Optionally, clear content after animation or revert to placeholder
        setTimeout(() => {
            if (!$('#configDetailsPanel').classList.contains('open')) { // Check if still closed
                const panelBody = $('#configDetailsBody');
                panelBody.innerHTML = `<p class="empty-state" data-lang="select_config_to_view_details">${lang('select_config_to_view_details')}</p>`;
            }
        }, 300); // Match CSS transition duration
    };

    const populateDetailsPanel = (details, originalConfig) => {
        const panelBody = $('#configDetailsBody');
        panelBody.innerHTML = ''; // Clear previous content or placeholder

        const addDetail = (labelKey, value, isLong = false) => {
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                return; // Don't display empty fields
            }
            const item = document.createElement('div');
            item.className = 'detail-item';

            const label = document.createElement('div');
            label.className = 'detail-label';
            label.textContent = lang(labelKey) || labelKey.replace(/_/g, ' ');

            const valueDiv = document.createElement('div');
            valueDiv.className = 'detail-value';
            if (typeof value === 'boolean') {
                valueDiv.textContent = value ? lang('yes') : lang('no');
            } else if (Array.isArray(value)) {
                valueDiv.textContent = value.join(', ');
            } else {
                valueDiv.textContent = value;
            }

            if (isLong) valueDiv.classList.add('long');

            item.appendChild(label);
            item.appendChild(valueDiv);
            panelBody.appendChild(item);
        };

        // Basic Info from originalConfig (already in renderer)
        addDetail('detail_name', originalConfig.name);
        addDetail('detail_protocol', details.protocol); // From full details
        addDetail('detail_address', originalConfig.address);
        addDetail('detail_port', originalConfig.portToDisplay);

        // Protocol Specific Settings (from details.settings)
        if (details.settings) {
            if (details.protocol === 'vless' && details.settings.vnext && details.settings.vnext[0]) {
                const vnext = details.settings.vnext[0];
                if (vnext.users && vnext.users[0]) {
                    addDetail('detail_id_user', vnext.users[0].id);
                    addDetail('detail_encryption', vnext.users[0].encryption);
                    addDetail('detail_flow', vnext.users[0].flow);
                }
            } else if (details.protocol === 'vmess' && details.settings.vnext && details.settings.vnext[0]) {
                const vnext = details.settings.vnext[0];
                if (vnext.users && vnext.users[0]) {
                    addDetail('detail_id_user', vnext.users[0].id);
                    addDetail('detail_alter_id', vnext.users[0].alterId); // Add lang key
                    addDetail('detail_security_vmess', vnext.users[0].security); // Add lang key e.g. "Cipher (VMess)"
                }
            } else if (details.protocol === 'trojan' && details.settings.servers && details.settings.servers[0]) {
                addDetail('detail_password', details.settings.servers[0].password);
            } else if (details.protocol === 'ss' && details.settings.servers && details.settings.servers[0]) {
                addDetail('detail_ss_method', details.settings.servers[0].method);
                addDetail('detail_password', details.settings.servers[0].password);
            }
        }

        // Stream Settings (from details.streamSettings)
        if (details.streamSettings) {
            addDetail('detail_network', details.streamSettings.network);
            addDetail('detail_security', details.streamSettings.security);

            if (details.streamSettings.security === 'tls' || details.streamSettings.security === 'xtls') {
                const tlsSettings = details.streamSettings.tlsSettings || {};
                addDetail('detail_sni', tlsSettings.serverName);
                addDetail('detail_alpn', tlsSettings.alpn); // Will be displayed as comma-separated string if array
                addDetail('detail_fingerprint', tlsSettings.fingerprint);
                addDetail('detail_allow_insecure', typeof tlsSettings.allowInsecure === 'boolean' ? tlsSettings.allowInsecure : undefined);
                // TODO: Add publicKey, shortId if present
            }
             if (details.streamSettings.security === 'xtls') { // XTLS specific on top of TLS
                const realitySettings = details.streamSettings.realitySettings || {}; // If XTLS uses REALITY
                addDetail('detail_xtls_settings_shortid', realitySettings.shortId); // Add lang key
                addDetail('detail_xtls_settings_publickey', realitySettings.publicKey); // Add lang key
             }


            if (details.streamSettings.network === 'ws' && details.streamSettings.wsSettings) {
                addDetail('detail_ws_path', details.streamSettings.wsSettings.path);
                if (details.streamSettings.wsSettings.headers) {
                    addDetail('detail_ws_host', details.streamSettings.wsSettings.headers.Host);
                }
            } else if (details.streamSettings.network === 'grpc' && details.streamSettings.grpcSettings) {
                addDetail('detail_service_name', details.streamSettings.grpcSettings.serviceName);
                addDetail('detail_multi_mode', typeof details.streamSettings.grpcSettings.multiMode === 'boolean' ? details.streamSettings.grpcSettings.multiMode : undefined);
            } else if (details.streamSettings.network === 'kcp' && details.streamSettings.kcpSettings) {
                addDetail('detail_header_type', details.streamSettings.kcpSettings.header?.type);
                addDetail('detail_seed', details.streamSettings.kcpSettings.seed);
                // Could add MTU, TTI etc. if desired
            } else if (details.streamSettings.network === 'quic' && details.streamSettings.quicSettings) {
                addDetail('detail_quic_security', details.streamSettings.quicSettings.security);
                addDetail('detail_quic_key', details.streamSettings.quicSettings.key);
                addDetail('detail_header_type', details.streamSettings.quicSettings.header?.type);
            }
            // TODO: Add other network types like tcp (http obfuscation), httpupgrade etc.
        }
        addDetail('detail_full_link', originalConfig.link, true);
    };


    // --- Event Listeners ---
    function addEventListeners() {
        const safelyAddEventListener = (selector, event, handler, queryAll = false) => {
            try {
                if (queryAll) {
                    const elements = $$(selector);
                    if (elements && elements.length > 0) {
                        elements.forEach(el => el.addEventListener(event, handler));
                    } else {
                        console.warn(`No elements found for selector '${selector}' to attach event listeners.`);
                    }
                } else {
                    const element = $(selector);
                    if (element) {
                        element.addEventListener(event, handler);
                    } else {
                        console.warn(`Element not found for selector '${selector}' to attach event listener.`);
                    }
                }
            } catch (error) {
                console.error(`Error attaching event listener to ${selector}:`, error);
            }
        };

        // Config Details Panel
        safelyAddEventListener('#closeDetailsPanelBtn', 'click', closeDetailsPanel);


        // Toolbar buttons
        safelyAddEventListener('#openAddModalBtn', 'click', () => openModal('addConfigModal'));
        safelyAddEventListener('#deleteUnhealthyBtn', 'click', handleDeleteUnhealthy);
        safelyAddEventListener('#startTestBtn', 'click', handleStartTest);
        safelyAddEventListener('#stopTestBtn', 'click', () => window.api.stopTests());

        // Search
        safelyAddEventListener('#searchBox', 'input', handleSearch);

        // Sidebar
        safelyAddEventListener('#addGroupBtn', 'click', handleAddGroup);
        safelyAddEventListener('#groupList', 'click', (e) => {
            const groupItem = e.target.closest('.group-item');
            const editBtn = e.target.closest('.btn-edit-group');
            const deleteBtn = e.target.closest('.btn-delete-group');

            if (editBtn && groupItem) {
                const groupId = editBtn.dataset.groupId;
                if (groupId && groupId !== 'all') { // Cannot edit/delete "All Configs"
                    handleEditGroup(groupId);
                }
            } else if (deleteBtn && groupItem) {
                const groupId = deleteBtn.dataset.groupId;
                if (groupId && groupId !== 'all') { // Cannot edit/delete "All Configs"
                    handleDeleteGroup(groupId);
                }
            } else if (groupItem) {
                // This is a click on the group item itself (not edit/delete buttons)
                handleGroupClick(e);
            }
        });

        // Main table
        safelyAddEventListener('#configsTableBody', 'click', handleTableClick);
        safelyAddEventListener('#configsTableBody', 'contextmenu', handleTableContextMenu);
        safelyAddEventListener('#configsTable th[data-sort]', 'click', handleSortClick, true); // queryAll = true
        safelyAddEventListener('#selectAllCheckbox', 'change', handleSelectAllToggle);

        // Status bar
        safelyAddEventListener('#connectBtn', 'click', handleConnectToggle);
        safelyAddEventListener('#settingsBtn', 'click', () => openModal('settingsModal'));
        safelyAddEventListener('#themeToggleBtn', 'click', () => {
            state.currentTheme = state.currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
            document.body.className = state.currentTheme;
            localStorage.setItem('theme', state.currentTheme);
            const icon = $('#themeToggleBtn i');
            if (icon) icon.className = state.currentTheme === 'dark-theme' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        });
        safelyAddEventListener('#langToggleBtn', 'click', () => {
            state.currentLanguage = state.currentLanguage === 'en' ? 'fa' : 'en';
            updateLangUI();
            renderAll();
        });

        // Settings Modal Buttons
        safelyAddEventListener('#saveSettingsBtn', 'click', () => {
            handleSaveSettings();
            closeModal();
        });
        safelyAddEventListener('#cancelSettingsBtn', 'click', () => {
            closeModal();
        });

        safelyAddEventListener('#importDataBtn', 'click', handleImportData);
        safelyAddEventListener('#exportDataBtn', 'click', handleExportData);
        safelyAddEventListener('#exportHealthyBtn', 'click', () => {
            const healthyConfigs = state.configs.filter(c => c.status === 'healthy');
            handleExportConfigs(healthyConfigs, 'healthy-configs.txt');
        });
        safelyAddEventListener('#clearAllDataBtn', 'click', handleClearAllData);

        // Add Config Modal Buttons
        safelyAddEventListener('#addFromSubLinkBtn', 'click', handleFetchSubscription);
        safelyAddEventListener('#addFromPasteBtn', 'click', handleAddConfigFromText);
        safelyAddEventListener('#addFromFileBtn', 'click', handleImportTextFile);

        // Modals general close buttons
        safelyAddEventListener('.close-modal-btn, #modalBackdrop', 'click', closeModal, true); // queryAll = true

        // Specific cancel buttons for confirm/prompt modals also just close.
        safelyAddEventListener('#confirmCancelBtn', 'click', closeModal);
        safelyAddEventListener('#promptCancelBtn', 'click', closeModal);

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
                state.lastTestCompletionTime = null; // Reset last test time
                saveAllData(); // Persist cleared state
                renderAll();
                updateDashboard(); // Update dashboard after clearing
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
                const qrImageEl = $('#qrCodeImage');
                const qrNameEl = $('#qrCodeName'); // Corrected ID

                if (qrImageEl) qrImageEl.src = dataUrl;
                else console.error("#qrCodeImage element not found for QR Code modal.");

                if (qrNameEl) qrNameEl.textContent = link; // Display the link as well
                else console.error("#qrCodeName element not found for QR Code modal.");

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
        if (!row || !row.dataset.id) return; // Click was not on a config row

        const configId = row.dataset.id;
        const isCheckboxClick = e.target.type === 'checkbox';
        const isSpecialKey = e.ctrlKey || e.metaKey || e.shiftKey;

        // Logic for selection (Ctrl/Shift clicks or checkbox clicks)
        if (isCheckboxClick || isSpecialKey) {
            if (e.shiftKey && state.lastSelectedId) {
                const visibleConfigs = getVisibleConfigs();
                const lastIdx = visibleConfigs.findIndex(c => c.id === state.lastSelectedId);
                const currentIdx = visibleConfigs.findIndex(c => c.id === configId);
                if (lastIdx !== -1 && currentIdx !== -1) {
                    const start = Math.min(lastIdx, currentIdx);
                    const end = Math.max(lastIdx, currentIdx);
                    const shiftSelectedIds = visibleConfigs.slice(start, end + 1).map(c => c.id);
                    // If the checkbox itself was clicked to initiate shift-select
                    if (isCheckboxClick && e.target.checked) {
                        state.selectedConfigIds = [...new Set([...state.selectedConfigIds, ...shiftSelectedIds])];
                    } else if (isCheckboxClick && !e.target.checked) {
                        state.selectedConfigIds = state.selectedConfigIds.filter(id => !shiftSelectedIds.includes(id));
                    } else { // Row click with shift (not directly on checkbox)
                        state.selectedConfigIds = shiftSelectedIds;
                    }
                }
            } else if (e.ctrlKey || e.metaKey) { // Ctrl/Cmd click
                if (state.selectedConfigIds.includes(configId)) {
                    state.selectedConfigIds = state.selectedConfigIds.filter(id => id !== configId);
                } else {
                    state.selectedConfigIds.push(configId);
                }
                state.lastSelectedId = configId;
            } else { // Simple click (could be on checkbox or row)
                state.selectedConfigIds = [configId];
                state.lastSelectedId = configId;
            }
            renderTable(); // Re-render for selection changes
            updateConnectionButton();
        }

        // Logic for showing details panel (only on simple row click, not checkbox/multi-select)
        // It should open if the click was not on a checkbox, and not a multi-select action
        // unless the panel is already open for that ID.
        if (!isCheckboxClick && !isSpecialKey) {
            if (state.activeDetailConfigId === configId && $('#configDetailsPanel').classList.contains('open')) {
                // If already open for this config, a simple click might close it (optional behavior)
                // For now, let's assume a simple click on an already detailed config does nothing to the panel
                // or re-affirms it. Or, if we want toggle: closeDetailsPanel();
            } else {
                showDetailsPanel(configId);
            }
        } else if (isCheckboxClick && state.selectedConfigIds.includes(configId) && state.selectedConfigIds.length === 1) {
            // If a checkbox is clicked and it's the only selected item, also show its details.
            showDetailsPanel(configId);
        } else if (state.selectedConfigIds.length !== 1 && $('#configDetailsPanel').classList.contains('open')) {
            // If multiple items are now selected, or no items, close the details panel.
            closeDetailsPanel();
        }
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

    const handleEditGroup = async (groupId) => {
        const group = state.groups.find(g => g.id === groupId);
        if (!group) {
            showToast('Group not found for editing.', 'error');
            return;
        }

        const newGroupName = await showPrompt({
            title: lang('edit_group_name_title') || 'Edit Group Name', // Add to translations
            message: lang('edit_group_name_message') || 'Enter the new name for the group:', // Add to translations
            defaultValue: group.name
        });

        if (newGroupName && newGroupName.trim() !== '' && newGroupName.trim() !== group.name) {
            group.name = newGroupName.trim();
            saveAllData();
            renderGroups(); // Re-render the group list
            // No need to renderTable unless group name is shown in the table directly and not just via config.groupId lookup
            showToast(`Group name updated to "${group.name}".`, 'success');
        } else if (newGroupName !== null && newGroupName.trim() === '') {
            showToast('Group name cannot be empty.', 'warning');
        }
        // If newGroupName is null (cancel) or same as old name, do nothing.
    };

    const handleDeleteGroup = async (groupId) => {
        const groupToDelete = state.groups.find(g => g.id === groupId);
        if (!groupToDelete) {
            showToast('Group not found for deletion.', 'error');
            return;
        }

        const confirmed = await showConfirm({
            title: lang('confirm_delete_group_title') || 'Delete Group', // Add to translations
            message: `${lang('confirm_delete_group_message') || 'Are you sure you want to delete the group:'} "${groupToDelete.name}"? ${lang('confirm_delete_group_message_configs_note') || 'Configs in this group will become ungrouped.'}` // Add to translations
        });

        if (confirmed) {
            state.groups = state.groups.filter(g => g.id !== groupId);
            state.configs.forEach(c => {
                if (c.groupId === groupId) {
                    c.groupId = null; // Ungroup configs
                }
            });

            if (state.activeGroupId === groupId) {
                state.activeGroupId = 'all'; // Reset to all if active group was deleted
            }

            saveAllData();
            renderAll(); // Re-render groups and table (as configs might have changed group)
            showToast(`Group "${groupToDelete.name}" deleted.`, 'success');
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

        // --- Assign to Group Options ---
        if (state.selectedConfigIds.length > 0) {
            items.push({ type: 'separator' });
            // Add a non-clickable label for the section
            items.push({ label: lang('assign_to_group'), disabled: true }); // Make it a non-actionable header

            state.groups.forEach(g => {
                items.push({
                    label: `  ${g.name}`, // Indent for visual grouping
                    action: () => handleAssignToGroup(g.id)
                });
            });
            items.push({ type: 'separator' });
            items.push({
                label: `  ${lang('assign_to_new_group') || 'New Group...'}`, // Add translation if needed
                action: () => handleAssignToGroup('new')
            });
            if (state.selectedConfigIds.some(id => state.configs.find(c => c.id === id)?.groupId !== null)) {
                items.push({
                    label: `  ${lang('ungroup_config') || 'Ungroup'}`, // Add translation if needed
                    action: () => handleAssignToGroup(null)
                });
            }
            items.push({ type: 'separator' });
        }
        // --- End Assign to Group Options ---

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
        updateDashboard(); // Update dashboard with new test results
    });

    window.api.onTestProgress(({ progress, total, completed }) => {
        state.isTesting = progress < 100;
        // Update general progress bar in status bar
        const progressBar = $('#progressBar'); // General progress bar in status bar
        const progressText = $('#progressText'); // Text next to general progress bar

        if(progressBar) progressBar.value = progress; // Assuming it's a <progress> element
        if(progressText) progressText.textContent = `Testing ${completed}/${total} (${Math.round(progress)}%)`;

        if (!state.isTesting && progress === 100) { // Test just finished
             if(progressText) progressText.textContent = `Test complete. Total: ${total}, Healthy: ${state.configs.filter(c => c.status === 'healthy').length}`;
        }
        updateTestUI();
    });

    window.api.onTestFinish(() => {
        state.isTesting = false;
        state.lastTestCompletionTime = new Date().toISOString(); // Record last test time
        saveAllData(); // Persist the new lastTestCompletionTime

        // Final update to all statuses that might still be 'testing' if stop was abrupt
        state.configs.forEach(c => { if (c.status === 'testing') c.status = 'untested'; });

        renderTable();
        updateTestUI();
        updateStatusBar();
        updateDashboard(); // Update dashboard with final test stats and time

        const totalConfigs = state.configs.length;
        const healthyConfigs = state.configs.filter(c => c.status === 'healthy').length;
        $('#progressText').textContent = `Test complete. Total: ${totalConfigs}, Healthy: ${healthyConfigs}`;
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
        updateDashboard(); // Update dashboard with connection status
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
