// Admin Dashboard JavaScript

// Note: Admin credentials are now managed via Google Sheets and handled in admin-login.html
// This file no longer stores or validates credentials directly for security reasons

let currentAppointments = [];
let selectedAppointmentId = null;
let currentPage = 1;
let recordsPerPage = 10;
let filteredAppointments = [];
let currentSearchTerm = '';
let currentSearchField = 'all';

// Session management
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Back to top button functionality
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    backToTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Auto-close hamburger menu on scroll (mobile)
const navbarCollapse = document.getElementById('navbarContent');
const navbarToggler = document.querySelector('.navbar-toggler');
if (navbarCollapse && navbarToggler) {
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        if (window.innerWidth < 992) { // Only on mobile
            const currentScroll = window.scrollY;
            if (Math.abs(currentScroll - lastScrollTop) > 50) { // Scrolled more than 50px
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse && navbarCollapse.classList.contains('show')) {
                    bsCollapse.hide();
                }
                lastScrollTop = currentScroll;
            }
        }
    });
}

// Helper function to refresh booking calendar if it exists
function refreshBookingCalendarIfExists() {
    try {
        if (typeof window.refreshBookingCalendar === 'function') {
            console.log('Refreshing booking calendar...');
            window.refreshBookingCalendar();
        } else {
            console.log('Booking calendar refresh function not available');
        }
    } catch (error) {
        console.log('Error refreshing booking calendar:', error);
    }
}

// Diagnostic function to test Google Apps Script endpoints
async function testGoogleAppsScriptEndpoints() {
    console.log('Testing Google Apps Script endpoints...');
    
    const endpoints = [
        { name: 'Get Appointments', action: 'getAppointments' },
        { name: 'Get Blocked Dates', action: 'getBlockedDates' },
        { name: 'Get Available Dates', action: 'getAvailableDates' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint.name}...`);
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL + '?action=' + endpoint.action + '&test=true', {
                method: 'GET',
                redirect: 'follow',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                try {
                    const result = await response.json();
                    results[endpoint.name] = {
                        status: response.status,
                        ok: true,
                        available: result.success || false,
                        test: result.test || false,
                        message: result.message || 'OK'
                    };
                } catch (jsonError) {
                    results[endpoint.name] = {
                        status: response.status,
                        ok: true,
                        available: true,
                        test: false,
                        message: 'Response not JSON, but endpoint accessible'
                    };
                }
            } else {
                results[endpoint.name] = {
                    status: response.status,
                    ok: false,
                    available: false,
                    error: `HTTP ${response.status}`
                };
            }
            
            console.log(`${endpoint.name}: ${results[endpoint.name].available ? 'Available' : 'Error ' + response.status}`);
        } catch (error) {
            results[endpoint.name] = {
                status: 'Network Error',
                ok: false,
                available: false,
                error: error.message
            };
            
            console.log(`${endpoint.name}: Failed - ${error.message}`);
        }
    }
    
    // Display results summary
    console.table(results);
    
    return results;
}

// Make diagnostic function globally available for console testing
window.testGoogleAppsScriptEndpoints = testGoogleAppsScriptEndpoints;

// Function to map session type values to friendly display names
function getDisplaySessionType(sessionType) {
    const sessionTypeMapping = {
        'generalized': 'Generalized',
        'specialized': 'Specialized (Virtual)',
        'super-specialized': 'Super-Specialized (In-Person)',
        'long-term-engagement': 'Long-term Projects',
        'advisory-service': 'Advisory'
    };
    return sessionTypeMapping[sessionType] || sessionType;
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check for valid session first
    if (!checkValidSession()) {
        // No valid session, redirect to login
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Valid session exists, show dashboard
    document.getElementById('dashboard').style.display = 'block';
    
    // Initialize pagination info with default values
    updatePaginationInfo();
    
    // Add event listeners
    document.getElementById('statusFilter').addEventListener('change', filterAndSearchAppointments);
    
    // Login History button event listener
    const loginHistoryBtn = document.getElementById('loginHistoryBtn');
    if (loginHistoryBtn) {
        loginHistoryBtn.addEventListener('click', showLoginHistoryModal);
    }
    
    // Actions Guide button event listener
    const actionsGuideBtn = document.getElementById('actionsGuideBtn');
    if (actionsGuideBtn) {
        actionsGuideBtn.addEventListener('click', showActionsGuideModal);
    }
    
    // Manage Credentials button event listener - only for authorized roles
    const manageCredentialsBtn = document.getElementById('manageCredentialsBtn');
    if (manageCredentialsBtn) {
        // Check if user has permission to manage admins
        if (canManageAdmins()) {
            manageCredentialsBtn.style.display = 'inline-block';
            manageCredentialsBtn.addEventListener('click', showManageCredentialsModal);
        } else {
            manageCredentialsBtn.style.display = 'none';
        }
    }
    
    // Manage Dates button event listener - only for authorized roles
    const manageDatesBtn = document.getElementById('manageDatesBtn');
    if (manageDatesBtn) {
        // Check if user has permission to manage dates (same as manage admins)
        if (canManageAdmins()) {
            manageDatesBtn.style.display = 'inline-block';
        } else {
            manageDatesBtn.style.display = 'none';
        }
    }
    
    // Search functionality event listeners
    initializeSearchFunctionality();
    
    // Initialize alerts container
    initializeAlertsContainer();
    
    // Display session info
    displaySessionInfo();
    
    // Load appointments on startup
    loadAppointments();
    
    // Add test button in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        addTestButton();
    }
    
    // Setup session refresh timer
    setupSessionRefresh();
    
    // Add interactive enhancements
    addInteractiveEnhancements();
    
    // Add event listeners for export filter modal
    initializeExportFilterListeners();
});

// Initialize export filter modal event listeners
function initializeExportFilterListeners() {
    // Add change listeners to all filter controls for real-time preview
    const exportStatusFilter = document.getElementById('exportStatusFilter');
    const exportClientStatusFilter = document.getElementById('exportClientStatusFilter');
    const exportSessionTypeFilter = document.getElementById('exportSessionTypeFilter');
    const exportDateFrom = document.getElementById('exportDateFrom');
    const exportDateTo = document.getElementById('exportDateTo');
    const exportSearchText = document.getElementById('exportSearchText');
    
    if (exportStatusFilter) {
        exportStatusFilter.addEventListener('change', updateExportPreview);
    }
    if (exportClientStatusFilter) {
        exportClientStatusFilter.addEventListener('change', updateExportPreview);
    }
    if (exportSessionTypeFilter) {
        exportSessionTypeFilter.addEventListener('change', updateExportPreview);
    }
    if (exportDateFrom) {
        exportDateFrom.addEventListener('change', updateExportPreview);
    }
    if (exportDateTo) {
        exportDateTo.addEventListener('change', updateExportPreview);
    }
    if (exportSearchText) {
        exportSearchText.addEventListener('input', debounce(updateExportPreview, 300));
    }
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if user can manage admin credentials (only Super Admin and Admin roles)
function canManageAdmins() {
    const sessionData = localStorage.getItem('adminSession');
    
    if (!sessionData) {
        return false;
    }
    
    try {
        const session = JSON.parse(sessionData);
        const role = session.role || '';
        
        // Only Super Admin and Admin can manage credentials
        return role === 'Super Admin' || role === 'Admin';
    } catch (error) {
        console.error('Error checking admin permissions:', error);
        return false;
    }
}

// Session management functions
function checkValidSession() {
    const sessionData = localStorage.getItem('adminSession');
    
    if (!sessionData) {
        return false;
    }
    
    try {
        const session = JSON.parse(sessionData);
        const currentTime = new Date().getTime();
        
        if (currentTime < session.expiryTime) {
            // Update last activity
            session.lastActivity = currentTime;
            localStorage.setItem('adminSession', JSON.stringify(session));
            return true;
        } else {
            // Session expired
            localStorage.removeItem('adminSession');
            return false;
        }
    } catch (error) {
        console.error('Error parsing session data:', error);
        localStorage.removeItem('adminSession');
        return false;
    }
}

function setupSessionRefresh() {
    // Check session every 5 minutes
    setInterval(() => {
        if (!checkValidSession()) {
            showAlert('Session expired. Please login again.', 'warning');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 3000);
        } else {
            // Update session info display
            displaySessionInfo();
        }
    }, 5 * 60 * 1000);
    
    // Update session info every minute for real-time countdown
    setInterval(() => {
        displaySessionInfo();
    }, 60 * 1000);
    
    // Auto-refresh appointments every 2 minutes to get new feedback/updates
    setInterval(async () => {
        try {
            console.log('Auto-refreshing appointments to check for new feedback...');
            await loadAppointments();
            console.log('Auto-refresh completed successfully');
        } catch (error) {
            console.log('Auto-refresh failed:', error);
            // Don't show alerts for auto-refresh failures to avoid spam
        }
    }, 2 * 60 * 1000); // 2 minutes
}

function initializeAlertsContainer() {
    // Create a fixed alert container at the top of the page
    const alertContainer = document.createElement('div');
    alertContainer.id = 'alertContainer';
    alertContainer.className = 'alert-container';
    alertContainer.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        width: 90%;
        max-width: 600px;
        pointer-events: none;
    `;
    
    document.body.appendChild(alertContainer);
}

function displaySessionInfo() {
    const sessionData = localStorage.getItem('adminSession');
    const loggedUserDisplay = document.getElementById('loggedUserDisplay');
    
    if (sessionData && loggedUserDisplay) {
        try {
            const session = JSON.parse(sessionData);
            const userName = session.name || 'Admin';
            const userRole = session.role || 'Administrator';
            
            // Update the logged user display with name
            const loggedUserNameElement = document.getElementById('loggedUserName');
            if (loggedUserNameElement) {
                loggedUserNameElement.textContent = userName;
                // Add tooltip with role information
                loggedUserDisplay.title = `${userName} - ${userRole}`;
            }
        } catch (error) {
            console.error('Error displaying session info:', error);
        }
    }
}

// Add interactive enhancements
function addInteractiveEnhancements() {
    // Add click animation to stats cards
    document.querySelectorAll('.stats-card').forEach(card => {
        card.addEventListener('click', function() {
            const statType = this.dataset.stat;
            if (statType) {
                // Set filter to show the correct appointments for each stat type
                const statusFilter = document.getElementById('statusFilter');
                
                if (statType === 'approved') {
                    // For approved stats, we need to show all statuses that count as "approved"
                    statusFilter.value = ''; // Clear filter first
                    
                    // Filter manually to match our stats calculation
                    filteredAppointments = currentAppointments.filter(appointment => {
                        const status = appointment.status || 'Pending';
                        // return status === 'Approved' || status === 'Payment Sent' || 
                        //        status === 'Session Scheduled' || status === 'Session Reminder Sent' ||
                        //        status === 'Consent Email Sent' || status === 'Session Completed';
                        return status === 'Approved' || status === 'Payment Sent' || 
                               status === 'Session Scheduled' || status === 'Session Reminder Sent' ||
                               status === 'Consent Email Sent' || status === 'Session Completed';
                    });
                    
                    // Reset page and display
                    currentPage = 1;
                    displayCurrentPage();
                    setupPagination();
                    updateSearchResultsIndicator();
                    
                } else if (statType === 'rejected') {
                    // For rejected stats, show rejected and cancelled
                    statusFilter.value = ''; // Clear filter first
                    
                    filteredAppointments = currentAppointments.filter(appointment => {
                        const status = appointment.status || 'Pending';
                        return status === 'Rejected' || status === 'Cancelled';
                    });
                    
                    // Reset page and display
                    currentPage = 1;
                    displayCurrentPage();
                    setupPagination();
                    updateSearchResultsIndicator();
                    
                } else {
                    // For other stats, use normal filtering
                    statusFilter.value = getFilterValueForStat(statType);
                    filterAndSearchAppointments();
                }
                
                // Add pulse animation
                this.style.animation = 'pulse 0.6s ease-in-out';
                setTimeout(() => {
                    this.style.animation = '';
                }, 600);
                
                // Scroll to indicator above table
                const indicator = document.getElementById('searchResultsIndicator');
                if (indicator && indicator.style.display !== 'none') {
                    indicator.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
                
                showAlert(`Filtered to show ${statType} appointments`, 'info');
            }
        });
    });
    
    // Add hover sound effect simulation
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            // Removed transform to prevent expansion
        });
        
        btn.addEventListener('mouseleave', function() {
            // Removed transform to prevent expansion
        });
    });
    
    // Add loading animation to refresh button
    const refreshBtn = document.querySelector('[onclick="loadAppointments()"]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.animation = 'spin 1s linear infinite';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 2000);
            }
        });
    }
    
    // Add smooth scroll to table when filtering
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            setTimeout(() => {
                const indicator = document.getElementById('searchResultsIndicator');
                if (indicator && indicator.style.display !== 'none') {
                    indicator.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }, 100);
        });
    }
}

function getFilterValueForStat(statType) {
    const filterMap = {
        'pending': 'Pending',
        'approved': '', // Handled specially in click handler
        'rescheduled': 'Session Rescheduled',
        'rejected': 'Rejected',
        'completed': 'Session Completed'
    };
    return filterMap[statType] || '';
}

// Enhanced export function
function exportToCSV() {
    if (currentAppointments.length === 0) {
        showAlert('No data to export!', 'warning');
        return;
    }
    
    exportToPDF();
}

// Show Export Filter Modal
function showExportFilterModal() {
    if (currentAppointments.length === 0) {
        showAlert('No appointments available to export!', 'warning');
        return;
    }
    
    // Reset filters
    clearExportFilters();
    
    // Update preview with all appointments
    updateExportPreview();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('exportFilterModal'));
    modal.show();
}

// Clear all export filters
function clearExportFilters() {
    document.getElementById('exportStatusFilter').selectedIndex = -1;
    document.getElementById('exportClientStatusFilter').selectedIndex = -1;
    document.getElementById('exportSessionTypeFilter').selectedIndex = -1;
    document.getElementById('exportDateFrom').value = '';
    document.getElementById('exportDateTo').value = '';
    document.getElementById('exportSearchText').value = '';
    updateExportPreview();
}

// Update export preview count
function updateExportPreview() {
    const filtered = getFilteredAppointmentsForExport();
    const previewNumber = document.getElementById('previewNumber');
    
    // Add animation class
    if (previewNumber) {
        previewNumber.classList.add('updating');
        setTimeout(() => {
            previewNumber.classList.remove('updating');
        }, 500);
    }
    
    document.getElementById('previewNumber').textContent = filtered.length;
    
    // Update preview color based on filter status
    const previewDiv = document.getElementById('exportPreviewCount');
    if (hasActiveExportFilters()) {
        previewDiv.querySelector('#previewNumber').className = 'text-warning updating';
    } else {
        previewDiv.querySelector('#previewNumber').className = 'text-primary updating';
    }
}

// Check if any export filters are active
function hasActiveExportFilters() {
    const statusFilter = document.getElementById('exportStatusFilter');
    const clientStatusFilter = document.getElementById('exportClientStatusFilter');
    const sessionTypeFilter = document.getElementById('exportSessionTypeFilter');
    const dateFrom = document.getElementById('exportDateFrom').value;
    const dateTo = document.getElementById('exportDateTo').value;
    const searchText = document.getElementById('exportSearchText').value.trim();
    
    return (statusFilter.selectedOptions.length > 0 && statusFilter.selectedOptions[0].value !== '') ||
           (clientStatusFilter.selectedOptions.length > 0 && clientStatusFilter.selectedOptions[0].value !== '') ||
           (sessionTypeFilter.selectedOptions.length > 0 && sessionTypeFilter.selectedOptions[0].value !== '') ||
           dateFrom !== '' ||
           dateTo !== '' ||
           searchText !== '';
}

// Get filtered appointments based on export modal filters
function getFilteredAppointmentsForExport() {
    let filtered = [...currentAppointments];
    
    // Status filter
    const statusFilter = document.getElementById('exportStatusFilter');
    const selectedStatuses = Array.from(statusFilter.selectedOptions)
        .map(opt => opt.value)
        .filter(val => val !== '');
    
    if (selectedStatuses.length > 0) {
        filtered = filtered.filter(apt => selectedStatuses.includes(apt.status || 'Pending'));
    }
    
    // Client Status filter
    const clientStatusFilter = document.getElementById('exportClientStatusFilter');
    const selectedClientStatuses = Array.from(clientStatusFilter.selectedOptions)
        .map(opt => opt.value)
        .filter(val => val !== '');
    
    if (selectedClientStatuses.length > 0) {
        filtered = filtered.filter(apt => {
            const clientStatus = apt.clientStatus || apt['clientStatus'] || apt['Client Status'] || 'Pending';
            return selectedClientStatuses.includes(clientStatus);
        });
    }
    
    // Session Type filter
    const sessionTypeFilter = document.getElementById('exportSessionTypeFilter');
    const selectedSessionTypes = Array.from(sessionTypeFilter.selectedOptions)
        .map(opt => opt.value)
        .filter(val => val !== '');
    
    if (selectedSessionTypes.length > 0) {
        filtered = filtered.filter(apt => {
            const sessionType = apt['session-type'] || apt.sessionType || '';
            return selectedSessionTypes.includes(sessionType);
        });
    }
    
    // Date range filter
    const dateFrom = document.getElementById('exportDateFrom').value;
    const dateTo = document.getElementById('exportDateTo').value;
    
    if (dateFrom || dateTo) {
        filtered = filtered.filter(apt => {
            const aptDate = apt['selected-date'] || apt.selectedDate;
            if (!aptDate || aptDate === 'N/A') return false;
            
            const appointmentDate = new Date(aptDate);
            
            if (dateFrom && appointmentDate < new Date(dateFrom)) return false;
            if (dateTo && appointmentDate > new Date(dateTo)) return false;
            
            return true;
        });
    }
    
    // Search text filter
    const searchText = document.getElementById('exportSearchText').value.trim().toLowerCase();
    if (searchText) {
        filtered = filtered.filter(apt => {
            const searchableText = [
                apt.name || '',
                apt.email || '',
                apt.organization || '',
                apt.phone || '',
                apt['session-type'] || apt.sessionType || ''
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchText);
        });
    }
    
    return filtered;
}

// Generate PDF with filters
function generateFilteredPDF() {
    const filtered = getFilteredAppointmentsForExport();
    
    if (filtered.length === 0) {
        showAlert('No appointments match the selected filters!', 'warning');
        return;
    }
    
    // Get filter information for PDF header
    const filterInfo = getExportFilterInfo();
    
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('exportFilterModal'));
    if (modal) modal.hide();
    
    // Generate PDF
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    const pdfContent = generatePDFContent(filtered, currentDate, currentTime, filterInfo);
    
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
            showAlert(`PDF export initiated! Exporting ${filtered.length} appointment(s).`, 'success');
        }, 500);
    };
}

// Get filter information for PDF display
function getExportFilterInfo() {
    const info = {
        hasFilters: hasActiveExportFilters(),
        filters: []
    };
    
    // Status filter
    const statusFilter = document.getElementById('exportStatusFilter');
    const selectedStatuses = Array.from(statusFilter.selectedOptions)
        .map(opt => opt.value)
        .filter(val => val !== '');
    if (selectedStatuses.length > 0) {
        info.filters.push(`Status: ${selectedStatuses.join(', ')}`);
    }
    
    // Client Status filter
    const clientStatusFilter = document.getElementById('exportClientStatusFilter');
    const selectedClientStatuses = Array.from(clientStatusFilter.selectedOptions)
        .map(opt => opt.value)
        .filter(val => val !== '');
    if (selectedClientStatuses.length > 0) {
        info.filters.push(`Client Status: ${selectedClientStatuses.join(', ')}`);
    }
    
    // Session Type filter
    const sessionTypeFilter = document.getElementById('exportSessionTypeFilter');
    const selectedSessionTypes = Array.from(sessionTypeFilter.selectedOptions)
        .map(opt => opt.value)
        .filter(val => val !== '');
    if (selectedSessionTypes.length > 0) {
        info.filters.push(`Session Type: ${selectedSessionTypes.join(', ')}`);
    }
    
    // Date range
    const dateFrom = document.getElementById('exportDateFrom').value;
    const dateTo = document.getElementById('exportDateTo').value;
    if (dateFrom || dateTo) {
        let dateStr = 'Date Range: ';
        if (dateFrom && dateTo) {
            dateStr += `${new Date(dateFrom).toLocaleDateString()} to ${new Date(dateTo).toLocaleDateString()}`;
        } else if (dateFrom) {
            dateStr += `From ${new Date(dateFrom).toLocaleDateString()}`;
        } else {
            dateStr += `Until ${new Date(dateTo).toLocaleDateString()}`;
        }
        info.filters.push(dateStr);
    }
    
    // Search text
    const searchText = document.getElementById('exportSearchText').value.trim();
    if (searchText) {
        info.filters.push(`Search: "${searchText}"`);
    }
    
    return info;
}

