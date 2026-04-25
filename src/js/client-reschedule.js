// Client Reschedule JavaScript
// This file handles the client-facing reschedule page with dynamic calendar

// CONFIG is available through window.CONFIG from config.js loaded in HTML

// Global variables
let currentCalendarDate = new Date();
let selectedDate = null;
let availableSlots = {};
let blockedDates = [];
let availableDates = [];
let appointmentData = null;

// Initialize page on load
document.addEventListener('DOMContentLoaded', async function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const appointmentId = urlParams.get('id');
    const token = urlParams.get('token');
    
    if (!appointmentId || !token) {
        showError('Invalid reschedule link. Please use the link provided in your email.');
        return;
    }
    
    // Store appointment ID
    document.getElementById('appointment-id').value = appointmentId;
    
    // Load appointment details
    await loadAppointmentDetails(appointmentId, token);
});

// Load appointment details from server
async function loadAppointmentDetails(appointmentId, token) {
    showLoading(true);
    
    try {
        const response = await fetch(`${window.CONFIG.GOOGLE_SCRIPT_URL}?action=getAppointmentForReschedule&id=${appointmentId}&token=${token}`);
        
        if (!response.ok) {
            throw new Error('Failed to load appointment details');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load appointment');
        }
        
        appointmentData = result.data;
        
        // Display appointment details
        displayAppointmentDetails(appointmentData);
        
        // Load calendar data
        await loadCalendarData();
        
        // Initialize calendar
        initializeCalendar();
        
        // Show main content
        document.getElementById('main-content').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading appointment:', error);
        showError(error.message || 'Failed to load appointment details. Please try again or contact support.');
    } finally {
        showLoading(false);
    }
}

// Display appointment details
function displayAppointmentDetails(appointment) {
    document.getElementById('current-session-id').textContent = appointment.sessionId || 'N/A';
    document.getElementById('current-session-type').textContent = formatSessionType(appointment.sessionType);
    document.getElementById('current-date').textContent = appointment.appointmentDate || 'N/A';
    document.getElementById('current-time').textContent = appointment.appointmentTime || 'N/A';
    
    // Store session type and location
    document.getElementById('session-type').value = appointment.sessionType;
    document.getElementById('location').value = appointment.location || 'india';
    document.getElementById('timezone-selector').value = appointment.timezone || 'Asia/Kolkata';
}

// Format session type for display
function formatSessionType(type) {
    const typeMap = {
        'generalized': 'Generalized',
        'specialized': 'Specialized',
        'super-specialized': 'Super-Specialized',
        'long-term-engagement': 'Long-Term Engagement'
    };
    return typeMap[type] || type;
}

// Load calendar data (blocked dates, available dates)
async function loadCalendarData() {
    try {
        const [blockedResponse, availableResponse] = await Promise.all([
            fetch(`${window.CONFIG.GOOGLE_SCRIPT_URL}?action=getBlockedDates`),
            fetch(`${window.CONFIG.GOOGLE_SCRIPT_URL}?action=getAvailableDates`)
        ]);
        
        if (blockedResponse.ok) {
            const blockedData = await blockedResponse.json();
            blockedDates = blockedData.data || [];
            console.log('Loaded blocked dates:', blockedDates.length);
        }
        
        if (availableResponse.ok) {
            const availableData = await availableResponse.json();
            availableDates = availableData.data || [];
            console.log('Loaded available dates:', availableDates.length);
        }
        
        // Generate available slots based on session type
        const sessionType = document.getElementById('session-type').value;
        const location = document.getElementById('location').value;
        const timezone = document.getElementById('timezone-selector').value;
        
        generateAvailableSlots(sessionType, location, timezone);
        
    } catch (error) {
        console.error('Error loading calendar data:', error);
        // Continue with empty data
    }
}

