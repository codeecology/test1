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
        activeDetailConfigId: null, // Re-add for the panel
        lastTestCompletionTime: null,
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
            test_group: "Test Group: {groupName}", // New translation
            test_visible: "Test Visible", // New translation for testing visible configs
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
            // Toasts & Prompts
            toast_group_added: "Group \"{groupName}\" added.",
            toast_group_name_updated: "Group name updated to \"{groupName}\".",
            toast_group_deleted: "Group \"{groupName}\" deleted.",
            toast_configs_assigned: "{count} config(s) assigned to {groupNameText}.",
            toast_config_name_updated: "Config name updated.",
            toast_configs_deleted: "{count} config(s) deleted.",
            toast_link_copied: "Link copied!",
            toast_failed_copy_link: "Failed to copy link.",
            toast_all_tests_finished: "All tests finished!",
            toast_connection_failed: "Connection failed: {error}",
            toast_disconnected: "Disconnected.",
            toast_no_configs_to_test: "No configs to test.",
            toast_test_already_running: "A test is already in progress.",
            toast_selected_configs_tested_or_testing: "Selected configs are already tested or currently testing.",
            toast_settings_saved: "Settings saved!",
            toast_data_imported: "Data imported successfully!",
            toast_data_exported: "Data exported successfully!",
            toast_all_data_cleared: "All data cleared successfully.",
            toast_no_unhealthy_to_delete: "No unhealthy configs to delete.",
            toast_unhealthy_deleted: "{count} unhealthy configs deleted.",
            toast_sub_url_empty: "Subscription URL is empty.",
            toast_fetching_sub: "Fetching subscription...",
            toast_failed_fetch_sub: "Failed to fetch subscription: {error}",
            toast_paste_area_empty: "Text area is empty.",
            toast_clipboard_empty_or_no_links: "Clipboard is empty or contains no valid links.",
            toast_clipboard_empty: "Clipboard is empty.",
            toast_failed_read_clipboard: "Failed to read from clipboard: {error}",
            toast_group_name_empty: "Group name cannot be empty.",
            toast_group_not_found_edit: "Group not found for editing.",
            toast_group_not_found_delete: "Group not found for deletion.",
            toast_select_single_config_edit_name: "Select a single config to edit its name.",
            toast_config_not_found_edit: "Config not found for editing.",
            toast_config_name_empty: "Config name cannot be empty.",
            toast_no_configs_delete: "No configs selected to delete.",
            toast_no_configs_assign: "No configs selected.",
            prompt_new_group_title: "New Group Name",
            prompt_new_group_message: "Enter name for the new group:",
            // Context Menu
            ctx_add_from_clipboard: "Add Config from Clipboard",
            ctx_add_new_group: "Add New Group",
            ctx_test_all_visible: "Test All Visible",
            ctx_delete_all_unhealthy: "Delete All Unhealthy",
            healthy_configs_group_title: "Healthy Configs",
            no_groups_available: "No groups available",
            confirm_delete_unhealthy_title: "Delete Unhealthy Configs",
            confirm_delete_unhealthy_message: "Are you sure you want to delete {count} unhealthy/error configs?",
            confirm_delete_config_plural: "Are you sure you want to delete {count} selected config(s)?",
            toast_configs_added_count: "{count} new config(s) added.",
            toast_configs_failed_count: "{count} config(s) failed to process.",
            toast_no_configs_export: "No configs to export.",
            confirm_clear_all_data_title: "Clear All Data",
            confirm_clear_all_data_message: "Are you sure you want to delete ALL configs, groups, and settings? This action cannot be undone.",
            toast_failed_clear_data: "Failed to clear data: {error}",
            toast_failed_generate_qr: "Failed to generate QR code: {error}",
            toast_select_one_healthy_config_connect: "Please select exactly one healthy config to connect.",
            toast_selected_config_not_healthy: "Selected config is not healthy or not tested.",
            testing_progress: "Testing {completed}/{total} ({progress}%)",
            test_complete_summary: "Test complete. Total: {total}, Healthy: {healthy}",
            view_details_ctx: "View Details",
            // Group selection actions
            ctx_select_healthy_in_group: "Select Healthy in Group",
            ctx_select_unhealthy_in_group: "Select Unhealthy in Group",
            ctx_select_untested_in_group: "Select Untested in Group",
            toast_none_selected_by_status: "No configs with status '{status}' found in current view to select.",
            setting_font_size: "Font Size",
            font_small: "Small",
            font_medium: "Medium",
            font_large: "Large",
            settings_real_delay_title: "Real Delay Test Settings",
            setting_real_delay_url: "Real Delay Test URL",
            setting_real_delay_pings: "Number of Pings",
            setting_real_delay_timeout: "Ping Timeout (ms)",
            settings_column_visibility_title: "Column Visibility", // Already added this one
            // Messages for empty table states
            no_configs_yet_message: "No configurations added yet. Click \"Add Config\" or \"Import\".",
            no_configs_match_search_message: "No configurations match your search term.",
            no_configs_in_group_message: "No configurations in group \"{groupName}\".",
            this_group: "this group", // Fallback for group name
            no_healthy_configs_message: "No healthy configurations found.",
            // Export selected
            export_selected_btn: "Export Selected",
            real_delay_test_selected_ctx: "Real Delay Test ({count})",
            toast_no_configs_selected_export: "No configurations selected for export.",
            toast_no_configs_selected_test: "No configurations selected for testing.",
            toast_selected_exported_success: "{count} selected config(s) exported successfully.",
            toast_export_failed: "Export failed: {error}",
            // Speed Test Settings
            setting_speed_test_url: "Download Speed Test File URL",
            setting_speed_test_url_note: "Use a file of known size (e.g., 1MB, 5MB, 10MB).",
            speed_test_selected_ctx: "Speed Test ({count})",
            // Test History
            test_history_title: "Test History",
            no_test_history_for_config: "No test history for this config.",
            test_type_standard: "Standard",
            test_type_real_delay: "Real Delay",
            test_type_speed: "Speed",
            // Detail panel specific
            error_message_detail: "Error Message",
            real_delay_avg_detail: "Real Delay (Avg)",
            real_delay_error_detail: "Real Delay Error",
            download_speed_detail: "Download Speed",
            speed_test_error_detail: "Speed Test Error",
            // Group Subscriptions
            prompt_group_sub_url_title: "Group Subscription URL",
            prompt_group_sub_url_message: "Enter subscription URL (leave empty to remove):",
            toast_group_sub_url_removed: "Subscription URL removed for group \"{groupName}\".",
            toast_group_sub_url_set: "Subscription URL set for group \"{groupName}\".",
            confirm_update_sub_now_title: "Update Subscription",
            confirm_update_sub_now_message: "Subscription URL for group \"{groupName}\" has been set/changed. Update now?",
            toast_invalid_sub_url: "Invalid subscription URL.",
            toast_no_sub_url_for_group: "No subscription URL set for group \"{groupName}\".",
            toast_fetching_group_sub: "Fetching subscription for group \"{groupName}\"...",
            toast_failed_fetch_group_sub: "Failed to fetch subscription for group \"{groupName}\": {error}",
            // Notes Feature
            config_notes_title: "Notes",
            save_notes: "Save Notes",
            notes_saved_toast: "Notes saved.",
            notes_placeholder: "Enter your notes here...",
            // Favorites Feature
            favorites_group_title: "Favorites",
            add_to_favorites_ctx: "Add to Favorites",
            remove_from_favorites_ctx: "Remove from Favorites",
            toggle_favorite_ctx: "Toggle Favorite",
        },
        fa: {
            groups: "گروه‌ها", all_configs: "همه کانفیگ‌ها", add_config: "افزودن کانفیگ", delete_unhealthy: "حذف ناسالم‌ها",
            start_test: "شروع تست", stop_test: "توقف تست", status: "وضعیت", name: "نام", group: "گروه", country: "کشور",
            protocol: "پروتکل", network: "شبکه", delay: "تأخیر", port: "پورت", details: "جزئیات", connect: "اتصال", disconnect: "قطع اتصال",
            not_connected: "متصل نیستید", connecting: "در حال اتصال...", connected_to: "متصل به", settings: "تنظیمات",
            test_group: "تست گروه: {groupName}", // ترجمه جدید
            test_visible: "تست قابل مشاهده‌ها", // ترجمه جدید
            untested: "تست نشده", testing: "در حال تست", healthy: "سالم", unhealthy: "ناسالم", error: "خطا",
            test_selected: "تست منتخب‌ها", copy_link: "کپی لینک", assign_to_group: "اختصاص به گروه",
            show_qr_code: "نمایش QR Code", delete: "حذف", edit_name: "ویرایش نام",
            confirm_delete_title: "تایید حذف", confirm_delete_config: "آیا از حذف این کانفیگ مطمئن هستید؟",
            confirm_delete_group_title: "حذف گروه",
            confirm_delete_group_message: "آیا از حذف گروه مطمئن هستید:",
            confirm_delete_group_message_configs_note: "کانفیگ‌های این گروه بدون گروه خواهند شد.",
            add_group_title: "افزودن گروه جدید", add_group_message: "نام گروه جدید را وارد کنید:",
            edit_name_title: "ویرایش نام", edit_name_message: "نام جدید کانفیگ را وارد کنید:",
            edit_group_name_title: "ویرایش نام گروه",
            edit_group_name_message: "نام جدید گروه را وارد کنید:",
            toast_configs_added: "کانفیگ جدید اضافه شد.",
            assign_to_new_group: "گروه جدید...",
            ungroup_config: "بدون گروه",
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
            // Toasts & Prompts - Farsi
            toast_group_added: "گروه «{groupName}» اضافه شد.",
            toast_group_name_updated: "نام گروه به «{groupName}» تغییر یافت.",
            toast_group_deleted: "گروه «{groupName}» حذف شد.",
            toast_configs_assigned: "{count} کانفیگ به {groupNameText} اختصاص داده شد.",
            toast_config_name_updated: "نام کانفیگ به‌روز شد.",
            toast_configs_deleted: "{count} کانفیگ حذف شد.",
            toast_link_copied: "لینک کپی شد!",
            toast_failed_copy_link: "خطا در کپی لینک.",
            toast_all_tests_finished: "تمام تست‌ها تمام شدند!",
            toast_connection_failed: "اتصال ناموفق: {error}",
            toast_disconnected: "اتصال قطع شد.",
            toast_no_configs_to_test: "کانفیگی برای تست وجود ندارد.",
            toast_test_already_running: "تست در حال انجام است.",
            toast_selected_configs_tested_or_testing: "کانفیگ‌های انتخاب شده تست شده‌اند یا در حال تست هستند.",
            toast_settings_saved: "تنظیمات ذخیره شد!",
            toast_data_imported: "داده‌ها با موفقیت وارد شدند!",
            toast_data_exported: "داده‌ها با موفقیت صادر شدند!",
            toast_all_data_cleared: "تمام داده‌ها با موفقیت پاک شدند.",
            toast_no_unhealthy_to_delete: "کانفیگ ناسالمی برای حذف وجود ندارد.",
            toast_unhealthy_deleted: "{count} کانفیگ ناسالم حذف شد.",
            toast_sub_url_empty: "آدرس URL اشتراک خالی است.",
            toast_fetching_sub: "در حال دریافت اشتراک...",
            toast_failed_fetch_sub: "خطا در دریافت اشتراک: {error}",
            toast_paste_area_empty: "کادر متن خالی است.",
            toast_clipboard_empty_or_no_links: "کلیپ‌بورد خالی است یا لینک معتبری ندارد.",
            toast_clipboard_empty: "کلیپ‌بورد خالی است.",
            toast_failed_read_clipboard: "خطا در خواندن از کلیپ‌بورد: {error}",
            toast_group_name_empty: "نام گروه نمی‌تواند خالی باشد.",
            toast_group_not_found_edit: "گروه برای ویرایش یافت نشد.",
            toast_group_not_found_delete: "گروه برای حذف یافت نشد.",
            toast_select_single_config_edit_name: "برای ویرایش نام، یک کانفیگ انتخاب کنید.",
            toast_config_not_found_edit: "کانفیگ برای ویرایش یافت نشد.",
            toast_config_name_empty: "نام کانفیگ نمی‌تواند خالی باشد.",
            toast_no_configs_delete: "کانفیگی برای حذف انتخاب نشده.",
            toast_no_configs_assign: "کانفیگی انتخاب نشده.",
            prompt_new_group_title: "نام گروه جدید",
            prompt_new_group_message: "نام گروه جدید را وارد کنید:",
            // Context Menu - Farsi
            ctx_add_from_clipboard: "افزودن کانفیگ از کلیپ‌بورد",
            ctx_add_new_group: "افزودن گروه جدید",
            ctx_test_all_visible: "تست همه قابل مشاهده‌ها",
            ctx_delete_all_unhealthy: "حذف همه ناسالم‌ها",
            healthy_configs_group_title: "کانفیگ‌های سالم",
            no_groups_available: "گروهی موجود نیست",
            confirm_delete_unhealthy_title: "حذف کانفیگ‌های ناسالم",
            confirm_delete_unhealthy_message: "آیا از حذف {count} کانفیگ ناسالم/خطادار مطمئن هستید؟",
            confirm_delete_config_plural: "آیا از حذف {count} کانفیگ انتخاب شده مطمئن هستید؟",
            toast_configs_added_count: "{count} کانفیگ جدید اضافه شد.",
            toast_configs_failed_count: "{count} کانفیگ پردازش نشد.",
            toast_no_configs_export: "کانفیگی برای صدور وجود ندارد.",
            confirm_clear_all_data_title: "پاک کردن تمام داده‌ها",
            confirm_clear_all_data_message: "آیا مطمئنید که می‌خواهید تمام کانفیگ‌ها، گروه‌ها و تنظیمات را حذف کنید؟ این عمل قابل بازگشت نیست.",
            toast_failed_clear_data: "خطا در پاک کردن داده‌ها: {error}",
            toast_failed_generate_qr: "خطا در ایجاد QR کد: {error}",
            toast_select_one_healthy_config_connect: "لطفاً برای اتصال دقیقاً یک کانفیگ سالم انتخاب کنید.",
            toast_selected_config_not_healthy: "کانفیگ انتخاب شده سالم نیست یا تست نشده.",
            testing_progress: "در حال تست {completed}/{total} ({progress}%)",
            test_complete_summary: "تست کامل شد. کل: {total}، سالم: {healthy}",
            view_details_ctx: "مشاهده جزئیات",
            // Group selection actions - Farsi
            ctx_select_healthy_in_group: "انتخاب سالم‌ها در گروه",
            ctx_select_unhealthy_in_group: "انتخاب ناسالم‌ها در گروه",
            ctx_select_untested_in_group: "انتخاب تست‌نشده‌ها در گروه",
            toast_none_selected_by_status: "هیچ کانفیگی با وضعیت «{status}» در نمای فعلی برای انتخاب یافت نشد.",
            setting_font_size: "اندازه فونت",
            font_small: "کوچک",
            font_medium: "متوسط",
            font_large: "بزرگ",
            settings_real_delay_title: "تنظیمات تست تأخیر واقعی",
            setting_real_delay_url: "آدرس تست تأخیر واقعی",
            setting_real_delay_pings: "تعداد پینگ‌ها",
            setting_real_delay_timeout: "زمان انتظار پینگ (میلی‌ثانیه)",
            settings_column_visibility_title: "نمایش ستون‌ها", // Already added
            // Messages for empty table states - Farsi
            no_configs_yet_message: "هنوز هیچ کانفیگی اضافه نشده. روی «افزودن کانفیگ» یا «ورود از فایل» کلیک کنید.",
            no_configs_match_search_message: "هیچ کانفیگی با عبارت جستجوی شما مطابقت ندارد.",
            no_configs_in_group_message: "هیچ کانفیگی در گروه «{groupName}» وجود ندارد.",
            this_group: "این گروه",
            no_healthy_configs_message: "هیچ کانفیگ سالمی یافت نشد.",
            // Export selected - Farsi
            export_selected_btn: "خروجی منتخب‌ها",
            real_delay_test_selected_ctx: "تست تأخیر واقعی ({count})",
            toast_no_configs_selected_export: "هیچ کانفیگی برای خروجی انتخاب نشده است.",
            toast_no_configs_selected_test: "هیچ کانفیگی برای تست انتخاب نشده است.",
            toast_selected_exported_success: "{count} کانفیگ منتخب با موفقیت صادر شد.",
            toast_export_failed: "خطا در صدور: {error}",
            // Speed Test Settings - Farsi
            setting_speed_test_url: "آدرس فایل تست سرعت دانلود",
            setting_speed_test_url_note: "از یک فایل با حجم معین استفاده کنید (مثلا 1MB، 5MB، 10MB).",
            speed_test_selected_ctx: "تست سرعت ({count})",
            // Test History - Farsi
            test_history_title: "تاریخچه تست‌ها",
            no_test_history_for_config: "تاریخچه تستی برای این کانفیگ وجود ندارد.",
            test_type_standard: "استاندارد",
            test_type_real_delay: "تأخیر واقعی",
            test_type_speed: "سرعت",
            // Detail panel specific - Farsi
            error_message_detail: "پیام خطا",
            real_delay_avg_detail: "تأخیر واقعی (میانگین)",
            real_delay_error_detail: "خطای تأخیر واقعی",
            download_speed_detail: "سرعت دانلود",
            speed_test_error_detail: "خطای تست سرعت",
            // Group Subscriptions - Farsi
            prompt_group_sub_url_title: "آدرس URL اشتراک گروه",
            prompt_group_sub_url_message: "آدرس URL اشتراک را وارد کنید (برای حذف خالی بگذارید):",
            toast_group_sub_url_removed: "آدرس اشتراک برای گروه «{groupName}» حذف شد.",
            toast_group_sub_url_set: "آدرس اشتراک برای گروه «{groupName}» تنظیم شد.",
            confirm_update_sub_now_title: "به‌روزرسانی اشتراک",
            confirm_update_sub_now_message: "آدرس اشتراک گروه «{groupName}» تنظیم/تغییر کرد. آیا الان به‌روزرسانی می‌کنید؟",
            toast_invalid_sub_url: "آدرس URL اشتراک نامعتبر است.",
            toast_no_sub_url_for_group: "هیچ آدرس اشتراکی برای گروه «{groupName}» تنظیم نشده.",
            toast_fetching_group_sub: "در حال دریافت اشتراک برای گروه «{groupName}»...",
            toast_failed_fetch_group_sub: "خطا در دریافت اشتراک برای گروه «{groupName}»: {error}",
            // Notes Feature - Farsi
            config_notes_title: "یادداشت‌ها",
            save_notes: "ذخیره یادداشت",
            notes_saved_toast: "یادداشت‌ها ذخیره شد.",
            notes_placeholder: "یادداشت‌های خود را اینجا بنویسید...",
        }
    };
    const lang = (key, params = {}) => {
        let translation = translations[state.currentLanguage]?.[key] || key;
        for (const param in params) {
            translation = translation.replace(`{${param}}`, params[param]);
        }
        return translation;
    };

    const formatStatus = (statusValue) => {
        if (!statusValue) return lang('untested');
        return lang(statusValue.toLowerCase()) || statusValue;
    };

    const formatDelay = (delayValue) => {
        if (delayValue === null || delayValue === undefined || delayValue < 0) {
            return 'N/A';
        }
        return `${delayValue} ms`;
    };

    const getStatusIconClass = (status) => {
        switch (status) {
            case 'healthy':
                return 'fa-solid fa-circle-check'; // Green check
            case 'unhealthy':
                return 'fa-solid fa-circle-xmark'; // Red x
            case 'error':
                return 'fa-solid fa-triangle-exclamation'; // Yellow warning triangle
            case 'testing':
                return 'fa-solid fa-spinner fa-spin'; // Spinning animation
            case 'untested':
            default:
                return 'fa-solid fa-circle-question'; // Question mark
        }
    };

    const formatDetails = (config) => {
        const parts = [];
        if (config.networkType) parts.push(`Net: ${config.networkType}`);
        if (config.security) parts.push(`Sec: ${config.security}`);
        if (config.sni) parts.push(`SNI: ${config.sni}`);
        if (config.fp) parts.push(`FP: ${config.fp}`);
        if (config.path) parts.push(`Path: ${config.path}`);
        if (config.serviceName) parts.push(`Svc: ${config.serviceName}`);
        if (config.protocol === 'vless') {
            if (config.encryption && config.encryption !== 'none') parts.push(`Enc: ${config.encryption}`);
            if (config.flow) parts.push(`Flow: ${config.flow}`);
        } else if (config.protocol === 'ss') {
            if (config.method) parts.push(`Method: ${config.method}`);
        }

        let detailsStr = parts.join(', ');
        if (detailsStr.length > 30) {
            detailsStr = detailsStr.substring(0, 27) + '...';
        }
        return detailsStr;
    };

    // --- Initialization ---
    const init = async () => {
        try {
            const initialData = await window.api.getAllData();
            Object.assign(state, initialData);
            // Ensure all configs have notes and isFavorite fields (for backward compatibility)
            state.configs = state.configs.map(c => ({ notes: '', isFavorite: false, ...c }));

        } catch (error) {
            console.error("Failed to get initial data:", error);
            showToast(`Error loading initial data: ${error.message || 'Unknown error'}`, 'error');
            state.configs = [];
            state.groups = [];
            // Ensure default settings also consider new fields if necessary, though 'notes' and 'isFavorite' are per-config
            state.settings = {
                concurrentTests: 10,
                testTimeout: 8,
                testUrl: 'http://cp.cloudflare.com/generate_204'
                // fontSize, columnVisibility etc. are loaded or defaulted in their respective init functions
            };
        }
        state.currentTheme = localStorage.getItem('theme') || 'dark-theme';
        document.body.className = state.currentTheme;
        if (state.settings && state.settings.lastTestCompletionTime) {
            state.lastTestCompletionTime = state.settings.lastTestCompletionTime;
        }
        applyFontSize(state.settings.fontSize || 'medium');

        addEventListeners();
        renderAll();
    };

    const applyFontSize = (size) => {
        // size will be 'small', 'medium', or 'large'
        let fontSizeValue;
        switch (size) {
            case 'small':
                fontSizeValue = 'var(--font-size-small)';
                break;
            case 'large':
                fontSizeValue = 'var(--font-size-large)';
                break;
            case 'medium':
            default:
                fontSizeValue = 'var(--font-size-medium)';
                break;
        }
        document.documentElement.style.setProperty('--current-font-size', fontSizeValue);
        state.settings.fontSize = size; // Keep track of current setting
    };

    // Define columns with their properties. `index` here is the original, fixed index if not reordered.
    // The actual display order will be managed by `state.settings.columnOrder`.
    // The checkbox (index 0) and actions (if any, index N) are typically fixed and not part of this reorderable set.
    const columnDefinitions = { // Changed to an object for easier lookup by key
        status:  { langKey: 'status', defaultVisible: true, defaultOrder: 0 },
        name:    { langKey: 'name', defaultVisible: true, defaultOrder: 1 },
        country: { langKey: 'country', defaultVisible: true, defaultOrder: 2 },
        delay:   { langKey: 'delay', defaultVisible: true, defaultOrder: 3 },
        protocol:{ langKey: 'protocol', defaultVisible: true, defaultOrder: 4 },
        network: { langKey: 'network', defaultVisible: true, defaultOrder: 5 },
        port:    { langKey: 'port', defaultVisible: true, defaultOrder: 6 },
        details: { langKey: 'details', defaultVisible: true, defaultOrder: 7 }
    };
    // This will be an array of keys, e.g., ['status', 'name', 'country', ...]
    const defaultColumnOrder = Object.keys(columnDefinitions).sort((a, b) => columnDefinitions[a].defaultOrder - columnDefinitions[b].defaultOrder);

    const initializeColumnVisibility = () => { // Renamed function
        if (!state.settings.columnVisibility) {
            state.settings.columnVisibility = {};
        }
        // Iterate over object keys
        Object.keys(columnDefinitions).forEach(key => {
            if (state.settings.columnVisibility[key] === undefined) {
                state.settings.columnVisibility[key] = columnDefinitions[key].defaultVisible;
            }
        });

        if (!state.settings.columnOrder || !Array.isArray(state.settings.columnOrder) || state.settings.columnOrder.length !== defaultColumnOrder.length) {
            state.settings.columnOrder = [...defaultColumnOrder];
        } else {
             // Ensure all keys in columnOrder exist in columnDefinitions and vice-versa
            const currentKeysInDef = Object.keys(columnDefinitions);
            state.settings.columnOrder = state.settings.columnOrder.filter(key => currentKeysInDef.includes(key));

            currentKeysInDef.forEach(key => {
                if (!state.settings.columnOrder.includes(key)) {
                    // Add missing keys based on their defaultOrder to maintain some logical sequence
                    // This is a simplified insertion; for perfect order preservation based on defaultOrder,
                    // one might need to rebuild the order array more carefully.
                    state.settings.columnOrder.push(key);
                }
            });
            // Ensure order is a permutation of defaultColumnOrder keys
             if (new Set(state.settings.columnOrder).size !== currentKeysInDef.length) {
                state.settings.columnOrder = [...defaultColumnOrder]; // Fallback to default if inconsistent
            }
        }
    };

    const populateColumnVisibilitySettings = () => {
        const container = $('#columnVisibilitySettings');
        if (!container) return;
        container.innerHTML = ''; // Clear old checkboxes

        initializeColumnVisibility(); // Ensure defaults are set

        // Iterate over the defined order for UI consistency
        defaultColumnOrder.forEach(key => {
            const col = columnDefinitions[key];
            const div = document.createElement('div');
            div.className = 'checkbox-group';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `col-toggle-${key}`;
            checkbox.dataset.columnKey = key;
            checkbox.checked = state.settings.columnVisibility[key];

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = lang(col.langKey) || key.charAt(0).toUpperCase() + key.slice(1);

            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        });
    };

    const applyColumnVisibility = () => {
        initializeColumnVisibility(); // Ensure settings are initialized (call uses new name)

        const table = $('#configsTable');
        if (!table) return;
        const headerRow = table.querySelector('thead tr');
        const bodyRows = table.querySelectorAll('tbody tr');

        // Checkbox column (index 0) is always visible
        if (headerRow) headerRow.cells[0].style.display = ''; // Checkbox column is always index 0
        bodyRows.forEach(row => { if(row.cells[0]) row.cells[0].style.display = ''; });

        let visibleColumnCount = 1; // For the checkbox column

        // Iterate using the defaultColumnOrder to ensure we process based on original HTML structure's indices
        defaultColumnOrder.forEach(key => {
            const colDef = columnDefinitions[key];
            const isVisible = state.settings.columnVisibility[key];
            const actualCellIndex = colDef.defaultOrder + 1; // +1 for checkbox col

            if (isVisible) {
                visibleColumnCount++;
            }

            if (headerRow && headerRow.cells[actualCellIndex]) {
                headerRow.cells[actualCellIndex].style.display = isVisible ? '' : 'none';
            }
            bodyRows.forEach(row => {
                if (row.dataset.id && row.cells[actualCellIndex]) { // Ensure it's a data row
                    row.cells[actualCellIndex].style.display = isVisible ? '' : 'none';
                }
            });
        });

        const emptyRow = table.querySelector('tbody tr td[colspan]');
        if (emptyRow) {
            emptyRow.setAttribute('colspan', visibleColumnCount.toString());
        }
        // Note: This function now correctly handles VISIBILITY based on original cell indices.
        // Actual visual REORDERING of columns needs to be done in renderTable by changing
        // the order in which <td> elements are appended/updated.
    };


    // --- Render Functions ---
    const renderAll = () => {
        initializeColumnVisibility(); // Corrected function name
        applyColumnVisibility();
        renderTable();
        renderGroups();
        updateStatusBar();
        updateConnectionButton();
        updateTestUI();
        updateLangUI();
        updateDashboardStatsInStatusBar();
        updateToolbarButtonStates(); // New function call
    };

    const updateToolbarButtonStates = () => {
        const exportSelectedBtn = $('#exportSelectedBtn');
        if (exportSelectedBtn) {
            exportSelectedBtn.disabled = state.selectedConfigIds.length === 0;
        }
        // Can add other toolbar button state updates here if needed in the future
    };

    // Renamed updateDashboard to updateDashboardStatsInStatusBar and using new IDs
    const updateDashboardStatsInStatusBar = () => {
        const sbTotalConfigs = $('#sbTotalConfigs');
        const sbHealthyConfigs = $('#sbHealthyConfigs');
        const sbLastTestTime = $('#sbLastTestTime');
        const sbConnectionStatus = $('#sbConnectionStatus'); // For the stat in status-center

        if (sbTotalConfigs) sbTotalConfigs.textContent = state.configs.length;
        else console.warn("#sbTotalConfigs not found");

        if (sbHealthyConfigs) sbHealthyConfigs.textContent = state.configs.filter(c => c.status === 'healthy').length;
        else console.warn("#sbHealthyConfigs not found");

        if (sbLastTestTime) {
            if (state.lastTestCompletionTime) {
                const now = new Date();
                const lastTest = new Date(state.lastTestCompletionTime);
                const diffMs = now - lastTest;
                const diffSecs = Math.round(diffMs / 1000);
                const diffMins = Math.round(diffSecs / 60);
                const diffHours = Math.round(diffMins / 60);

                if (diffSecs < 60) {
                    sbLastTestTime.textContent = lang('moments_ago');
                } else if (diffMins < 60) {
                    sbLastTestTime.textContent = `${diffMins} ${lang('minutes_ago')}`;
                } else if (diffHours < 24) {
                    sbLastTestTime.textContent = `${diffHours} ${lang('hours_ago')}`;
                } else if (diffHours < 48) {
                    sbLastTestTime.textContent = lang('yesterday');
                } else {
                    sbLastTestTime.textContent = lastTest.toLocaleDateString();
                }
            } else {
                sbLastTestTime.textContent = lang('never');
            }
        } else console.warn("#sbLastTestTime not found");

        // Update the connection status in the status-center (sbConnectionStatus)
        // The one in status-left (connectionStatus) is updated by updateConnectionButton
        if (sbConnectionStatus) {
            if (state.activeConnectionId) {
                const config = state.configs.find(c => c.id === state.activeConnectionId);
                sbConnectionStatus.textContent = `${lang('connected_to')} ${config?.name || 'Unknown'}`;
                const iconEl = sbConnectionStatus.parentElement.querySelector('i');
                if(iconEl) iconEl.style.color = 'var(--success-color)';
            } else {
                sbConnectionStatus.textContent = lang('not_connected');
                 const iconEl = sbConnectionStatus.parentElement.querySelector('i');
                if(iconEl) iconEl.style.color = 'var(--disconnected-color)';
            }
        } else console.warn("#sbConnectionStatus not found");
    };


    const renderTable = () => {
        const tableBody = $('#configsTableBody');
        const configsToRender = getVisibleConfigs();
        // Calculate colspan dynamically based on visible columns
        let colspanValue = 1; // For checkbox column
        if (state.settings.columnVisibility) {
            Object.values(state.settings.columnVisibility).forEach(isVisible => {
                if (isVisible) colspanValue++;
            });
        } else { // Fallback if columnVisibility is not yet initialized (should be, but defensive)
            colspanValue = Object.keys(columnDefinitions).length + 1;
        }


        if (configsToRender.length === 0) {
            let message = lang('no_configs_yet_message');
            if (state.searchTerm !== '') {
                message = lang('no_configs_match_search_message');
            } else if (state.activeGroupId === 'favorite_configs') {
                message = lang('no_favorite_configs_message') || "No favorite configurations yet. Click the star to add some!"; // Add lang key: no_favorite_configs_message
            } else if (state.activeGroupId === 'healthy_configs') {
                 message = lang('no_healthy_configs_message');
            } else if (state.activeGroupId !== 'all') {
                const group = state.groups.find(g => g.id === state.activeGroupId);
                message = lang('no_configs_in_group_message', { groupName: group ? group.name : lang('this_group') });
            }

            tableBody.innerHTML = `<tr><td colspan="${colspanValue}" class="empty-table-message">${message}</td></tr>`;
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
            const groupName = state.groups.find(g => g.id === config.groupId)?.name || '-';
            const countryText = config.country || '-'; // Display country code or '-' if undefined

            const isSelected = state.selectedConfigIds.includes(config.id);
            const isConnected = config.id === state.activeConnectionId;

            let row = existingRowsById.get(config.id);
            if (row) { // Row exists, update it
                if (isSelected) row.classList.add('selected'); else row.classList.remove('selected');
                if (isConnected) row.classList.add('connected'); else row.classList.remove('connected');

                const cells = row.cells;
                cells[0].firstChild.checked = isSelected;

                const statusCell = cells[1];
                const statusIndicator = statusCell.querySelector('.status-indicator');
                const statusIconElement = statusCell.querySelector('.status-icon'); // New
                const statusText = statusCell.querySelector('.status-text'); // Changed selector for clarity
                const favoriteIcon = statusCell.querySelector('.favorite-toggle-icon');

                const newStatus = config.status || 'untested';
                const statusIconClass = getStatusIconClass(newStatus); // Helper function needed

                if (statusIndicator && statusText && statusIconElement) {
                    const currentStatusClass = statusIndicator.className.match(/status-\S+/)?.[0];
                    const newIndicatorClass = `status-${newStatus}`;
                    if (currentStatusClass !== newIndicatorClass) {
                        if (currentStatusClass) statusIndicator.classList.remove(currentStatusClass);
                        statusIndicator.classList.add(newIndicatorClass);
                    }
                    if (!statusIndicator.classList.contains('status-indicator')) {
                        statusIndicator.classList.add('status-indicator');
                    }
                    statusIconElement.className = `status-icon ${statusIconClass}`; // Update icon class
                    statusText.textContent = formatStatus(newStatus);
                } else {
                    // Regenerate innerHTML if elements are missing (e.g., on first render of a new row)
                    statusCell.innerHTML = `
                        <i class="favorite-toggle-icon ${config.isFavorite ? 'fa-solid' : 'fa-regular'} fa-star" title="${lang('toggle_favorite_ctx')}"></i>
                        <span class="status-indicator status-${newStatus}"></span>
                        <i class="status-icon ${statusIconClass}"></i>
                        <span class="status-text">${formatStatus(newStatus)}</span>`;
                }

                // Ensure favorite icon is correctly updated or added if it was missing from the else block above
                const currentFavoriteIcon = statusCell.querySelector('.favorite-toggle-icon'); // Re-query in case innerHTML changed
                if (currentFavoriteIcon) {
                    favoriteIcon.className = `favorite-toggle-icon ${config.isFavorite ? 'fa-solid' : 'fa-regular'} fa-star`;
                    favoriteIcon.title = config.isFavorite ? lang('remove_from_favorites_ctx') : lang('add_to_favorites_ctx');
                }


                cells[2].textContent = config.name;
                cells[2].title = config.name;
                cells[3].textContent = countryText;
                cells[3].className = 'country-cell';
                cells[4].textContent = formatDelay(config.delay);
                cells[5].textContent = config.protocol;
                cells[6].textContent = config.network;
                cells[7].textContent = config.portToDisplay || '-';
                cells[8].textContent = formatDetails(config);
                cells[8].title = formatDetails(config);

                existingRowsById.delete(config.id);
            } else {
                row = document.createElement('tr');
                row.dataset.id = config.id;
                if (isSelected) row.classList.add('selected');
                if (isConnected) row.classList.add('connected');

                // Ensure favorite icon is part of the status cell's HTML
                row.innerHTML = `
                    <td class="checkbox-cell"><input type="checkbox" ${isSelected ? 'checked' : ''}></td>
                    <td class="status-cell">
                        <i class="favorite-toggle-icon ${config.isFavorite ? 'fa-solid' : 'fa-regular'} fa-star" title="${config.isFavorite ? lang('remove_from_favorites_ctx') : lang('add_to_favorites_ctx')}"></i>
                        <span class="status-indicator status-${config.status || 'untested'}"></span>
                        <i class="status-icon ${getStatusIconClass(config.status || 'untested')}"></i>
                        <span class="status-text">${formatStatus(config.status || 'untested')}</span>
                    </td>
                    <td title="${config.name}">${config.name}</td>
                    <td class="country-cell">${countryText}</td>
                    <td>${formatDelay(config.delay)}</td>
                    <td>${config.protocol}</td>
                    <td>${config.network}</td>
                    <td>${config.portToDisplay || '-'}</td>
                    <td title="${formatDetails(config)}">${formatDetails(config)}</td>
                `;
                fragmentForNewRows.appendChild(row);
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
        updateSelectAllCheckboxState(); // Keep this here as it's specific to table rendering
        updateToolbarButtonStates(); // Add this call here
    };

    const renderGroups = () => {
        const groupList = $('#groupList');
        groupList.innerHTML = '';

        // Helper to create a group item
        const createGroupItem = (id, iconClass, nameKey, count = -1, isUserGroup = false, groupData = null) => {
            const li = document.createElement('li');
            li.className = `group-item ${state.activeGroupId === id ? 'active' : ''}`;
            li.dataset.groupId = id;

            const icon = document.createElement('i');
            icon.className = iconClass;
            li.appendChild(icon);

            const nameSpan = document.createElement('span');
            // For user groups, nameKey is the actual name, not a lang key
            nameSpan.textContent = isUserGroup ? nameKey : lang(nameKey);
            li.appendChild(nameSpan);

            if (count > -1) {
                const countSpan = document.createElement('span');
                countSpan.className = 'group-count';
                countSpan.textContent = count;
                li.appendChild(countSpan);
            }

            if (isUserGroup && groupData) {
                const actionsSpan = document.createElement('span');
                actionsSpan.className = 'group-actions';

                const editBtn = document.createElement('i');
                editBtn.className = 'fa-solid fa-pencil btn-edit-group';
                editBtn.title = lang('edit_group_name_title'); // Use lang key for title
                editBtn.dataset.groupId = groupData.id;
                actionsSpan.appendChild(editBtn);

                const subBtn = document.createElement('i');
                subBtn.className = 'fa-solid fa-link btn-manage-group-sub';
                subBtn.title = groupData.subscriptionUrl ? lang('edit_group_sub_url_title') : lang('set_group_sub_url_title'); // Add lang keys
                subBtn.dataset.groupId = groupData.id;
                actionsSpan.appendChild(subBtn);

                if (groupData.subscriptionUrl) {
                    const updateSubBtn = document.createElement('i');
                    updateSubBtn.className = 'fa-solid fa-sync btn-update-group-sub';
                    updateSubBtn.title = lang('update_group_sub_now_title', {lastUpdated: groupData.lastUpdated ? new Date(groupData.lastUpdated).toLocaleDateString() : lang('never')}); // Add lang keys
                    updateSubBtn.dataset.groupId = groupData.id;
                    actionsSpan.appendChild(updateSubBtn);
                }

                const deleteBtn = document.createElement('i');
                deleteBtn.className = 'fa-solid fa-trash-alt btn-delete-group';
                deleteBtn.title = lang('delete_group_title'); // Use lang key
                deleteBtn.dataset.groupId = groupData.id;
                actionsSpan.appendChild(deleteBtn);

                li.appendChild(actionsSpan);
            }
            groupList.appendChild(li);
        };

        // Add "All Configs" group
        createGroupItem('all', 'fa-solid fa-globe', 'all_configs');

        // Add "Favorites" dynamic group
        const favoriteCount = state.configs.filter(c => c.isFavorite).length;
        createGroupItem('favorite_configs', 'fa-solid fa-star', 'favorites_group_title', favoriteCount);

        // Add "Healthy Configs" dynamic group
        const healthyCount = state.configs.filter(c => c.status === 'healthy').length;
        createGroupItem('healthy_configs', 'fa-solid fa-heart-circle-check', 'healthy_configs_group_title', healthyCount);

        // Add user-created groups
        state.groups.forEach(group => {
            const userGroupCount = state.configs.filter(c => c.groupId === group.id).length;
            createGroupItem(group.id, 'fa-solid fa-folder', group.name, userGroupCount, true, group);
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
        const startTestBtn = $('#startTestBtn');
        const stopTestBtn = $('#stopTestBtn');

        if (startTestBtn) {
            startTestBtn.style.display = state.isTesting ? 'none' : 'inline-flex';
            if (!state.isTesting) {
                // Update button text based on active group
                const activeGroup = state.groups.find(g => g.id === state.activeGroupId);
                if (activeGroup) { // User-defined group
                    startTestBtn.textContent = lang('test_group', { groupName: activeGroup.name });
                } else if (state.activeGroupId === 'all' || state.activeGroupId === 'favorite_configs' || state.activeGroupId === 'healthy_configs') {
                    startTestBtn.textContent = lang('test_visible');
                } else {
                    startTestBtn.textContent = lang('start_test'); // Default
                }
            }
        }
        if (stopTestBtn) {
            stopTestBtn.style.display = state.isTesting ? 'inline-flex' : 'none';
            stopTestBtn.disabled = !state.isTesting;
            if(state.isTesting) stopTestBtn.textContent = lang('stop_test');
        }
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
        let filteredConfigs = state.configs;

        if (state.activeGroupId === 'healthy_configs') {
            filteredConfigs = state.configs.filter(c => c.status === 'healthy');
        } else if (state.activeGroupId === 'favorite_configs') { // Added favorite filter
            filteredConfigs = state.configs.filter(c => c.isFavorite);
        } else if (state.activeGroupId !== 'all') { // User-created groups
            filteredConfigs = state.configs.filter(c => c.groupId === state.activeGroupId);
        }
        // If state.activeGroupId is 'all', no specific group filtering is done initially on filteredConfigs.

        return filteredConfigs
            .filter(c => !searchTerm ||
                         c.name.toLowerCase().includes(searchTerm) ||
                         c.protocol.toLowerCase().includes(searchTerm) ||
                         (c.network && c.network.toLowerCase().includes(searchTerm)) ||
                         (c.address && c.address.toLowerCase().includes(searchTerm)))
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

    const processAndAddConfigs = async (linksArray, targetGroupId = null) => { // Added targetGroupId parameter
        const existingLinks = new Set(state.configs.map(c => c.link));
        let addedCount = 0;
        let failedCount = 0;

        for (const link of linksArray) {
            // Global duplicate check still applies
            if (!link || !/^(vless|vmess|trojan|ss):\/\//.test(link) || existingLinks.has(link)) {
                if (existingLinks.has(link)) { // Log duplicate warning always in renderer, as it's a user action consequence
                    console.warn(`Skipping duplicate config link (globally): ${link}`);
                }
                continue;
            }

            try {
                const detailsResult = await window.api.getFullConfigDetails(link);

                if (!detailsResult || !detailsResult.success) {
                    console.warn(`Renderer: Failed to get full details for link (skipping): ${link} - Error: ${detailsResult?.error || 'Unknown parse error from main'}`);
                    failedCount++;
                    continue;
                }

                const fullDetails = detailsResult.details;
                // Use original link's URL object primarily for the #ps (name fragment)
                const parsedUrlForNameFragment = new URL(link);
                let name = decodeURIComponent(parsedUrlForNameFragment.hash.substring(1));

                let address = '';
                let displayPort = '-';

                // Extract address and port from the rich fullDetails object
                if (fullDetails.protocol === 'vmess' || fullDetails.protocol === 'vless') {
                    address = fullDetails.settings?.vnext?.[0]?.address;
                    displayPort = fullDetails.settings?.vnext?.[0]?.port?.toString() || '-';
                } else if (fullDetails.protocol === 'trojan' || fullDetails.protocol === 'ss') {
                    address = fullDetails.settings?.servers?.[0]?.address;
                    displayPort = fullDetails.settings?.servers?.[0]?.port?.toString() || '-';
                }

                // Fallback for address if somehow not in fullDetails (shouldn't happen with good main.js parsing)
                address = address || parsedUrlForNameFragment.hostname;

                if (!name) { // If #ps is not present or empty, construct a name
                    name = address && displayPort !== '-' ? `${address}:${displayPort}` : (parsedUrlForNameFragment.hostname || `Config ${state.configs.length + 1 + addedCount}`);
                }

                let country = 'XX';
                try {
                    const hostForCountryLookup = address; // Prefer address from parsed details
                    if (hostForCountryLookup) {
                        console.log(`[processAndAddConfigs] Getting country for host: ${hostForCountryLookup}`); // Log always
                        country = await window.api.getCountry(hostForCountryLookup);
                        console.log(`[processAndAddConfigs] Got country: ${country} for host: ${hostForCountryLookup}`); // Log always
                    } else {
                        console.warn(`[processAndAddConfigs] No valid hostname/address for country lookup from parsed details: ${link}`);
                    }
                } catch (countryError) {
                    console.warn(`[processAndAddConfigs] Failed to get country for ${address || parsedUrlForNameFragment.hostname}:`, countryError.message);
                }

                // Extract other details primarily from fullDetails, fallback to URL parsing if necessary
                const protocolName = fullDetails.protocol || parsedUrlForNameFragment.protocol.slice(0, -1).toLowerCase();

                let networkType = fullDetails.streamSettings?.network;
                if (!networkType && protocolName === 'vmess') networkType = 'tcp'; // Default for vmess if not specified
                networkType = networkType || parsedUrlForNameFragment.searchParams.get('type') || 'tcp';

                let security = fullDetails.streamSettings?.security;
                if (!security && fullDetails.streamSettings?.tlsSettings) security = 'tls'; // Infer if tlsSettings exist
                else if (!security && fullDetails.streamSettings?.realitySettings) security = 'reality'; // Infer if realitySettings exist
                security = security || parsedUrlForNameFragment.searchParams.get('security') || 'none';

                const sni = fullDetails.streamSettings?.tlsSettings?.serverName || fullDetails.streamSettings?.realitySettings?.serverName || parsedUrlForNameFragment.searchParams.get('sni') || parsedUrlForNameFragment.searchParams.get('host') || '';
                const fp = fullDetails.streamSettings?.tlsSettings?.fingerprint || fullDetails.streamSettings?.realitySettings?.fingerprint || parsedUrlForNameFragment.searchParams.get('fp') || '';

                let extractedPath = '';
                if (fullDetails.streamSettings?.wsSettings?.path) {
                    extractedPath = fullDetails.streamSettings.wsSettings.path;
                } else if (fullDetails.streamSettings?.grpcSettings?.serviceName) {
                    extractedPath = fullDetails.streamSettings.grpcSettings.serviceName;
                }
                extractedPath = extractedPath || parsedUrlForNameFragment.searchParams.get('path') || '';
                extractedPath = extractedPath.split(',')[0];

                const serviceName = fullDetails.streamSettings?.grpcSettings?.serviceName || parsedUrlForNameFragment.searchParams.get('serviceName') || '';
                const encryption = (protocolName === 'vless' && fullDetails.settings?.vnext?.[0]?.users?.[0]?.encryption) || parsedUrlForNameFragment.searchParams.get('encryption') || '';
                const flow = (protocolName === 'vless' && fullDetails.settings?.vnext?.[0]?.users?.[0]?.flow) || parsedUrlForNameFragment.searchParams.get('flow') || '';

                state.configs.push({
                    id: `cfg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    link, name, country,
                    address: address,
                    protocol: protocolName,
                    network: networkType,
                    portToDisplay: displayPort,
                    status: 'untested', delay: null,
                    // Assign to targetGroupId if provided, otherwise to current active group (or null if 'all' or 'healthy_configs')
                    groupId: targetGroupId || (state.activeGroupId && state.activeGroupId !== 'all' && state.activeGroupId !== 'healthy_configs' ? state.activeGroupId : null),
                    // Store key details for display and potential filtering
                    security: security,
                    sni: sni,
                    fp: fp,
                    path: extractedPath,
                    serviceName: serviceName,
                    encryption: encryption,
                    flow: flow,
                    notes: '',
                    isFavorite: false, // Initialize isFavorite field
                });
                existingLinks.add(link);
                addedCount++;
            } catch (e) { console.warn("Skipping invalid config:", link, e); }
        }
        if (addedCount > 0) {
            saveAllData();
            renderAll();
            showToast(lang('toast_configs_added_count', { count: addedCount }), 'success');
        }
        if (failedCount > 0) {
            showToast(lang('toast_configs_failed_count', { count: failedCount }), 'error');
        }
    };

    const saveAllData = () => {
        // Ensure all configs have necessary fields (for backward compatibility if loading older data)
        state.configs.forEach(config => {
            if (config.notes === undefined) {
                config.notes = '';
            }
            if (config.isFavorite === undefined) {
                config.isFavorite = false;
            }
        });

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
            // Populate font size select
            const fontSizeSelect = $('#fontSizeSelect');
            if (fontSizeSelect) fontSizeSelect.value = state.settings.fontSize || 'medium'; else console.warn('#fontSizeSelect not found');

            // Populate Real Delay Test settings
            const realDelayTestUrlInput = $('#realDelayTestUrlInput');
            if (realDelayTestUrlInput) realDelayTestUrlInput.value = state.settings.realDelayTestUrl || 'https://www.google.com/generate_204'; else console.warn('#realDelayTestUrlInput not found');
            const realDelayTestPingsInput = $('#realDelayTestPingsInput');
            if (realDelayTestPingsInput) realDelayTestPingsInput.value = state.settings.realDelayTestPings || 3; else console.warn('#realDelayTestPingsInput not found');
            const realDelayTestTimeoutInput = $('#realDelayTestTimeoutInput');
            if (realDelayTestTimeoutInput) realDelayTestTimeoutInput.value = state.settings.realDelayTestTimeout || 2000; else console.warn('#realDelayTestTimeoutInput not found');

            const speedTestFileUrlInput = $('#speedTestFileUrlInput');
            if (speedTestFileUrlInput) speedTestFileUrlInput.value = state.settings.speedTestFileUrl || 'http://cachefly.cachefly.net/10mb.test'; else console.warn('#speedTestFileUrlInput not found');

            // Populate Column Visibility settings
            populateColumnVisibilitySettings();

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
                        // If it's a submenu parent, don't close the main menu immediately on click.
                        // Actual submenu display logic will be handled by hover or a more complex click management.
                        // For now, we assume action will handle its own logic or it's a non-actionable parent.
                        if (!item.submenu) {
                            clickEvent.stopPropagation();
                            item.action();
                            menu.style.display = 'none';
                            menu.classList.remove('active');
                        } else {
                            // Potentially toggle submenu visibility here if click-to-open is desired
                        }
                    });
                }

                if (item.submenu && Array.isArray(item.submenu)) {
                    li.classList.add('submenu-parent');
                    const arrow = document.createElement('span');
                    arrow.className = 'submenu-arrow';
                    arrow.innerHTML = ' &raquo;'; // Or a FontAwesome icon
                    li.appendChild(arrow);

                    const subMenuUl = document.createElement('ul');
                    subMenuUl.className = 'context-submenu';
                    item.submenu.forEach(subItem => {
                        const subLi = document.createElement('li');
                        if (subItem.iconClass) {
                            const subIcon = document.createElement('i');
                            subItem.iconClass.split(' ').forEach(cls => subIcon.classList.add(cls));
                            subLi.appendChild(subIcon);
                        }
                        subLi.appendChild(document.createTextNode(subItem.label));
                        if (subItem.disabled) {
                            subLi.classList.add('disabled');
                        } else {
                            subLi.addEventListener('click', (subClickEvent) => {
                                subClickEvent.stopPropagation();
                                subItem.action();
                                menu.style.display = 'none'; // Close main menu
                                menu.classList.remove('active');
                            });
                        }
                        subMenuUl.appendChild(subLi);
                    });
                    li.appendChild(subMenuUl);
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

    // --- Config Details Panel Logic (REMOVED) ---
    // const showDetailsPanel = ... (Removed)
    // const closeDetailsPanel = ... (Removed)
    // const populateDetailsPanel = ... (Removed)

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
            const manageSubBtn = e.target.closest('.btn-manage-group-sub');
            const updateSubBtn = e.target.closest('.btn-update-group-sub');

            if (editBtn && groupItem) {
                const groupId = editBtn.dataset.groupId;
                if (groupId && groupId !== 'all' && groupId !== 'healthy_configs') {
                    handleEditGroup(groupId);
                }
            } else if (deleteBtn && groupItem) {
                const groupId = deleteBtn.dataset.groupId;
                if (groupId && groupId !== 'all' && groupId !== 'healthy_configs') {
                    handleDeleteGroup(groupId);
                }
            } else if (manageSubBtn && groupItem) {
                const groupId = manageSubBtn.dataset.groupId;
                 if (groupId && groupId !== 'all' && groupId !== 'healthy_configs') {
                    handleManageGroupSubscription(groupId);
                }
            } else if (updateSubBtn && groupItem) {
                const groupId = updateSubBtn.dataset.groupId;
                 if (groupId && groupId !== 'all' && groupId !== 'healthy_configs') {
                    handleUpdateGroupSubscription(groupId, true); // true to force update
                }
            } else if (groupItem) { // Click on the group item itself
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

        // Modals general close buttons (those explicitly marked with .close-modal-btn)
        safelyAddEventListener('.close-modal-btn', 'click', (e) => {
            // If the button has a data-modal-id, it targets a specific modal.
            // Otherwise, the generic closeModal behavior (closing any active modal) is fine.
            const modalId = e.target.dataset.modalId || e.target.closest('.close-modal-btn')?.dataset.modalId;
            if (modalId) {
                const modalToClose = $(`#${modalId}`);
                if (modalToClose) {
                    modalToClose.classList.remove('active');
                }
                // Check if any other modals are active before hiding backdrop
                const anyActiveModals = $$('.modal.active').length > 0;
                if (!anyActiveModals) {
                    const backdrop = $('#modalBackdrop');
                    if (backdrop) {
                        backdrop.style.display = 'none';
                        backdrop.classList.remove('active');
                    }
                }
            } else {
                closeModal(); // Fallback to generic close if no specific modal targeted
            }
        }, true);

        // Backdrop click to close
        safelyAddEventListener('#modalBackdrop', 'click', (e) => {
            if (e.target.id === 'modalBackdrop') { // Only close if the click is directly on the backdrop
                closeModal();
            }
        });

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
        // The provided index.html does not have: exportAllBtn, exportGroupBtn, addConfigFromClipboardBtn
        // exportSelectedBtn is now added.
        safelyAddEventListener('#exportSelectedBtn', 'click', handleExportSelectedConfigs);

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey; // metaKey for macOS Command

            if (isCtrlOrCmd && e.key.toLowerCase() === 't') {
                e.preventDefault();
                if (state.isTesting && !$('#stopTestBtn').disabled) {
                    $('#stopTestBtn').click();
                } else if (!state.isTesting && !$('#startTestBtn').disabled) {
                    $('#startTestBtn').click();
                }
            } else if (isCtrlOrCmd && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                $('#openAddModalBtn').click();
            } else if (isCtrlOrCmd && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                $('#searchBox').focus();
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedConfigIds.length > 0) {
                 // Ensure focus is not on an input field when Delete/Backspace is pressed
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA' && activeElement.contentEditable !== 'true') {
                    e.preventDefault();
                    handleDeleteConfig(); // This function already includes a confirmation
                }
            }
        });

        // Sidebar Resizer Logic
        const sidebar = $('#sidebar');
        const resizer = $('#resizer');
        const mainContent = $('.main-content'); // Assuming this is the element to adjust

        if (sidebar && resizer && mainContent) {
            let isResizing = false;
            let initialSidebarWidth = sidebar.offsetWidth;
            let initialMouseX = 0;

            // Load persisted sidebar width
            if (state.settings.sidebarWidth) {
                sidebar.style.width = `${state.settings.sidebarWidth}px`;
            }


            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                initialSidebarWidth = sidebar.offsetWidth;
                initialMouseX = e.clientX;
                sidebar.style.transition = 'none'; // Disable CSS transition during drag for smoothness
                mainContent.style.transition = 'none'; // Disable for main content margin if it's animated

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });

            const handleMouseMove = (e) => {
                if (!isResizing) return;
                const deltaX = e.clientX - initialMouseX;
                let newWidth = initialSidebarWidth + deltaX;

                const minWidth = parseInt(getComputedStyle(sidebar).minWidth, 10) || 150;
                const maxWidth = window.innerWidth * 0.5; // Example: max 50% of window

                if (newWidth < minWidth) newWidth = minWidth;
                if (newWidth > maxWidth) newWidth = maxWidth;

                sidebar.style.width = `${newWidth}px`;
                // If main content margin is adjusted by sidebar width, update it here too.
                // For example, if main content has margin-left equal to sidebar width:
                // mainContent.style.marginLeft = `${newWidth}px`;
            };

            const handleMouseUp = () => {
                if (!isResizing) return;
                isResizing = false;
                sidebar.style.transition = ''; // Re-enable CSS transition
                mainContent.style.transition = '';

                // Persist the new width
                state.settings.sidebarWidth = sidebar.offsetWidth;
                saveAllData(); // This should ideally only save settings, not all data

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        } else {
            console.warn("Sidebar, resizer, or main content element not found. Resizer disabled.");
        }
    }

    // --- Handlers ---

    const handleExportSelectedConfigs = () => {
        if (state.selectedConfigIds.length === 0) {
            showToast(lang('toast_no_configs_selected_export'), 'warning'); // Add lang key: toast_no_configs_selected_export
            return;
        }
        const configsToExport = state.configs.filter(c => state.selectedConfigIds.includes(c.id));
        const content = configsToExport.map(c => c.link).join('\n');
        const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        window.api.exportFile({ defaultPath: `selected-configs-${date}.txt`, content, isJson: false })
            .then(success => {
                if (success) showToast(lang('toast_selected_exported_success', { count: configsToExport.length }), 'success'); // Add lang key
            })
            .catch(error => {
                console.error("Error exporting selected configs:", error);
                showToast(lang('toast_export_failed', { error: error.message }), 'error'); // Add lang key
            });
    };

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
        const selectedFontSize = $('#fontSizeSelect').value;
        const realDelayTestUrl = $('#realDelayTestUrlInput').value;
        const realDelayTestPings = parseInt($('#realDelayTestPingsInput').value, 10);
        const realDelayTestTimeout = parseInt($('#realDelayTestTimeoutInput').value, 10);
        const speedTestFileUrl = $('#speedTestFileUrlInput').value;

        let changed = false;
        // Standard test settings
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
        // Font size setting
        if (selectedFontSize && state.settings.fontSize !== selectedFontSize) {
            applyFontSize(selectedFontSize);
            changed = true;
        }
        // Real Delay Test settings
        if (realDelayTestUrl && state.settings.realDelayTestUrl !== realDelayTestUrl) {
            state.settings.realDelayTestUrl = realDelayTestUrl;
            changed = true;
        }
        if (!isNaN(realDelayTestPings) && realDelayTestPings > 0 && state.settings.realDelayTestPings !== realDelayTestPings) {
            state.settings.realDelayTestPings = realDelayTestPings;
            changed = true;
        }
        if (!isNaN(realDelayTestTimeout) && realDelayTestTimeout >= 100 && state.settings.realDelayTestTimeout !== realDelayTestTimeout) {
            state.settings.realDelayTestTimeout = realDelayTestTimeout;
            changed = true;
        }
        if (speedTestFileUrl && state.settings.speedTestFileUrl !== speedTestFileUrl) {
            state.settings.speedTestFileUrl = speedTestFileUrl;
            changed = true;
        }

        // Column Visibility settings
        let columnVisibilityChanged = false;
        Object.keys(columnDefinitions).forEach(key => { // Iterate over object keys
            const checkbox = $(`#col-toggle-${key}`);
            if (checkbox) {
                const isVisible = checkbox.checked;
                if (state.settings.columnVisibility[key] !== isVisible) {
                    state.settings.columnVisibility[key] = isVisible;
                    columnVisibilityChanged = true;
                }
            }
        });

        if (columnVisibilityChanged) {
            applyColumnVisibility(); // Apply immediately to update table
            changed = true; // Ensure saveAllData is called
        }

        if (changed) {
            saveAllData();
            showToast(lang('toast_settings_saved'), 'success');
        }
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
    updateSelectAllCheckboxState();
    updateSelectAllCheckboxState();
    // Also call it after handleSearch, handleGroupClick, handleDeleteConfig, etc.

    // --- Config Details Panel Logic (Re-introduced) ---
    const showDetailsPanel = async (configId, isRefresh = false) => {
        const panel = $('#configDetailsPanel');
        const panelBody = $('#configDetailsBody');
        const notesSection = $('#configNotesSection'); // Get notes section
        const notesTextarea = $('#configNotesTextarea'); // Get notes textarea

        if (!panel || !panelBody || !notesSection || !notesTextarea) {
            console.error("One or more details panel elements (panel, body, notes section/textarea) not found.");
            return;
        }

        if (!isRefresh && state.activeDetailConfigId === configId && panel.classList.contains('open')) {
            closeDetailsPanel();
            return;
        }

        const config = state.configs.find(c => c.id === configId);
        if (!config) {
            showToast(lang('error_config_not_found'), 'error');
            closeDetailsPanel();
            return;
        }

        // Show loading state only for main details, not notes initially
        panelBody.innerHTML = `<p class="empty-state" data-lang="loading_details">${lang('loading_details')}</p>`;
        notesSection.style.display = 'none'; // Hide notes while loading other details

        if (!panel.classList.contains('open')) {
            panel.classList.add('open');
        }
        state.activeDetailConfigId = configId;

        try {
            const result = await window.api.getFullConfigDetails(config.link);
            if (result.success) {
                // Populate main details first (this will clear panelBody's loading message)
                populateDetailsPanel(result.details, config);

                // Now handle notes section specifically
                notesTextarea.value = config.notes || '';
                notesTextarea.setAttribute('placeholder', lang('notes_placeholder'));
                notesSection.style.display = 'block'; // Show notes section

                // Ensure notes title is also localized
                const notesTitle = notesSection.querySelector('.detail-section-title');
                if(notesTitle) notesTitle.textContent = lang('config_notes_title');


                // Remove any previous listener and add a new one for the current config
                notesTextarea.onblur = null; // Clear old listener
                notesTextarea.onblur = () => {
                    if (config.notes !== notesTextarea.value) {
                        config.notes = notesTextarea.value;
                        saveAllData();
                        showToast(lang('notes_saved_toast'), 'success');
                    }
                };

            } else {
                throw new Error(result.error || 'Failed to get config details.');
            }
        } catch (error) {
            console.error("Error fetching/populating config details panel:", error);
            panelBody.innerHTML = `<p class="empty-state error-state">${lang('error_fetching_details')}: ${error.message}</p>`;
            notesSection.style.display = 'none'; // Keep notes hidden on error
        }
    };

    const closeDetailsPanel = () => {
        const panel = $('#configDetailsPanel');
        const notesSection = $('#configNotesSection'); // Get notes section
        const notesTextarea = $('#configNotesTextarea');

        if (panel) {
            panel.classList.remove('open');
        }
        if (notesTextarea) { // Clean up listener when panel closes
            notesTextarea.onblur = null;
        }
        state.activeDetailConfigId = null;

        setTimeout(() => {
            const panelBody = $('#configDetailsBody');
            if (panelBody && (!panel || !panel.classList.contains('open'))) { // Check if panel is still defined
                 panelBody.innerHTML = `<p class="empty-state" data-lang="select_config_to_view_details">${lang('select_config_to_view_details')}</p>`;
                 if(notesSection) notesSection.style.display = 'none'; // Hide notes section again
            }
        }, 300);
    };

    const populateDetailsPanel = (details, originalConfig) => {
        const panelBody = $('#configDetailsBody');
        // IMPORTANT: This function will now *not* clear panelBody.innerHTML directly at the start.
        // It will append to it, or a wrapper div within it.
        // For simplicity, let's assume the loading message is cleared by the caller (showDetailsPanel)
        // and this function just adds new content.
        // OR, create a specific container for these details *excluding* the notes section.

        // Clear previous details, but leave the notes section structure if it's already there
        // A more robust way is to have a dedicated div for these auto-generated details.
        // For now, let's clear and then re-add the placeholder if needed.
        panelBody.innerHTML = ''; // Clear previous content (including any old notes section if not careful)

        const addDetailPrimitive = (labelKey, value) => { // Renamed to avoid conflict, simpler args
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                return null; // Return null if no item created
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

            item.appendChild(label);
            item.appendChild(valueDiv);
            return item; // Return the created DOM element
        };

        const addDetailLong = (labelKey, value) => {
            const item = addDetailPrimitive(labelKey, value);
            if (item) {
                const valueDiv = item.querySelector('.detail-value');
                if (valueDiv) valueDiv.classList.add('long');
            }
            return item;
        };

        const appendIfNotNull = (element) => {
            if (element) panelBody.appendChild(element);
        }

        // Main config details
        appendIfNotNull(addDetailPrimitive('detail_name', originalConfig.name));
        appendIfNotNull(addDetailPrimitive('detail_protocol', details.protocol));
        appendIfNotNull(addDetailPrimitive('detail_address', originalConfig.address));
        appendIfNotNull(addDetailPrimitive('detail_port', originalConfig.portToDisplay));

        if (details.settings) {
            if (details.protocol === 'vless' && details.settings.vnext?.[0]?.users?.[0]) {
                const user = details.settings.vnext[0].users[0];
                appendIfNotNull(addDetailPrimitive('detail_id_user', user.id));
                appendIfNotNull(addDetailPrimitive('detail_encryption', user.encryption));
                appendIfNotNull(addDetailPrimitive('detail_flow', user.flow));
            } else if (details.protocol === 'vmess' && details.settings.vnext?.[0]?.users?.[0]) {
                const user = details.settings.vnext[0].users[0];
                appendIfNotNull(addDetailPrimitive('detail_id_user', user.id));
                appendIfNotNull(addDetailPrimitive('detail_alter_id', user.alterId));
                appendIfNotNull(addDetailPrimitive('detail_security_vmess', user.security));
            } else if (details.protocol === 'trojan' && details.settings.servers?.[0]) {
                appendIfNotNull(addDetailPrimitive('detail_password', details.settings.servers[0].password));
            } else if (details.protocol === 'ss' && details.settings.servers?.[0]) {
                appendIfNotNull(addDetailPrimitive('detail_ss_method', details.settings.servers[0].method));
                appendIfNotNull(addDetailPrimitive('detail_password', details.settings.servers[0].password));
            }
        }

        if (details.streamSettings) {
            appendIfNotNull(addDetailPrimitive('detail_network', details.streamSettings.network));
            appendIfNotNull(addDetailPrimitive('detail_security', details.streamSettings.security));
            if (details.streamSettings.tlsSettings) {
                const ts = details.streamSettings.tlsSettings;
                appendIfNotNull(addDetailPrimitive('detail_sni', ts.serverName));
                appendIfNotNull(addDetailPrimitive('detail_alpn', ts.alpn));
                appendIfNotNull(addDetailPrimitive('detail_fingerprint', ts.fingerprint));
                appendIfNotNull(addDetailPrimitive('detail_allow_insecure', typeof ts.allowInsecure === 'boolean' ? ts.allowInsecure : undefined));
            }
            if (details.streamSettings.realitySettings) {
                const rs = details.streamSettings.realitySettings;
                appendIfNotNull(addDetailPrimitive('detail_xtls_settings_publickey', rs.publicKey));
                appendIfNotNull(addDetailPrimitive('detail_xtls_settings_shortid', rs.shortId));
            }
            if (details.streamSettings.wsSettings) {
                appendIfNotNull(addDetailPrimitive('detail_ws_path', details.streamSettings.wsSettings.path));
                if(details.streamSettings.wsSettings.headers) appendIfNotNull(addDetailPrimitive('detail_ws_host', details.streamSettings.wsSettings.headers.Host));
            }
            if (details.streamSettings.grpcSettings) {
                appendIfNotNull(addDetailPrimitive('detail_service_name', details.streamSettings.grpcSettings.serviceName));
                appendIfNotNull(addDetailPrimitive('detail_multi_mode', typeof details.streamSettings.grpcSettings.multiMode === 'boolean' ? details.streamSettings.grpcSettings.multiMode : undefined));
            }
        }
        appendIfNotNull(addDetailLong('detail_full_link', originalConfig.link));

        // Standard test results
        appendIfNotNull(addDetailPrimitive('status', formatStatus(originalConfig.status)));
        if (originalConfig.delay !== null && originalConfig.delay !== undefined) {
            appendIfNotNull(addDetailPrimitive('delay', formatDelay(originalConfig.delay)));
        }
        if (originalConfig.errorMessage) {
            appendIfNotNull(addDetailLong('error_message_detail', originalConfig.errorMessage));
        }

        // Real Delay Test results
        if (originalConfig.realDelay !== undefined && originalConfig.realDelay !== null) {
            appendIfNotNull(addDetailPrimitive('real_delay_avg_detail', formatDelay(originalConfig.realDelay)));
            if (originalConfig.realDelayError) {
                appendIfNotNull(addDetailLong('real_delay_error_detail', originalConfig.realDelayError));
            }
        } else if (originalConfig.realDelayError) {
             appendIfNotNull(addDetailPrimitive('real_delay_avg_detail', 'N/A'));
             appendIfNotNull(addDetailLong('real_delay_error_detail', originalConfig.realDelayError));
        }

        // Add Speed Test results if available
        if (originalConfig.downloadSpeed !== undefined && originalConfig.downloadSpeed !== null) {
            if (originalConfig.downloadSpeed > -1) {
                appendIfNotNull(addDetailPrimitive('download_speed_detail', `${originalConfig.downloadSpeed} Mbps`));
            } else {
                appendIfNotNull(addDetailPrimitive('download_speed_detail', 'N/A'));
            }
            if (originalConfig.speedTestError) {
                appendIfNotNull(addDetailLong('speed_test_error_detail', originalConfig.speedTestError));
            }
        } else if (originalConfig.speedTestError) {
            appendIfNotNull(addDetailPrimitive('download_speed_detail', 'N/A'));
            appendIfNotNull(addDetailLong('speed_test_error_detail', originalConfig.speedTestError));
        }

        // Test History section
        const historyTitle = document.createElement('h4');
        historyTitle.className = 'detail-section-title';
        historyTitle.textContent = lang('test_history_title');
        panelBody.appendChild(historyTitle);

        const historyList = document.createElement('ul');
        historyList.className = 'test-history-list';

        const configHistory = (state.settings.testHistory || []).filter(entry => entry.configId === originalConfig.id).slice(0, 5);

        if (configHistory.length === 0) {
            const noHistoryItem = document.createElement('li');
            noHistoryItem.className = 'history-item empty';
            noHistoryItem.textContent = lang('no_test_history_for_config');
            historyList.appendChild(noHistoryItem);
        } else {
            configHistory.forEach(entry => {
                const item = document.createElement('li');
                item.className = 'history-item';
                const date = new Date(entry.timestamp).toLocaleString();
                let resultText = '';
                let resultClass = 'history-result'; // Default class
                if (entry.testType === 'speed') {
                    if (entry.downloadSpeed > -1) {
                        resultText = `${entry.downloadSpeed} Mbps`;
                    } else {
                        resultText = `Error: ${entry.error || 'Failed'}`;
                        resultClass += ' error-text'; // Add error class
                    }
                } else {
                    if (entry.delay > -1) {
                        resultText = `${entry.delay} ms`;
                    } else {
                        resultText = `Error: ${entry.error || 'Failed'}`;
                        resultClass += ' error-text'; // Add error class
                    }
                }
                item.innerHTML = `
                    <span class="history-date">${date}</span>
                    <span class="history-type">(${lang('test_type_' + entry.testType) || entry.testType})</span>:
                    <span class="${resultClass}">${resultText}</span>
                `;
                historyList.appendChild(item);
            });
        }
        panelBody.appendChild(historyList);

        // Re-add the notes section structure if it was cleared (it should be separate in HTML)
        // This is a bit of a hack; the notes section should ideally be outside the part of panelBody that populateDetailsPanel clears.
        // For now, ensure the notes section is re-appended if it got wiped.
        const notesSectionElement = $('#configNotesSection');
        if (notesSectionElement) { // This assumes it's already in the DOM from index.html
             panelBody.appendChild(notesSectionElement); // Move it to the end
        }
    };

    // --- End Config Details Panel Logic ---


    const handleAddConfigFromText = () => {
        const text = $('#pasteArea').value;
        if (text) {
            const links = text.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
            processAndAddConfigs(links);
            $('#pasteArea').value = ''; // Clear textarea
            closeModal(); // Assuming this button is within a modal that should close
        } else {
            showToast(lang('toast_paste_area_empty'), 'warning');
        }
    };

    const handleImportTextFile = () => { // Now correctly associated with addFromFileBtn
        window.api.importTextFile()
            .then(fileContent => {
                if (fileContent === null) return; // User cancelled dialog
                const links = fileContent.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
                if (links.length > 0) {
                    processAndAddConfigs(links);
                    // Success toast is handled by processAndAddConfigs
                }
                // Optionally, add a toast if the file was empty or contained no valid links.
            })
            .catch(error => {
                console.error("Error importing text file:", error);
                showToast(lang('toast_failed_fetch_sub', { error: error.message || 'Unknown error' }), 'error'); // Reusing failed_fetch_sub for generic file error
            });
    };

    const handleExportConfigs = (configsToExport, defaultFilename) => {
        if (!configsToExport || configsToExport.length === 0) {
            showToast(lang('toast_no_configs_export'), 'info'); // Add lang key: toast_no_configs_export
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
            showToast(lang('toast_sub_url_empty'), 'warning');
            return;
        }
        showToast(lang('toast_fetching_sub'), 'info');
        try {
            const result = await window.api.fetchSubscription(subUrl);
            if (result.success) {
                const links = result.data.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
                if (links.length > 0) {
                    processAndAddConfigs(links);
                     // Success toast handled by processAndAddConfigs
                }
                $('#subLinkInput').value = ''; // Clear input
                closeModal(); // Assuming this is in a modal
            } else {
                throw new Error(result.error || 'Unknown error fetching subscription');
            }
        } catch (error) {
            console.error("Error fetching subscription:", error);
            showToast(lang('toast_failed_fetch_sub', { error: error.message || 'Unknown error' }), 'error');
        }
    };

    const handleClearAllData = async () => {
        const confirmed = await showConfirm({ title: lang('confirm_clear_all_data_title'), message: lang('confirm_clear_all_data_message') }); // Add lang keys
        if (!confirmed) return;

        window.api.clearAllData()
            .then(() => {
                state.configs = [];
                state.groups = [];
                state.settings = { concurrentTests: 10, testTimeout: 8, testUrl: 'http://cp.cloudflare.com/generate_204' };
                state.activeGroupId = 'all';
                state.selectedConfigIds = [];
                state.lastTestCompletionTime = null;
                saveAllData();
                renderAll(); // renderAll already calls updateDashboardStatsInStatusBar
                // updateDashboard(); // This was the error, and it's redundant.
                showToast(lang('toast_all_data_cleared'), 'success');
            })
            .catch(error => {
                console.error("Error clearing all data:", error);
                showToast(lang('toast_failed_clear_data', { error: error.message || 'Unknown error' }), 'error'); // Add lang key
            });
    };

    const handleShowQRCode = (link) => {
        window.api.generateQRCode(link)
            .then(dataUrl => {
                const qrImageEl = $('#qrCodeImage');
                const qrNameEl = $('#qrCodeName');

                if (qrImageEl) qrImageEl.src = dataUrl;
                else console.error("#qrCodeImage element not found for QR Code modal.");

                if (qrNameEl) qrNameEl.textContent = link;
                else console.error("#qrCodeName element not found for QR Code modal.");

                openModal('qrCodeModal');
            })
            .catch(error => {
                console.error("Error generating QR code:", error);
                showToast(lang('toast_failed_generate_qr', { error: error.message || 'Unknown error' }), 'error'); // Add lang key
            });
    };

    const handleStartTest = () => {
        if (state.isTesting) {
            showToast(lang('toast_test_already_running'), 'warning');
            return;
        }

        let configsToTest = [];
        let groupIdToSend = null;

        const activeUserGroup = state.groups.find(g => g.id === state.activeGroupId);

        if (activeUserGroup) {
            // A specific user-defined group is active, send its ID
            // main.js will fetch all configs for this group from the store.
            // We still need to provide a 'configs' array, but it can be minimal or ignored by main.js if groupId is present.
            // For simplicity and consistency, let's send the visible configs of that group.
            // Or, if main.js is set to *always* re-fetch by groupId, this 'configs' array is less critical.
            // Based on the main.js change, if groupId is present, 'configs' passed from here is not the primary source.
            // So, we can send an empty array for 'configs' when groupId is set.
            // However, to keep track of totalToTest for progress bar locally, it's better if renderer knows the count.
            // Let's have renderer determine the configs to test for the group.
            configsToTest = state.configs.filter(c => c.groupId === state.activeGroupId && c.status !== 'testing');
            groupIdToSend = state.activeGroupId; // Send the group ID
            if (configsToTest.length === 0) {
                showToast(lang('toast_no_configs_to_test') + (activeUserGroup ? ` in group "${activeUserGroup.name}"` : ""), 'info');
                return;
            }
            console.log(`Starting test for group: ${activeUserGroup.name}, ID: ${groupIdToSend}, Configs: ${configsToTest.length}`);
        } else {
            // Testing 'all', 'favorites', 'healthy', or search results (visible configs)
            configsToTest = getVisibleConfigs().filter(c => c.status !== 'testing');
            if (configsToTest.length === 0) {
                showToast(lang('toast_no_configs_to_test'), 'info');
                return;
            }
            console.log(`Starting test for visible configs. Count: ${configsToTest.length}`);
        }

        state.isTesting = true;
        configsToTest.forEach(c => { c.status = 'testing'; });
        renderTable();
        updateTestUI();

        $('#progressBar').value = 0; // Assuming #progressBar is a <progress> element or similar
        $('#progressText').textContent = lang('testing_progress', { completed: 0, total: configsToTest.length, progress: 0 });

        // Send the determined configs and potentially the groupId
        window.api.startTests({ configs: configsToTest, settings: state.settings, groupId: groupIdToSend });
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
                showToast(lang('toast_select_one_healthy_config_connect'), 'warning'); // Add lang key
            } else {
                showToast(lang('toast_selected_config_not_healthy'), 'warning'); // Add lang key
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
        const config = state.configs.find(c => c.id === configId);
        if (!config) return;

        // Handle favorite toggle click
        if (e.target.classList.contains('favorite-toggle-icon')) {
            config.isFavorite = !config.isFavorite;
            saveAllData();
            renderTable(); // Re-render this row and potentially others if sort order changes
            renderGroups(); // Update favorite count in sidebar
            // If current view is "Favorites" and item is unfavorited, it will disappear.
            // If current view is not "Favorites" and item is favorited, it will just update icon.
            return; // Prevent row selection logic from firing for icon click
        }

        const isCheckboxClick = e.target.type === 'checkbox';
        const isSpecialKey = e.ctrlKey || e.metaKey || e.shiftKey;

        if (isCheckboxClick || isSpecialKey) {
            if (e.shiftKey && state.lastSelectedId) {
                const visibleConfigs = getVisibleConfigs();
                const lastIdx = visibleConfigs.findIndex(c => c.id === state.lastSelectedId);
                const currentIdx = visibleConfigs.findIndex(c => c.id === configId);
                if (lastIdx !== -1 && currentIdx !== -1) {
                    const start = Math.min(lastIdx, currentIdx);
                    const end = Math.max(lastIdx, currentIdx);
                    const shiftSelectedIds = visibleConfigs.slice(start, end + 1).map(c => c.id);
                    if (isCheckboxClick && e.target.checked) {
                        state.selectedConfigIds = [...new Set([...state.selectedConfigIds, ...shiftSelectedIds])];
                    } else if (isCheckboxClick && !e.target.checked) {
                        state.selectedConfigIds = state.selectedConfigIds.filter(id => !shiftSelectedIds.includes(id));
                    } else {
                        state.selectedConfigIds = shiftSelectedIds;
                    }
                }
            } else if (e.ctrlKey || e.metaKey) {
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
            renderTable();
            updateConnectionButton();
        } else if (!isCheckboxClick && !isSpecialKey) {
            state.selectedConfigIds = [configId];
            state.lastSelectedId = configId;
            renderTable();
            updateConnectionButton();
        }
    };

    const handleTableContextMenu = async (e) => {
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

        let menuItems = [];
        if (row && row.dataset.id && state.selectedConfigIds.length === 1) {
            // If a single config is right-clicked (and now selected), fetch its details for the context menu
            const config = state.configs.find(c => c.id === clickedConfigId);
            if (config) {
                try {
                    // Add a "Loading details..." item first
                    // This item will be replaced once details are fetched.
                    // This approach is complex for a context menu that's usually built synchronously.
                    // A simpler way is to build the menu after details are fetched.
                    // Or, show basic items and a "View Details" that then opens a modal or separate view.
                    // Given the request to put details *in* the menu, we'll fetch then build.

                    // showContextMenu(e, [{label: "Loading details...", disabled: true}]); // Show temp menu
                    // const menuElement = $('#contextMenu'); // Get reference to update later
                    // if(menuElement) menuElement.classList.add('loading-details');


                    const result = await window.api.getFullConfigDetails(config.link);
                    // menuElement.classList.remove('loading-details'); // Remove loading state

                    if (result.success) {
                        menuItems = getConfigContextMenuItems(result.details, config);
                    } else {
                        console.error("Failed to get full config details for context menu:", result.error);
                        showToast(lang('error_fetching_details') + `: ${result.error}`, 'error');
                        menuItems = getConfigContextMenuItems(null, config); // Build menu without details
                    }
                } catch (error) {
                    // menuElement.classList.remove('loading-details');
                    console.error("Exception getting full config details for context menu:", error);
                    showToast(lang('error_fetching_details') + `: ${error.message}`, 'error');
                    menuItems = getConfigContextMenuItems(null, config); // Build menu without details
                }
            } else {
                 menuItems = getConfigContextMenuItems(); // Should not happen if row.dataset.id is valid
            }
        } else {
            menuItems = getConfigContextMenuItems(); // For multi-select or global context
        }
        showContextMenu(e, menuItems);
    };

    const handleManageGroupSubscription = async (groupId) => {
        const group = state.groups.find(g => g.id === groupId);
        if (!group) {
            showToast(lang('toast_group_not_found_edit'), 'error'); // Re-use existing lang key
            return;
        }

        const newSubUrl = await showPrompt({
            title: lang('prompt_group_sub_url_title') || 'Group Subscription URL', // Add lang key
            message: lang('prompt_group_sub_url_message') || 'Enter subscription URL (leave empty to remove):', // Add lang key
            defaultValue: group.subscriptionUrl || ''
        });

        if (newSubUrl !== null) { // User didn't cancel prompt
            const trimmedUrl = newSubUrl.trim();
            if (trimmedUrl === '' && group.subscriptionUrl) { // Removing URL
                delete group.subscriptionUrl;
                delete group.lastUpdated; // Remove last updated time as well
                showToast(lang('toast_group_sub_url_removed', { groupName: group.name }), 'success'); // Add lang key
            } else if (trimmedUrl !== '' && trimmedUrl !== group.subscriptionUrl) {
                try {
                    new URL(trimmedUrl); // Validate URL format
                    group.subscriptionUrl = trimmedUrl;
                    group.lastUpdated = null; // Reset last updated time, will update on fetch
                    showToast(lang('toast_group_sub_url_set', { groupName: group.name }), 'success'); // Add lang key
                     // Optionally, ask if they want to update now
                    const updateConfirm = await showConfirm({
                        title: lang('confirm_update_sub_now_title') || 'Update Subscription', // Add lang key
                        message: lang('confirm_update_sub_now_message', { groupName: group.name }) || `Subscription URL for group "${group.name}" has been set/changed. Update now?` // Add lang key
                    });
                    if (updateConfirm) {
                        handleUpdateGroupSubscription(groupId);
                    }
                } catch (urlError) {
                    showToast(lang('toast_invalid_sub_url'), 'error'); // Add lang key
                }
            }
            saveAllData();
            renderGroups(); // Re-render to show new/updated sub button title and update button
        }
    };

    const handleUpdateGroupSubscription = async (groupId, forceUpdate = false) => {
        const group = state.groups.find(g => g.id === groupId);
        if (!group || !group.subscriptionUrl) {
            showToast(lang('toast_no_sub_url_for_group', { groupName: group ? group.name : 'N/A' }), 'warning'); // Add lang key
            return;
        }

        // Optional: Add logic here to prevent too frequent updates unless forced
        // if (!forceUpdate && group.lastUpdated && (Date.now() - new Date(group.lastUpdated).getTime()) < SOME_MINIMUM_INTERVAL) {
        //     showToast(lang('toast_sub_updated_recently', {groupName: group.name}), 'info'); // Add lang key
        //     return;
        // }

        showToast(lang('toast_fetching_group_sub', { groupName: group.name }), 'info'); // Add lang key

        try {
            const result = await window.api.fetchSubscription(group.subscriptionUrl);
            if (result.success) {
                const links = result.data.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
                // Modify processAndAddConfigs to accept a targetGroupId
                await processAndAddConfigs(links, groupId); // Pass groupId here
                group.lastUpdated = new Date().toISOString();
                saveAllData(); // Save updated timestamp
                renderGroups(); // Re-render groups to show updated lastUpdated time
                // processAndAddConfigs already shows a toast for added configs
            } else {
                throw new Error(result.error || 'Unknown error fetching group subscription');
            }
        } catch (error) {
            console.error(`Error fetching group subscription for ${group.name}:`, error);
            showToast(lang('toast_failed_fetch_group_sub', { groupName: group.name, error: error.message }), 'error'); // Add lang key
        }
    };


    const handleSelectByStatusInGroup = (statusToSelect) => {
        const visibleConfigs = getVisibleConfigs(); // These are already filtered by current group/search
        const configsToSelect = visibleConfigs.filter(c => c.status === statusToSelect);

        if (configsToSelect.length === 0) {
            showToast(lang('toast_none_selected_by_status', { status: lang(statusToSelect) || statusToSelect }), 'info');
            return;
        }

        // Add to current selection or replace? For now, let's replace.
        state.selectedConfigIds = configsToSelect.map(c => c.id);
        if (state.selectedConfigIds.length > 0) {
            state.lastSelectedId = state.selectedConfigIds[state.selectedConfigIds.length - 1];
        } else {
            state.lastSelectedId = null;
        }
        renderTable();
        updateConnectionButton();
        updateSelectAllCheckboxState(); // Ensure the master checkbox reflects the new selection
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
        // Now includes 'error' status explicitly as part of what's considered "unhealthy" for deletion.
        // Also includes items that were tested but resulted in a negative delay (often indicating an issue).
        const configsToDelete = state.configs.filter(c =>
            c.status === 'unhealthy' ||
            c.status === 'error' ||
            (c.status === 'untested' && c.delay === -1) || // Typically means a test ran but failed before status was set, e.g. timeout
            (c.delay !== null && c.delay < 0 && c.status !== 'testing') // Catch-all for tested items with negative delay
        );
        if (configsToDelete.length === 0) {
            showToast(lang('toast_no_unhealthy_to_delete'), 'info');
            return;
        }
        const confirmed = await showConfirm({
            title: lang('confirm_delete_unhealthy_title'), // Add lang key
            message: lang('confirm_delete_unhealthy_message', { count: unhealthyConfigs.length }) // Add lang key
        });
        if (confirmed) {
            const idsToDelete = new Set(configsToDelete.map(c => c.id));
            state.configs = state.configs.filter(c => !idsToDelete.has(c.id));
            state.selectedConfigIds = state.selectedConfigIds.filter(id => !idsToDelete.has(id));
            saveAllData();
            renderAll();
            showToast(lang('toast_unhealthy_deleted', { count: idsToDelete.size }), 'success');
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
                    showToast(lang('toast_clipboard_empty_or_no_links'), 'info');
                }
            } else {
                showToast(lang('toast_clipboard_empty'), 'info');
            }
        } catch (error) {
            console.error("Error reading from clipboard:", error);
            showToast(lang('toast_failed_read_clipboard', { error: error.message }), 'error');
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
            renderGroups();
            showToast(lang('toast_group_added', { groupName: newGroup.name }), 'success');
        } else if (groupName !== null) {
            showToast(lang('toast_group_name_empty'), 'warning');
        }
    };

    const handleEditGroup = async (groupId) => {
        const group = state.groups.find(g => g.id === groupId);
        if (!group) {
            showToast(lang('toast_group_not_found_edit'), 'error');
            return;
        }

        const newGroupName = await showPrompt({
            title: lang('edit_group_name_title'),
            message: lang('edit_group_name_message'),
            defaultValue: group.name
        });

        if (newGroupName && newGroupName.trim() !== '' && newGroupName.trim() !== group.name) {
            group.name = newGroupName.trim();
            saveAllData();
            renderGroups();
            showToast(lang('toast_group_name_updated', { groupName: group.name }), 'success');
        } else if (newGroupName !== null && newGroupName.trim() === '') {
            showToast(lang('toast_group_name_empty'), 'warning');
        }
    };

    const handleDeleteGroup = async (groupId) => {
        const groupToDelete = state.groups.find(g => g.id === groupId);
        if (!groupToDelete) {
            showToast(lang('toast_group_not_found_delete'), 'error');
            return;
        }

        const confirmed = await showConfirm({
            title: lang('confirm_delete_group_title'),
            message: `${lang('confirm_delete_group_message')} "${groupToDelete.name}"? ${lang('confirm_delete_group_message_configs_note')}`
        });

        if (confirmed) {
            const deletedGroupName = groupToDelete.name; // Store name before deletion
            state.groups = state.groups.filter(g => g.id !== groupId);
            state.configs.forEach(c => {
                if (c.groupId === groupId) {
                    c.groupId = null;
                }
            });

            if (state.activeGroupId === groupId) {
                state.activeGroupId = 'all';
            }

            saveAllData();
            renderAll();
            showToast(lang('toast_group_deleted', { groupName: deletedGroupName }), 'success');
        }
    };


    const handleEditName = async (config) => {
        if (!config) {
            if (state.selectedConfigIds.length !== 1) {
                 showToast(lang('toast_select_single_config_edit_name'), "warning"); return;
            }
            config = state.configs.find(c => c.id === state.selectedConfigIds[0]);
        }
        if (!config) {
             showToast(lang('toast_config_not_found_edit'), "error"); return;
        }

        const newName = await showPrompt({
            title: lang('edit_name_title'),
            message: lang('edit_name_message'),
            defaultValue: config.name
        });
        if (newName !== null && newName.trim() !== '') {
            config.name = newName.trim();
            saveAllData();
            renderTable();
            showToast(lang('toast_config_name_updated'), 'success');
        } else if (newName !== null) {
             showToast(lang('toast_config_name_empty'), 'warning');
        }
    };
    
    const handleDeleteConfig = async () => {
        if (state.selectedConfigIds.length === 0) {
            showToast(lang('toast_no_configs_delete'), "warning"); return;
        }
        const confirmed = await showConfirm({
            title: lang('confirm_delete_title'),
            message: lang('confirm_delete_config_plural', { count: state.selectedConfigIds.length }) // Add lang key
        });
        if (confirmed) {
            const selectionIdSet = new Set(state.selectedConfigIds);
            state.configs = state.configs.filter(c => !selectionIdSet.has(c.id));
            state.selectedConfigIds = [];
            state.lastSelectedId = null;
            saveAllData();
            renderAll(); // This calls updateDashboardStatsInStatusBar
            // updateDashboard();
            showToast(lang('toast_configs_deleted', { count: selectionIdSet.size }), 'success');
        }
    };

    // This is a duplicate of handleDeleteGroup, removing it.
    /*
    const handleDeleteGroup = async (groupId) => {
        const groupToDelete = state.groups.find(g => g.id === groupId);
        if (!groupToDelete) {
            showToast('Group not found.', 'error');
            return;
        }

        const confirmed = await showConfirm({
            title: lang('confirm_delete_group_title'), // Ensure this lang key exists
            message: `${lang('confirm_delete_group_message') || 'Are you sure you want to delete the group:'} "${groupToDelete.name}"? ${lang('confirm_delete_group_message_configs_note') || 'Configs in this group will become ungrouped.'}`
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
    */

    const handleAssignToGroup = async (groupId) => {
        if (state.selectedConfigIds.length === 0) {
            showToast(lang('toast_no_configs_assign'), "warning"); return;
        }
        if (groupId === 'new') {
            const groupName = await showPrompt({ title: lang('prompt_new_group_title'), message: lang('prompt_new_group_message') });
            if (groupName && groupName.trim() !== "") {
                const newGroup = { id: `grp_${Date.now()}_${Math.random().toString(36).substring(2,9)}`, name: groupName.trim() };
                state.groups.push(newGroup);
                groupId = newGroup.id;
                renderGroups();
            } else if (groupName !== null) {
                showToast(lang('toast_group_name_empty'), "warning"); return;
            } else {
                return;
            }
        }

        let assignedCount = 0;
        state.configs.forEach(c => {
            if (state.selectedConfigIds.includes(c.id)) {
                c.groupId = groupId;
                assignedCount++;
            }
        });
        saveAllData();
        renderTable();
        renderGroups();
        const targetGroup = state.groups.find(g => g.id === groupId);
        const groupNameText = targetGroup ? `"${targetGroup.name}"` : lang('ungrouped'); // Use lang key for "ungrouped"
        showToast(lang('toast_configs_assigned', { count: assignedCount, groupNameText: groupNameText }), 'success');
    };
    
    const getGlobalContextMenuItems = () => {
        return [
            { label: lang('ctx_add_from_clipboard'), action: handleAddFromClipboard, iconClass: 'fa-solid fa-paste' },
            { label: lang('ctx_add_new_group'), action: handleAddGroup, iconClass: 'fa-solid fa-folder-plus' },
            { type: 'separator' },
            { label: lang('ctx_test_all_visible'), action: () => handleStartTest(), iconClass: 'fa-solid fa-play-circle' },
            { label: lang('ctx_delete_all_unhealthy'), action: handleDeleteUnhealthy, iconClass: 'fa-solid fa-heart-crack' },
        ];
    };

    const getConfigContextMenuItems = (configDetails = null, originalConfig = null) => { // configDetails might be null if not pre-fetched
        const items = [];
        const selectedConfig = state.configs.find(c => c.id === state.selectedConfigIds[0]);

        // Standard actions for single selection
        if (state.selectedConfigIds.length === 1 && selectedConfig) {
            const favoriteActionText = selectedConfig.isFavorite ? lang('remove_from_favorites_ctx') : lang('add_to_favorites_ctx');
            const favoriteActionIcon = selectedConfig.isFavorite ? 'fa-solid fa-star-half-alt' : 'fa-regular fa-star'; // Example: use half-star or outline
            items.push({
                label: favoriteActionText,
                action: () => {
                    selectedConfig.isFavorite = !selectedConfig.isFavorite;
                    saveAllData();
                    renderTable();
                    renderGroups();
                },
                iconClass: favoriteActionIcon
            });
            items.push({ type: 'separator' });
            items.push({ label: lang('copy_link'), action: () => navigator.clipboard.writeText(selectedConfig.link).then(() => showToast(lang('toast_link_copied'), 'success')).catch(e => showToast(lang('toast_failed_copy_link'), 'error')), iconClass: 'fa-solid fa-copy' });
            items.push({ label: lang('show_qr_code'), action: () => handleShowQRCode(selectedConfig.link), iconClass: 'fa-solid fa-qrcode' });
            items.push({ label: lang('edit_name'), action: () => handleEditName(selectedConfig), iconClass: 'fa-solid fa-pen-to-square' });
        }

        // Actions for any selection (single or multiple)
        if (state.selectedConfigIds.length > 0) {
            // If multiple items are selected, "Toggle Favorite" might be ambiguous.
            // Could offer "Add All to Favorites" / "Remove All from Favorites" or disable if mixed.
            // For now, let's keep the single-select favorite toggle for simplicity in context menu.
            // Test, Real Delay, Speed Test actions:
            items.push({
                label: `${lang('test_selected')} (${state.selectedConfigIds.length})`,
                action: () => {
                    if (state.isTesting) {
                        showToast(lang('toast_test_already_running'), 'warning');
                        return;
                    }
                    const configsToTest = state.configs.filter(c => state.selectedConfigIds.includes(c.id) && c.status !== 'testing');
                    if (configsToTest.length === 0) {
                        showToast(lang('toast_selected_configs_tested_or_testing'), 'info');
                        return;
                    }
                    state.isTesting = true;
                    configsToTest.forEach(c => c.status = 'testing');
                    renderTable();
                    updateTestUI();
                    $('#progressBar').style.width = '0%';
                    $('#progressText').textContent = `Testing 0/${configsToTest.length}`;
                    window.api.startTests({ configs: configsToTest, settings: state.settings });
                },
                iconClass: 'fa-solid fa-play' // Added icon
            });
            // Add Real Delay Test option
            items.push({
                label: `${lang('real_delay_test_selected_ctx', { count: state.selectedConfigIds.length })}`,
                action: () => {
                    if (state.isTesting) {
                        showToast(lang('toast_test_already_running'), 'warning');
                        return;
                    }
                    const configsToTest = state.configs.filter(c => state.selectedConfigIds.includes(c.id));
                    if (configsToTest.length === 0) {
                        showToast(lang('toast_no_configs_selected_test'), 'warning');
                        return;
                    }
                    state.isTesting = true;
                    configsToTest.forEach(c => c.status = 'testing');
                    renderTable();
                    updateTestUI();
                     $('#progressBar').style.width = '0%';
                    $('#progressText').textContent = `Real Delay Testing 0/${configsToTest.length}`;

                    window.api.startRealDelayTests({ configs: configsToTest, settings: state.settings });
                },
                iconClass: 'fa-solid fa-stopwatch'
            });
            // Add Speed Test option
            items.push({
                label: `${lang('speed_test_selected_ctx', { count: state.selectedConfigIds.length })}`,
                action: () => {
                    if (state.isTesting) {
                        showToast(lang('toast_test_already_running'), 'warning');
                        return;
                    }
                    const configsToTest = state.configs.filter(c => state.selectedConfigIds.includes(c.id));
                    if (configsToTest.length === 0) {
                        showToast(lang('toast_no_configs_selected_test'), 'warning');
                        return;
                    }
                    state.isTesting = true;
                    configsToTest.forEach(c => c.status = 'testing');
                    renderTable();
                    updateTestUI();
                    $('#progressBar').style.width = '0%';
                    $('#progressText').textContent = `Speed Testing 0/${configsToTest.length}`;
                    window.api.startSpeedTests({ configs: configsToTest, settings: state.settings });
                },
                iconClass: 'fa-solid fa-gauge-high'
            });
        }

        // --- Assign to Group Options ---
        if (state.selectedConfigIds.length > 0) {
            const groupSubmenuItems = [];
            const assignableGroups = state.groups;

            assignableGroups.forEach(g => {
                groupSubmenuItems.push({
                    label: g.name,
                    action: () => handleAssignToGroup(g.id),
                    iconClass: 'fa-solid fa-folder' // Icon for existing groups in submenu
                });
            });
            groupSubmenuItems.push({ type: 'separator' });
            groupSubmenuItems.push({
                label: lang('assign_to_new_group'),
                action: () => handleAssignToGroup('new'),
                iconClass: 'fa-solid fa-folder-plus' // Icon for new group option
            });

            if (state.selectedConfigIds.some(id => {
                const config = state.configs.find(c => c.id === id);
                return config && config.groupId !== null;
            })) {
                groupSubmenuItems.push({ type: 'separator' });
                groupSubmenuItems.push({
                    label: lang('ungroup_config'),
                    action: () => handleAssignToGroup(null),
                    iconClass: 'fa-solid fa-times-circle' // Icon for ungrouping
                });
            }

            if (assignableGroups.length > 0 || true) {
                 items.push({ type: 'separator' });
                items.push({
                    label: lang('assign_to_group'),
                    submenu: groupSubmenuItems,
                    iconClass: 'fa-solid fa-object-group' // Icon for the main "Assign to Group"
                });
                items.push({ type: 'separator' });
            }
        }
        // --- End Assign to Group Options ---

        // Group-specific selection actions (only if a single config is the context, implies originalConfig is present)
        if (originalConfig) { // This check implies it's a single-config context menu
            items.push({ type: 'separator' });
            items.push({ label: lang('ctx_select_healthy_in_group'), action: () => handleSelectByStatusInGroup('healthy'), iconClass: 'fa-solid fa-check-circle' });
            items.push({ label: lang('ctx_select_unhealthy_in_group'), action: () => handleSelectByStatusInGroup('unhealthy'), iconClass: 'fa-solid fa-heart-crack' });
            items.push({ label: lang('ctx_select_untested_in_group'), action: () => handleSelectByStatusInGroup('untested'), iconClass: 'fa-solid fa-question-circle' });
        }

        if (state.selectedConfigIds.length > 0) { // Delete action available if any selection
            items.push({ label: `${lang('delete')} (${state.selectedConfigIds.length})`, action: () => handleDeleteConfig(), iconClass: 'fa-solid fa-trash-alt' });
        }
        return items;
    };


    // --- IPC Listeners ---
    window.api.onTestResult((result) => {
        const config = state.configs.find(c => c.id === result.id);
        if (config) {
            if (result.testType === 'real-delay') {
                config.realDelay = result.delay;
                config.realDelayError = result.error || null;
            } else if (result.testType === 'speed') {
                config.downloadSpeed = result.downloadSpeed;
                config.speedTestError = result.error || null;
            } else { // Standard test (connectivity)
                config.delay = result.delay;
                config.status = result.delay > -1 ? 'healthy' : (result.error ? 'error' : 'unhealthy');
                if (result.error) config.errorMessage = result.error; else delete config.errorMessage;
            }

            // Add to test history
            if (!state.settings.testHistory) {
                state.settings.testHistory = [];
            }
            const historyEntry = {
                configId: config.id,
                configName: config.name, // Store name at time of test for context
                timestamp: new Date().toISOString(),
                testType: result.testType || 'standard', // Default to 'standard' if not specified
                delay: result.testType !== 'speed' ? result.delay : undefined, // delay for standard/real-delay
                downloadSpeed: result.testType === 'speed' ? result.downloadSpeed : undefined, // speed for speed test
                status: result.testType !== 'speed' ? (result.delay > -1 ? 'healthy' : (result.error ? 'error' : 'unhealthy')) : (result.downloadSpeed > -1 ? 'success' : 'error'), // Simplified status for history
                error: result.error || null,
            };
            state.settings.testHistory.unshift(historyEntry); // Add to the beginning
            const MAX_HISTORY_ITEMS = 100; // Limit global history size
            if (state.settings.testHistory.length > MAX_HISTORY_ITEMS) {
                state.settings.testHistory.length = MAX_HISTORY_ITEMS; // Trim older entries
            }
            saveAllData(); // Save settings which now includes history
        }
        renderTable();
        updateStatusBar();
        updateDashboardStatsInStatusBar();

        if (config && state.activeDetailConfigId === config.id && $('#configDetailsPanel').classList.contains('open')) {
            showDetailsPanel(config.id, true);
        }
    });

    window.api.onTestProgress(({ progress, total, completed }) => {
        state.isTesting = progress < 100;
        const progressBar = $('#progressBar');
        const progressText = $('#progressText');

        if(progressBar) progressBar.value = progress;
        if(progressText) progressText.textContent = lang('testing_progress', { completed, total, progress: Math.round(progress) }); // Add lang key

        if (!state.isTesting && progress === 100) {
             if(progressText) progressText.textContent = lang('test_complete_summary', { total, healthy: state.configs.filter(c => c.status === 'healthy').length }); // Add lang key
        }
        updateTestUI();
    });

    window.api.onTestFinish(() => {
        state.isTesting = false;
        state.lastTestCompletionTime = new Date().toISOString();
        saveAllData();

        state.configs.forEach(c => { if (c.status === 'testing') c.status = 'untested'; });

        renderTable();
        updateTestUI();
        updateStatusBar();
        updateDashboardStatsInStatusBar();

        const totalConfigs = state.configs.length;
        const healthyConfigs = state.configs.filter(c => c.status === 'healthy').length;
        // Ensure this text is also localized if it's different from the onTestProgress one.
        // For now, it seems covered by the onTestProgress at 100%.
        // $('#progressText').textContent = `Test complete. Total: ${totalConfigs}, Healthy: ${healthyConfigs}`;
        showToast(lang('toast_all_tests_finished'), 'success');
    });

    window.api.onProxyStatusChange(({ isConnected, error }) => {
        if (isConnected) {
            state.activeConnectionId = state.selectedConfigIds.length === 1 ? state.selectedConfigIds[0] : null;
            if (!state.activeConnectionId) {
                console.warn("Proxy connected, but renderer couldn't determine activeConnectionId from selection.");
            }
        } else {
            state.activeConnectionId = null;
            if (error) {
                showToast(lang('toast_connection_failed', { error }), 'error');
            } else {
                showToast(lang('toast_disconnected'), 'info');
            }
        }
        renderTable();
        updateConnectionButton();
        updateDashboardStatsInStatusBar();
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

    // Handle actions triggered from the main process menu
    window.api.onMenuAction((action) => {
        switch (action) {
            case 'open-add-config-modal':
                openModal('addConfigModal');
                break;
            case 'open-settings-modal':
                openModal('settingsModal');
                break;
            case 'open-import-data-modal':
                // This is handled within settings modal, so just open settings
                openModal('settingsModal');
                // If a direct import was desired, a new handler would be needed.
                // For example, document.getElementById('importDataBtn').click();
                // but that assumes the settings modal's button is always available.
                // A cleaner way would be to call handleImportData() directly if it's safe.
                // For now, opening settings modal is a safe way to access it.
                // Or, directly call handleImportData if it doesn't depend on modal state:
                // handleImportData();
                // Let's make it open settings to be safe and consistent for now.
                break;
            case 'open-export-data-modal':
                // Similar to import, this is in settings.
                openModal('settingsModal');
                // Or directly call: handleExportData();
                break;
            case 'toggle-theme':
                const themeToggleBtn = $('#themeToggleBtn');
                if (themeToggleBtn) themeToggleBtn.click();
                break;
            // Add other actions here if needed
        }
    });

    init();
});