// Export to PDF function (legacy - now redirects to modal)
function exportToPDF() {
    showExportFilterModal();
}

function generatePDFContent(appointments, currentDate, currentTime, filterInfo = null) {
    const totalAppointments = appointments.length;
    const pendingCount = appointments.filter(apt => apt.status === 'Pending').length;
    const approvedCount = appointments.filter(apt => apt.status === 'Approved' || apt.status === 'Session Scheduled').length;
    
    // Build filter description for PDF
    let filterDescription = '';
    if (filterInfo && filterInfo.hasFilters && filterInfo.filters.length > 0) {
        filterDescription = `
            <div class="filter-info">
                <h6><i class="fas fa-filter me-2"></i>Applied Filters:</h6>
                <ul>
                    ${filterInfo.filters.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Appointments Report - ${currentDate}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 20mm;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #0d6efd;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #0d6efd;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .header .subtitle {
            color: #666;
            margin: 5px 0;
            font-size: 14px;
        }
        .header .export-info {
            color: #888;
            font-size: 11px;
            margin-top: 10px;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        .summary-item {
            text-align: center;
            flex: 1;
        }
        .summary-item .number {
            font-size: 20px;
            font-weight: 700;
            color: #0d6efd;
            display: block;
        }
        .summary-item .label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        th {
            background: linear-gradient(135deg, #0d6efd, #0056b3);
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #0056b3;
        }
        td {
            padding: 10px 8px;
            border: 1px solid #dee2e6;
            vertical-align: top;
            font-size: 10px;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #e3f2fd;
        }
        .status-badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
            text-align: center;
            color: black;
            display: inline-block;
            min-width: 60px;
        }
        .status-pending { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .status-approved { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .status-rejected { background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); }
        .status-scheduled { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .status-other { background: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%); }
        .client-info {
            font-weight: 600;
            color: #0d6efd;
        }
        .contact-info {
            font-size: 9px;
            color: #666;
        }
        .date-time {
            font-weight: 600;
            color: #28a745;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            text-align: center;
            color: #666;
            font-size: 10px;
        }
        .page-break {
            page-break-before: always;
        }
        .filter-info {
            background: #e3f2fd;
            border-left: 4px solid #0d6efd;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        .filter-info h6 {
            color: #0d6efd;
            font-size: 14px;
            font-weight: 700;
            margin: 0 0 10px 0;
        }
        .filter-info ul {
            margin: 0;
            padding-left: 20px;
            list-style-type: circle;
        }
        .filter-info li {
            color: #495057;
            font-size: 11px;
            margin-bottom: 5px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📅 Appointment Management Report</h1>
        <div class="subtitle">Comprehensive Appointment Overview</div>
        <div class="export-info">
            Generated on: ${currentDate} at ${currentTime} | 
            Total Records: ${totalAppointments}
        </div>
    </div>

    ${filterDescription}

    <div class="summary">
        <div class="summary-item">
            <span class="number">${totalAppointments}</span>
            <span class="label">Total Appointments</span>
        </div>
        <div class="summary-item">
            <span class="number">${pendingCount}</span>
            <span class="label">Pending</span>
        </div>
        <div class="summary-item">
            <span class="number">${approvedCount}</span>
            <span class="label">Approved/Scheduled</span>
        </div>
        <div class="summary-item">
            <span class="number">${appointments.filter(apt => apt.status === 'Rejected').length}</span>
            <span class="label">Rejected</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 8%;">S.No.</th>
                <th style="width: 15%;">Client Details</th>
                <th style="width: 18%;">Contact Information</th>
                <th style="width: 12%;">Date & Time</th>
                <th style="width: 12%;">Session Type</th>
                <th style="width: 12%;">Status</th>
                <th style="width: 12%;">Client Status</th>
                <th style="width: 11%;">Submission Date</th>
            </tr>
        </thead>
        <tbody>
            ${appointments.map((appointment, index) => {
                const status = appointment.status || 'Pending';
                const clientStatus = appointment.clientStatus || appointment['clientStatus'] || appointment['Client Status'] || 'Pending';
                const selectedDate = appointment['selected-date'] || appointment.selectedDate || 'N/A';
                const selectedTime = appointment['selected-time'] || appointment.selectedTime || 'N/A';
                const sessionType = appointment['session-type'] || appointment.sessionType || 'N/A';
                const timestamp = appointment.timestamp || appointment['Time Stamp *'] || 'N/A';
                
                // Map session type values to friendly display names
                const sessionTypeDisplay = {
                    'generalized': 'Generalized',
                    'specialized': 'Specialized (Virtual)',
                    'super-specialized': 'Super-Specialized (In-Person)', 
                    'long-term-engagement': 'Long-term Projects',
                    'advisory-service': 'Advisory'
                };
                const displaySessionType = getDisplaySessionType(sessionType);
                
                return `
                <tr>
                    <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                    <td>
                        <div class="client-info">${appointment.name || 'N/A'}</div>
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">
                            ${appointment.organization || 'No Organization'}
                        </div>
                    </td>
                    <td class="contact-info">
                        <div>📧 ${appointment.email || 'N/A'}</div>
                        <div style="margin-top: 2px;">📞 ${appointment.phone || 'N/A'}</div>
                    </td>
                    <td class="date-time">
                        <div>📅 ${formatPDFDate(selectedDate)}</div>
                        <div style="margin-top: 2px;">⏰ ${formatPDFTime(selectedTime)}</div>
                    </td>
                    <td style="text-align: center;">
                        <span style="background: #e3f2fd; padding: 3px 6px; border-radius: 8px; font-size: 9px; color: #1976d2;">
                            ${displaySessionType}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <span class="status-badge ${getStatusClass(status)}">${status}</span>
                    </td>
                    <td style="text-align: center;">
                        <span class="status-badge ${getClientStatusClass(clientStatus)}">${clientStatus}</span>
                    </td>
                    <td style="font-size: 9px; color: #666;">
                        ${formatPDFTimestamp(timestamp)}
                    </td>
                </tr>
                `;
            }).join('')}
        </tbody>
    </table>

    <div class="footer">
        <div>🏢 <strong>Anurag Sharma - Consultation Services</strong></div>
        <div style="margin-top: 5px;">
            This report contains confidential information. Please handle with care.
        </div>
        <div style="margin-top: 5px;">
            Report generated automatically by Admin Dashboard System
        </div>
    </div>
</body>
</html>
    `;
}

function formatPDFDate(dateString) {
    if (!dateString || dateString === 'N/A') return 'Not Set';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        return dateString;
    }
}

function formatPDFTime(timeString) {
    if (!timeString || timeString === 'N/A') return 'Not Set';
    return timeString;
}

function formatPDFTimestamp(timestamp) {
    if (!timestamp || timestamp === 'N/A') return 'Not Available';
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return timestamp;
    }
}

// Legacy function - Authentication is now handled in admin-login.html
// This function is no longer used and kept only for backward compatibility
function handleLogin(event) {
    event.preventDefault();
    
    // Redirect to proper login page
    console.log('Legacy login function called - redirecting to login page');
    window.location.href = 'admin-login.html';
}

// Enhanced logout function
function logout() {
    // Clear session data
    localStorage.removeItem('adminSession');
    
    // Show logout message
    showAlert('Logged out successfully. Redirecting...', 'success');
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = 'admin-login.html';
    }, 1500);
}

// JSONP fallback for loading appointments when CORS fails
// This works by creating a script tag which bypasses CORS restrictions
async function loadAppointmentsViaJsonp() {
    return new Promise((resolve, reject) => {
        // Create unique callback name
        const callbackName = 'jsonpCallback_' + Date.now();
        
        // Create script element
        const script = document.createElement('script');
        const url = CONFIG.GOOGLE_SCRIPT_URL + 
            '?action=getAppointments&callback=' + callbackName + 
            '&fetchOnly=true&timestamp=' + Date.now() + '&adminRequest=true&format=jsonp';
        
        // Define callback function
        window[callbackName] = function(data) {
            console.log('JSONP response received:', data);
            
            // Clean up
            delete window[callbackName];
            document.body.removeChild(script);
            
            if (data && data.status === 'success') {
                currentAppointments = data.appointments || [];
                console.log('Loaded appointments via JSONP:', currentAppointments.length);
                
                // Sort and display
                currentAppointments.sort((a, b) => {
                    const getTimestamp = (appointment) => {
                        const timestamp = appointment.timestamp || appointment['Time Stamp *'] || '';
                        return timestamp ? new Date(timestamp).getTime() : 0;
                    };
                    return getTimestamp(b) - getTimestamp(a);
                });
                
                filteredAppointments = [...currentAppointments];
                currentPage = 1;
                displayCurrentPage();
                setupPagination();
                updateStatistics();
                updateSearchResultsIndicator();
                initializeTableScrolling();
                showLoading(false);
                resolve(data);
            } else {
                reject(new Error(data?.message || 'JSONP request failed'));
            }
        };
        
        // Handle script errors
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Failed to load script (JSONP error)'));
        };
        
        // Set script source and add to page
        script.src = url;
        document.body.appendChild(script);
        
        // Timeout after 15 seconds
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
                reject(new Error('JSONP request timeout'));
            }
        }, 15000);
    });
}