// Generate available slots (same logic as booking session)
function generateAvailableSlots(sessionType, location, customTimezone) {
    availableSlots = {};

    let timezone;
    if (customTimezone) {
        timezone = customTimezone;
    } else if (location === 'others') {
        timezone = 'Asia/Kolkata';
    } else {
        timezone = getTimezoneForLocation(location);
    }

    const today = new Date();
    const startDaysAfter = sessionType === 'generalized' ? 3 : 7;
    const maxDaysToCheck = 90; // 3 months
    let dayOffset = startDaysAfter;

    const baseTimeSlots = ['05:00', '07:00', '09:00', '11:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

    while (dayOffset <= maxDaysToCheck) {
        const date = new Date(today);
        date.setDate(today.getDate() + dayOffset);

        // Check if date is available
        const isAvailableForBooking = isDateAvailable(date, sessionType);
        
        if (isAvailableForBooking) {
            const dateKey = getLocalDateKey(date);
            availableSlots[dateKey] = [];

            baseTimeSlots.forEach(baseTime => {
                let slotInfo;
                if (timezone === 'Asia/Kolkata') {
                    slotInfo = {
                        time: baseTime,
                        timezone: 'IST',
                        value: `${dateKey} ${baseTime}:00 IST`
                    };
                } else {
                    const userTime = convertISTToUserTimezone(date, baseTime, timezone);
                    if (userTime) {
                        slotInfo = {
                            time: userTime.time,
                            timezone: userTime.timezone,
                            value: `${dateKey} ${baseTime}:00 IST`
                        };
                    }
                }
                if (slotInfo) {
                    availableSlots[dateKey].push(slotInfo);
                }
            });
        }
        dayOffset++;
    }
    
    console.log('Generated available slots for', Object.keys(availableSlots).length, 'days');
}

// Check if date is available (same logic as booking session)
function isDateAvailable(date, sessionType) {
    // STEP 1: If manually available, override all rules
    if (isDateManuallyAvailable(date)) {
        return true;
    }

    // STEP 2: If blocked, it's unavailable
    if (isDateBlocked(date)) {
        return false;
    }

    // STEP 3: Apply default business rules based on day of week
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    if (sessionType === 'super-specialized') {
        // Super-specialized: only weekends
        return dayOfWeek === 0 || dayOfWeek === 6;
    } else {
        // All other types: only weekdays
        return dayOfWeek !== 0 && dayOfWeek !== 6;
    }
}

// Check if date is blocked
function isDateBlocked(date) {
    if (!blockedDates || blockedDates.length === 0) {
        return false;
    }

    const checkDate = new Date(date);
    if (isNaN(checkDate)) {
        return false;
    }

    checkDate.setHours(0, 0, 0, 0);

    for (const blockedDate of blockedDates) {
        if (!blockedDate.startDate) continue;

        const startDate = new Date(blockedDate.startDate);
        const endDate = new Date(blockedDate.endDate || blockedDate.startDate);

        if (isNaN(startDate) || isNaN(endDate)) continue;

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        if (checkDate >= startDate && checkDate <= endDate) {
            return true;
        }
    }

    return false;
}

// Check if date is manually available
function isDateManuallyAvailable(date) {
    if (!availableDates || availableDates.length === 0) {
        return false;
    }

    // Convert to YYYY-MM-DD format
    let checkDateStr;
    if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        checkDateStr = `${year}-${month}-${day}`;
    } else {
        return false;
    }

    // Check if date exists in available dates
    for (const availableDate of availableDates) {
        if (availableDate && availableDate.date) {
            let availDateStr = availableDate.date.trim();

            // Handle ISO date format
            if (availDateStr.includes('T')) {
                availDateStr = availDateStr.split('T')[0];
            }
            // Handle DD/MM/YYYY format
            else if (availDateStr.includes('/')) {
                const parts = availDateStr.split('/');
                if (parts.length === 3) {
                    availDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }

            if (checkDateStr === availDateStr) {
                return true;
            }
        }
    }

    return false;
}

// Initialize calendar
function initializeCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');

    // Clear existing content
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Add navigation event listeners
    document.getElementById('prev-month').addEventListener('click', () => {
        const today = new Date();
        const currentMonth = currentCalendarDate.getMonth();
        const currentYear = currentCalendarDate.getFullYear();

        const minAllowedMonth = today.getMonth();
        const minAllowedYear = today.getFullYear();

        const prevMonth = currentMonth - 1;
        const adjustedPrevMonth = prevMonth < 0 ? 11 : prevMonth;
        const adjustedPrevYear = prevMonth < 0 ? currentYear - 1 : currentYear;

        if (adjustedPrevYear > minAllowedYear || (adjustedPrevYear === minAllowedYear && adjustedPrevMonth >= minAllowedMonth)) {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            clearDateSelection();
            updateCalendarDisplay();
        }
    });

    document.getElementById('next-month').addEventListener('click', () => {
        const today = new Date();
        const currentMonth = currentCalendarDate.getMonth();
        const currentYear = currentCalendarDate.getFullYear();

        const maxDate = new Date(today);
        maxDate.setMonth(today.getMonth() + 3);
        const maxAllowedMonth = maxDate.getMonth();
        const maxAllowedYear = maxDate.getFullYear();

        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

        if (nextYear < maxAllowedYear || (nextYear === maxAllowedYear && nextMonth <= maxAllowedMonth)) {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            clearDateSelection();
            updateCalendarDisplay();
        }
    });

    updateCalendarDisplay();
}

