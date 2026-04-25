/**
 * EXCEL LOGIN LOGGER
 * ==================
 * 
 * This utility logs user logins to both localStorage AND Google Sheets.
 * It creates a downloadable Excel file with login records that can be saved locally,
 * and also sends login data to the Google Apps Script to be stored in a spreadsheet.
 */

/**
 * Log user login to both localStorage and Google Sheets
 * @param {string} email - User's email address
 * @param {string} userType - Type of user (Admin, Client, etc.)
 * @returns {Promise} - Promise that resolves when logging is complete
 */
async function logUserLoginToExcel(email, userType = 'Unknown') {
    try {
        console.log('Logging user login:', email, userType);
        
        // Get user's IP address
        let ipAddress = 'Unknown';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip;
        } catch (ipError) {
            console.warn('Could not get IP address:', ipError);
        }
        
        // Get current date and time
        const now = new Date();
        const loginDate = now.toLocaleDateString();
        const loginTime = now.toLocaleTimeString();
        const userAgent = navigator.userAgent || 'Unknown';
        const browserInfo = getBrowserInfo();
        
        // Create login record
        const loginRecord = {
            email: email,
            loginDate: loginDate,
            loginTime: loginTime,
            userType: userType,
            ipAddress: ipAddress,
            userAgent: userAgent,
            browserInfo: browserInfo,
            timestamp: now.toISOString()
        };
        
        // 1. Save to localStorage
        let loginHistory = [];
        try {
            const existingData = localStorage.getItem('loginHistory');
            if (existingData) {
                loginHistory = JSON.parse(existingData);
            }
        } catch (error) {
            console.warn('Could not load existing login history:', error);
        }
        loginHistory.push(loginRecord);
        localStorage.setItem('loginHistory', JSON.stringify(loginHistory));
        
        // 2. Send to Google Sheets via Apps Script
        await logLoginToGoogleSheets(email, userType, ipAddress, browserInfo);
        
        // Auto-download Excel file if there are more than 5 records
        if (loginHistory.length % 5 === 0) {
            await downloadLoginHistoryAsExcel();
        }
        
        console.log('Login logged successfully to localStorage and Google Sheets');
        return { success: true, message: 'Login logged successfully' };
        
    } catch (error) {
        console.error('Error logging user login:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get browser information
 */
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    
    if (ua.includes('Firefox')) {
        browser = 'Firefox';
    } else if (ua.includes('Chrome') && !ua.includes('Edg')) {
        browser = 'Chrome';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        browser = 'Safari';
    } else if (ua.includes('Edg')) {
        browser = 'Edge';
    } else if (ua.includes('Opera') || ua.includes('OPR')) {
        browser = 'Opera';
    } else if (ua.includes('MSIE') || ua.includes('Trident')) {
        browser = 'Internet Explorer';
    }
    
    // Get OS
    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return `${browser} on ${os}`;
}

/**
 * Send login data to Google Sheets via Apps Script
 */
async function logLoginToGoogleSheets(email, userType, ipAddress, browserInfo) {
    try {
        // Get the Google Script URL from config
        const scriptUrl = window.CONFIG?.GOOGLE_SCRIPT_URL;
        
        if (!scriptUrl) {
            console.warn('Google Script URL not configured');
            return { success: false, error: 'Script URL not configured' };
        }
        
        const formData = new URLSearchParams();
        formData.append('action', 'logAdminLogin');
        formData.append('adminUser', email);
        formData.append('ipAddress', ipAddress);
        formData.append('browserInfo', browserInfo);
        formData.append('loginStatus', `${userType} Login Success`);
        formData.append('timestamp', Date.now().toString());
        
        console.log('Sending login data to Google Sheets...');
        
        const response = await fetch(scriptUrl, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (response.ok) {
            const result = await response.text();
            console.log('Login logged to Google Sheets successfully:', result);
            return { success: true, message: 'Login logged to spreadsheet' };
        } else {
            console.warn('Failed to log to Google Sheets, status:', response.status);
            return { success: false, error: `HTTP ${response.status}` };
        }
        
    } catch (error) {
        console.warn('Error logging to Google Sheets (will continue anyway):', error);
        return { success: false, error: error.message };
    }
}

/**
 * Download login history as Excel file
 */
async function downloadLoginHistoryAsExcel() {
    try {
        // Get login history from localStorage
        const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        
        if (loginHistory.length === 0) {
            alert('No login history to download');
            return;
        }
        
        // Create CSV content
        const csvContent = createCSVContent(loginHistory);
        
        // Create and download file as CSV
        const blob = new Blob([csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `login_history_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('CSV file downloaded successfully');
        return { success: true, message: 'CSV file downloaded' };
        
    } catch (error) {
        console.error('Error downloading Excel file:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create CSV content from login history
 */
function createCSVContent(loginHistory) {
    // Create CSV content (which Excel can open)
    let csvContent = 'Email,Login Date,Login Time,User Type,IP Address,User Agent,Full Timestamp\n';
    
    loginHistory.forEach(record => {
        const row = [
            record.email || '',
            record.loginDate || '',
            record.loginTime || '',
            record.userType || '',
            record.ipAddress || '',
            '"' + (record.userAgent || '').replace(/"/g, '""') + '"', // Escape quotes in user agent
            record.timestamp || ''
        ].join(',');
        csvContent += row + '\n';
    });
    
    return csvContent;
}

/**
 * Clear login history
 */
function clearLoginHistory() {
    if (confirm('Are you sure you want to clear all login history?')) {
        localStorage.removeItem('loginHistory');
        console.log('Login history cleared');
        return true;
    }
    return false;
}

/**
 * Get login history count
 */
function getLoginHistoryCount() {
    try {
        const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        return loginHistory.length;
    } catch (error) {
        return 0;
    }
}

/**
 * View login history in console
 */
function viewLoginHistory() {
    try {
        const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        console.table(loginHistory);
        return loginHistory;
    } catch (error) {
        console.error('Error viewing login history:', error);
        return [];
    }
}

/**
 * Admin login logging
 */
async function logAdminLoginToExcel(email) {
    return await logUserLoginToExcel(email, 'Admin');
}

/**
 * Client login logging
 */
async function logClientLoginToExcel(email) {
    return await logUserLoginToExcel(email, 'Client');
}

/**
 * Create login dashboard HTML
 */
function createLoginDashboard() {
    const count = getLoginHistoryCount();
    
    return `
    <div style="position: fixed; top: 10px; right: 10px; background: white; border: 1px solid #ccc; padding: 10px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 9999; font-family: Arial, sans-serif; font-size: 12px;">
        <strong>Login Tracker</strong><br>
        Records: ${count}<br>
        <button onclick="downloadLoginHistoryAsExcel()" style="margin: 2px; padding: 5px; font-size: 11px;">Download Excel</button><br>
        <button onclick="viewLoginHistory()" style="margin: 2px; padding: 5px; font-size: 11px;">View in Console</button><br>
        <button onclick="clearLoginHistory(); location.reload();" style="margin: 2px; padding: 5px; font-size: 11px;">Clear History</button>
    </div>
    `;
}

/**
 * Add login dashboard to page
 */
function addLoginDashboard() {
    if (document.getElementById('loginDashboard')) return; // Already exists
    
    const dashboard = document.createElement('div');
    dashboard.id = 'loginDashboard';
    dashboard.innerHTML = createLoginDashboard();
    document.body.appendChild(dashboard);
}

// Make functions available globally
window.logUserLoginToExcel = logUserLoginToExcel;
window.logAdminLoginToExcel = logAdminLoginToExcel;
window.logClientLoginToExcel = logClientLoginToExcel;
window.downloadLoginHistoryAsExcel = downloadLoginHistoryAsExcel;
window.clearLoginHistory = clearLoginHistory;
window.getLoginHistoryCount = getLoginHistoryCount;
window.viewLoginHistory = viewLoginHistory;
window.addLoginDashboard = addLoginDashboard;

// NOTE: Auto-add dashboard has been DISABLED to keep the login page clean.
// The login history is available on the admin dashboard via the "Logins" button.
// To enable the dashboard widget on any page, call window.addLoginDashboard() manually.