// Load appointments from Google Sheets
async function loadAppointments(retryCount = 0, useJsonp = false) {
    showLoading(true);
    
    try {
        console.log('Loading appointments from:', CONFIG.GOOGLE_SCRIPT_URL);
        console.log('Attempt:', retryCount + 1, 'Using JSONP:', useJsonp);
        
        // Try JSONP approach on retry (works around CORS by using script tag)
        if (useJsonp) {
            return await loadAppointmentsViaJsonp();
        }
        
        // Use POST to avoid CORS preflight, but make it crystal clear this is a FETCH operation
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            credentials: 'omit', // Don't send cookies to avoid CORS preflight
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            // Clear payload that this is ONLY a fetch request, not a form submission
            body: `action=getAppointments&fetchOnly=true&timestamp=${Date.now()}&adminRequest=true`
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        
        let data;
        try {
            data = JSON.parse(textResponse);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        
        console.log('Parsed data:', data);
        
        if (data.status === 'success') {
            currentAppointments = data.appointments || [];
            console.log('Loaded appointments:', currentAppointments.length);
            
            // Sort appointments by timestamp (newest first)
            currentAppointments.sort((a, b) => {
                const getTimestamp = (appointment) => {
                    const timestamp = appointment.timestamp || appointment['Time Stamp *'] || '';
                    return timestamp ? new Date(timestamp).getTime() : 0;
                };
                
                const timestampA = getTimestamp(a);
                const timestampB = getTimestamp(b);
                
                // Sort in descending order (newest first)
                return timestampB - timestampA;
            });
            
            console.log('Appointments sorted by timestamp (newest first)');
            
            // Debug payment proof and feedback data for first few appointments
            currentAppointments.slice(0, 3).forEach((apt, idx) => {
                console.log(`=== APPOINTMENT ${idx + 1} DEBUG ===`);
                console.log('Appointment name:', apt.name);
                console.log('All fields:', Object.keys(apt));
                console.log('Payment related fields:');
                Object.keys(apt).forEach(key => {
                    if (key.toLowerCase().includes('payment') || key.toLowerCase().includes('proof') || key.toLowerCase().includes('link')) {
                        console.log(`  ${key}: "${apt[key]}"`);
                    }
                });
                console.log('Feedback related fields:');
                Object.keys(apt).forEach(key => {
                    if (key.toLowerCase().includes('feedback') || key.toLowerCase().includes('client')) {
                        console.log(`  ${key}: "${apt[key]}"`);
                    }
                });
                console.log('Client status:', apt.clientStatus || apt['Client Status']);
                console.log('Raw paymentProofLink value:', apt.paymentProofLink);
                console.log('=== END DEBUG ===');
            });
            
            // Initialize search and pagination
            filteredAppointments = [...currentAppointments];
            currentPage = 1;
            displayCurrentPage();
            setupPagination();
            updateStatistics();
            updateSearchResultsIndicator();
            
            // Initialize table scrolling once
            initializeTableScrolling();
        } else {
            throw new Error(data.message || 'Unknown error from server');
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        
        // Handle CORS/403 errors with retry logic and JSONP fallback
        const isCorsError = error.message.includes('Failed to fetch') || 
                           error.message.includes('CORS') || 
                           error.message.includes('403');
        
        if (isCorsError) {
            if (retryCount < 1) {
                // First retry: wait and try again with fetch
                console.log(`CORS/403 error detected, retrying... (attempt ${retryCount + 1}/2)`);
                showAlert(`Connection issue detected. Retrying... (${retryCount + 1}/2)`, 'info');
                
                setTimeout(() => {
                    loadAppointments(retryCount + 1, false);
                }, 1500);
                return;
            } else if (retryCount < 2 && !useJsonp) {
                // Second retry: try JSONP approach
                console.log('Trying JSONP fallback...');
                showAlert('Trying alternative connection method...', 'info');
                
                setTimeout(() => {
                    loadAppointments(retryCount + 1, true);
                }, 1000);
                return;
            } else {
                // All retries failed - show detailed error with fix instructions
                console.error('All retry attempts failed');
                showAlert(`
                    <strong>Unable to load appointments - CORS/Access Error</strong><br><br>
                    <strong>To fix this, you need to redeploy your Google Apps Script:</strong><br>
                    1. Go to <a href="https://script.google.com" target="_blank">script.google.com</a><br>
                    2. Open your project and click "Deploy" → "New deployment"<br>
                    3. Set "Who has access" to <strong>"Anyone"</strong> (NOT "Anyone with Google account")<br>
                    4. Click Deploy and authorize<br>
                    5. Copy the new URL and update config.js<br><br>
                    <small>See cors-fix-guide.html for detailed instructions</small>
                `, 'warning', 30000);
            }
        }
        
        let errorMessage = 'Failed to load appointments. ';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('403')) {
            errorMessage += 'The Google Apps Script deployment may need to be updated. Check the console for details.';
        } else {
            errorMessage += error.message;
        }
        
        if (!isCorsError) {
            showAlert(errorMessage, 'danger');
        }
        
        // Show empty state
        filteredAppointments = [];
        currentPage = 1;
        displayCurrentPage();
        setupPagination();
        updateSearchResultsIndicator();
    } finally {
        showLoading(false);
    }
}

// Display appointments in the table
function displayAppointments(appointments, startIndex = 0) {
    const tbody = document.getElementById('appointmentsBody');
    tbody.innerHTML = '';
    
    if (appointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No appointments found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    appointments.forEach((appointment, pageIndex) => {
        // Calculate the actual global index for the appointment
        const globalIndex = findGlobalAppointmentIndex(appointment);
        const row = createAppointmentRow(appointment, globalIndex);
        tbody.appendChild(row);
    });
    
    // Initialize Bootstrap tooltips for the newly added elements
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    
    // Ensure horizontal scrollbar is visible and functional
    initializeTableScrolling();
}

// Initialize table scrolling with enhanced scrollbar visibility
function initializeTableScrolling() {
    const tableContainer = document.querySelector('.table-scroll-container');
    const table = document.getElementById('appointmentsTable');
    
    if (tableContainer && table) {
        // CSS should handle this, but force it just in case
        tableContainer.style.overflowX = 'scroll';
        table.style.minWidth = '1600px';
        table.style.width = 'max-content';
        
        console.log('Horizontal scrollbar forced via CSS and JS');
    }
}

// Add mobile scroll indicator
function addMobileScrollIndicator(container, shouldShow) {
    // Remove existing indicator
    const existingIndicator = container.querySelector('.mobile-scroll-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Add new indicator if needed
    if (shouldShow && window.innerWidth <= 768) {
        const indicator = document.createElement('div');
        indicator.className = 'mobile-scroll-indicator';
        indicator.innerHTML = '← Scroll horizontally to see more columns →';
        indicator.style.cssText = `
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.75rem;
            color: #6c757d;
            font-style: italic;
            background: rgba(255,255,255,0.9);
            padding: 5px 10px;
            border-radius: 4px;
            white-space: nowrap;
            z-index: 5;
            animation: pulse 2s infinite;
        `;
        container.appendChild(indicator);
        
        // Add pulsing animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Helper function to find the global index of an appointment in currentAppointments array
function findGlobalAppointmentIndex(appointment) {
    // Try to find by rowIndex first (most reliable)
    if (appointment.rowIndex) {
        const foundIndex = currentAppointments.findIndex(apt => apt.rowIndex === appointment.rowIndex);
        if (foundIndex !== -1) return foundIndex;
    }
    
    // Fallback: try to find by unique combination of fields
    const foundIndex = currentAppointments.findIndex(apt => 
        apt.name === appointment.name && 
        apt.email === appointment.email && 
        apt.timestamp === appointment.timestamp
    );
    
    if (foundIndex !== -1) return foundIndex;
    
    // Last resort: try to find by email and timestamp
    return currentAppointments.findIndex(apt => 
        apt.email === appointment.email && 
        apt.timestamp === appointment.timestamp
    );
}

// Create appointment row
function createAppointmentRow(appointment, index) {
    const row = document.createElement('tr');
    row.className = 'fade-in';
    
    const status = appointment.status || 'Pending';
    const statusClass = getStatusClass(status);
    
    // Handle client status with multiple possible field names
    const clientStatus = appointment.clientStatus || 
                        appointment['clientStatus'] || 
                        appointment['Client Status'] || 
                        appointment['client-status'] || 
                        'Pending';
    const clientStatusClass = getClientStatusClass(clientStatus);
    
    // Debug logging for client query
    const clientQuery = appointment.clientQuery || appointment['Client Query'] || appointment['clientQuery'];
    if (clientStatus === 'Query') {
        console.log('Query appointment found:', {
            name: appointment.name,
            clientStatus,
            clientQuery,
            hasQuery: !!clientQuery,
            queryLength: clientQuery ? clientQuery.length : 0,
            allQueryFields: {
                'appointment.clientQuery': appointment.clientQuery,
                'Client Query': appointment['Client Query'],
                'appointment[clientQuery]': appointment['clientQuery']
            }
        });
    }
    
    // Additional debug logging for all appointments to check field names
    if (index < 3) { // Only log first 3 appointments to avoid spam
        console.log(`Appointment ${index + 1} debug:`, {
            name: appointment.name,
            clientStatus,
            allFields: Object.keys(appointment),
            clientFields: Object.keys(appointment).filter(key => 
                key.toLowerCase().includes('client') || 
                key.toLowerCase().includes('query') ||
                key.toLowerCase().includes('status')
            )
        });
    }
    
    // Handle date/time fields with correct field mapping based on Google Sheets
    const selectedDate = appointment['selected-date'] || 
                         appointment.selectedDate || 
                         'N/A';
    
    const selectedTime = appointment['selected-time'] || 
                         appointment.selectedTime ||
                         'N/A';
    
    const selectedSlot = appointment['selected-slot'] || 
                         appointment.selectedSlot ||
                         'N/A';
    
    const sessionType = appointment['session-type'] ||
                        appointment.sessionType || 
                        'N/A';
    
    // Get the submission timestamp
    const timestamp = appointment.timestamp ||
                      appointment['Time Stamp *'] ||
                      'N/A';
    
    // Debug logging for date/time fields - COMPREHENSIVE
    console.log('=== COMPREHENSIVE DATE/TIME DEBUG ===');
    console.log('Full appointment object:', appointment);
    console.log('All available fields:', Object.keys(appointment));
    console.log('Date-related fields:');
    Object.keys(appointment).forEach(key => {
        if (key.toLowerCase().includes('date') || 
            key.toLowerCase().includes('time') || 
            key.toLowerCase().includes('slot') ||
            key.toLowerCase().includes('selected')) {
            console.log(`  ${key}: "${appointment[key]}"`);
        }
    });
    console.log('Selected values:');
    console.log(`  selectedDate: "${selectedDate}"`);
    console.log(`  selectedTime: "${selectedTime}"`);
    console.log(`  selectedSlot: "${selectedSlot}"`);
    console.log('=== END DEBUG ===');
    
    // Determine the best date and time to display - simplified logic
    let displayDate = selectedDate;
    let displayTime = selectedTime;
    
    // If we don't have separate date/time, try to extract from selectedSlot
    if ((displayDate === 'N/A' || displayTime === 'N/A') && selectedSlot !== 'N/A') {
        console.log('Extracting date/time from selectedSlot:', selectedSlot);
        
        // Parse "2025-09-26 20:00:00 IST" format
        if (selectedSlot.includes(' ')) {
            const parts = selectedSlot.split(' ');
            if (parts.length >= 2) {
                displayDate = parts[0]; // Date part: "2025-09-26"
                displayTime = parts[1]; // Time part: "20:00:00"
            }
        }
    }
    
    console.log(`Final display values - Date: "${displayDate}", Time: "${displayTime}"`);
    
    // Get payment proof information - check both camelCase and original column name
    let paymentProofLink = appointment.paymentProofLink || 
                          appointment['Payment Proof Link'] || 
                          appointment['paymentProofLink'] || 
                          '';
    
    console.log('=== PAYMENT PROOF DEBUG ===');
    console.log('Appointment Name:', appointment.name);
    console.log('Payment Proof Link field:', paymentProofLink);
    console.log('Available keys:', Object.keys(appointment).filter(k => k.toLowerCase().includes('payment') || k.toLowerCase().includes('proof')));
    console.log('=== END PAYMENT PROOF DEBUG ===');
    
    // Helper function to create payment proof display
    const createPaymentProofDisplay = (proofLink) => {
        console.log('Creating payment proof display for link:', proofLink);
        
        if (!proofLink || proofLink.trim() === '') {
            return '<span class="text-muted"><i class="fas fa-minus"></i> Not uploaded</span>';
        }
        
        // Check if it's a hyperlink formula from Google Sheets
        if (proofLink.includes('=HYPERLINK')) {
            console.log('Detected Google Sheets HYPERLINK formula');
            // Extract URL and filename from =HYPERLINK("URL", "filename")
            const hyperlinkMatch = proofLink.match(/=HYPERLINK\("([^"]+)",\s*"([^"]+)"\)/);
            if (hyperlinkMatch) {
                const url = hyperlinkMatch[1];
                const filename = hyperlinkMatch[2];
                console.log('Extracted from HYPERLINK - URL:', url, 'Filename:', filename);
                
                // Truncate filename for display but keep full filename in tooltip
                const displayFilename = filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
                
                return `<a href="${url}" target="_blank" class="btn btn-sm btn-success" 
                          title="View Payment Proof: ${filename}" 
                          data-bs-toggle="tooltip" data-bs-placement="top">
                    <i class="fas fa-file-alt"></i> ${displayFilename}
                </a>`;
            }
        }
        
        // If it's a direct Google Drive URL
        if (proofLink.includes('drive.google.com')) {
            console.log('Detected direct Google Drive URL');
            const filename = 'Payment Proof';
            return `<a href="${proofLink}" target="_blank" class="btn btn-sm btn-success" 
                      title="View Payment Proof" 
                      data-bs-toggle="tooltip" data-bs-placement="top">
                <i class="fas fa-file-alt"></i> ${filename}
            </a>`;
        }
        
        // Check if it's just a filename (legacy data)
        if (proofLink && !proofLink.includes('http') && !proofLink.includes('=HYPERLINK')) {
            console.log('Detected filename without URL:', proofLink);
            const displayFilename = proofLink.length > 20 ? proofLink.substring(0, 17) + '...' : proofLink;
            return `<span class="text-warning" 
                      title="File: ${proofLink} (Link missing)" 
                      data-bs-toggle="tooltip" data-bs-placement="top">
                <i class="fas fa-exclamation-triangle"></i> ${displayFilename} (Link missing)
            </span>`;
        }
        
        // Fallback for other link formats
        console.log('Using fallback link format');
        return `<a href="${proofLink}" target="_blank" class="btn btn-sm btn-primary" 
                  title="View Payment Proof" 
                  data-bs-toggle="tooltip" data-bs-placement="top">
            <i class="fas fa-external-link-alt"></i> View Proof
        </a>`;
    };

    // Get current search term for highlighting
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    // Helper function to safely highlight text
    const safeHighlight = (text) => {
        if (!text || text === 'N/A') return text;
        return searchTerm ? highlightSearchTerm(String(text), searchTerm) : String(text);
    };
    
    row.innerHTML = `
        <td>
            <div class="session-id-badge" title="${appointment.sessionId || 'N/A'}">
                <strong>${appointment.sessionId || 'N/A'}</strong>
            </div>
        </td>
        <td>
            <div class="session-id-info">
                <div class="timestamp-date">${formatTimestamp(timestamp)}</div>
            </div>
        </td>
        <td>
            <div class="appointment-datetime">
                <div class="appointment-date">${formatDate(displayDate)}</div>
                <div class="appointment-time">${formatTime(displayTime)}</div>
            </div>
        </td>
        <td>
            <div class="client-info">
                <div class="client-name">${safeHighlight(appointment.name || 'N/A')}</div>
                <div class="client-org">${safeHighlight(appointment.organization || 'N/A')}</div>
            </div>
        </td>
        <td>
            <div class="contact-info">
                <a href="mailto:${appointment.email || ''}" class="contact-email">${safeHighlight(appointment.email || 'N/A')}</a>
                <div class="contact-phone">${safeHighlight(appointment.phone || 'N/A')}</div>
            </div>
        </td>
        <td>
            <span class="session-type">${safeHighlight(getDisplaySessionType(sessionType))}</span>
        </td>
        <td>
            <span class="status-badge ${statusClass}">${safeHighlight(status)}</span>
        </td>
        <td>
            <span class="client-status-badge ${clientStatusClass}">${safeHighlight(clientStatus)}</span>
            ${clientStatus === 'Query' && (appointment.clientQuery || appointment['Client Query'] || appointment['clientQuery']) ? 
              `<button class="btn btn-sm btn-info mt-1" onclick="showClientQuery('${(appointment.clientQuery || appointment['Client Query'] || appointment['clientQuery'] || '').replace(/'/g, '&#39;')}', '${appointment.name}')" title="View Client Query">
                <i class="fas fa-eye"></i> View Query
              </button>` : ''}
            ${(clientStatus === 'Feedback Received' || (appointment.clientFeedback || appointment['Client Feedback'] || appointment['clientFeedback'])) && (appointment.clientFeedback || appointment['Client Feedback'] || appointment['clientFeedback']) ? 
              `<button class="btn btn-sm btn-success mt-1" onclick="showClientFeedback('${(appointment.clientFeedback || appointment['Client Feedback'] || appointment['clientFeedback'] || '').replace(/'/g, '&#39;')}', ${index})" title="View Client Feedback">
                <i class="fas fa-star"></i> View Feedback
                ${clientStatus !== 'Feedback Received' ? ' <span class="badge bg-warning">NEW</span>' : ''}
              </button>` : ''} 
              <br>
            ${(appointment.queryHistory || appointment['Query History'] || appointment['queryHistory']) ? 
              `<button class="btn btn-sm btn-info mt-1" onclick="showQueryHistory('${(appointment.queryHistory || appointment['Query History'] || appointment['queryHistory'] || '').replace(/'/g, '&#39;').replace(/\n/g, '\\n')}', '${appointment.name}')" title="View Query History">
                <i class="fas fa-comments"></i> Query History
              </button>` : ''}
            ${(appointment.rescheduleHistory || appointment['Reschedule History'] || appointment['rescheduleHistory']) ? 
              `<button class="btn btn-sm btn-warning mt-1" onclick="showRescheduleHistory('${(appointment.rescheduleHistory || appointment['Reschedule History'] || appointment['rescheduleHistory'] || '').replace(/'/g, '&#39;').replace(/\n/g, '\\n')}', '${appointment.name}')" title="View Reschedule History">
                <i class="fas fa-history"></i> Reschedule History
              </button>` : ''}
        </td>
        <td>
            <div class="payment-proof-info">
                ${createPaymentProofDisplay(paymentProofLink)}
            </div>
        </td>
        <td>
            <div class="actions-container">
                ${generateActionButtons(appointment, index, status, clientStatus)}
            </div>
        </td>
    `;
    
    return row;
}

// Generate action buttons based on status
/**
 * Count how many times an appointment has been rescheduled
 * @param {Object} appointment - The appointment object
 * @returns {number} - Number of reschedules (0-3)
 */
function getRescheduleCount(appointment) {
    const rescheduleHistory = appointment.rescheduleHistory || appointment['Reschedule History'] || '';
    
    if (!rescheduleHistory || rescheduleHistory.trim() === '') {
        return 0;
    }
    
    // Count the number of reschedule entries
    // Each reschedule creates an entry like "timestamp: Client rescheduled from ... to ..."
    const rescheduleEntries = rescheduleHistory.split('\n').filter(entry => 
        entry.trim() !== '' && entry.includes('rescheduled')
    );
    
    return rescheduleEntries.length;
}

/**
 * Count how many queries have been submitted by the client
 * @param {Object} appointment - The appointment object
 * @returns {number} - Number of queries (0-3)
 */
function getQueryCount(appointment) {
    const queryHistory = appointment.queryHistory || appointment['Query History'] || '';
    
    console.log('Debug - getQueryCount called for:', appointment.name);
    console.log('Debug - queryHistory:', queryHistory);
    
    if (!queryHistory || queryHistory.trim() === '') {
        console.log('Debug - No query history found');
        return 0;
    }
    
    // Count the number of query entries
    // Each query creates an entry like "timestamp: Client submitted query: ..."
    const queryEntries = queryHistory.split('\n').filter(entry => {
        const trimmed = entry.trim();
        const hasQuery = trimmed !== '' && (
            trimmed.includes('Client submitted query') || 
            trimmed.includes('submitted query') || 
            trimmed.includes('Query:')
        );
        console.log('Debug - Entry:', trimmed, 'HasQuery:', hasQuery);
        return hasQuery;
    });
    
    console.log('Debug - Found query entries:', queryEntries.length);
    return queryEntries.length;
}

/**
 * Check if client has reached query limit
 * @param {Object} appointment - The appointment object
 * @returns {boolean} - Whether more queries are allowed
 */
function isQueryAllowed(appointment) {
    const MAX_QUERIES = 3;
    const currentCount = getQueryCount(appointment);
    
    return currentCount < MAX_QUERIES;
}

/**
 * Generate query resolved button if client status is "Query"
 * @param {Object} appointment - The appointment object
 * @param {number} index - The appointment index
 * @returns {string} - HTML for query resolved button or empty string
 */
function generateQueryResolvedButton(appointment, index) {
    const clientStatus = appointment.clientStatus || appointment['Client Status'] || '';
    
    // Show resolve button only for 'Query' status
    if (clientStatus === 'Query') {
        // No limit tracking - unlimited queries now
        console.log('Debug - generateQueryResolvedButton for:', appointment.name);
        console.log('Debug - clientStatus:', clientStatus);
        
        return `
            <button class="btn btn-sm action-btn btn-success" onclick="showQueryResolvedModal(${index})" title="Mark Query as Resolved">
                <i class="fas fa-question-circle"></i> Resolve Query
            </button>
        `;
    }
    
    return '';
}

/**
 * Generate reschedule button without any limits or count display
 * @param {Object} appointment - The appointment object
 * @param {number} index - The appointment index
 * @param {string} title - The button title
 * @returns {string} - HTML for reschedule button
 */
function generateRescheduleButton(appointment, index, title = "Reschedule") {
    // No limits, no count display - completely unlimited reschedules
    return `
        <button class="btn btn-sm action-btn btn-reschedule" onclick="showRescheduleModal(${index})" title="${title}">
            <i class="fas fa-calendar-alt"></i>
        </button>
    `;
}

function generateActionButtons(appointment, index, status, clientStatus = 'Pending') {
    const baseButtons = `
        <button class="btn btn-sm action-btn btn-secondary" onclick="viewDetails(${index})" title="View Details">
            <i class="fas fa-eye"></i>
        </button>
    `;
    
    // Check if client has submitted a query - show Query Resolved button
    const queryResolvedButton = generateQueryResolvedButton(appointment, index);
    
    // Helper function to determine if session reminder should be shown
    const shouldShowSessionReminder = () => {
        // Show session reminder ONLY after session is scheduled until completion
        const sessionScheduledStatuses = [
            'Session Scheduled',
            'Consent Email Sent', 
            'Session Reminder Sent'
        ];
        return sessionScheduledStatuses.includes(status) && status !== 'Session Completed';
    };
    
    // Helper function to determine if consent should be shown  
    const shouldShowConsent = () => {
        // Show consent primarily for Session Scheduled status
        return status === 'Session Scheduled' && status !== 'Session Completed';
    };
    
    // Helper function to generate common action buttons based on requirements
    const generateCommonButtons = (includeInvoice = false, includeConsent = false, includeSessionReminder = false, includeApproveReject = false) => {
        let buttons = '';
        
        // 1. Query button (if query is raised and unresolved)
        buttons += queryResolvedButton;
        
        // 2. Approve/Reject buttons (if needed)
        if (includeApproveReject) {
            buttons += `
                <button class="btn btn-sm action-btn btn-approve" onclick="showApproveModal(${index})" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm action-btn btn-reject" onclick="showRejectModal(${index})" title="Reject">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else {
            // Always show reject button unless session is completed
            if (status !== 'Session Completed') {
                buttons += `
                    <button class="btn btn-sm action-btn btn-reject" onclick="showRejectModal(${index})" title="Reject">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
        }
        
        // 3. Send Invoice button (until Invoice Acknowledgment is sent)
        if (includeInvoice && status !== 'Session Completed') {
            buttons += `
                <button class="btn btn-sm action-btn btn-payment" onclick="showPaymentModal(${index})" title="Send Invoice">
                    <i class="fas fa-file-invoice-dollar"></i>
                </button>
            `;
        }
        
        // 4. Send Consent button (for scheduled sessions until completed) - use helper function
        if (includeConsent && shouldShowConsent()) {
            buttons += `
                <button class="btn btn-sm action-btn btn-primary" onclick="showSendConsentModal(${index})" title="Send Consent Email">
                    <i class="fas fa-clipboard-check"></i>
                </button>
            `;
        }
        
        // 5. Send Session Reminder button (for scheduled sessions until completed) - use helper function
        if (includeSessionReminder && shouldShowSessionReminder()) {
            buttons += `
                <button class="btn btn-sm action-btn btn-warning" onclick="showSendSessionReminderModal(${index})" title="Send Session Reminder Email">
                    <i class="fas fa-bell"></i>
                </button>
            `;
        }
        
        // 6. Reschedule button (always available except for completed sessions)
        if (status !== 'Session Completed') {
            buttons += generateRescheduleButton(appointment, index);
        }
        
        // 7. Cancel button (always available except for completed sessions)
        if (status !== 'Session Completed') {
            buttons += `
                <button class="btn btn-sm action-btn btn-cancel" onclick="showCancelModal(${index})" title="Cancel">
                    <i class="fas fa-ban"></i>
                </button>
            `;
        }
        
        return buttons;
    };
    
    // Handle "Proceed" client status - route to appropriate workflow based on main status
    if (clientStatus === 'Proceed') {
        if (status === 'Approved') {
            return baseButtons + generateCommonButtons(true, false, false, false);
        } else if (status === 'Session Scheduled') {
            return baseButtons + generateCommonButtons(false, true, true, false);
        } else if (status === 'Query Resolved') {
            // After query resolved and client proceeded, continue with normal approved flow
            return baseButtons + generateCommonButtons(true, false, false, false);
        } else if (status === 'Pending') {
            // If still pending but client has proceeded, show approve/reject
            return baseButtons + generateCommonButtons(false, false, false, true);
        }
    }
    
    // Session Scheduled status - show consent and reminder buttons (HIGH PRIORITY - check this BEFORE client status checks)
    if (status === 'Session Scheduled') {
        // Add refund button for Session Scheduled status
        return baseButtons + generateCommonButtons(false, true, true, false) + `
            <button class="btn btn-sm action-btn btn-refund" onclick="showRefundModal(${index})" title="Initiate Refund">
                <i class="fas fa-money-bill-wave"></i>
            </button>
        `;
    }
    
    // Status "Session Reminder Sent" - show mark session done button AND keep session reminder available
    // IMPORTANT: This check must come BEFORE the "Payment Proof Uploaded" check to ensure
    // "Mark Session Done" is always shown when a session reminder has been sent,
    // regardless of client status.
    if (status === 'Session Reminder Sent') {
        return baseButtons + queryResolvedButton + `
            <button class="btn btn-sm action-btn btn-success" onclick="showMarkSessionDoneModal(${index})" title="Mark Session as Done">
                <i class="fas fa-check-circle"></i>
            </button>
            <button class="btn btn-sm action-btn btn-warning" onclick="showSendSessionReminderModal(${index})" title="Send Session Reminder Email">
                <i class="fas fa-bell"></i>
            </button>
            <button class="btn btn-sm action-btn btn-reject" onclick="showRejectModal(${index})" title="Reject">
                <i class="fas fa-times"></i>
            </button>
            ${generateRescheduleButton(appointment, index, "Reschedule")}
            <button class="btn btn-sm action-btn btn-cancel" onclick="showCancelModal(${index})" title="Cancel">
                <i class="fas fa-ban"></i>
            </button>
        `;
    }
    
    // Special case: if client status is "Payment Proof Uploaded" - show payment acknowledgement button
    if (clientStatus === 'Payment Proof Uploaded' && status !== 'Session Completed' && status !== 'Session Scheduled') {
        return baseButtons + generateCommonButtons(true, false, false, false) + `
            <button class="btn btn-sm action-btn btn-success" onclick="showPaymentAcknowledgementModal(${index})" title="Send Payment Acknowledgement">
                <i class="fas fa-video"></i>
            </button>
            <button class="btn btn-sm action-btn btn-refund" onclick="showRefundModal(${index})" title="Initiate Refund">
                <i class="fas fa-money-bill-wave"></i>
            </button>
        `;
    }
    
    // Client Status "Consent Given" - show send session reminder button
    if (clientStatus === 'Consent Given') {
        return baseButtons + generateCommonButtons(false, false, true, false);
    }

    // Status "Consent Email Sent" - show session reminder button and other actions
    if (status === 'Consent Email Sent') {
        return baseButtons + generateCommonButtons(false, true, true, false);
    }
    
    // Special case: Client has chosen a new time slot after rescheduling
    if (clientStatus && clientStatus.includes('New Time Slot Chosen')) {
        return baseButtons + generateCommonButtons(false, false, false, true);
    }
    
    // Handle different main statuses
    if (status === 'Pending') {
        return baseButtons + generateCommonButtons(false, false, false, true);
    } else if (status === 'Approved') {
        return baseButtons + generateCommonButtons(true, false, false, false);
    } else if (status === 'Payment Sent') {
        // Payment Sent - still allow invoice resend until acknowledgment, but NO session reminder (session not scheduled yet)
        return baseButtons + generateCommonButtons(true, false, false, false);
    } else if (status === 'Consent Email Sent') {
        // Consent Email Sent - show session reminder button and other actions
        return baseButtons + generateCommonButtons(false, true, true, false);
    } else if (status === 'New Query Received') {
        // New Query Received - show resolve query button PLUS all other appropriate action buttons
        // Determine what buttons to show based on the appointment's overall state and client status
        
        let showInvoice = false;
        let showConsent = false; 
        let showSessionReminder = false;
        let showApproveReject = false;
        
        // Determine appropriate buttons based on client status and overall appointment state
        if (clientStatus === 'Payment Proof Uploaded') {
            // If payment proof uploaded, show invoice and payment acknowledgement  
            showInvoice = true;
        } else if (clientStatus === 'Proceed' || clientStatus.includes('Proceed')) {
            // If client has proceeded, show invoice (this is the ONLY time invoice should show for queries)
            showInvoice = true;
        } else if (clientStatus === 'Consent Given') {
            // If consent given, show session-related buttons
            showConsent = true;
            showSessionReminder = true;
        } else if (!clientStatus || clientStatus === 'Pending' || clientStatus === 'Query') {
            // If just query or pending, DON'T show approve (already approved) or invoice (client hasn't proceeded yet)
            // Only show basic reject/reschedule/cancel actions
            showApproveReject = false;  // No approve needed - already approved
            showInvoice = false;        // No invoice until client status is "Proceed"
        }
        
        // If there are any scheduled session indicators, enable session buttons
        const hasScheduledSession = appointment['selected-date'] || appointment.selectedDate || 
                                   appointment['selected-time'] || appointment.selectedTime;
        if (hasScheduledSession) {
            showConsent = true;
            showSessionReminder = true;
        }
        
        return baseButtons + generateCommonButtons(showInvoice, showConsent, showSessionReminder, showApproveReject);
    } else if (status === 'Session Completed') {
        // When session is completed, show different options based on client status
        // Always show feedback reminder button unless feedback has been received
        const feedbackReminderBtn = clientStatus !== 'Feedback Received' ? `
            <button class="btn btn-sm action-btn btn-warning" onclick="showSendFeedbackReminderModal(${index})" title="Send Feedback Reminder">
                <i class="fas fa-envelope"></i>
            </button>
        ` : '';
        if (clientStatus === 'Feedback Pending') {
            return baseButtons + queryResolvedButton + feedbackReminderBtn + `
                <span class="badge bg-warning text-dark">
                    <i class="fas fa-clock"></i> Waiting for feedback
                </span>
            `;
        } else if (clientStatus === 'Feedback Received') {
            return baseButtons + queryResolvedButton + `
                <span class="badge bg-success">
                    <i class="fas fa-check-circle"></i> Complete
                </span>
            `;
        } else {
            return baseButtons + queryResolvedButton + feedbackReminderBtn + `
                <span class="badge bg-info">
                    <i class="fas fa-check-circle"></i> Completed
                </span>
            `;
        }
    } else if (status === 'Rejected') {
        // For rejected appointments, show request rebooking button
        return baseButtons + queryResolvedButton + `
            <button class="btn btn-sm action-btn btn-success" onclick="showRequestRebookingModal(${index})" title="Request Rebooking">
                <i class="fas fa-calendar-plus"></i>
            </button>
        `;
    } else if (status === 'Requested Rebooking') {
        // For appointments where rebooking has been requested, show status badge
        return baseButtons + queryResolvedButton + `
            <span class="badge bg-info">
                <i class="fas fa-paper-plane"></i> Rebooking Invitation Sent
            </span>
        `;
    } else if (status === 'Requested Rescheduling') {
        // Admin requested rescheduling - if client picked new time, show approve/reject
        if (clientStatus && clientStatus.includes('New Time Slot Chosen')) {
            return baseButtons + generateCommonButtons(false, false, false, true);
        }
        // Otherwise show basic buttons while waiting for client
        return baseButtons + queryResolvedButton;
    } else if (status === 'Session Rescheduled' || status === 'Rescheduled') {
        // Client has rescheduled - show Approve/Reject so admin can approve the new schedule
        // Also show invoice, consent, and session reminder for workflow continuity
        return baseButtons + generateCommonButtons(true, true, true, true);
    } else {
        return baseButtons + queryResolvedButton;
    }
}

// Get status CSS class
function getStatusClass(status) {
    const statusMap = {
        'Pending': 'status-pending',
        'Approved': 'status-approved',
        'Rejected': 'status-rejected',
        'Requested Rebooking': 'status-requested-rebooking',
        'Session Rescheduled': 'status-rescheduled',
        'Cancelled': 'status-cancelled',
        'Payment Sent': 'status-payment-sent',
        'Session Scheduled': 'status-session-scheduled',
        'Consent Email Sent': 'status-consent-sent',
        'Session Reminder Sent': 'status-session-reminder-sent',
        'Session Completed': 'status-session-completed',
        'Query Resolved': 'status-query-resolved'
    };
    
    return statusMap[status] || 'status-pending';
}

// Get CSS class for client status
function getClientStatusClass(clientStatus) {
    const statusMap = {
        'Pending': 'client-status-pending',
        'Proceed': 'client-status-proceed',
        'Query': 'client-status-query',
        'Query Resolved - Awaiting Response': 'client-status-query-resolved',
        'Payment Proof Uploaded': 'client-status-payment-uploaded',
        'Consent Given': 'client-status-consent-given',
        'Feedback Pending': 'client-status-feedback-pending',
        'Feedback Received': 'client-status-feedback-received'
    };
    
    // Handle partial matches for dynamic statuses
    if (clientStatus && clientStatus.includes('Query Resolved')) {
        return 'client-status-query-resolved';
    }
    if (clientStatus && clientStatus.includes('Awaiting Response')) {
        return 'client-status-awaiting-response';
    }
    if (clientStatus && clientStatus.includes('New Time Slot Chosen')) {
        return 'client-status-rescheduled';
    }
    
    return statusMap[clientStatus] || 'client-status-pending';
}

// Show client query in modal
function showClientQuery(query, clientName) {
    try {
        // Decode HTML entities if any were encoded
        const decodedQuery = query.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        
        const modal = new bootstrap.Modal(document.getElementById('clientQueryModal'));
        document.getElementById('clientQueryContent').textContent = decodedQuery || 'No query available';
        document.getElementById('clientQueryModalLabel').textContent = `Client Query - ${clientName}`;
        modal.show();
        
        console.log('Client query modal opened for:', clientName);
    } catch (error) {
        console.error('Error showing client query:', error);
        alert('Error displaying client query.');
    }
}

// Show reschedule history in modal
function showRescheduleHistory(history, clientName) {
    try {
        // Decode HTML entities and line breaks
        const decodedHistory = history.replace(/&#39;/g, "'")
                                     .replace(/&quot;/g, '"')
                                     .replace(/&amp;/g, '&')
                                     .replace(/\\n/g, '\n');
        
        const modal = new bootstrap.Modal(document.getElementById('rescheduleHistoryModal'));
        
        // Format the history with proper line breaks
        const formattedHistory = decodedHistory.split('\n').map(line => {
            if (line.trim()) {
                return `<div class="history-entry"><i class="fas fa-clock text-warning me-2"></i>${line.trim()}</div>`;
            }
            return '';
        }).filter(line => line).join('');
        
        document.getElementById('rescheduleHistoryContent').innerHTML = formattedHistory || '<div class="text-muted">No reschedule history available</div>';
        document.getElementById('rescheduleHistoryModalLabel').textContent = `Reschedule History - ${clientName}`;
        modal.show();
        
        console.log('Reschedule history modal opened for:', clientName);
    } catch (error) {
        console.error('Error showing reschedule history:', error);
        alert('Error displaying reschedule history.');
    }
}

// Show query history in modal
function showQueryHistory(history, clientName) {
    try {
        // Decode HTML entities and line breaks
        const decodedHistory = history.replace(/&#39;/g, "'")
                                     .replace(/&quot;/g, '"')
                                     .replace(/&amp;/g, '&')
                                     .replace(/\\n/g, '\n');
        
        const modal = new bootstrap.Modal(document.getElementById('queryHistoryModal'));
        
        // Format the history with proper line breaks and different icons for queries vs resolutions
        const formattedHistory = decodedHistory.split('\n').map(line => {
            if (line.trim()) {
                const isQuery = line.includes('submitted query') || line.includes('Query:');
                const isResolution = line.includes('resolved') || line.includes('Resolution:');
                
                let icon = 'fas fa-comment text-info';
                if (isResolution) {
                    icon = 'fas fa-check-circle text-success';
                } else if (isQuery) {
                    icon = 'fas fa-question-circle text-warning';
                }
                
                // Convert document links to clickable buttons
                let formattedLine = line.trim();
                
                // Match [Document: URL] or [Admin Response Document: URL] patterns
                const documentLinkRegex = /\[(Document|Admin Response Document|Client Document|User Document): (https?:\/\/[^\]]+)\]/g;
                formattedLine = formattedLine.replace(documentLinkRegex, (match, docType, url) => {
                    // Extract filename from URL if possible
                    let filename = docType;
                    if (url.includes('/d/')) {
                        const fileId = url.match(/\/d\/([^/]+)/);
                        if (fileId) {
                            filename = `${docType}`;
                        }
                    }
                    
                    // Create a clickable button similar to payment proof
                    return `<a href="${url}" target="_blank" class="btn btn-sm btn-success ms-2" 
                              title="View ${docType}" 
                              data-bs-toggle="tooltip" data-bs-placement="top">
                        <i class="fas fa-file-alt"></i> View ${docType}
                    </a>`;
                });
                
                return `<div class="history-entry mb-2"><i class="${icon} me-2"></i>${formattedLine}</div>`;
            }
            return '';
        }).filter(line => line).join('');
        
        document.getElementById('queryHistoryContent').innerHTML = formattedHistory || '<div class="text-muted">No query history available</div>';
        document.getElementById('queryHistoryModalLabel').textContent = `Query History - ${clientName}`;
        modal.show();
        
        console.log('Query history modal opened for:', clientName);
    } catch (error) {
        console.error('Error showing query history:', error);
        alert('Error displaying query history.');
    }
}

// Show client feedback in modal with detailed parsing
function showClientFeedback(feedbackData, appointmentIndex) {
    try {
        const appointment = currentAppointments[appointmentIndex];
        if (!appointment) {
            console.error('Appointment not found at index:', appointmentIndex);
            alert('Error: Appointment data not found.');
            return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('clientFeedbackModal'));
        
        // Parse feedback data if it's in the format "Rating: X/5 stars | feedback text"
        const feedbackInfo = parseFeedbackData(feedbackData);
        
        // Populate modal with client details
        document.getElementById('feedbackClientName').textContent = appointment.name || 'Unknown';
        document.getElementById('feedbackClientEmail').textContent = appointment.email || 'Unknown';
        document.getElementById('feedbackClientOrg').textContent = appointment.organization || 'Unknown';
        
        // Populate session details
        const selectedDate = appointment['selected-date'] || appointment.selectedDate || 'Unknown';
        const selectedTime = appointment['selected-time'] || appointment.selectedTime || 'Unknown';
        
        document.getElementById('feedbackSessionDate').textContent = formatDate(selectedDate);
        document.getElementById('feedbackSessionTime').textContent = formatTime(selectedTime);
        document.getElementById('feedbackSessionType').textContent = getDisplaySessionType(appointment['session-type'] || appointment.sessionType) || 'Consultation';
        
        // Populate feedback details
        if (feedbackInfo.rating !== 'N/A') {
            document.getElementById('feedbackRating').textContent = `${feedbackInfo.rating}/5`;
            document.getElementById('feedbackStars').innerHTML = feedbackInfo.stars;
        } else {
            document.getElementById('feedbackRating').textContent = 'No rating';
            document.getElementById('feedbackStars').innerHTML = '<span class="text-muted">No rating provided</span>';
        }
        
        document.getElementById('feedbackContent').textContent = feedbackInfo.text;
        
        modal.show();
    } catch (error) {
        console.error('Error showing client feedback:', error);
        alert('Error displaying feedback details.');
    }
}

// Helper function to parse feedback data
function parseFeedbackData(feedbackData) {
    let rating = 'N/A';
    let feedbackText = 'No feedback available';
    let stars = '';
    
    if (feedbackData && feedbackData !== 'N/A') {
        const ratingMatch = feedbackData.match(/Rating:\s*(\d+)\/5\s*stars?\s*\|\s*(.+)/);
        if (ratingMatch) {
            rating = parseInt(ratingMatch[1]);
            feedbackText = ratingMatch[2].trim();
            
            // Generate star display
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    stars += '<i class="fas fa-star text-warning"></i>';
                } else {
                    stars += '<i class="far fa-star text-muted"></i>';
                }
            }
        } else {
            // If not in expected format, show as is
            feedbackText = feedbackData;
        }
    }
    
    return { rating, text: feedbackText, stars };
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    if (!timestamp || timestamp === 'N/A') {
        return 'N/A';
    }
    
    try {
        const date = new Date(timestamp);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return timestamp; // Return original string if can't parse
        }
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting timestamp:', error, 'Original:', timestamp);
        return timestamp; // Return original string if error
    }
}

// Format time for display
function formatTime(timeString) {
    if (!timeString || timeString === 'N/A') {
        return 'N/A';
    }
    
    try {
        // If it's a weird Google Sheets serial time, skip it
        if (timeString.includes('1899-') || timeString.includes('1900-')) {
            console.warn('Detected invalid serial time from Google Sheets:', timeString);
            return 'Invalid Time';
        }
        
        // If it's already a time range format like "14:30-15:30", return as is
        if (timeString.includes('-') && timeString.match(/\d{1,2}:\d{2}/)) {
            return timeString;
        }
        
        // If it's an ISO datetime string, extract the time
        if (timeString.includes('T') && timeString.includes(':')) {
            const timePart = timeString.split('T')[1];
            if (timePart) {
                const timeOnly = timePart.split('.')[0]; // Remove milliseconds if present
                return timeOnly.substring(0, 5); // HH:MM format
            }
        }
        
        // Return as-is for simple time formats
        return timeString;
    } catch (error) {
        console.error('Error formatting time:', error, 'Original:', timeString);
        return timeString;
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString || dateString === 'N/A') {
        return 'N/A';
    }
    
    try {
        // Handle various date formats
        let dateToFormat = dateString;
        
        // If it's a weird Google Sheets serial date like "1899-12-30T14:38:50.000Z", skip it
        if (dateString.includes('1899-') || dateString.includes('1900-')) {
            console.warn('Detected invalid serial date from Google Sheets:', dateString);
            return 'Invalid Date';
        }
        
        // If it's a combined datetime string, extract just the date part
        if (typeof dateString === 'string' && dateString.includes(' ')) {
            dateToFormat = dateString.split(' ')[0];
        }
        
        // Handle ISO strings
        if (dateString.includes('T') && dateString.includes('Z')) {
            dateToFormat = dateString.split('T')[0];
        }
        
        const date = new Date(dateToFormat);
        
        // Check if the date is valid and not in the 1800s/1900s (Google Sheets serial date issue)
        if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
            console.warn('Invalid or suspicious date detected:', dateString);
            return dateString; // Return original string if can't parse or suspicious
        }
        
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error, 'Original:', dateString);
        return dateString; // Return original string if error
    }
}

// Update statistics
function updateStatistics() {
    const stats = {
        pending: 0,
        approved: 0,
        rescheduled: 0,
        rejected: 0,
        sessionScheduled: 0,
        completed: 0
    };
    
    // Debug: Log all statuses
    console.log('Debug: All appointment statuses:', currentAppointments.map(app => app.status || 'Pending'));
    
    currentAppointments.forEach(appointment => {
        const status = appointment.status || 'Pending';
        switch (status) {
            case 'Pending':
                stats.pending++;
                break;
            case 'Approved':
                stats.approved++;
                break;
            case 'Session Rescheduled':
                stats.rescheduled++;
                break;
            case 'Rejected':
            case 'Cancelled':
                stats.rejected++;
                break;
            case 'Session Scheduled':
                stats.sessionScheduled++;
                break;
            case 'Session Reminder Sent':
                stats.sessionScheduled++;
                break;
            case 'Payment Sent':
                // Count payment sent as approved for statistics
                stats.approved++;
                break;
            case 'Consent Email Sent':
                // Count consent email sent as approved
                stats.approved++;
                break;
            case 'Session Completed':
                stats.completed++;
                break;
        }
    });
    
    console.log('Debug: Calculated stats:', stats);
    
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('approvedCount').textContent = stats.approved + stats.sessionScheduled; // Include scheduled sessions
    document.getElementById('rescheduledCount').textContent = stats.rescheduled;
    document.getElementById('rejectedCount').textContent = stats.rejected;
    document.getElementById('completedCount').textContent = stats.completed;
}

// Modal functions
function showApproveModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('approveModal'));
    modal.show();
}

function showRejectModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('rejectModal'));
    modal.show();
}

function showRescheduleModal(index) {
    selectedAppointmentId = index;
    const appointment = currentAppointments[index];
    
    // Clear any previous data
    clearModalForms();
    resetRescheduleModal();
    
    // Note: Calendar-related elements have been removed from the modal
    // Only the request rescheduling option is available
    
    // Set up option change handlers (simplified)
    setupRescheduleOptionHandlers();
    
    const modal = new bootstrap.Modal(document.getElementById('rescheduleModal'));
    modal.show();
}

function showCancelModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
    modal.show();
}

function showPaymentModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
}

function showPaymentAcknowledgementModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('paymentAcknowledgementModal'));
    modal.show();
}

// Show refund initiation modal
function showRefundModal(index) {
    selectedAppointmentId = index;
    const appointment = currentAppointments[index];
    
    // Update modal title with appointment details
    const modalTitle = document.getElementById('refundModalTitle');
    if (modalTitle) {
        const clientName = appointment.name || appointment['Full Name *'] || 'Unknown Client';
        const sessionId = appointment.sessionId || appointment['Session ID'] || 'Unknown ID';
        modalTitle.textContent = `Initiate Refund - ${clientName} (${sessionId})`;
    }
    
    // Clear previous form data
    const refundNotesTextarea = document.getElementById('refundNotes');
    const refundProofFile = document.getElementById('refundProofFile');
    const refundNotesCount = document.getElementById('refundNotesCount');
    
    if (refundNotesTextarea) refundNotesTextarea.value = '';
    if (refundProofFile) refundProofFile.value = '';
    if (refundNotesCount) refundNotesCount.textContent = '0';
    
    // Add character count listener for refund notes
    if (refundNotesTextarea && !refundNotesTextarea.hasCharCountListener) {
        refundNotesTextarea.addEventListener('input', function() {
            if (refundNotesCount) {
                refundNotesCount.textContent = this.value.length;
            }
        });
        refundNotesTextarea.hasCharCountListener = true;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('refundModal'));
    modal.show();
}

function showSendConsentModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('sendConsentModal'));
    modal.show();
}

function showSendSessionReminderModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('sendSessionReminderModal'));
    modal.show();
}

function showMarkSessionDoneModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('markSessionDoneModal'));
    modal.show();
}

function showRequestRebookingModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('requestRebookingModal'));
    modal.show();
}

function showQueryResolvedModal(index) {
    selectedAppointmentId = index;
    
    // Clear form fields when opening modal
    document.getElementById('queryResolution').value = '';
    const fileInput = document.getElementById('adminQueryDocument');
    if (fileInput) {
        fileInput.value = '';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('queryResolvedModal'));
    modal.show();
}

// Action confirmations
async function confirmApprove() {
    const appointment = currentAppointments[selectedAppointmentId];
    const notes = document.getElementById('approveNotes').value;
    
    await performAction('approve', appointment, { notes });
}

async function confirmReject() {
    const appointment = currentAppointments[selectedAppointmentId];
    const reason = document.getElementById('rejectReason').value.trim();
    
    await performAction('reject', appointment, { reason });
}

async function confirmReschedule() {
    const appointment = currentAppointments[selectedAppointmentId];
    const reason = document.getElementById('rescheduleReason').value;
    
    // Send email to client with reschedule request (email will contain booking form link)
    await performAction('reschedule', appointment, { reason });
}

async function confirmCancel() {
    const appointment = currentAppointments[selectedAppointmentId];
    const reason = document.getElementById('cancelReason').value.trim();
    
    if (!reason) {
        showAlert('Please provide a reason for cancellation.', 'danger');
        return;
    }
    
    await performAction('cancel', appointment, { reason });
}