// Update calendar display
function updateCalendarDisplay() {
    const calendarTitle = document.getElementById('calendar-title');
    const calendarGrid = document.getElementById('calendar-grid');

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    calendarTitle.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;

    const today = new Date();
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();

    const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();
    prevBtn.disabled = isCurrentMonth;

    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 3);
    const maxAllowedMonth = maxDate.getMonth();
    const maxAllowedYear = maxDate.getFullYear();

    const isMaxMonth = currentYear === maxAllowedYear && currentMonth === maxAllowedMonth;
    nextBtn.disabled = isMaxMonth;

    // Clear existing calendar days
    const dayElements = calendarGrid.querySelectorAll('.calendar-day');
    dayElements.forEach(el => el.remove());

    // Generate calendar days
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();

        const dateKey = getLocalDateKey(date);
        const isCurrentMonthDay = date.getMonth() === currentCalendarDate.getMonth();
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < today && !isToday;

        const sessionType = document.getElementById('session-type').value;
        const isDateAvailableForSession = sessionType ? isDateAvailable(date, sessionType) : false;
        const hasSlots = availableSlots[dateKey] && availableSlots[dateKey].length > 0;

        if (!isCurrentMonthDay) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        if (isCurrentMonthDay && !isPast && isDateAvailableForSession && hasSlots) {
            dayElement.classList.add('available');
            dayElement.addEventListener('click', () => selectCalendarDate(date, dayElement));
        } else {
            dayElement.classList.add('disabled');
            
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const shouldShowAsBlocked = isDateBlocked(date) && !isDateManuallyAvailable(date);
            const isDefaultUnavailableWeekend = isWeekend && sessionType !== 'super-specialized';
            
            if (shouldShowAsBlocked && !isDefaultUnavailableWeekend) {
                dayElement.title = 'This date is blocked for booking';
                dayElement.style.background = '#ffebee';
                dayElement.style.color = '#c62828';
            } else if (isPast) {
                dayElement.title = 'This date is in the past';
            } else {
                dayElement.title = 'This date is not available for booking';
            }
        }

        if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }

        calendarGrid.appendChild(dayElement);
    }
}

// Select calendar date
function selectCalendarDate(date, element) {
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        clearDateSelection();
        return;
    }

    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selection
    element.classList.add('selected');

    selectedDate = new Date(date);
    const dateKey = getLocalDateKey(date);

    // Update display
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    selectedDateDisplay.innerHTML = `<i class="fas fa-calendar-check"></i> ${date.toLocaleDateString('en-US', options)}`;

    // Display time slots
    displayTimeSlotsForDate(dateKey);

    // Store selected date
    document.getElementById('selected-date').value = dateKey;

    // Clear selected slot
    document.getElementById('selected-slot').value = '';
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Disable submit button until time slot is selected
    document.getElementById('submit-reschedule').disabled = true;
}

// Clear date selection
function clearDateSelection() {
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    selectedDate = null;
    document.getElementById('selected-date').value = '';
    document.getElementById('selected-slot').value = '';

    document.getElementById('selected-date-display').textContent = 'Select a date to view available time slots';

    const container = document.getElementById('time-slots-container');
    container.className = 'time-slots calendar-no-slots';
    container.innerHTML = 'Select a date from the calendar to view available time slots';
    
    document.getElementById('submit-reschedule').disabled = true;
}

// Display time slots for selected date
function displayTimeSlotsForDate(dateKey) {
    const container = document.getElementById('time-slots-container');
    const slots = availableSlots[dateKey];

    if (!slots || slots.length === 0) {
        container.innerHTML = '';
        container.className = 'time-slots calendar-no-slots';
        container.textContent = 'No available time slots for this date';
        return;
    }

    container.className = 'time-slots has-slots';
    container.innerHTML = '';

    // Add timezone notice
    const location = document.getElementById('location').value;
    const customTimezone = document.getElementById('timezone-selector').value;
    let timezoneDisplayName = 'IST (Indian Standard Time)';
    
    if (customTimezone && customTimezone !== 'Asia/Kolkata') {
        const tzMap = {
            'Asia/Dubai': 'GST (Gulf Standard Time)',
            'Europe/London': 'GMT/BST (Greenwich Mean Time)',
            'America/New_York': 'EST/EDT (Eastern Time)',
            'Asia/Tokyo': 'JST (Japan Standard Time)'
        };
        timezoneDisplayName = tzMap[customTimezone] || 'Local Time';
    }

    const noticeDiv = document.createElement('div');
    noticeDiv.className = 'alert alert-info mb-3';
    noticeDiv.innerHTML = `<i class="fas fa-globe"></i> All times shown are in ${timezoneDisplayName}`;
    container.appendChild(noticeDiv);

    // Add time slots
    slots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = 'time-slot';
        slotElement.innerHTML = `
            <i class="fas fa-clock"></i>
            <span>${slot.time} ${slot.timezone}</span>
        `;
        slotElement.addEventListener('click', () => selectTimeSlot(slot, slotElement));
        container.appendChild(slotElement);
    });
}

// Select time slot
function selectTimeSlot(slot, element) {
    // Remove previous selection
    document.querySelectorAll('.time-slot.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selection
    element.classList.add('selected');

    // Store selected slot
    document.getElementById('selected-slot').value = slot.value;
    
    // Enable submit button
    document.getElementById('submit-reschedule').disabled = false;
    
    console.log('Selected slot:', slot.value);
}

// Submit reschedule request
document.getElementById('submit-reschedule').addEventListener('click', async function() {
    const appointmentId = document.getElementById('appointment-id').value;
    const newDate = document.getElementById('selected-date').value;
    const newSlot = document.getElementById('selected-slot').value;
    
    if (!newDate || !newSlot) {
        alert('Please select a date and time slot');
        return;
    }
    
    showLoading(true);
    this.disabled = true;
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'submitClientReschedule');
        formData.append('appointmentId', appointmentId);
        formData.append('newDate', newDate);
        formData.append('newSlot', newSlot);
        formData.append('timestamp', Date.now().toString());
        
        const response = await fetch(window.CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit reschedule request');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to submit reschedule');
        }
        
        // Show success message
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        
    } catch (error) {
        console.error('Error submitting reschedule:', error);
        alert('Failed to submit reschedule request. Please try again or contact support.');
        this.disabled = false;
    } finally {
        showLoading(false);
    }
});

// Helper functions
function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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
        const [hours, minutes] = timeIST.split(':').map(Number);
        const istDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
        
        const utcTime = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
        
        const userTime = utcTime.toLocaleTimeString('en-US', {
            timeZone: userTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        const tzAbbr = userTimezone === 'Asia/Kolkata' ? 'IST' : 
                       userTimezone === 'Asia/Dubai' ? 'GST' :
                       userTimezone === 'Europe/London' ? 'GMT' :
                       userTimezone === 'America/New_York' ? 'EST' :
                       userTimezone === 'Asia/Tokyo' ? 'JST' : 'Local';
        
        return {
            time: userTime,
            timezone: tzAbbr
        };
    } catch (error) {
        console.error('Timezone conversion error:', error);
        return null;
    }
}

function showLoading(show) {
    document.getElementById('loading-indicator').style.display = show ? 'block' : 'none';
}

function showError(message) {
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-message').style.display = 'block';
}