async function confirmPayment() {
    const appointment = currentAppointments[selectedAppointmentId];
    const fileInput = document.getElementById('invoiceFile');
    const notes = document.getElementById('paymentNotes').value;
    
    if (!fileInput.files?.[0]) {
        showAlert('Please select a PDF file to send.', 'danger');
        return;
    }
    
    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
        showAlert('Please select a valid PDF file.', 'danger');
        return;
    }
    
    // Convert file to base64
    const base64File = await fileToBase64(file);
    
    await performAction('payment', appointment, { 
        notes, 
        fileName: file.name,
        fileContent: base64File,
        // Try multiple field name variations for client status update
        clientStatus: 'P. P Upload Pending',
        newClientStatus: 'P. P Upload Pending',
        'Client Status': 'P. P Upload Pending',
        updateClientStatus: 'P. P Upload Pending'
    });
}

async function confirmPaymentAcknowledgement() {
    const appointment = currentAppointments[selectedAppointmentId];
    const notes = document.getElementById('acknowledgementNotes').value;
    
    await performAction('paymentAcknowledgement', appointment, { notes });
}

async function confirmSendConsent() {
    const appointment = currentAppointments[selectedAppointmentId];
    const notes = document.getElementById('consentNotes').value;
    
    await performAction('sendConsent', appointment, { notes });
}

async function confirmSendSessionReminder() {
    const appointment = currentAppointments[selectedAppointmentId];
    const notes = document.getElementById('sessionReminderNotes').value;
    
    await performAction('sendSessionReminder', appointment, { notes });
}

async function confirmRefund() {
    const appointment = currentAppointments[selectedAppointmentId];
    const notes = document.getElementById('refundNotes').value;
    const fileInput = document.getElementById('refundProofFile');
    
    // Prepare refund data
    const refundData = { notes };
    
    // Handle file upload if present
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        
        console.log('📎 File selected for refund proof:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
        });
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showAlert('File size exceeds 10MB limit. Please choose a smaller file.', 'danger');
            return;
        }
        
        // Convert file to base64
        try {
            console.log('🔄 Converting file to base64...');
            const base64File = await fileToBase64(file);
            refundData.refundProofName = file.name;
            refundData.refundProofDocument = base64File;
            refundData.refundProofType = file.type;
            
            console.log('✅ File converted successfully:', {
                refundProofName: refundData.refundProofName,
                refundProofType: refundData.refundProofType,
                base64Length: base64File.length,
                hasData: !!refundData.refundProofDocument
            });
        } catch (error) {
            console.error('❌ Error converting file to base64:', error);
            showAlert('Error processing file. Please try again.', 'danger');
            return;
        }
    } else {
        console.log('ℹ️ No file selected for refund proof');
    }
    
    console.log('📤 Sending refund data:', {
        appointmentId: appointment.sessionId || appointment['Session ID'],
        hasNotes: !!notes,
        hasFile: !!(refundData.refundProofName && refundData.refundProofDocument && refundData.refundProofType),
        refundData: refundData
    });
    
    await performAction('initiateRefund', appointment, refundData);
}

async function confirmMarkSessionDone() {
    const appointment = currentAppointments[selectedAppointmentId];
    const notes = document.getElementById('sessionDoneNotes').value;
    
    await performAction('markSessionDone', appointment, { notes });
}

function showSendFeedbackReminderModal(index) {
    selectedAppointmentId = index;
    const modal = new bootstrap.Modal(document.getElementById('feedbackReminderModal'));
    modal.show();
}

async function confirmSendFeedbackReminder() {
    const appointment = currentAppointments[selectedAppointmentId];
    await performAction('sendFeedbackReminder', appointment, {});
}

async function confirmRequestRebooking() {
    const appointment = currentAppointments[selectedAppointmentId];
    const message = document.getElementById('rebookingMessage').value.trim();
    
    await performAction('requestRebooking', appointment, { message });
}

async function confirmQueryResolved() {
    const appointment = currentAppointments[selectedAppointmentId];
    const resolution = document.getElementById('queryResolution').value.trim();
    
    if (!resolution) {
        showAlert('Please enter your resolution response to the client before submitting.', 'warning');
        return;
    }
    
    // Handle optional document upload
    const fileInput = document.getElementById('adminQueryDocument');
    let fileData = null;
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            showAlert('File size exceeds 10MB limit. Please choose a smaller file.', 'danger');
            return;
        }
        
        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/jpg', 
            'image/png'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            showAlert('Invalid file type. Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG', 'danger');
            return;
        }
        
        try {
            // Convert file to base64
            const base64File = await fileToBase64(file);
            fileData = {
                fileName: file.name,
                fileContent: base64File,
                fileType: file.type
            };
            console.log('Admin document prepared for upload:', file.name, file.type);
        } catch (error) {
            console.error('Error converting file to base64:', error);
            showAlert('Error processing file. Please try again.', 'danger');
            return;
        }
    }
    
    await performAction('queryResolved', appointment, { 
        resolution,
        adminDocument: fileData 
    });
}

// Perform action on appointment
async function performAction(action, appointment, data, retryCount = 0) {
    showLoading(true);
    
    try {
        // CRITICAL FIX: Ensure we always send proper Session ID to backend
        // Use sessionId as the proper appointment ID for Google Sheets
        let appointmentId = appointment.sessionId || appointment['Session ID'];
        
        // If sessionId is not available, construct it from rowIndex
        if (!appointmentId && appointment.rowIndex) {
            const currentYear = new Date().getFullYear();
            const sequenceNumber = appointment.rowIndex - 1; // rowIndex is 1-based, sequence is 0-based
            appointmentId = `GIS-${currentYear}-${String(sequenceNumber).padStart(3, '0')}`;
            console.log('Constructed Session ID from rowIndex:', appointmentId);
        }
        
        // IMPORTANT: Only use rowIndex as absolute last resort, not as normal fallback
        if (!appointmentId) {
            console.warn('No Session ID available, using rowIndex as last resort:', appointment.rowIndex || appointment.id);
            appointmentId = appointment.rowIndex || appointment.id || 1;
        }
        
        console.log('Final appointmentId being sent to backend:', appointmentId);
        
        // Enhanced appointment data for email generation - collect all relevant fields
        const enhancedAppointment = {
            ...appointment,
            // Add the constructed Session ID back to the appointment object
            sessionId: appointmentId,
            // Ensure consistent field naming for email templates
            clientName: appointment.name || appointment.clientName,
            emailAddress: appointment.email || appointment.emailAddress,
            phoneNumber: appointment.phone || appointment.phoneNumber || appointment['Phone Number'],
            organizationName: appointment.organization || appointment.organizationName,
            clientDesignation: appointment.designation || appointment.clientDesignation,
            appointmentDate: appointment['selected-date'] || appointment.selectedDate || appointment.appointmentDate,
            appointmentTime: appointment['selected-time'] || appointment.selectedTime || appointment.appointmentTime,
            sessionType: appointment['session-type'] || appointment.sessionType || appointment.consultationType,
            consultationTopic: appointment.topic || appointment.consultationTopic || appointment.query,
            submissionTimestamp: appointment.timestamp || appointment['Time Stamp *'] || appointment.submissionTime,
            currentStatus: appointment.status || 'Pending',
            clientCurrentStatus: appointment.clientStatus || appointment['Client Status'] || 'Pending'
        };
        
        // Handle combined date-time fields for better email population
        const combinedDateTimeFields = [
            'selected-time-slot--in-case-of-consultancyist',
            'selected-time-slot-in-case-of-consultancyregion-st', 
            'selected-slot',
            'appointmentDateTime'
        ];
        
        for (const field of combinedDateTimeFields) {
            if (appointment[field] && appointment[field] !== 'Not specified') {
                const combinedValue = appointment[field];
                if (combinedValue.includes(' ')) {
                    const parts = combinedValue.split(' ');
                    if (parts.length >= 2) {
                        enhancedAppointment.appointmentDate = parts[0];
                        enhancedAppointment.appointmentTime = parts.slice(1).join(' ');
                        break;
                    }
                }
            }
        }
        
        console.log('Sending action:', {
            action: action,
            appointmentId: appointmentId,
            enhancedAppointment: enhancedAppointment,
            data: data
        });
        
        // Use form-encoded data to avoid CORS preflight issues
        const formData = new URLSearchParams();
        formData.append('action', action);
        formData.append('appointmentId', appointmentId.toString());
        formData.append('appointment', JSON.stringify(enhancedAppointment));
        formData.append('actionData', JSON.stringify(data));
        formData.append('timestamp', Date.now().toString()); // Prevent caching
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        console.log('Action response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        console.log('Action raw response:', textResponse);
        
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            console.error('JSON parse error for action response:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        
        if (result.status === 'success') {
            showAlert(`Appointment ${action}d successfully!`, 'success');
            
            // Close modal
            const activeModal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
            if (activeModal) {
                activeModal.hide();
            }
            
            // Clear form fields
            clearModalForms();
            
            // Reload appointments
            await loadAppointments();
        } else {
            throw new Error(result.message || 'Unknown error');
        }
    } catch (error) {
        console.error(`Error performing ${action}:`, error);
        
        // Handle network state errors and other fetch issues with retry logic
        if ((error.message.includes('Failed to fetch') || 
             error.message.includes('Network request failed') ||
             error.message.includes('Net state changed') ||
             error.message.includes('ERR_NETWORK') ||
             error.name === 'TypeError') && retryCount < 3) {
            
            console.log(`Network error detected, retrying ${action}... (attempt ${retryCount + 1}/3)`);
            showAlert(`Network issue detected, retrying ${action}... (attempt ${retryCount + 1}/3)`, 'warning');
            
            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 1000)));
            
            return performAction(action, appointment, data, retryCount + 1);
        }
        
        let errorMessage = `Failed to ${action} appointment. `;
        
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
            errorMessage += 'Network connection issue. Please check your internet connection and try again.';
        } else if (error.message.includes('Net state changed')) {
            errorMessage += 'Network state changed during request. This is usually temporary - please try again.';
        } else {
            errorMessage += error.message;
        }
        
        showAlert(errorMessage, 'danger');
    } finally {
        showLoading(false);
    }
}

// Test connection to Google Apps Script
async function testConnection() {
    console.log('Testing connection to Google Apps Script...');
    console.log('URL:', CONFIG.GOOGLE_SCRIPT_URL);
    
    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-cache'
        });
        
        console.log('Test response status:', response.status);
        console.log('Test response headers:', [...response.headers.entries()]);
        
        const text = await response.text();
        console.log('Test response text:', text);
        
        if (response.ok) {
            showAlert('Connection test successful!', 'success');
        } else {
            showAlert(`Connection test failed: ${response.status}`, 'danger');
        }
    } catch (error) {
        console.error('Connection test error:', error);
        showAlert(`Connection test failed: ${error.message}`, 'danger');
    }
}

// Add test button functionality
function addTestButton() {
    const container = document.querySelector('.container-fluid .row').parentElement;
    const testDiv = document.createElement('div');
    testDiv.innerHTML = `
        <div class="alert alert-info mt-3">
            <strong>Debug Tools:</strong>
            <button class="btn btn-sm btn-primary ms-2" onclick="testConnection()">Test Connection</button>
            <button class="btn btn-sm btn-secondary ms-2" onclick="console.log('Current config:', CONFIG)">Log Config</button>
            <button class="btn btn-sm btn-warning ms-2" onclick="debugAppointmentFields()">Debug Fields</button>
            <button class="btn btn-sm btn-success ms-2" onclick="debugDateTimeFields()">Debug Date/Time</button>
            <button class="btn btn-sm btn-info ms-2" onclick="debugSessionIdColumn()">Debug Session IDs</button>
            <button class="btn btn-sm btn-danger ms-2" onclick="testRefundDocumentUpload()">Test Refund Upload</button>
        </div>
    `;
    container.appendChild(testDiv);
}

// Debug Session ID column function
async function debugSessionIdColumn() {
    console.log('Debugging Session ID column...');
    
    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL + '?action=debugSessionId', {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Session ID Debug Result:', result);
        
        if (result.status === 'success') {
            const info = result;
            let message = `Session ID Column Debug:
• Column exists: ${info.sessionIdColumnExists}
• Column index: ${info.sessionIdColumnIndex}
• Total rows: ${info.totalRows}
• Sample Session IDs: ${info.sampleSessionIds.map(s => `Row ${s.row}: ${s.sessionId}`).join(', ')}`;
            
            showAlert(message, 'info');
            
            if (!info.sessionIdColumnExists) {
                showAlert('Session ID column is missing! This could be causing the approval errors. Consider running the Session ID setup function.', 'warning');
            } else if (info.sampleSessionIds.some(s => s.sessionId === 'EMPTY')) {
                showAlert('Some appointments have empty Session IDs. This could cause lookup failures.', 'warning');
            }
        } else {
            showAlert('Debug failed: ' + result.message, 'danger');
        }
    } catch (error) {
        console.error('Session ID debug error:', error);
        showAlert('Failed to debug Session ID column: ' + error.message, 'danger');
    }
}

// Search Functionality
function initializeSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    if (!searchInput || !searchDropdown || !clearSearchBtn) {
        console.warn('Search elements not found in DOM');
        return;
    }
    
    // Search input event listeners
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('focus', showSearchDropdown);
    searchInput.addEventListener('blur', () => {
        setTimeout(hideSearchDropdown, 200); // Delay to allow dropdown clicks
    });
    
    // Search dropdown event listeners
    searchDropdown.addEventListener('mousedown', function(e) {
        e.preventDefault(); // Prevent blur when clicking dropdown
    });
    
    searchDropdown.addEventListener('click', function(e) {
        const option = e.target.closest('.search-option');
        if (option) {
            selectSearchField(option.dataset.field);
        }
    });
    
    // Clear search button
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-input-wrapper')) {
            hideSearchDropdown();
        }
    });
    
    // Keyboard navigation for search dropdown
    searchInput.addEventListener('keydown', handleSearchKeydown);
}

function handleSearchInput(e) {
    const searchTerm = e.target.value.trim();
    currentSearchTerm = searchTerm;
    
    // Show/hide clear button
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        if (searchTerm) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
    }
    
    // Debounce search to avoid too many calls
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        filterAndSearchAppointments();
    }, 300);
}

function handleSearchKeydown(e) {
    const dropdown = document.getElementById('searchDropdown');
    const options = dropdown.querySelectorAll('.search-option');
    const currentActive = dropdown.querySelector('.search-option.active');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        showSearchDropdown();
        const nextOption = currentActive ? currentActive.nextElementSibling : options[0];
        if (nextOption) {
            currentActive?.classList.remove('active');
            nextOption.classList.add('active');
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        showSearchDropdown();
        const prevOption = currentActive ? currentActive.previousElementSibling : options[options.length - 1];
        if (prevOption) {
            currentActive?.classList.remove('active');
            prevOption.classList.add('active');
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentActive) {
            selectSearchField(currentActive.dataset.field);
        }
        hideSearchDropdown();
    } else if (e.key === 'Escape') {
        hideSearchDropdown();
    }
}

function showSearchDropdown() {
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) {
        dropdown.style.display = 'block';
    }
}

function hideSearchDropdown() {
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function selectSearchField(field) {
    currentSearchField = field;
    
    // Update dropdown active state
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) {
        dropdown.querySelectorAll('.search-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.field === field) {
                option.classList.add('active');
            }
        });
    }
    
    // Update placeholder
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const fieldNames = {
            'all': 'Search all fields...',
            'name': 'Search by client name...',
            'email': 'Search by email...',
            'organization': 'Search by organization...',
            'sessionType': 'Search by session type...',
            'status': 'Search by status...'
        };
        searchInput.placeholder = fieldNames[field] || 'Search appointments...';
    }
    
    // Re-run search if there's a search term
    if (currentSearchTerm) {
        filterAndSearchAppointments();
    }
    
    hideSearchDropdown();
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    if (searchInput) {
        searchInput.value = '';
    }
    currentSearchTerm = '';
    currentSearchField = 'all';
    
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // Reset to default search field
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) {
        dropdown.querySelectorAll('.search-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.field === 'all') {
                option.classList.add('active');
            }
        });
    }
    
    // Update placeholder
    if (searchInput) {
        searchInput.placeholder = 'Search all fields...';
    }
    
    // Re-filter appointments
    filterAndSearchAppointments();
}

function searchAppointments(appointments, searchTerm, searchField) {
    if (!searchTerm) {
        return appointments;
    }
    
    const term = searchTerm.toLowerCase();
    
    return appointments.filter(appointment => {
        const getValue = (field) => {
            const value = appointment[field];
            return value ? String(value).toLowerCase() : '';
        };
        
        switch (searchField) {
            case 'name':
                return getValue('name').includes(term);
            case 'email':
                return getValue('email').includes(term);
            case 'organization':
                return getValue('organization').includes(term);
            case 'sessionType':
                return (getValue('session-type') || getValue('sessionType')).includes(term);
            case 'status':
                return getValue('status').includes(term);
            case 'all':
            default:
                // Search in all relevant fields with proper fallbacks
                return getValue('name').includes(term) ||
                       getValue('email').includes(term) ||
                       getValue('organization').includes(term) ||
                       getValue('phone').includes(term) ||
                       (getValue('session-type') || getValue('sessionType')).includes(term) ||
                       getValue('status').includes(term) ||
                       (getValue('clientStatus') || getValue('Client Status') || getValue('client-status')).includes(term) ||
                       (getValue('selected-date') || getValue('selectedDate')).includes(term) ||
                       (getValue('selected-time') || getValue('selectedTime')).includes(term) ||
                       (getValue('selected-slot') || getValue('selectedSlot')).includes(term);
        }
    });
}

// Function to highlight search terms in text
function highlightSearchTerm(text, searchTerm) {
    if (!text || !searchTerm) {
        return text;
    }
    
    const textStr = String(text);
    const termStr = String(searchTerm);
    
    // Create a case-insensitive regex to find the search term
    const regex = new RegExp(`(${termStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    // Replace matches with highlighted version
    return textStr.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function updateSearchUI() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.querySelector('.search-clear-btn');
    
    if (searchInput && clearBtn) {
        if (searchInput.value.trim()) {
            clearBtn.style.display = 'block';
            searchInput.placeholder = 'Searching...';
        } else {
            clearBtn.style.display = 'none';
            searchInput.placeholder = 'Search appointments...';
        }
    }
}

function filterAndSearchAppointments() {
    const filterStatus = document.getElementById('statusFilter')?.value || '';
    
    // Start with all appointments
    let filtered = [...currentAppointments];
    
    // Apply status filter first
    if (filterStatus) {
        filtered = filtered.filter(appointment => {
            const status = appointment.status || 'Pending';
            
            // Handle special group filters
            if (filterStatus === 'approved-group') {
                return status === 'Approved' || status === 'Payment Sent' || 
                       status === 'Session Scheduled' || status === 'Session Reminder Sent' ||
                       status === 'Consent Email Sent' || status === 'Session Completed';
            } else if (filterStatus === 'rejected-group') {
                return status === 'Rejected' || status === 'Cancelled';
            } else {
                return status === filterStatus;
            }
        });
    }
    
    // Debug: Log filtering results
    console.log('Debug: Filter applied:', filterStatus);
    console.log('Debug: Filtered results count:', filtered.length);
    console.log('Debug: Filtered appointments:', filtered.map(app => ({status: app.status, id: app.sessionId})));
    
    // Apply search filter
    if (currentSearchTerm && currentSearchTerm.trim()) {
        filtered = searchAppointments(filtered, currentSearchTerm.trim(), currentSearchField);
    }
    
    // Update filtered appointments
    filteredAppointments = filtered;
    
    // Reset to first page when filtering/searching
    currentPage = 1;
    displayCurrentPage();
    setupPagination();
    
    // Update search results indicator
    updateSearchResultsIndicator();
}

function updateSearchResultsIndicator() {
    const indicator = document.getElementById('searchResultsIndicator');
    if (!indicator) return;
    
    const totalOriginal = currentAppointments.length;
    const totalFiltered = filteredAppointments.length;
    const filterStatus = document.getElementById('statusFilter').value;
    
    // Show indicator if there's a search term or filter applied
    if (currentSearchTerm || filterStatus) {
        let message = `Showing ${totalFiltered} of ${totalOriginal} appointments`;
        
        if (currentSearchTerm) {
            message += ` <span class="badge bg-secondary ms-2">Search: "${currentSearchTerm}"</span>`;
        }
        
        if (filterStatus) {
            message += ` <span class="badge bg-primary ms-2">Filter: ${filterStatus}</span>`;
        }
        
        indicator.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            ${message}
            <button type="button" class="btn btn-sm btn-outline-info ms-2" onclick="clearAllFilters()">
                <i class="fas fa-times me-1"></i>Clear All
            </button>
        `;
        
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

function clearAllFilters() {
    // Clear search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    currentSearchTerm = '';
    currentSearchField = 'all';
    
    // Clear status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.value = '';
    }
    
    // Update UI
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // Reset to show all appointments
    filteredAppointments = [...currentAppointments];
    currentPage = 1;
    
    // Refresh display
    displayCurrentPage();
    setupPagination();
    updateSearchResultsIndicator();
    
    showAlert('All filters cleared', 'success');
}

// Make functions available globally for HTML onclick handlers
window.clearAllFilters = clearAllFilters;
window.logout = logout;
window.loadAppointments = loadAppointments;
window.exportToCSV = exportToCSV;
window.showExportFilterModal = showExportFilterModal;
window.clearExportFilters = clearExportFilters;
window.updateExportPreview = updateExportPreview;
window.generateFilteredPDF = generateFilteredPDF;
window.showDateManagementModal = showDateManagementModal;
window.downloadLoginHistory = downloadLoginHistory;
window.confirmApprove = confirmApprove;
window.confirmReject = confirmReject;
window.confirmReschedule = confirmReschedule;
window.confirmCancel = confirmCancel;
window.confirmPayment = confirmPayment;
window.confirmPaymentAcknowledgement = confirmPaymentAcknowledgement;
window.showRefundModal = showRefundModal;
window.confirmRefund = confirmRefund;
window.confirmSendConsent = confirmSendConsent;
window.confirmSendSessionReminder = confirmSendSessionReminder;
window.confirmMarkSessionDone = confirmMarkSessionDone;
window.showSendFeedbackReminderModal = showSendFeedbackReminderModal;
window.confirmSendFeedbackReminder = confirmSendFeedbackReminder;
window.confirmRequestRebooking = confirmRequestRebooking;
window.confirmQueryResolved = confirmQueryResolved;
window.blockDates = blockDates;
window.loadBlockedDates = loadBlockedDates;
window.makeMultipleDatesAvailable = makeMultipleDatesAvailable;
window.makeSingleDateAvailable = makeSingleDateAvailable;
window.loadAvailableDates = loadAvailableDates;
window.unblockEntireRange = unblockEntireRange;
window.manualUnblockDate = manualUnblockDate;

// Functions used in dynamically generated HTML
window.showClientQuery = showClientQuery;
window.showClientFeedback = showClientFeedback;
window.showQueryHistory = showQueryHistory;
window.showRescheduleHistory = showRescheduleHistory;
window.showQueryResolvedModal = showQueryResolvedModal;
window.showRescheduleModal = showRescheduleModal;
window.viewDetails = viewDetails;
window.showPaymentModal = showPaymentModal;
window.showCancelModal = showCancelModal;
window.showSendConsentModal = showSendConsentModal;
window.showPaymentAcknowledgementModal = showPaymentAcknowledgementModal;
window.showRefundModal = showRefundModal;
window.confirmRefund = confirmRefund;
window.showRefundModal = showRefundModal;
window.confirmRefund = confirmRefund;
window.showApproveModal = showApproveModal;
window.showRejectModal = showRejectModal;
window.showSendSessionReminderModal = showSendSessionReminderModal;
window.showMarkSessionDoneModal = showMarkSessionDoneModal;
window.showRequestRebookingModal = showRequestRebookingModal;

// Debug functions (for development)
window.testConnection = testConnection;
window.debugAppointmentFields = debugAppointmentFields;
window.debugDateTimeFields = debugDateTimeFields;

/**
 * Test function to verify refund document upload functionality
 */
async function testRefundDocumentUpload() {
    showLoading(true);
    
    try {
        console.log('Testing refund document upload functionality...');
        
        const formData = new URLSearchParams();
        formData.append('action', 'testRefundUpload');
        formData.append('timestamp', Date.now().toString());
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        console.log('Test response:', textResponse);
        
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        
        if (result.status === 'success') {
            showAlert('✅ Refund document upload test completed successfully! Check the console logs for details.', 'success');
            console.log('Test result:', result);
        } else {
            throw new Error(result.message || 'Test failed with unknown error');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        showAlert('❌ Refund document upload test failed: ' + error.message, 'danger');
    } finally {
        showLoading(false);
    }
}

window.testRefundDocumentUpload = testRefundDocumentUpload;
window.debugSessionIdColumn = debugSessionIdColumn;

// Update the existing filterAppointments function to use the new combined function
function filterAppointments() {
    filterAndSearchAppointments();
}

// Date Management Functions
function showDateManagementModal() {
    const modal = new bootstrap.Modal(document.getElementById('dateManagementModal'));
    modal.show();
    loadBlockedDates();
    loadAvailableDates();
    
    // Set minimum date to today for all date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('blockStartDate').min = today;
    document.getElementById('blockEndDate').min = today;
    
    // Set minimum dates for available date inputs if they exist
    const availableStartDate = document.getElementById('availableStartDate');
    const availableEndDate = document.getElementById('availableEndDate');
    const singleAvailableDate = document.getElementById('singleAvailableDate');
    
    if (availableStartDate) availableStartDate.min = today;
    if (availableEndDate) availableEndDate.min = today;
    if (singleAvailableDate) singleAvailableDate.min = today;
    
    // Test connection to make sure the script is working
    testDateManagementConnection();
}

// Test function to verify the Google Apps Script is responding
async function testDateManagementConnection() {
    try {
        console.log('Testing connection to Google Apps Script...');
        console.log('Using URL:', CONFIG.GOOGLE_SCRIPT_URL);
        
        const formData = new URLSearchParams();
        formData.append('action', 'getBlockedDates');
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        console.log('Test response status:', response.status);
        console.log('Test response ok:', response.ok);
        
        if (response.ok) {
            const text = await response.text();
            console.log('Test response text:', text);
            console.log('Date management connection test: SUCCESS');
        } else {
            console.error('Date management connection test: FAILED - Status:', response.status);
        }
    } catch (error) {
        console.error('Date management connection test: ERROR -', error);
    }
}

async function blockDates() {
    const startDate = document.getElementById('blockStartDate').value;
    const endDate = document.getElementById('blockEndDate').value;
    const reason = document.getElementById('blockReason').value.trim();
    
    if (!startDate) {
        showAlert('Please select a start date', 'error');
        return;
    }
    
    if (endDate && new Date(endDate) < new Date(startDate)) {
        showAlert('End date cannot be before start date', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('Attempting to block dates:', { startDate, endDate, reason });
        console.log('Using URL:', CONFIG.GOOGLE_SCRIPT_URL);
        
        // Use form-encoded data to match existing admin action pattern
        const formData = new URLSearchParams();
        formData.append('action', 'blockDates');
        formData.append('startDate', startDate);
        formData.append('endDate', endDate || startDate);
        formData.append('reason', reason || 'Date blocked by admin');
        
        console.log('Sending form data:', formData.toString());
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        console.log('Block dates response status:', response.status);
        console.log('Block dates response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        console.log('Block dates raw response:', textResponse);
        
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Response text that failed to parse:', textResponse);
            
            // If we can't parse as JSON, check if it contains success indicators
            if (textResponse.includes('success') || textResponse.includes('blocked')) {
                result = { success: true, message: 'Dates blocked successfully' };
            } else {
                throw new Error('Invalid response format from server');
            }
        }
        
        console.log('Parsed result:', result);
        
        if (result.success) {
            showAlert('Dates blocked successfully!', 'success');
            
            // Clear form
            document.getElementById('blockStartDate').value = '';
            document.getElementById('blockEndDate').value = '';
            document.getElementById('blockReason').value = '';
            
            // Refresh blocked dates list
            loadBlockedDates();
            
            // Refresh booking calendar if it exists
            refreshBookingCalendarIfExists();
        } else {
            showAlert('Error blocking dates: ' + (result.error || result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error blocking dates:', error);
        
        let errorMessage = 'Network error while blocking dates. ';
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Please check:\n• Your internet connection\n• The Google Apps Script URL is correct\n• The script is properly deployed';
        } else {
            errorMessage += error.message;
        }
        
        showAlert(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

async function loadBlockedDates() {
    try {
        console.log('Loading blocked dates from:', CONFIG.GOOGLE_SCRIPT_URL + '?action=getBlockedDates');
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL + '?action=getBlockedDates', {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        console.log('Blocked dates raw response:', textResponse);
        
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            console.warn('Could not parse blocked dates response as JSON:', parseError);
            // If we can't parse the response, assume no blocked dates
            result = { success: true, data: [] };
        }
        
        if (result.success && result.data) {
            displayBlockedDates(result.data);
        } else {
            console.error('Error loading blocked dates:', result.error);
            displayBlockedDates([]);
        }
    } catch (error) {
        console.warn('Error loading blocked dates, showing fallback:', error);
        
        // Show error message but still display empty state
        displayBlockedDates([]);
        
        // Show a non-blocking warning to admin
        if (error.message.includes('Failed to fetch')) {
            showAlert('Unable to load blocked dates. Please check your internet connection and Google Apps Script configuration.', 'warning');
        }
    }
}

function displayBlockedDates(blockedDates) {
    const container = document.getElementById('blockedDatesList');
    
    if (!blockedDates || blockedDates.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-calendar-check fa-2x mb-2 d-block"></i>
                <div>No blocked dates</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = blockedDates.map(dateInfo => {
        const startDate = new Date(dateInfo.startDate).toLocaleDateString();
        const endDate = dateInfo.endDate && dateInfo.endDate !== dateInfo.startDate 
            ? new Date(dateInfo.endDate).toLocaleDateString() 
            : null;
        
        const dateRange = endDate ? `${startDate} - ${endDate}` : startDate;
        
        return `
            <div class="blocked-date-item border-bottom py-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="fw-bold text-danger">
                            <i class="fas fa-ban me-1"></i>${dateRange}
                        </div>
                        <small class="text-muted">${dateInfo.reason || 'No reason provided'}</small>
                    </div>
                    <div>
                        <button class="btn btn-outline-success btn-sm" onclick="unblockEntireRange('${dateInfo.id || dateInfo.startDate}')" title="Unblock entire range">
                            <i class="fas fa-unlock me-1"></i>Unblock
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function unblockEntireRange(dateId) {
    if (!confirm('Are you sure you want to unblock this date/range? This will make the date(s) available for booking again.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'unblockDate');
        formData.append('dateId', dateId);
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        console.log('Unblock response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        console.log('Unblock raw response:', textResponse);
        
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        
        if (result.success) {
            showAlert('Date(s) unblocked successfully!', 'success');
            loadBlockedDates();
            
            // Refresh booking calendar if it exists
            refreshBookingCalendarIfExists();
        } else {
            showAlert('Error unblocking date(s): ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error unblocking date:', error);
        showAlert('Network error while unblocking date. Please check your connection and try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Simple manual unblock function
async function manualUnblockDate() {
    const dateToUnblock = document.getElementById('unblockDate').value;
    
    if (!dateToUnblock) {
        showAlert('Please select a date to unblock.', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to unblock ${new Date(dateToUnblock).toLocaleDateString()}? This will make the date available for booking even if it's part of a blocked range.`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'manualUnblockDate');
        formData.append('date', dateToUnblock);
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            throw new Error('Invalid JSON response from server');
        }
        
        if (result.success) {
            showAlert('Date unblocked successfully!', 'success');
            document.getElementById('unblockDate').value = '';
            loadBlockedDates(); // Refresh the list
            
            // Refresh booking calendar if it exists
            refreshBookingCalendarIfExists();
        } else {
            showAlert('Error unblocking date: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error performing manual unblock:', error);
        showAlert('Network error while unblocking date. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Available Date Management Functions
async function makeMultipleDatesAvailable() {
    const startDate = document.getElementById('availableStartDate').value;
    const endDate = document.getElementById('availableEndDate').value;
    const reason = document.getElementById('availableReason').value.trim();
    
    if (!startDate) {
        showAlert('Please select a start date', 'error');
        return;
    }
    
    if (endDate && new Date(endDate) < new Date(startDate)) {
        showAlert('End date cannot be before start date', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('Attempting to make dates available:', { startDate, endDate, reason });
        
        // Generate array of dates between startDate and endDate
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate || startDate);
        
        // Create a new date object for each iteration to avoid mutation issues
        const currentDate = new Date(start);
        while (currentDate <= end) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log('Generated dates array:', dates);
        
        // Check for existing available dates to avoid duplicates
        await loadAvailableDates(); // Load current available dates
        
        // Filter out dates that are already available
        const existingDates = new Set();
        const availableDatesList = document.getElementById('availableDatesList');
        if (availableDatesList) {
            const existingDateElements = availableDatesList.querySelectorAll('[data-date]');
            existingDateElements.forEach(element => {
                const dateStr = element.getAttribute('data-date');
                if (dateStr) {
                    existingDates.add(dateStr);
                }
            });
        }
        
        const newDates = dates.filter(date => !existingDates.has(date));
        const duplicateDates = dates.filter(date => existingDates.has(date));
        
        if (duplicateDates.length > 0) {
            const duplicateMessage = `These dates are already available and will be skipped: ${duplicateDates.join(', ')}`;
            console.log(duplicateMessage);
            showAlert(duplicateMessage, 'info');
        }
        
        if (newDates.length === 0) {
            showAlert('All selected dates are already available. No new dates to add.', 'warning');
            showLoading(false);
            return;
        }
        
        console.log('New dates to add:', newDates);
        console.log('Duplicate dates skipped:', duplicateDates);
        
        const formData = new URLSearchParams();
        formData.append('action', 'makeMultipleDatesAvailable');
        formData.append('dates', JSON.stringify(newDates)); // Only send new dates
        formData.append('reason', reason || 'Manually made available by admin');
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        console.log('Make available dates raw response:', textResponse);
        
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            
            if (textResponse.includes('success') || textResponse.includes('available')) {
                result = { success: true, message: 'Dates made available successfully' };
            } else {
                throw new Error('Invalid response format');
            }
        }
        
        if (result.success) {
            let successMessage = `${newDates.length} date(s) made available successfully!`;
            if (duplicateDates.length > 0) {
                successMessage += ` (${duplicateDates.length} duplicate(s) skipped)`;
            }
            showAlert(successMessage, 'success');
            
            // Clear form
            document.getElementById('availableStartDate').value = '';
            document.getElementById('availableEndDate').value = '';
            document.getElementById('availableReason').value = '';
            
            // Refresh available dates list
            loadAvailableDates();
            
            // Refresh booking calendar if it exists
            refreshBookingCalendarIfExists();
        } else {
            showAlert('Error making dates available: ' + (result.error || result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error making dates available:', error);
        
        let errorMessage = 'Network error while making dates available. ';
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Please check your internet connection and try again.';
        } else {
            errorMessage += error.message;
        }
        
        showAlert(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

async function makeSingleDateAvailable() {
    const dateToMake = document.getElementById('singleAvailableDate').value;
    const reason = document.getElementById('singleAvailableReason').value.trim();
    
    if (!dateToMake) {
        showAlert('Please select a date to make available.', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'makeDateAvailable');
        formData.append('date', dateToMake);
        formData.append('reason', reason || 'Manually made available by admin');
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            throw new Error('Invalid JSON response from server');
        }
        
        if (result.success) {
            showAlert('Date made available successfully!', 'success');
            document.getElementById('singleAvailableDate').value = '';
            document.getElementById('singleAvailableReason').value = '';
            loadAvailableDates();
            
            // Refresh booking calendar if it exists
            refreshBookingCalendarIfExists();
        } else {
            showAlert('Error making date available: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error making single date available:', error);
        showAlert('Network error while making date available. Please check your connection and try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadAvailableDates() {
    try {
        console.log('Loading available dates from:', CONFIG.GOOGLE_SCRIPT_URL + '?action=getAvailableDates');
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL + '?action=getAvailableDates', {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        console.log('Available dates raw response:', textResponse);
        
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            console.warn('Could not parse available dates response as JSON:', parseError);
            // If we can't parse the response, assume no available dates
            result = { success: true, data: [] };
        }
        
        if (result.success && result.data) {
            displayAvailableDates(result.data);
        } else {
            console.log('No available dates found or error:', result.error);
            displayAvailableDates([]);
        }
    } catch (error) {
        console.warn('Error loading available dates, showing fallback:', error);
        
        // Show error message but still display empty state
        displayAvailableDates([]);
        
        // Show a non-blocking warning to admin
        if (error.message.includes('Failed to fetch')) {
            showAlert('Unable to load available dates. This feature may require updating your Google Apps Script deployment with the latest available dates functionality.', 'info');
        }
    }
}

function displayAvailableDates(availableDates) {
    const container = document.getElementById('availableDatesList');
    
    if (!availableDates || availableDates.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-calendar-plus fa-2x mb-2 d-block"></i>
                <div>No manually available dates</div>
                <small>All weekdays (Mon-Fri) are available by default for most sessions.<br>
                Weekends (Sat-Sun) are available by default for Super-Specialized sessions.</small>
                <div class="mt-2">
                    <small class="text-info">
                        <i class="fas fa-info-circle"></i>
                        If you can't add available dates, please ensure your Google Apps Script has been updated with the latest version.
                    </small>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = availableDates.map(dateInfo => {
        const date = new Date(dateInfo.date).toLocaleDateString();
        const dayOfWeek = new Date(dateInfo.date).toLocaleDateString('en-US', { weekday: 'long' });
        
        return `
            <div class="available-date-item border-bottom py-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="fw-bold text-success">
                            <i class="fas fa-calendar-check me-1"></i>${date} (${dayOfWeek})
                        </div>
                        <small class="text-muted">${dateInfo.reason || 'No reason provided'}</small>
                    </div>
                    <div>
                        <button class="btn btn-outline-danger btn-sm" onclick="removeAvailableDate('${dateInfo.id || dateInfo.date}')" title="Remove from available dates">
                            <i class="fas fa-times me-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function removeAvailableDate(dateId) {
    if (!confirm('Are you sure you want to remove this date from manually available dates? This will revert it to the default availability rules.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'removeAvailableDate');
        formData.append('dateId', dateId);
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            throw new Error('Invalid JSON response from server');
        }
        
        if (result.success) {
            showAlert('Available date removed successfully!', 'success');
            loadAvailableDates();
            
            // Refresh booking calendar if it exists
            refreshBookingCalendarIfExists();
        } else {
            showAlert('Error removing available date: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error removing available date:', error);
        showAlert('Network error while removing available date. Please check your connection and try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Pagination Functions
function setupPagination() {
    const totalPages = Math.ceil(filteredAppointments.length / recordsPerPage);
    const paginationContainer = document.getElementById('paginationControls');
    
    // Always update pagination info, even when there's only one page or no data
    updatePaginationInfo();
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(1); return false;">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    updatePaginationInfo();
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredAppointments.length / recordsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayCurrentPage();
    setupPagination();
}

// Make goToPage globally accessible
window.goToPage = goToPage;

function updatePaginationInfo() {
    // Ensure filteredAppointments is properly initialized
    if (!filteredAppointments) {
        filteredAppointments = [];
    }
    
    const total = filteredAppointments.length;
    const start = total > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0;
    const end = Math.min(currentPage * recordsPerPage, total);
    
    document.getElementById('showingStart').textContent = start;
    document.getElementById('showingEnd').textContent = end;
    document.getElementById('totalRecords').textContent = total;
}

function displayCurrentPage() {
    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const pageAppointments = filteredAppointments.slice(start, end);
    
    displayAppointments(pageAppointments, start);
    updateSearchResultsIndicator();
    updatePaginationInfo();
}

// Debug function specifically for date/time issues
function debugDateTimeFields() {
    if (currentAppointments.length > 0) {
        console.log('=== DATE/TIME FIELDS DEBUG ===');
        currentAppointments.forEach((appointment, index) => {
            console.log(`\n--- Appointment ${index + 1} ---`);
            console.log('All fields:');
            Object.keys(appointment).forEach(key => {
                const value = appointment[key];
                if (key.toLowerCase().includes('date') || 
                    key.toLowerCase().includes('time') || 
                    key.toLowerCase().includes('slot') ||
                    key.toLowerCase().includes('selected')) {
                    console.log(`  ${key}: "${value}" (type: ${typeof value})`);
                }
            });
        });
        console.log('=== END DATE/TIME DEBUG ===');
        showAlert('Check console for detailed date/time field analysis.', 'info');
    } else {
        showAlert('No appointments available to debug. Load appointments first.', 'warning');
    }
}

// Utility functions
function clearModalForms() {
    document.getElementById('approveNotes').value = '';
    document.getElementById('rejectReason').value = '';
    document.getElementById('rescheduleReason').value = '';
    document.getElementById('cancelReason').value = '';
    document.getElementById('invoiceFile').value = '';
    document.getElementById('paymentNotes').value = '';
    document.getElementById('acknowledgementNotes').value = '';
    document.getElementById('consentNotes').value = '';
    document.getElementById('sessionReminderNotes').value = '';
    document.getElementById('sessionDoneNotes').value = '';
    document.getElementById('rebookingMessage').value = '';
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

function showAlert(message, type) {
    let alertContainer = document.getElementById('alertContainer');
    
    // Create alert container if it doesn't exist
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.className = 'alert-container';
        alertContainer.style.cssText = `
            position: fixed;
            top: 90px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            width: 95%;
            max-width: 650px;
            pointer-events: none;
        `;
        document.body.appendChild(alertContainer);
    }
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.cssText = `
        pointer-events: auto;
        margin: 0 auto 12px auto;
        border-radius: 12px;
        border: none;
        font-weight: 500;
        animation: gentleSlideIn 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        min-height: 60px;
        display: flex;
        align-items: center;
        padding: 1rem 1.5rem;
        width: 100%;
        box-sizing: border-box;
    `;
    
    // Set icon and styling based on alert type
    let icon = '';
    let additionalStyles = '';
    
    switch(type) {
        case 'success': 
            icon = 'fas fa-check-circle'; 
            additionalStyles = `
                background: linear-gradient(135deg, rgba(25, 135, 84, 0.95), rgba(25, 135, 84, 0.85));
                border-left: 4px solid #198754;
                color: white;
                box-shadow: 0 8px 25px rgba(25, 135, 84, 0.3);
            `;
            break;
        case 'danger': 
            icon = 'fas fa-exclamation-triangle'; 
            additionalStyles = `
                background: linear-gradient(135deg, rgba(220, 53, 69, 0.95), rgba(220, 53, 69, 0.85));
                border-left: 4px solid #dc3545;
                color: white;
                box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
            `;
            break;
        case 'warning': 
            icon = 'fas fa-exclamation-circle'; 
            additionalStyles = `
                background: linear-gradient(135deg, rgba(255, 193, 7, 0.95), rgba(255, 193, 7, 0.85));
                border-left: 4px solid #ffc107;
                color: #000;
                box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
            `;
            break;
        case 'info': 
            icon = 'fas fa-info-circle'; 
            additionalStyles = `
                background: linear-gradient(135deg, rgba(13, 202, 240, 0.95), rgba(13, 202, 240, 0.85));
                border-left: 4px solid #0dcaf0;
                color: white;
                box-shadow: 0 8px 25px rgba(13, 202, 240, 0.3);
            `;
            break;
        default: 
            icon = 'fas fa-bell';
            additionalStyles = `
                background: linear-gradient(135deg, rgba(108, 117, 125, 0.95), rgba(108, 117, 125, 0.85));
                border-left: 4px solid #6c757d;
                color: white;
                box-shadow: 0 8px 25px rgba(108, 117, 125, 0.3);
            `;
    }
    
    // Apply additional styles
    alertDiv.style.cssText += additionalStyles;
    
    alertDiv.innerHTML = `
        <div style="display: flex; align-items: center; width: 100%;">
            <i class="${icon}" style="font-size: 1.2rem; margin-right: 12px; opacity: 0.9;"></i>
            <span style="flex: 1; line-height: 1.4;">${message}</span>
            <button type="button" class="btn-close btn-close-white" style="margin-left: 15px; opacity: 0.8;" aria-label="Close"></button>
        </div>
    `;
    
    // Add shimmer effect
    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        animation: shimmer 2s ease-in-out infinite;
    `;
    alertDiv.appendChild(shimmer);
    
    // Add to container with stagger effect
    alertContainer.appendChild(alertDiv);
    
    // Add hover effects
    alertDiv.addEventListener('mouseenter', () => {
        alertDiv.style.transform = 'translateY(-2px) scale(1.02)';
        alertDiv.style.boxShadow = alertDiv.style.boxShadow.replace('0.3)', '0.4)');
    });
    
    alertDiv.addEventListener('mouseleave', () => {
        alertDiv.style.transform = 'translateY(0) scale(1)';
        alertDiv.style.boxShadow = alertDiv.style.boxShadow.replace('0.4)', '0.3)');
    });
    
    // Auto-remove with enhanced animation
    const autoRemoveTimer = setTimeout(() => {
        removeAlert(alertDiv);
    }, 8000);
    
    // Add manual close functionality
    const closeBtn = alertDiv.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoRemoveTimer);
        removeAlert(alertDiv);
    });
    
    // Enhanced removal function
    function removeAlert(element) {
        if (element.parentNode) {
            element.style.animation = 'gentleSlideOut 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) forwards';
            element.style.pointerEvents = 'none';
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                }
            }, 500);
        }
    }
}

function viewDetails(index) {
    const appointment = currentAppointments[index];

    // Helper function to get field value with fallbacks
    const getFieldValue = (fieldNames, defaultValue = null) => {
        for (const fieldName of fieldNames) {
            if (appointment[fieldName] && appointment[fieldName] !== '') {
                return appointment[fieldName];
            }
        }
        return defaultValue;
    };

    // --- START OF THE FIX ---

    // 1. Get the raw session type from the appointment data
    const rawSessionType = getFieldValue(['session-type', 'sessionType'], '');

    // 2. Create a normalized, lowercase version for matching
    const normalizedSessionType = rawSessionType.toLowerCase();

    // 3. Determine the correct session key with a smarter check
    let sessionKey = 'generalized'; // Default to generalized
    if (normalizedSessionType.includes('super-specialized')) {
        sessionKey = 'super-specialized';
    } else if (normalizedSessionType.includes('specialized')) {
        sessionKey = 'specialized';
    } else if (normalizedSessionType.includes('long-term') || normalizedSessionType.includes('long_term')) {
        sessionKey = 'long-term-engagement';
    }

    // --- END OF THE FIX ---

    // Common questions for ALL session types
    const commonQuestions = [
        { field: 'topic', label: 'What do you want to talk about? * Please ask your question in 50-100 words.' },
        { field: 'selected-domains', label: 'Domain Selected' },
        { field: 'custom-domain-input', label: 'Custom Domain (if Others selected)' },
        { field: 'selected-regions', label: 'Region Selected' },
        { field: 'custom-region-domain-input', label: 'Custom Region (if Others selected)' },
        { field: 'location', label: 'Location/Region' }
    ];

    // Enhanced session type mapping with questions - EXACT MATCH with booking system
    const sessionTypeMapping = {
        'generalized': {
            title: 'Generalized Session',
            questions: [
                ...commonQuestions,
                { field: 'space-policy-area', label: 'What specific area of space policy interests you most?' },
                { field: 'guidance-type', label: 'Are you looking for general guidance or specific insights?' },
                { field: 'specific-insights-details', label: 'If Specific insights, Details' }
            ]
        },
        'specialized': {
            title: 'Specialized Session (Virtual)',
            questions: [
                ...commonQuestions,
                { field: 'policy-directive', label: 'Is there any policy directive you are concerned with?' },
                { field: 'policy-directive-details', label: 'If Yes, Policy Directive Details' },
                { field: 'geopolitical-situation', label: 'Is there any specific Geopolitical development/ situation you are concerned with?' },
                { field: 'geopolitical-details', label: 'If Yes, Geopolitical Development/Situation Details' },
                { field: 'use-case', label: 'Is there any particular "Use Case" related to your work profile/project you are concerned with?' },
                { field: 'use-case-details', label: 'If Yes, Use Case Details' },
                { field: 'additional-info', label: 'Is there any other specific information you would like to discuss before the consultancy session to make the session more personalized?' },
                { field: 'additional-info-details', label: 'If Yes, Additional Information Details' },
                { field: 'specific-entity', label: 'Is there any specific Entity you are already dealing with?' },
                { field: 'entity-details', label: 'If Yes, Entity Details' },
                { field: 'detail-level', label: 'What level of detail are you expecting from this consultation?' }
            ]
        },
        'super-specialized': {
            title: 'Super-Specialized Session (In-Person)',
            questions: [
                ...commonQuestions,
                { field: 'complex-challenges', label: 'What complex challenges or strategic decisions are you currently facing?' },
                { field: 'relevant-regional-dynamics', label: 'Which regional dynamics are most relevant to your current situation?' },
                { field: 'analysis-type', label: 'Are you looking for comprehensive analysis or strategic planning assistance?' },
                { field: 'customized-frameworks', label: 'Do you need customized frameworks or policy recommendations?' }
            ]
        },
        'long-term-engagement': {
            title: 'Long-term Projects',
            questions: [
                ...commonQuestions,
                { field: 'strategic-objectives', label: 'What are your primary strategic objectives for this engagement?' },
                { field: 'expected-outcomes', label: 'Which specific outcomes are you hoping to achieve over the 2-6 month period?' },
                { field: 'engagement-model', label: 'What is your preferred engagement model (weekly/bi-weekly consultations)?' },
                { field: 'deliverables-needed', label: 'Do you need deliverables like reports, frameworks, or policy recommendations?' }
            ]
        }
    };
    
    // Use the correctly identified sessionKey to get the configuration
    const sessionConfig = sessionTypeMapping[sessionKey];

    // The rest of the function remains the same as your original code...
    
    const formatFieldValue = (value, type = 'text') => {
        if (!value) return null;
        switch (type) {
            case 'email': return `<a href="mailto:${value}" class="important">${value}</a>`;
            case 'phone': return `<a href="tel:${value}" class="important">${value}</a>`;
            case 'date': return formatDate(value);
            case 'time': return formatTime(value);
            case 'status': return `<span class="detail-status-badge ${getStatusClass(value)}">${value}</span>`;
            case 'text-important': return `<span class="important">${value}</span>`;
            default: return value;
        }
    };

    const getRelevantFields = () => {
        const fields = {};
        fields.name = getFieldValue(['name']);
        fields.email = getFieldValue(['email']);
        fields.phone = getFieldValue(['phone']);
        fields.organization = getFieldValue(['organization']);
        fields.designation = getFieldValue(['designation']);
        fields.topic = getFieldValue(['topic']);
        fields.status = getFieldValue(['status'], 'Pending');
        fields.clientStatus = getFieldValue(['clientStatus', 'Client Status'], 'Pending');
        fields.timestamp = getFieldValue(['timestamp', 'Time Stamp *']);

        if (sessionConfig.questions) {
            sessionConfig.questions.forEach(question => {
                fields[question.field] = getFieldValue([question.field]);
            });
        }
        return fields;
    };

    const fields = getRelevantFields();
    let displayDate = getFieldValue(['selected-date', 'selectedDate']);
    let displayTime = getFieldValue(['selected-time', 'selectedTime']);
    
    const createFieldHTML = (label, value, type = 'text', cssClass = '') => {
        if (!value) return '';
        return `<div class="detail-field ${cssClass}"><label class="detail-label">${label}</label><p class="detail-value">${formatFieldValue(value, type)}</p></div>`;
    };

    const createSessionQuestionsHTML = () => {
        if (!sessionConfig.questions) return '';
        let questionsHTML = '';
        sessionConfig.questions.forEach(question => {
            const value = fields[question.field];
            if (value && value.trim() !== '') {
                questionsHTML += createFieldHTML(question.label, value, 'text', 'session-specific');
            }
        });
        if (!questionsHTML) return '';
        return `<div class="detail-section session-questions"><h6 class="detail-section-title"><i class="fas fa-question-circle"></i> Session-Specific Information</h6>${questionsHTML}</div>`;
    };

    const detailsHtml = `
        <div class="modal fade appointment-details-modal" id="detailsModal" tabindex="-1" aria-labelledby="detailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="detailsModalLabel"><i class="fas fa-calendar-check"></i> ${sessionConfig.title}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-section">
                            <div class="detail-section-header"><i class="fas fa-user-circle"></i><h6>Client Information</h6></div>
                            <div class="detail-grid-3">
                                ${createFieldHTML('Full Name', fields.name, 'text-important')}
                                ${createFieldHTML('Email Address', fields.email, 'email')}
                                ${createFieldHTML('Phone Number', fields.phone, 'phone')}
                                ${createFieldHTML('Organization', fields.organization)}
                                ${createFieldHTML('Designation', fields.designation)}
                            </div>
                        </div>
                        ${createSessionQuestionsHTML()}
                        <div class="detail-section">
                            <div class="detail-section-header"><i class="fas fa-calendar-alt"></i><h6>Appointment & Status</h6></div>
                            <div class="detail-row">
                                ${createFieldHTML('Date', displayDate, 'date')}
                                ${createFieldHTML('Time', displayTime, 'time')}
                                ${createFieldHTML('Session Type', rawSessionType, 'text-important')}
                                ${createFieldHTML('Status', fields.status, 'status')}
                            </div>
                            ${fields.clientStatus !== 'Pending' ? createFieldHTML('Client Status', fields.clientStatus, 'text-important') : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('detailsModal');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', detailsHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
    
    document.getElementById('detailsModal').addEventListener('hidden.bs.modal', function () { this.remove(); });
}

// Simple manual unblock for a single date
// Debug function to help identify field names
function debugAppointmentFields() {
    if (currentAppointments.length > 0) {
        const appointment = currentAppointments[0];
        console.log('=== APPOINTMENT FIELD DEBUG ===');
        console.log('All available fields in first appointment:');
        Object.keys(appointment).forEach(key => {
            console.log(`${key}: ${appointment[key]}`);
        });
        console.log('=== END DEBUG ===');
        
        showAlert(`Check console for detailed field mapping. First appointment has ${Object.keys(appointment).length} fields.`, 'info');
    } else {
        showAlert('No appointments available to debug. Load appointments first.', 'warning');
    }
}

// Rescheduling Calendar Functionality
let rescheduleCurrentDate = new Date();
let rescheduleSelectedDate = null;
let rescheduleAvailableSlots = {};
let rescheduleBlockedDates = [];
let rescheduleAvailableDates = [];

function resetRescheduleModal() {
    // Reset form
    document.getElementById('rescheduleReason').value = '';
    
    // Reset reschedule state
    rescheduleSelectedDate = null;
    rescheduleCurrentDate = new Date();
}

function setupRescheduleOptionHandlers() {
    // Only reschedule request option is available now
    // Calendar rescheduling option has been removed
    console.log('Reschedule modal initialized - only request option available');
}

async function loadRescheduleCalendarData() {
    try {
        showLoading(true);
        
        // Fetch blocked dates and available dates
        const [blockedResponse, availableResponse] = await Promise.all([
            fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getBlockedDates`),
            fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getAvailableDates`)
        ]);
        
        if (blockedResponse.ok) {
            const blockedData = await blockedResponse.json();
            rescheduleBlockedDates = blockedData.data || [];
        }
        
        if (availableResponse.ok) {
            const availableData = await availableResponse.json();
            rescheduleAvailableDates = availableData.data || [];
        }
        
        // Generate time slots and update calendar
        generateRescheduleTimeSlots();
        updateRescheduleCalendarDisplay();
        
    } catch (error) {
        console.error('Error loading reschedule calendar data:', error);
        showAlert('Error loading calendar data', 'error');
    } finally {
        showLoading(false);
    }
}

function initializeRescheduleCalendar() {
    const calendarGrid = document.getElementById('reschedule-calendar-grid');
    
    // Clear existing content
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day header';
        dayElement.textContent = day;
        dayElement.style.fontWeight = 'bold';
        dayElement.style.background = '#f8f9fa';
        dayElement.style.cursor = 'default';
        calendarGrid.appendChild(dayElement);
    });

    // Add navigation event listeners (remove existing first)
    const prevBtn = document.getElementById('reschedule-prev-month');
    const nextBtn = document.getElementById('reschedule-next-month');
    
    // Clone and replace to remove existing listeners
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    document.getElementById('reschedule-prev-month').addEventListener('click', () => {
        rescheduleCurrentDate.setMonth(rescheduleCurrentDate.getMonth() - 1);
        updateRescheduleCalendarDisplay();
    });

    document.getElementById('reschedule-next-month').addEventListener('click', () => {
        rescheduleCurrentDate.setMonth(rescheduleCurrentDate.getMonth() + 1);
        updateRescheduleCalendarDisplay();
    });

    updateRescheduleCalendarDisplay();
}

function updateRescheduleCalendarDisplay() {
    const titleElement = document.getElementById('reschedule-calendar-title');
    const calendarGrid = document.getElementById('reschedule-calendar-grid');
    
    // Update month/year title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    titleElement.textContent = `${monthNames[rescheduleCurrentDate.getMonth()]} ${rescheduleCurrentDate.getFullYear()}`;
    
    // Clear previous calendar (keep headers)
    const dayElements = calendarGrid.querySelectorAll('.calendar-day:not(.header)');
    dayElements.forEach(element => element.remove());
    
    // Get first day of month and number of days
    const firstDay = new Date(rescheduleCurrentDate.getFullYear(), rescheduleCurrentDate.getMonth(), 1);
    const lastDay = new Date(rescheduleCurrentDate.getFullYear(), rescheduleCurrentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const today = new Date();
    const sessionType = document.getElementById('reschedule-session-type').value;
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(rescheduleCurrentDate.getFullYear(), rescheduleCurrentDate.getMonth(), day);
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check if date is in the past
        if (currentDate < today.setHours(0, 0, 0, 0)) {
            dayElement.classList.add('past');
        }
        // Check availability based on session type and rules
        else if (isRescheduleDateAvailable(currentDate, sessionType)) {
            dayElement.classList.add('available');
            dayElement.addEventListener('click', () => selectRescheduleDate(currentDate, dayElement));
        }
        // Date is blocked or not available
        else {
            dayElement.classList.add('blocked');
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

function isRescheduleDateAvailable(date, sessionType) {
    // STEP 1: If a date is manually made available, it overrides all other rules.
    if (isRescheduleDateManuallyAvailable(date)) {
        return true;
    }

    // STEP 2: If a date is blocked (and not manually overridden), it is unavailable.
    if (isRescheduleDateBlocked(date)) {
        return false;
    }

    // STEP 3: Apply default business rules based on the day of the week.
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    if (sessionType === 'super-specialized') {
        // For "Super-Specialized" sessions, only weekends (Saturday and Sunday) are available.
        return dayOfWeek === 0 || dayOfWeek === 6;
    } else {
        // For all other session types, only weekdays are available.
        return dayOfWeek !== 0 && dayOfWeek !== 6;
    }
}

// Helper functions for reschedule calendar
function isRescheduleDateManuallyAvailable(date) {
    const dateString = date.toISOString().split('T')[0];
    
    return rescheduleAvailableDates.some(availableDate => {
        if (availableDate.startDate && availableDate.endDate) {
            return dateString >= availableDate.startDate && dateString <= availableDate.endDate;
        } else if (availableDate.date) {
            return dateString === availableDate.date;
        }
        return false;
    });
}

function isRescheduleDateBlocked(date) {
    const dateString = date.toISOString().split('T')[0];
    
    return rescheduleBlockedDates.some(blockedDate => {
        if (blockedDate.startDate && blockedDate.endDate) {
            return dateString >= blockedDate.startDate && dateString <= blockedDate.endDate;
        } else if (blockedDate.date) {
            return dateString === blockedDate.date;
        }
        return false;
    });
}

function selectRescheduleDate(date, element) {
    // Remove previous selection
    document.querySelectorAll('#reschedule-calendar-grid .calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked element
    element.classList.add('selected');
    rescheduleSelectedDate = date;
    
    // Update display and show time slots
    const dateString = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('reschedule-selected-date-display').textContent = `Selected: ${dateString}`;
    document.getElementById('newSelectedDate').textContent = dateString;
    
    // Store the date
    document.getElementById('reschedule-selected-date').value = date.toISOString().split('T')[0];
    
    // Generate and display time slots
    displayRescheduleTimeSlots(date);
}

function displayRescheduleTimeSlots(date) {
    const timeSlotsContainer = document.getElementById('reschedule-time-slots-container');
    const sessionType = document.getElementById('reschedule-session-type').value;
    const clientLocation = document.getElementById('reschedule-client-location').value;
    
    // Clear existing time slots
    timeSlotsContainer.innerHTML = '';
    
    if (sessionType === 'super-specialized' || sessionType === 'long-term-engagement') {
        // In-person sessions or long-term engagement don't need time slots
        timeSlotsContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <strong>In-Person Session:</strong> Time will be coordinated separately with the client.
            </div>
        `;
        
        // Auto-set a default time for in-person sessions
        document.getElementById('reschedule-selected-time').value = 'TBD';
        document.getElementById('reschedule-selected-slot').value = `${date.toISOString().split('T')[0]}_TBD`;
        document.getElementById('newSelectedTime').textContent = 'To be coordinated';
        return;
    }
    
    // Generate time slots for virtual sessions
    const timeSlots = generateRescheduleTimeSlotsForDate(date, clientLocation);
    
    if (timeSlots.length === 0) {
        timeSlotsContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                No available time slots for this date.
            </div>
        `;
        return;
    }
    
    timeSlots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.innerHTML = `
            <div class="time-text">${slot.displayTime}</div>
            <div class="timezone-text">${slot.timezone}</div>
        `;
        
        slotElement.addEventListener('click', () => {
            // Remove previous selection
            timeSlotsContainer.querySelectorAll('.time-slot.selected').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Select this slot
            slotElement.classList.add('selected');
            
            // Store the selection
            document.getElementById('reschedule-selected-time').value = slot.originalTime;
            document.getElementById('reschedule-selected-slot').value = slot.value;
            document.getElementById('newSelectedTime').textContent = slot.displayTime;
        });
        
        timeSlotsContainer.appendChild(slotElement);
    });
}

function generateRescheduleTimeSlotsForDate(date, clientLocation) {
    const timeSlots = [];
    const dateString = date.toISOString().split('T')[0];
    
    // Define base time slots in IST
    const baseSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    // Get timezone for client location
    const clientTimezone = getTimezoneForLocation(clientLocation) || 'Asia/Kolkata';
    
    baseSlots.forEach(timeIST => {
        try {
            // Convert IST time to client timezone
            const clientTime = convertISTToUserTimezone(date, timeIST, clientTimezone);
            const timezoneAbbr = getTimezoneAbbreviation(clientTimezone);
            
            timeSlots.push({
                originalTime: timeIST,
                displayTime: clientTime,
                timezone: timezoneAbbr,
                value: `${dateString}_${timeIST}`
            });
        } catch (error) {
            console.error('Error converting time for slot:', timeIST, error);
        }
    });
    
    return timeSlots;
}

function generateRescheduleTimeSlots() {
    // This function is called when calendar data is loaded
    // It's similar to the booking system's generateTimeSlots function
    rescheduleAvailableSlots = {};
    
    const sessionType = document.getElementById('reschedule-session-type').value;
    const clientLocation = document.getElementById('reschedule-client-location').value;
    
    if (!sessionType || !clientLocation) {
        console.warn('Missing session type or client location for rescheduling');
        return;
    }
    
    // Generate slots for the next 60 days
    const today = new Date();
    for (let i = 1; i <= 60; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        
        if (isRescheduleDateAvailable(checkDate, sessionType)) {
            const dateKey = checkDate.toISOString().split('T')[0];
            rescheduleAvailableSlots[dateKey] = generateRescheduleTimeSlotsForDate(checkDate, clientLocation);
        }
    }
}

// Helper functions for timezone conversion (reused from booking system)
function getTimezoneForLocation(location) {
    const timezoneMap = {
        'middle-east': 'Asia/Dubai',
        'europe': 'Europe/London', 
        'us': 'America/New_York',
        'india': 'Asia/Kolkata',
        'japan': 'Asia/Tokyo'
    };
    return timezoneMap[location] || 'Asia/Kolkata';
}

function convertISTToUserTimezone(date, timeIST, userTimezone) {
    try {
        // Create a date object in IST
        const [hours, minutes] = timeIST.split(':').map(Number);
        const istDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
        
        // Convert IST to UTC
        const utcTime = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
        
        // Format in user's timezone
        const userTime = utcTime.toLocaleTimeString('en-US', {
            timeZone: userTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        return userTime;
    } catch (error) {
        console.error('Timezone conversion error:', error);
        return timeIST; // Fallback to original time
    }
}

function getTimezoneAbbreviation(timezone) {
    const abbreviationMap = {
        'Asia/Kolkata': 'IST',
        'Asia/Dubai': 'GST', 
        'Europe/London': 'GMT/BST',
        'America/New_York': 'EST/EDT',
        'Asia/Tokyo': 'JST'
    };
    return abbreviationMap[timezone] || 'Local';
}

// Action confirmation functions for rescheduling
// Calendar rescheduling function - REMOVED
// This function has been disabled as calendar rescheduling option was removed
/*
async function confirmCalendarReschedule() {
    const selectedDate = document.getElementById('reschedule-selected-date').value;
    const selectedTime = document.getElementById('reschedule-selected-time').value;
    const selectedSlot = document.getElementById('reschedule-selected-slot').value;
    const notes = document.getElementById('rescheduleCalendarNotes').value;
    
    if (!selectedDate || !selectedTime || !selectedSlot) {
        showAlert('Please select a new date and time for the appointment.', 'warning');
        return;
    }
    
    const appointment = currentAppointments[selectedAppointmentId];
    const actionData = {
        newDate: selectedDate,
        newTime: selectedTime,
        newSlot: selectedSlot,
        notes: notes,
        isDirectReschedule: true
    };
    
    try {
        await performAction('rescheduleWithCalendar', appointment, actionData);
        
        // Close modal and refresh appointments
        bootstrap.Modal.getInstance(document.getElementById('rescheduleModal')).hide();
        showAlert('Appointment rescheduled successfully! Client will be notified of the new schedule.', 'success');
        loadAppointments();
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        showAlert('Error rescheduling appointment. Please try again.', 'error');
    }
}
*/

// Download login history as Excel
async function downloadLoginHistory() {
    try {
        showLoading(true);
        
        const formData = new URLSearchParams();
        formData.append('action', 'getLoginHistory');
        formData.append('timestamp', Date.now().toString());
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            // Create Excel-compatible content (tab-separated values)
            const headers = ['Timestamp', 'Admin User', 'IP Address', 'Browser Info', 'Login Status'];
            const excelContent = [
                headers.join('\t'),
                ...result.data.map(row => 
                    row.map(cell => String(cell || '')).join('\t')
                )
            ].join('\n');
            
            // Create and download file as .xls
            const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `admin_login_history_${new Date().toISOString().slice(0, 10)}.xls`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showAlert('Login history downloaded successfully!', 'success');
        } else {
            throw new Error(result.message || 'Failed to fetch login history');
        }
        
    } catch (error) {
        console.error('Error downloading login history:', error);
        showAlert('Error downloading login history. Please try again.', 'danger');
    } finally {
        showLoading(false);
    }
}

// Initialize table scrolling on window resize
window.addEventListener('resize', function() {
    // Debounce the resize handler
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        if (document.getElementById('appointmentsTable')) {
            initializeTableScrolling();
        }
    }, 250);
});

// Initialize table scrolling when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up initial table scrolling when appointments are first loaded
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && 
                mutation.target.id === 'appointmentsBody' && 
                mutation.addedNodes.length > 0) {
                // Table content has been added, initialize scrolling
                setTimeout(() => initializeTableScrolling(), 100);
            }
        });
    });
    
    const appointmentsBody = document.getElementById('appointmentsBody');
    if (appointmentsBody) {
        observer.observe(appointmentsBody, { childList: true });
    }
});

// ========================
// LOGIN HISTORY FUNCTIONS
// ========================

// Show actions guide modal
function showActionsGuideModal() {
    const modal = new bootstrap.Modal(document.getElementById('actionsGuideModal'));
    modal.show();
}

// Show login history modal
function showLoginHistoryModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginHistoryModal'));
    modal.show();
    
    // Add event listeners for modal buttons if not already added
    const refreshBtn = document.getElementById('refreshLoginHistoryBtn');
    const downloadBtn = document.getElementById('downloadLoginHistoryBtn');
    
    if (refreshBtn && !refreshBtn.hasAttribute('data-listener-attached')) {
        refreshBtn.addEventListener('click', refreshLoginHistory);
        refreshBtn.setAttribute('data-listener-attached', 'true');
    }
    
    if (downloadBtn && !downloadBtn.hasAttribute('data-listener-attached')) {
        downloadBtn.addEventListener('click', downloadLoginHistory);
        downloadBtn.setAttribute('data-listener-attached', 'true');
    }
    
    // Load login history when modal is shown
    loadLoginHistory();
}

// Export to window immediately to fix inline onclick error
window.showLoginHistoryModal = showLoginHistoryModal;

// Load login history from Google Sheets
async function loadLoginHistory() {
    const loadingEl = document.getElementById('loginHistoryLoading');
    const errorEl = document.getElementById('loginHistoryError');
    const tableBody = document.getElementById('loginHistoryBody');
    const countEl = document.getElementById('loginHistoryCount');
    
    // Show loading, hide error
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'getLoginHistory');
        formData.append('timestamp', Date.now().toString());
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            displayLoginHistory(result.data);
            countEl.textContent = `${result.data.length} records`;
        } else {
            throw new Error(result.message || 'Failed to load login history');
        }
        
    } catch (error) {
        console.error('Error loading login history:', error);
        errorEl.style.display = 'block';
        document.getElementById('loginHistoryErrorText').textContent = 
            'Unable to load login history: ' + error.message;
        
        // Try to load from localStorage as fallback
        loadLocalLoginHistory();
        
    } finally {
        loadingEl.style.display = 'none';
    }
}

// Load login history from localStorage (fallback)
function loadLocalLoginHistory() {
    const tableBody = document.getElementById('loginHistoryBody');
    const countEl = document.getElementById('loginHistoryCount');
    
    try {
        const localHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        
        if (localHistory.length > 0) {
            // Convert local format to display format
            const displayData = localHistory.map(record => [
                record.timestamp || record.loginDate + ' ' + record.loginTime,
                record.email || 'Unknown',
                record.ipAddress || 'Unknown',
                record.browserInfo || record.userAgent?.substring(0, 50) + '...' || 'Unknown',
                record.userType || 'Login'
            ]).reverse(); // Most recent first
            
            displayLoginHistory(displayData);
            countEl.textContent = `${displayData.length} records (local)`;
        }
    } catch (error) {
        console.error('Error loading local login history:', error);
    }
}

// Display login history in the table
function displayLoginHistory(data) {
    const tableBody = document.getElementById('loginHistoryBody');
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-history fa-2x mb-2"></i>
                    <p>No login history available</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Reverse to show newest first
    const reversedData = [...data].reverse();
    
    tableBody.innerHTML = reversedData.map((row, index) => {
        const timestamp = row[0] || 'Unknown';
        const adminUser = row[1] || 'Unknown';
        const ipAddress = row[2] || 'Unknown';
        const browserInfo = row[3] || 'Unknown';
        const status = row[4] || 'Success';
        
        // Format timestamp for display
        let displayTime = timestamp;
        try {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                displayTime = date.toLocaleString();
            }
        } catch (e) {
            // Use original if parsing fails
        }
        
        // Determine status badge color
        let statusBadge = 'bg-success';
        if (status.toLowerCase().includes('fail')) {
            statusBadge = 'bg-danger';
        } else if (status.toLowerCase().includes('dashboard')) {
            statusBadge = 'bg-info';
        }
        
        return `
            <tr>
                <td><small>${displayTime}</small></td>
                <td><span class="fw-medium">${adminUser}</span></td>
                <td><code class="text-primary">${ipAddress}</code></td>
                <td><small class="text-muted">${browserInfo.substring(0, 40)}${browserInfo.length > 40 ? '...' : ''}</small></td>
                <td><span class="badge ${statusBadge}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

// Refresh login history
function refreshLoginHistory() {
    loadLoginHistory();
    showAlert('Login history refreshed', 'info');
}

// ========================
// ADMIN CREDENTIALS MANAGEMENT FUNCTIONS
// ========================

// Show manage credentials modal
function showManageCredentialsModal() {
    // Double-check permissions before opening modal
    if (!canManageAdmins()) {
        showAlert('Access Denied: Only Super Admin and Admin roles can manage credentials', 'danger');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('manageCredentialsModal'));
    modal.show();
    
    // Load and display admin accounts
    loadAdminAccounts();
    
    // Setup form submission
    setupAddAdminForm();
}

// Load admin accounts from Google Sheets
async function loadAdminAccounts() {
    try {
        showLoading(true);
        
        const formData = new URLSearchParams();
        formData.append('action', 'getUsersAndRoles');
        formData.append('timestamp', Date.now().toString());
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            displayAdminAccounts(result.data);
        } else {
            throw new Error(result.message || 'Failed to fetch admin accounts');
        }
        
    } catch (error) {
        console.error('Error loading admin accounts:', error);
        showAlert('Failed to load admin accounts. Please try again.', 'danger');
    } finally {
        showLoading(false);
    }
}

// Display admin accounts in the modal
function displayAdminAccounts(adminCredentials) {
    const container = document.getElementById('adminAccountsList');
    
    if (adminCredentials.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No admin accounts found.</p>';
        return;
    }
    
    container.innerHTML = adminCredentials.map((admin) => `
        <div class="card mb-2">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">
                            <i class="fas fa-user me-2"></i>${admin.name}
                            <span class="badge bg-${admin.role === 'Super Admin' ? 'danger' : admin.role === 'Admin' ? 'primary' : admin.role === 'User' ? 'info' : 'secondary'} ms-2">${admin.role}</span>
                        </h6>
                        <small class="text-muted d-block"><i class="fas fa-envelope me-1"></i>${admin.email}</small>
                        <small class="text-muted d-block"><i class="fas fa-id-badge me-1"></i>ID: ${admin.id}</small>
                        <small class="text-muted d-block"><i class="fas fa-clock me-1"></i>Created: ${admin.createdAt ? new Date(admin.createdAt).toLocaleString() : 'N/A'}</small>
                        ${admin.lastLogin ? `<small class="text-muted d-block"><i class="fas fa-sign-in-alt me-1"></i>Last login: ${new Date(admin.lastLogin).toLocaleString()}</small>` : ''}
                        ${admin.passwordChangedBy ? `<small class="text-muted d-block"><i class="fas fa-key me-1"></i>Password changed by: ${admin.passwordChangedBy}</small>` : ''}
                        ${admin.passwordChangedAt ? `<small class="text-muted d-block"><i class="fas fa-calendar me-1"></i>Password changed: ${admin.passwordChangedAt}</small>` : ''}
                    </div>
                    <div class="d-flex flex-column gap-2">
                        <button class="btn btn-sm btn-outline-warning" onclick="showChangePasswordModal('${admin.id}', '${admin.name.replace(/'/g, "\\'")}', '${admin.email}')" 
                                title="Change password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAdmin('${admin.id}')" 
                                ${adminCredentials.length === 1 ? 'disabled' : ''} 
                                title="${adminCredentials.length === 1 ? 'Cannot delete the last user' : 'Delete user'}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup add admin form
function setupAddAdminForm() {
    const form = document.getElementById('addAdminForm');
    
    // Remove existing listener if any
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('newAdminEmail').value;
        const name = document.getElementById('newAdminName').value;
        const password = document.getElementById('newAdminPassword').value;
        const role = document.getElementById('newAdminRole').value;
        
        // Validate email
        if (!email || !email.includes('@')) {
            showAlert('Please enter a valid email address', 'danger');
            return;
        }
        
        try {
            showLoading(true);
            
            const formData = new URLSearchParams();
            formData.append('action', 'addUser');
            formData.append('email', email);
            formData.append('name', name);
            formData.append('password', password);
            formData.append('role', role);
            formData.append('timestamp', Date.now().toString());
            
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                redirect: 'follow',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                // Clear form
                newForm.reset();
                
                // Reload display
                await loadAdminAccounts();
                
                showAlert('Admin account added successfully', 'success');
            } else {
                throw new Error(result.message || 'Failed to add admin');
            }
            
        } catch (error) {
            console.error('Error adding admin:', error);
            showAlert(error.message || 'Failed to add admin account. Please try again.', 'danger');
        } finally {
            showLoading(false);
        }
    });
}

// Delete admin account
async function deleteAdmin(userId) {
    if (!confirm('Are you sure you want to delete this admin account?')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const formData = new URLSearchParams();
        formData.append('action', 'deleteUser');
        formData.append('userId', userId);
        formData.append('timestamp', Date.now().toString());
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Reload display
            await loadAdminAccounts();
            showAlert('Admin account deleted successfully', 'success');
        } else {
            throw new Error(result.message || 'Failed to delete admin');
        }
        
    } catch (error) {
        console.error('Error deleting admin:', error);
        showAlert(error.message || 'Failed to delete admin account. Please try again.', 'danger');
    } finally {
        showLoading(false);
    }
}

// Show change password modal
function showChangePasswordModal(userId, userName, userEmail) {
    document.getElementById('changePasswordUserId').value = userId;
    document.getElementById('changePasswordUserName').textContent = userName;
    document.getElementById('changePasswordUserEmail').textContent = userEmail;
    
    // Clear form
    document.getElementById('changePasswordForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
    
    // Setup form submission if not already done
    const form = document.getElementById('changePasswordForm');
    if (!form.hasAttribute('data-listener-attached')) {
        form.addEventListener('submit', handleChangePassword);
        form.setAttribute('data-listener-attached', 'true');
    }
}

// Handle password change
async function handleChangePassword(event) {
    event.preventDefault();
    
    const userId = document.getElementById('changePasswordUserId').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match!', 'danger');
        return;
    }
    
    if (newPassword.length < 3) {
        showAlert('Password must be at least 3 characters long', 'danger');
        return;
    }
    
    try {
        showLoading(true);
        
        const formData = new URLSearchParams();
        formData.append('action', 'changeUserPassword');
        formData.append('userId', userId);
        formData.append('newPassword', newPassword);
        
        // Get current admin email from session
        const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
        const changedByEmail = adminSession.email || 'Unknown';
        formData.append('changedByEmail', changedByEmail);
        
        formData.append('timestamp', Date.now().toString());
        
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
            
            showAlert('Password updated successfully!', 'success');
        } else {
            throw new Error(result.message || 'Failed to change password');
        }
        
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert(error.message || 'Failed to change password. Please try again.', 'danger');
    } finally {
        showLoading(false);
    }
}

// Make functions globally available
window.showLoginHistoryModal = showLoginHistoryModal;
window.loadLoginHistory = loadLoginHistory;
window.refreshLoginHistory = refreshLoginHistory;
window.showManageCredentialsModal = showManageCredentialsModal;
window.deleteAdmin = deleteAdmin;
window.showChangePasswordModal = showChangePasswordModal;