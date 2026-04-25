let currentTab = 0;
let totalTabs = 3; // Will be dynamically adjusted based on service category
let calendarInstance = null;

// Reschedule mode variables
let isRescheduleMode = false;
let rescheduleData = null;

// Helper function to wait for element to be available
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            resolve(document.querySelector(selector));
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            resolve(document.querySelector(selector));
        }, timeout);
    });
}

// Dynamic questions based on session type
const sessionQuestions = {
    'generalized': [
        // 'What is covered?',
        'What specific area of space policy interests you most?',
        'Are you looking for general guidance or specific insights?'
    ],
    'specialized': [
        // 'What is covered?',
        'Is there any policy directive you are concerned with?',
        'Is there any specific Geopolitical development/ situation you are concerned with?',
        'Is there any particular "Use Case" related to your work profile/project you are concerned with?',
        'Is there any other specific information you would like to discuss before the consultancy session to make the session more personalized?',
        'Is there any specific Entity you are already dealing with?',
        'What level of detail are you expecting from this consultation?'
    ],
    'super-specialized': [
        // 'What is covered?',
        'What complex challenges or strategic decisions are you currently facing?',
        'Which regional dynamics are most relevant to your current situation?',
        'Are you looking for comprehensive analysis or strategic planning assistance?',
        'Do you need customized frameworks or policy recommendations?'
    ],
    'long-term-engagement': [
        // 'What is covered?',
        'What are your primary strategic objectives for this engagement?',
        'Which specific outcomes are you hoping to achieve over the 2-6 month period?',
        'What is your preferred engagement model (weekly/bi-weekly consultations)?',
        'Do you need deliverables like reports, frameworks, or policy recommendations?'
    ]
};

// Question field name mapping
const questionFieldMapping = {
    'What specific area of space policy interests you most?': 'space-policy-area',
    'Are you looking for general guidance or specific insights?': 'guidance-type',
    'If Specific insights, Details': 'specific-insights-details',
    'Is there any policy directive you are concerned with?': 'policy-directive',
    'If Yes, Policy Directive Details': 'policy-directive-details',
    'Is there any specific Geopolitical development/ situation you are concerned with?': 'geopolitical-situation',
    'If Yes, Geopolitical Development/Situation Details': 'geopolitical-details',
    'Is there any particular "Use Case" related to your work profile/project you are concerned with?': 'use-case',
    'If Yes, Use Case Details': 'use-case-details',
    'Is there any other specific information you would like to discuss before the consultancy session to make the session more personalized?': 'additional-info',
    'If Yes, Additional Information Details': 'additional-info-details',
    'Is there any specific Entity you are already dealing with?': 'specific-entity',
    'If Yes, Entity Details': 'entity-details',
    'What level of detail are you expecting from this consultation?': 'detail-level',
    'What are your primary strategic objectives for this engagement?': 'strategic-objectives',
    'Which specific outcomes are you hoping to achieve over the 2-6 month period?': 'expected-outcomes',
    'What is your preferred engagement model (weekly/bi-weekly consultations)?': 'engagement-model',
    'Do you need deliverables like reports, frameworks, or policy recommendations?': 'deliverables-needed',
    'What complex challenges or strategic decisions are you currently facing?': 'complex-challenges',
    'Which regional dynamics are most relevant to your current situation?': 'relevant-regional-dynamics',
    'Are you looking for comprehensive analysis or strategic planning assistance?': 'analysis-type',
    'Do you need customized frameworks or policy recommendations?': 'customized-frameworks'
};

// Display text mappings - to save display text instead of values
const displayTextMappings = {
    location: {
        'middle-east': 'Middle East / West Asia',
        'europe': 'Europe',
        'us': 'United States',
        'india': 'India',
        'japan': 'Japan',
        'others': 'Others'
    },
    'country-code': {
        '+1': '+1 (US/Canada)',
        '+44': '+44 (UK)',
        '+91': '+91 (India)',
        '+81': '+81 (Japan)',
        '+49': '+49 (Germany)',
        '+33': '+33 (France)',
        '+39': '+39 (Italy)',
        '+34': '+34 (Spain)',
        '+86': '+86 (China)',
        '+7': '+7 (Russia)',
        '+61': '+61 (Australia)',
        '+55': '+55 (Brazil)',
        '+27': '+27 (South Africa)',
        '+82': '+82 (South Korea)',
        '+65': '+65 (Singapore)',
        '+971': '+971 (UAE)',
        '+966': '+966 (Saudi Arabia)',
        '+20': '+20 (Egypt)',
        '+52': '+52 (Mexico)',
        '+31': '+31 (Netherlands)',
        '+46': '+46 (Sweden)',
        '+47': '+47 (Norway)',
        '+45': '+45 (Denmark)',
        '+41': '+41 (Switzerland)',
        '+43': '+43 (Austria)',
        '+32': '+32 (Belgium)',
        '+351': '+351 (Portugal)',
        '+30': '+30 (Greece)',
        '+90': '+90 (Turkey)',
        '+62': '+62 (Indonesia)',
        '+60': '+60 (Malaysia)',
        '+66': '+66 (Thailand)',
        '+84': '+84 (Vietnam)',
        '+63': '+63 (Philippines)',
        '+92': '+92 (Pakistan)',
        '+880': '+880 (Bangladesh)',
        '+94': '+94 (Sri Lanka)',
        '+977': '+977 (Nepal)',
        '+98': '+98 (Iran)',
        '+964': '+964 (Iraq)',
        '+962': '+962 (Jordan)',
        '+961': '+961 (Lebanon)',
        '+972': '+972 (Israel)',
        '+212': '+212 (Morocco)',
        '+213': '+213 (Algeria)',
        '+216': '+216 (Tunisia)',
        '+234': '+234 (Nigeria)',
        '+254': '+254 (Kenya)',
        '+256': '+256 (Uganda)',
        '+255': '+255 (Tanzania)',
        '+233': '+233 (Ghana)',
        '+251': '+251 (Ethiopia)',
        '+593': '+593 (Ecuador)',
        '+51': '+51 (Peru)',
        '+56': '+56 (Chile)',
        '+54': '+54 (Argentina)',
        '+57': '+57 (Colombia)',
        '+58': '+58 (Venezuela)',
        '+595': '+595 (Paraguay)',
        '+598': '+598 (Uruguay)',
        '+591': '+591 (Bolivia)'
    },
    category: {
        'consultancy': 'Consultancy',
        'advisory': 'Advisory'
    },
    sessionType: {
        'generalized': 'Generalized',
        'specialized': 'Specialized (Virtual)',
        'super-specialized': 'Super-Specialized (In-Person)',
        'long-term-engagement': 'Long-term Projects',
        'advisory-service': 'Advisory'
    },
    guidanceType: {
        'general': 'General',
        'specific': 'Specific'
    },
    yesNo: {
        'yes': 'Yes',
        'no': 'No'
    },
    domains: {
        'technology-diplomacy': 'Technology Diplomacy',
        'space-power': 'Space Diplomacy',
        'economic-diplomacy': 'Economic Diplomacy',
        'defence': 'Defence',
        'multi-domain': 'Multi-Domain',
        'others': 'Others'
    },
    regions: {
        'outer-space': 'Outer Space',
        'rimland': 'Rimland',
        'antarctic': 'Antarctic',
        'arctic': 'Arctic',
        'deep-sea': 'Deep Sea',
        'others': 'Others'
    }
};

// Session descriptions for "What is covered"
const sessionDescriptions = {
    'generalized': {
        title: 'What is covered:',
        content: `
      <ul style="color: var(--text-light);">
        <li>General information regarding the Question you posed during the booking. It likely covers the aspects of geopolitical situation, general policy framework, and potential sub-domains and areas.</li>
        <li>Further consultation will be based on the discussed information.</li>
      </ul>
    `
    },
    'specialized': {
        title: 'What is covered:',
        content: `
      <ul style="color: var(--text-light);">
        <li>Detailed analysis of your specific domain and requirements</li>
        <li>Virtual consultation with expert insights and recommendations</li>
        <li>Customized guidance based on your particular use case</li>
      </ul>
    `
    },
    'super-specialized': {
        title: 'What is covered:',
        content: `
      <ul style="color: var(--text-light);">
        <li>Comprehensive in-person consultation with extensive expertise</li>
        <li>Strategic planning and complex challenge resolution</li>
        <li>Customized frameworks and detailed policy recommendations</li>
      </ul>
    `
    },
    'long-term-engagement': {
        title: 'What is covered:',
        content: `
      <ul style="color: var(--text-light);">
        <li>Extended strategic partnership over 2-6 months</li>
        <li>Regular consultations and ongoing support</li>
        <li>Deliverables including reports, frameworks, and policy guidance</li>
      </ul>
    `
    }
};

/**
 * Converts a Date object to a timezone-safe "YYYY-MM-DD" string.
 * This avoids the UTC conversion issues caused by .toISOString().
 * @param {Date} date The date to convert.
 * @returns {string} The formatted date string.
 */
function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() is 0-indexed
    const day = date.getDate();

    // Pad with a leading zero if necessary
    const monthPadded = String(month).padStart(2, '0');
    const dayPadded = String(day).padStart(2, '0');

    return `${year}-${monthPadded}-${dayPadded}`;
}

// Initialize advisory calendar
function initializeAdvisoryCalendar() {
    if (!advisoryCalendarInitialized) {
        // Set the appropriate starting month for advisory calendar
        initializeAdvisoryCalendarDate();
        
        const advisoryCalendarGrid = document.getElementById('advisory-calendar-grid');

        // Clear existing content
        advisoryCalendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            advisoryCalendarGrid.appendChild(dayHeader);
        });

        // Add navigation event listeners
        document.getElementById('advisory-prev-month').addEventListener('click', () => {
            const today = new Date();
            const minDate = new Date(today);
            minDate.setDate(today.getDate() + 7); // Advisory requires 7 days minimum
            
            const currentMonth = advisoryCurrentCalendarDate.getMonth();
            const currentYear = advisoryCurrentCalendarDate.getFullYear();

            // Don't allow navigation to previous months before the minimum allowed month
            const minAllowedMonth = minDate.getMonth();
            const minAllowedYear = minDate.getFullYear();
            
            if (currentYear > minAllowedYear || (currentYear === minAllowedYear && currentMonth > minAllowedMonth)) {
                advisoryCurrentCalendarDate.setMonth(advisoryCurrentCalendarDate.getMonth() - 1);

                // Clear previous date selection when changing month
                advisorySelectedDate = null;
                document.getElementById('advisory-selected-date').value = '';
                document.getElementById('advisory-selected-time').value = '';
                document.getElementById('advisory-selected-datetime').value = '';
                document.getElementById('advisory-time-slots-container').innerHTML = '<div class="calendar-no-slots">Select a date from the calendar to view available time slots</div>';
                document.getElementById('advisory-selected-date-display').textContent = 'Select a date to choose time';

                updateAdvisoryCalendarDisplay();
            }
        });

        document.getElementById('advisory-next-month').addEventListener('click', () => {
            const today = new Date();
            const currentMonth = advisoryCurrentCalendarDate.getMonth();
            const currentYear = advisoryCurrentCalendarDate.getFullYear();

            // Allow navigation up to 6 months from today
            const maxDate = new Date(today);
            maxDate.setMonth(today.getMonth() + 6);
            const maxAllowedMonth = maxDate.getMonth();
            const maxAllowedYear = maxDate.getFullYear();

            if (currentYear < maxAllowedYear || (currentYear === maxAllowedYear && currentMonth < maxAllowedMonth)) {
                advisoryCurrentCalendarDate.setMonth(advisoryCurrentCalendarDate.getMonth() + 1);

                // Clear previous date selection when changing month
                advisorySelectedDate = null;
                document.getElementById('advisory-selected-date').value = '';
                document.getElementById('advisory-selected-time').value = '';
                document.getElementById('advisory-selected-datetime').value = '';
                document.getElementById('advisory-time-slots-container').innerHTML = '<div class="calendar-no-slots">Select a date from the calendar to view available time slots</div>';
                document.getElementById('advisory-selected-date-display').textContent = 'Select a date to choose time';

                updateAdvisoryCalendarDisplay();
            }
        });

        advisoryCalendarInitialized = true;
        updateAdvisoryCalendarDisplay();
    }
}

// Update tab structure based on service category
function updateTabStructure(category) {
    const scheduleTab = document.getElementById('schedule-tab');
    const scheduleContent = document.getElementById('schedule-content');
    const step3 = document.getElementById('step3');

    if (category === 'advisory') {
        totalTabs = 2;
        scheduleTab.style.display = 'none';
        // Remove active class and don't set display block
        scheduleContent.classList.remove('active');
        // Remove step 3 from indicator and hide its line
        step3.style.display = 'none';
        // Also hide the line after step 2 when step 3 is hidden
        document.getElementById('step2').style.setProperty('--after-display', 'none');
    } else {
        totalTabs = 3;
        scheduleTab.style.display = 'block';
        // For consultancy, just ensure it's not active initially - don't set display block
        scheduleContent.classList.remove('active');
        // Show step 3 in indicator
        step3.style.display = 'flex';
        // Show the line after step 2
        document.getElementById('step2').style.removeProperty('--after-display');
    }
}

function resetFormSections() {
    // Reset session types section
    const sessionTypesSection = document.getElementById('session-types-section');
    const consultancySessions = document.getElementById('consultancy-sessions');
    const advisoryMessage = document.getElementById('advisory-message');
    const advisoryDatetime = document.getElementById('advisory-datetime');
    const domainSelection = document.getElementById('domain-selection');

    const regionSelection = document.getElementById('region-selection');

    const topicSection = document.getElementById('topic-section');
    const consentSection = document.querySelector('.consent-section');
    const dynamicQuestions = document.getElementById('dynamic-questions');
    const additionalDynamicQuestions = document.getElementById('additional-dynamic-questions');

    // Hide all sections initially
    sessionTypesSection.style.display = 'none';
    consultancySessions.style.display = 'none';
    advisoryMessage.style.display = 'none';
    advisoryDatetime.style.display = 'none';
    domainSelection.style.display = 'none';

    regionSelection.style.display = 'none';
    
    // Initially remove required attributes since fields are hidden
    document.getElementById('domain-select').removeAttribute('required');
    document.getElementById('region-select').removeAttribute('required');

    topicSection.style.display = 'none';
    consentSection.style.display = 'none';
    dynamicQuestions.style.display = 'none';
    additionalDynamicQuestions.style.display = 'none';

    // Clear dynamic questions
    dynamicQuestions.innerHTML = '';
    additionalDynamicQuestions.innerHTML = '';

    // Clear all selections
    document.querySelectorAll('[data-type]').forEach(opt => opt.classList.remove('selected'));

    // Reset dropdown selections
    const domainSelect = document.getElementById('domain-select');
    const regionSelect = document.getElementById('region-select');
    if (domainSelect) domainSelect.value = '';
    if (regionSelect) regionSelect.value = '';

    // Clear form values
    document.getElementById('session-type').value = '';
    document.getElementById('selected-domains').value = '';
    document.getElementById('selected-regions').value = '';

    // Hide custom inputs
    hideCustomDomainInput();
    hideCustomRegionInput();

    // FIXED: Clear both topic textareas and remove required attributes
    const originalTopic = document.getElementById('topic');
    const dynamicTopic = document.getElementById('dynamic-topic');

    if (originalTopic) {
        originalTopic.value = '';
        originalTopic.removeAttribute('required');
    }
    if (dynamicTopic) {
        dynamicTopic.value = '';
        dynamicTopic.removeAttribute('required');
    }

    // Clear advisory calendar selections
    document.getElementById('advisory-selected-date').value = '';
    document.getElementById('advisory-selected-time').value = '';
    document.getElementById('advisory-selected-datetime').value = '';

    // Reset advisory calendar if initialized
    if (advisoryCalendarInitialized) {
        advisorySelectedDate = null;
        document.getElementById('advisory-time-slots-container').innerHTML = '<div class="calendar-no-slots">Select a date from the calendar to view available time slots</div>';
        document.getElementById('advisory-selected-date-display').textContent = 'Select a date to choose time';
        updateAdvisoryCalendarDisplay();
    }

    document.getElementById('selected-slot').value = '';

    // Clear checkboxes
    document.getElementById('data-consent').checked = false;
    document.getElementById('terms-consent').checked = false;

    // Remove required attributes
    document.getElementById('advisory-selected-datetime').removeAttribute('required');
    document.getElementById('session-type').removeAttribute('required');
    document.getElementById('selected-domains').removeAttribute('required');
    document.getElementById('selected-regions').removeAttribute('required');

    // Clear time slots
    document.getElementById('time-slots-container').innerHTML = '';

    // Hide others input if exists
    const othersContainer = document.getElementById('others-input-container');
    if (othersContainer) {
        othersContainer.remove();
    }

    const othersRegionContainer = document.getElementById('others-region-container');
    if (othersRegionContainer) {
        othersRegionContainer.remove();
    }
}

document.querySelectorAll('[data-category]').forEach(option => {
    option.addEventListener('click', function () {
        document.querySelectorAll('[data-category]').forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');

        const category = this.dataset.category;
        document.getElementById('service-category').value = category;

        // Reset all form sections first
        resetFormSections();

        // Update tab structure
        updateTabStructure(category);

        // Reset current tab to 1 (session details) if we're currently on a higher tab
        if (currentTab >= totalTabs) {
            currentTab = 1;
        }
        showTab(currentTab);

        const sessionTypesSection = document.getElementById('session-types-section');
        const consultancySessions = document.getElementById('consultancy-sessions');
        const advisoryMessage = document.getElementById('advisory-message');
        const advisoryDatetime = document.getElementById('advisory-datetime');
        const domainSelection = document.getElementById('domain-selection');
        const topicSection = document.getElementById('topic-section');
        const consentSection = document.querySelector('.consent-section');
        const dynamicQuestions = document.getElementById('dynamic-questions');

        // Clear previous selections
        document.getElementById('session-type').value = '';
        document.getElementById('selected-domains').value = '';
        document.getElementById('topic').value = '';

        // Clear advisory calendar selections
        document.getElementById('advisory-selected-date').value = '';
        document.getElementById('advisory-selected-time').value = '';
        document.getElementById('advisory-selected-datetime').value = '';

        // Clear dynamic questions
        dynamicQuestions.innerHTML = '';
        dynamicQuestions.style.display = 'none';

        // Reset all sections
        sessionTypesSection.style.display = 'block';
        domainSelection.style.display = 'none';
        advisoryDatetime.style.display = 'none';

        if (category === 'consultancy') {
            consultancySessions.style.display = 'flex';
            advisoryMessage.style.display = 'none';

            // Reset consultancy-specific elements
            topicSection.style.display = 'none';
            consentSection.style.display = 'none';
            document.getElementById('topic').removeAttribute('required');
            document.getElementById('advisory-selected-datetime').removeAttribute('required');
            
            // Ensure domain and region selects are required for consultancy
            document.getElementById('domain-select').setAttribute('required', '');
            document.getElementById('region-select').setAttribute('required', '');

            // Clear session type selection for consultancy
            document.querySelectorAll('[data-type]').forEach(opt => opt.classList.remove('selected'));

            // If location is already selected, we might need to regenerate time slots when session type is selected
            const existingLocation = document.getElementById('location').value;
            if (existingLocation) {
                // Clear any existing time slots to avoid confusion
                document.getElementById('time-slots-container').innerHTML = '';
            }
        } else {
            sessionTypesSection.style.display = 'block';
            consultancySessions.style.display = 'none';
            advisoryMessage.style.display = 'block';
            advisoryDatetime.style.display = 'block';

            // Set advisory values
            document.getElementById('session-type').value = 'advisory-service';
            document.getElementById('advisory-selected-datetime').setAttribute('required', '');
            
            // Remove required from domain and region selects for advisory (they're hidden)
            document.getElementById('domain-select').removeAttribute('required');
            document.getElementById('region-select').removeAttribute('required');

            // Show required sections for advisory
            topicSection.style.display = 'block';
            consentSection.style.display = 'block';
            document.getElementById('topic').setAttribute('required', '');

            // Initialize advisory calendar
            initializeAdvisoryCalendar();
        }
    });
});


// Calendar variables
let currentCalendarDate = new Date();
let selectedDate = null;
let availableSlots = {};
let blockedDates = [];
let calendarInitialized = false;

// Advisory Calendar variables
let advisoryCurrentCalendarDate = new Date();
let advisorySelectedDate = null;
let advisoryCalendarInitialized = false;

// Initialize advisory calendar to start from appropriate month
function initializeAdvisoryCalendarDate() {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 7); // Advisory requires 7 days minimum
    
    // If the minimum date is in the next month, start calendar from next month
    if (minDate.getMonth() !== today.getMonth()) {
        advisoryCurrentCalendarDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    } else {
        advisoryCurrentCalendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
}

// FIXED: generateTimeSlots function restructured to correctly handle all session types
function generateTimeSlots(sessionType) {
    const container = document.getElementById('time-slots-container');
    const selectedDateDisplay = document.getElementById('selected-date-display');

    // Get selected location and determine timezone
    const location = document.getElementById('location').value;
    const customTimezone = document.getElementById('timezone-selector').value;

    if (!location) {
        container.innerHTML = '<div class="availability-notice"><i class="fas fa-info-circle"></i> Please select your region first to see available time slots</div>';
        return;
    }

    // Initialize calendar if not done already
    if (!calendarInitialized) {
        initializeCalendar();
        calendarInitialized = true;
    }

    // Always generate available slots data first, so the calendar can be displayed correctly
    generateAvailableSlots(sessionType, location, customTimezone);

    // Always update the calendar display with the new availability data
    updateCalendarDisplay();

    // Now, customize the time slot container UI based on the session type
    if (sessionType === 'super-specialized' || sessionType === 'long-term-engagement') {
        selectedDateDisplay.innerHTML = '<i class="fas fa-clock"></i> Special scheduling required';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'availability-notice';

        if (sessionType === 'long-term-engagement') {
            messageDiv.innerHTML = `
                <i class="fas fa-clock"></i>
                <strong>Long-term Projects Notice:</strong><br>
                We will contact you within 48-72 working hours to discuss your requirements and schedule the initial consultation for your 2-6 month engagement.
            `;
        } else {
            messageDiv.innerHTML = `
                <i class="fas fa-clock"></i>
                <strong>Super-Specialized Session Notice:</strong><br>
                We will get back to you in the next 48-72 working hours to schedule your in-person consultation.
            `;
        }

        container.innerHTML = '';
        container.appendChild(messageDiv);
        
        // FIX: Ensure the field is set and not required for special sessions
        const selectedSlotField = document.getElementById('selected-slot');
        selectedSlotField.removeAttribute('required');
        selectedSlotField.value = `${sessionType}-pending`;
    } else {
        // For other session types, show the time slots or a prompt to select a date
        if (!selectedDate) {
            container.innerHTML = '<div class="calendar-no-slots">Select a date from the calendar to view available time slots</div>';
            selectedDateDisplay.textContent = 'Select a date to view available time slots';
        } else {
            // If a date is already selected, display its slots (this handles changing session type while a date is selected)
            const dateKey = selectedDate.toISOString().split('T')[0];
            displayTimeSlotsForDate(dateKey);
        }
    }
}

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

    // Remove existing event listeners to prevent duplicates
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    // Clone and replace elements to remove all event listeners
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    // Add navigation event listeners
    document.getElementById('prev-month').addEventListener('click', () => {
        const today = new Date();
        const currentMonth = currentCalendarDate.getMonth();
        const currentYear = currentCalendarDate.getFullYear();

        // Calculate min allowed date (current month)
        const minAllowedMonth = today.getMonth();
        const minAllowedYear = today.getFullYear();

        // Calculate previous month
        const prevMonth = currentMonth - 1;
        const adjustedPrevMonth = prevMonth < 0 ? 11 : prevMonth;
        const adjustedPrevYear = prevMonth < 0 ? currentYear - 1 : currentYear;

        // Check if previous month is within allowed range
        if (adjustedPrevYear > minAllowedYear || (adjustedPrevYear === minAllowedYear && adjustedPrevMonth >= minAllowedMonth)) {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);

            // Clear previous date selection when changing month (no grid needed)
            selectedDate = null;
            document.getElementById('selected-date').value = '';
            const container = document.getElementById('time-slots-container');
            container.className = 'time-slots calendar-no-slots';
            container.innerHTML = '';
            container.textContent = 'Select a date from the calendar to view available time slots';
            document.getElementById('selected-date-display').textContent = 'Select a date to view available time slots';

            // Regenerate slots for the new month
            const sessionType = document.getElementById('session-type').value;
            const location = document.getElementById('location').value;
            const customTimezone = document.getElementById('timezone-selector').value;
            if (sessionType && location) {
                generateAvailableSlots(sessionType, location, customTimezone);
                console.log('2');
            }
            updateCalendarDisplay();
        }
    });

    document.getElementById('next-month').addEventListener('click', () => {
        const today = new Date();
        const currentMonth = currentCalendarDate.getMonth();
        const currentYear = currentCalendarDate.getFullYear();

        // Calculate max allowed date (3 months from today)
        const maxDate = new Date(today);
        maxDate.setMonth(today.getMonth() + 3);
        const maxAllowedMonth = maxDate.getMonth();
        const maxAllowedYear = maxDate.getFullYear();

        // Calculate next month
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

        // Check if next month is within allowed range
        if (nextYear < maxAllowedYear || (nextYear === maxAllowedYear && nextMonth <= maxAllowedMonth)) {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);

            // Clear previous date selection when changing month (no grid needed)
            selectedDate = null;
            document.getElementById('selected-date').value = '';
            const container = document.getElementById('time-slots-container');
            container.className = 'time-slots calendar-no-slots';
            container.innerHTML = '';
            container.textContent = 'Select a date from the calendar to view available time slots';
            document.getElementById('selected-date-display').textContent = 'Select a date to view available time slots';

            // Regenerate slots for the new month
            const sessionType = document.getElementById('session-type').value;
            const location = document.getElementById('location').value;
            const customTimezone = document.getElementById('timezone-selector').value;
            if (sessionType && location) {
                generateAvailableSlots(sessionType, location, customTimezone);
                console.log('3');
            }
            updateCalendarDisplay();
        }
    });

    updateCalendarDisplay();
}

// Global variables for date availability management
let availableDates = []; // Manually enabled dates (for weekdays)

// Function to clear potentially corrupted cached data
function clearAvailableDatesCache() {
    try {
        localStorage.removeItem('availableDates');
        localStorage.removeItem('availableDatesTimestamp');
        console.log('Available dates cache cleared');
    } catch (error) {
        console.warn('Error clearing available dates cache:', error);
    }
}

// Comprehensive diagnostic function for date availability issues
function diagnoseDateAvailability(dateString) {
    console.log('=== DATE AVAILABILITY DIAGNOSTIC ===');
    console.log(`Checking date: ${dateString}`);

    const date = new Date(dateString);
    if (isNaN(date)) {
        console.error('Invalid date format');
        return;
    }

    console.log(`Parsed date object: ${date}`);
    console.log(`ISO string: ${date.toISOString().split('T')[0]}`);
    console.log(`Day of week: ${date.getDay()} (0=Sunday, 6=Saturday)`);

    // Check blocked status
    const isBlocked = isDateBlocked(date);
    console.log(`Is blocked: ${isBlocked}`);
    if (isBlocked) {
        console.log('Blocked dates:', blockedDates);
    }

    // Check manual availability
    const isManuallyAvailable = isDateManuallyAvailable(date);
    console.log(`Is manually available: ${isManuallyAvailable}`);
    console.log('Available dates count:', availableDates.length);
    console.log('Available dates:', availableDates);

    // Check final availability for different session types
    const sessionTypes = ['generalized', 'super-specialized'];
    for (const sessionType of sessionTypes) {
        const isAvailable = isDateAvailable(date, sessionType);
        console.log(`Available for ${sessionType}: ${isAvailable}`);
    }

    console.log('=== END DIAGNOSTIC ===');
}

// Make diagnostic function globally available
window.diagnoseDateAvailability = diagnoseDateAvailability;

// Function to force refresh all date data and clear cache
async function refreshAllDateData() {
    console.log('🔄 Forcing refresh of all date data...');

    // Clear all cached data
    clearAvailableDatesCache();
    try {
        localStorage.removeItem('blockedDates');
        localStorage.removeItem('blockedDatesTimestamp');
    } catch (error) {
        console.warn('Error clearing blocked dates cache:', error);
    }

    // Reset arrays
    availableDates = [];
    blockedDates = [];

    // Fetch fresh data in parallel
    await Promise.all([fetchBlockedDates(), fetchAvailableDates()]);

    console.log('✅ Date data refreshed successfully');
    console.log(`Available dates: ${availableDates.length}`);
    console.log(`Blocked dates: ${blockedDates.length}`);

    // Regenerate calendar if it exists
    const sessionType = document.getElementById('session-type')?.value;
    const location = document.getElementById('location')?.value;
    const customTimezone = document.getElementById('timezone-selector')?.value;

    if (sessionType) {
        generateAvailableSlots(sessionType, location, customTimezone);
        console.log('4');
        updateCalendarDisplay();
    }

    return { availableDates: availableDates.length, blockedDates: blockedDates.length };
}

// Make refresh function globally available for debugging
window.refreshAllDateData = refreshAllDateData;

// Function to test if the available dates endpoint exists
async function testAvailableDatesEndpoint() {
    try {
        console.log('Testing available dates endpoint...');
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL + '?action=getAvailableDates&test=true', {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-cache'
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Available dates endpoint test result:', result);
            if (result.success && result.test) {
                console.log('Available dates endpoint is working correctly');
                return true;
            }
        }

        console.warn('Available dates endpoint returned unexpected response:', response.status);
        return false;
    } catch (error) {
        console.warn('Available dates endpoint test failed:', error.message);
        return false;
    }
}

// Function to fetch blocked dates and available dates from the server
async function fetchBlockedDates() {
    try {
        console.log('Fetching blocked dates from:', CONFIG.GOOGLE_SCRIPT_URL + '?action=getBlockedDates');

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
            blockedDates = result.data;
            console.log('Loaded blocked dates:', blockedDates.length);

            // Cache successful result
            try {
                localStorage.setItem('blockedDates', JSON.stringify(blockedDates));
                localStorage.setItem('blockedDatesTimestamp', Date.now().toString());
            } catch (storageError) {
                console.warn('Could not cache blocked dates:', storageError);
            }
        } else {
            console.log('No blocked dates found or error:', result.error);
            blockedDates = [];
        }
    } catch (error) {
        console.warn('Error fetching blocked dates, using fallback:', error);
        // Use localStorage as fallback
        try {
            const stored = localStorage.getItem('blockedDates');
            if (stored) {
                blockedDates = JSON.parse(stored);
                console.log('Using cached blocked dates:', blockedDates.length);
            } else {
                blockedDates = [];
            }
        } catch (storageError) {
            console.warn('Error accessing localStorage:', storageError);
            blockedDates = [];
        }
    }
}

// Function to fetch manually available dates from the server
// Function to refresh calendar and time slots data
async function refreshCalendarData() {
    console.log('Refreshing calendar data...');

    // Fetch both in parallel
    await Promise.all([
        fetchBlockedDates(),
        fetchAvailableDates().catch(err => {
            console.warn('Available dates endpoint not available during refresh. Using existing data.');
        })
    ]);

    // Get current session parameters
    const sessionType = document.getElementById('session-type').value;
    const location = document.getElementById('location').value;
    const customTimezone = document.getElementById('timezone-selector').value;

    // Regenerate available slots if session type is selected
    if (sessionType) {
        generateAvailableSlots(sessionType, location, customTimezone);
        console.log('5');
    }

    // Update calendar display
    updateCalendarDisplay();

    console.log('Calendar data refreshed');
}

// Global function to trigger calendar refresh from admin dashboard
window.refreshBookingCalendar = refreshCalendarData;

async function fetchAvailableDates() {
    try {
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

        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (parseError) {
            result = { success: true, data: [] };
        }

        if (result.success && result.data) {
            // Deduplicate available dates by date string to handle duplicate entries
            const dateMap = new Map();

            for (const dateEntry of result.data) {
                const dateStr = dateEntry.date;
                if (!dateStr) {
                    continue;
                }

                // Determine timestamp for comparison (handle missing timestamps)
                let entryTimestamp;
                if (dateEntry.timestamp) {
                    entryTimestamp = new Date(dateEntry.timestamp);
                } else if (dateEntry.createdAt) {
                    entryTimestamp = new Date(dateEntry.createdAt);
                } else {
                    // If no timestamp, use a very old date so newer entries with timestamps take priority
                    entryTimestamp = new Date('1900-01-01');
                }

                // Keep the most recent entry for each date
                if (!dateMap.has(dateStr)) {
                    dateMap.set(dateStr, { ...dateEntry, _resolvedTimestamp: entryTimestamp });
                } else {
                    const existing = dateMap.get(dateStr);
                    const existingTimestamp = existing._resolvedTimestamp;

                    if (entryTimestamp > existingTimestamp) {
                        dateMap.set(dateStr, { ...dateEntry, _resolvedTimestamp: entryTimestamp });
                    }
                }
            }

            // Convert back to array with only unique dates (remove helper timestamp)
            availableDates = Array.from(dateMap.values()).map(entry => {
                const { _resolvedTimestamp, ...cleanEntry } = entry;
                return cleanEntry;
            });

            console.log('Manually Available Dates from Spreadsheet:', availableDates);

            // Cache successful result
            try {
                localStorage.setItem('availableDates', JSON.stringify(availableDates));
                localStorage.setItem('availableDatesTimestamp', Date.now().toString());
            } catch (storageError) {
                console.warn('Could not cache available dates:', storageError);
            }
        } else {
            availableDates = [];
        }
    } catch (error) {
        console.warn('Error fetching available dates, using fallback:', error);
        // Use localStorage as fallback
        try {
            const stored = localStorage.getItem('availableDates');
            if (stored) {
                const rawCachedDates = JSON.parse(stored);

                // Deduplicate cached data as well
                const dateMap = new Map();
                for (const dateEntry of rawCachedDates) {
                    const dateStr = dateEntry.date;
                    if (!dateMap.has(dateStr)) {
                        dateMap.set(dateStr, dateEntry);
                    }
                }

                availableDates = Array.from(dateMap.values());
                console.log('Using cached available dates:', availableDates.length);
                console.log('Cached available dates details:', availableDates);

                if (rawCachedDates.length > availableDates.length) {
                    console.warn(`Deduplicated ${rawCachedDates.length - availableDates.length} duplicate entries from cache`);
                }
            } else {
                availableDates = [];
                console.log('No cached available dates found');
            }
        } catch (storageError) {
            console.warn('Error accessing localStorage:', storageError);
            availableDates = [];
        }
    }
    
    return availableDates;
}

// Function to check if a date is blocked
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

// Function to check if a date is manually made available
function isDateManuallyAvailable(date) {
    if (!availableDates || availableDates.length === 0) {
        console.log(`⚠️  No available dates loaded yet. Array length: ${availableDates ? availableDates.length : 'undefined'}`);
        return false;
    }

    // Convert input date to YYYY-MM-DD format using local timezone (no UTC conversion)
    let checkDateStr;
    if (date instanceof Date) {
        // Use local date methods to avoid timezone conversion
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        checkDateStr = `${year}-${month}-${day}`;
    } else if (typeof date === 'string') {
        // If string, try to parse and format using local methods
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate)) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const day = String(parsedDate.getDate()).padStart(2, '0');
            checkDateStr = `${year}-${month}-${day}`;
        } else {
            checkDateStr = date; // Assume already in YYYY-MM-DD format
        }
    } else {
        return false;
    }

    console.log(`🔍 Checking manual availability for date: ${checkDateStr}`);
    console.log(`📊 Available dates array:`, availableDates);

    // Check if date exists in available dates
    for (const availableDate of availableDates) {
        if (availableDate && availableDate.date) {
            let availDateStr = availableDate.date.trim();
            console.log(`📅 Processing available date entry:`, availableDate);
            console.log(`📅 Raw date string: "${availDateStr}"`);

            // Handle ISO date format (with time component)
            if (availDateStr.includes('T')) {
                // Simply extract the date part without timezone conversion
                // This avoids the timezone shift issue
                availDateStr = availDateStr.split('T')[0];
                console.log(`🔄 Extracted date part from ISO string: "${availDateStr}"`);
            }
            // Handle DD/MM/YYYY format if needed
            else if (availDateStr.includes('/')) {
                const parts = availDateStr.split('/');
                if (parts.length === 3) {
                    availDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
                console.log(`🔄 Converted DD/MM/YYYY to: "${availDateStr}"`);
            }
            // Handle date objects stored as strings
            else if (availDateStr.includes('Z') || availDateStr.includes('+')) {
                // Parse as Date and extract date part
                const parsedAvailDate = new Date(availDateStr);
                if (!isNaN(parsedAvailDate)) {
                    availDateStr = parsedAvailDate.toISOString().split('T')[0];
                }
                console.log(`🔄 Converted date object to: "${availDateStr}"`);
            }

            console.log(`Comparing: ${checkDateStr} === ${availDateStr} -> ${checkDateStr === availDateStr}`);
            
            if (checkDateStr === availDateStr) {
                console.log(`✅ Manual date match found: ${availDateStr}`);
                return true;
            }
        }
    }

    console.log(`❌ No manual date match found for: ${checkDateStr}`);
    return false;
}

// FIXED: isDateAvailable function rewritten for clarity and correctness
function isDateAvailable(date, sessionType) {
    // STEP 1: If a date is manually made available, it overrides all other rules.
    if (isDateManuallyAvailable(date)) {
        return true;
    }

    // STEP 2: If a date is blocked (and not manually overridden), it is unavailable.
    if (isDateBlocked(date)) {
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

        // Check if date is available (including manual overrides)
        const isAvailableForBooking = isDateAvailable(date, sessionType) || isDateManuallyAvailable(date);
        
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
}

function updateCalendarDisplay() {
    const calendarTitle = document.getElementById('calendar-title');
    const calendarGrid = document.getElementById('calendar-grid');

    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    calendarTitle.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;

    // Update navigation buttons state
    const today = new Date();
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();

    // Disable previous button if we're at current month
    const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();
    prevBtn.disabled = isCurrentMonth;

    // Disable next button if we're at 3 months from now
    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 3);
    const maxAllowedMonth = maxDate.getMonth();
    const maxAllowedYear = maxDate.getFullYear();

    const isMaxMonth = currentYear === maxAllowedYear && currentMonth === maxAllowedMonth;
    nextBtn.disabled = isMaxMonth;

    // Clear existing calendar days (keep headers)
    const dayElements = calendarGrid.querySelectorAll('.calendar-day');
    dayElements.forEach(el => el.remove());

    // Generate calendar days
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    for (let i = 0; i < 42; i++) { // 6 weeks
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();

        const dateKey = getLocalDateKey(date);
        const isCurrentMonthDay = date.getMonth() === currentCalendarDate.getMonth();
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < today && !isToday;

        // Get current session type to check availability
        const sessionType = document.getElementById('session-type').value;
        const isDateAvailableForSession = sessionType ? isDateAvailable(date, sessionType) : false;
        const hasSlots = availableSlots[dateKey] && availableSlots[dateKey].length > 0;

        if (!isCurrentMonthDay) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        // **CORRECTED LOGIC STARTS HERE**
        // The primary check is for overall availability.
        if (isCurrentMonthDay && !isPast && isDateAvailableForSession && hasSlots) {
            dayElement.classList.add('available');
            dayElement.addEventListener('click', () => selectCalendarDate(date, dayElement));
        } else {
            // If not available, then determine why it's disabled.
            dayElement.classList.add('disabled');
            
            // Check if date is a weekend
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            // Only show as "blocked" if:
            // 1. The date is actually in the blocked list
            // 2. It's NOT manually made available
            // 3. It's NOT a weekend that's already unavailable by default for this session type
            const shouldShowAsBlocked = isDateBlocked(date) && !isDateManuallyAvailable(date);
            
            // For non-super-specialized sessions, weekends are unavailable by default
            // So if a weekend is in the blocked range, don't show it as "blocked" (red)
            // Instead show it as regular unavailable (gray)
            const isDefaultUnavailableWeekend = isWeekend && sessionType !== 'super-specialized';
            
            if (shouldShowAsBlocked && !isDefaultUnavailableWeekend) {
                // Style specifically for blocked dates that are not default unavailable weekends
                dayElement.title = 'This date is blocked for booking';
                dayElement.style.background = '#ffebee';
                dayElement.style.color = '#c62828';
            } else if (isPast) {
                // Style for past dates
                dayElement.title = 'This date is in the past';
            } else {
                // General unavailable style (includes default unavailable weekends)
                dayElement.title = 'This date is not available for booking';
            }
        }
        // **CORRECTED LOGIC ENDS HERE**

        // Apply selected class if this date matches the currently selected date
        if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }

        calendarGrid.appendChild(dayElement);
    }
}

function selectCalendarDate(date, element) {
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        // If it's the same date, this is a DESELECTION action.
        clearDateSelection();
        return; // Stop the function here.
    }

    // Remove previous selection from all calendar days
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selection to clicked element with enhanced visual feedback
    element.classList.add('selected');

    // Add a temporary highlight effect
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow - intentionally using expression  
    element.style.animation = 'selectedPulse 0.3s ease-out';

    // Store the selected date globally
    selectedDate = new Date(date);
    const dateKey = getLocalDateKey(date);

    // Update selected date display
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    selectedDateDisplay.innerHTML = `<i class="fas fa-calendar-check"></i> ${date.toLocaleDateString('en-US', options)}`;

    // Update time slots
    displayTimeSlotsForDate(dateKey);

    // Store selected date in form
    document.getElementById('selected-date').value = dateKey;

    // Clear any previously selected time slot when selecting a new date
    document.getElementById('selected-slot').value = '';
    if (document.getElementById('selected-time')) {
        document.getElementById('selected-time').value = '';
    }
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
}

/**
 * Clears the currently selected date and resets related UI elements.
 */
function clearDateSelection() {
    // 1. Remove the visual 'selected' class from the calendar day
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // 2. Clear the global selectedDate variable
    selectedDate = null;

    // 3. Clear the hidden form inputs
    document.getElementById('selected-date').value = '';
    document.getElementById('selected-slot').value = '';
    if (document.getElementById('selected-time')) {
        document.getElementById('selected-time').value = '';
    }

    // 4. Reset the selected date display text
    const selectedDateDisplay = document.getElementById('selected-date-display');
    selectedDateDisplay.textContent = 'Select a date to view available time slots';

    // 5. Reset the time slots container to its initial state (no grid needed)
    const container = document.getElementById('time-slots-container');
    container.className = 'time-slots calendar-no-slots';
    container.innerHTML = '';
    container.textContent = 'Select a date from the calendar to view available time slots';
}

function displayTimeSlotsForDate(dateKey) {
    const container = document.getElementById('time-slots-container');
    const slots = availableSlots[dateKey];

    if (!slots || slots.length === 0) {
        // Apply no-slots styling directly to the container (no grid)
        container.innerHTML = '';
        container.className = 'time-slots calendar-no-slots';
        container.textContent = 'No available time slots for this date';
        return;
    }

    // Reset container class and add has-slots for grid styling
    container.className = 'time-slots has-slots';
    container.innerHTML = '';

    // Get timezone info for display
    const location = document.getElementById('location').value;
    const customTimezone = document.getElementById('timezone-selector').value;
    let timezoneDisplayName;

    if (customTimezone) {
        timezoneDisplayName = getTimezoneDisplayName(customTimezone);
    } else {
        timezoneDisplayName = getLocationDisplayName(location);
    }

    // Get separate timezone notice container
    const timezoneNoticeWrapper = document.getElementById('timezone-notice-wrapper');
    if (timezoneNoticeWrapper) {
        // Clear and populate the separate timezone notice container
        timezoneNoticeWrapper.innerHTML = '';
        
        const noticeDiv = document.createElement('div');
        noticeDiv.className = 'calendar-availability-notice';
        noticeDiv.innerHTML = `
            <i class="fas fa-globe"></i>
            <div class="timezone-info">
                <strong>Timezone:</strong>
                <span>All times shown are in ${timezoneDisplayName}</span>
            </div>
        `;
        timezoneNoticeWrapper.appendChild(noticeDiv);
    }

    // Use the time-slots-container directly as grid
    container.innerHTML = '';

    // Create and add all time slot buttons directly to the container
    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'time-slot';
        slotDiv.innerHTML = `
            <strong>${slot.time}</strong>
            <span class="time-slot-timezone">${slot.timezone}</span>
        `;
        slotDiv.addEventListener('click', () => selectTimeSlot(slotDiv, slot.value));
        
        container.appendChild(slotDiv);
    });
}

// Helper function to check if a specific date-time slot is booked
// Booked sessions slot checking removed due to timezone complications

function getTimezoneDisplayName(timezone) {
    const displayNames = {
        'Asia/Dubai': 'Middle East (GST)',
        'Europe/London': 'European Standard Time (GMT/BST)',
        'America/New_York': 'Eastern Standard Time - US (EST/EDT)',
        'Asia/Kolkata': 'India (IST)',
        'Asia/Tokyo': 'Japan (JST)'
    };
    return displayNames[timezone] || timezone;
}

function getTimezoneForLocation(location) {
    const timezoneMap = {
        'middle-east': 'Asia/Dubai',      // UTC+4
        'europe': 'Europe/London',        // UTC+0/+1 (depends on DST)
        'us': 'America/New_York',         // UTC-5/-4 (depends on DST)
        'india': 'Asia/Kolkata',          // UTC+5:30
        'japan': 'Asia/Tokyo'             // UTC+9
    };
    return timezoneMap[location];
}

function convertISTToUserTimezone(date, timeIST, userTimezone) {
    try {
        // Create a date object in IST
        const [hours, minutes] = timeIST.split(':');
        const istDate = new Date(date);
        istDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Convert IST to UTC first
        const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000)); // IST is UTC+5:30

        // Convert UTC to user's timezone
        const userTimeString = utcDate.toLocaleString('en-US', {
            timeZone: userTimezone,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Extract date and time parts
        const parts = userTimeString.split(', ');
        const datePart = parts[0] + ', ' + parts[1];
        const timePart = parts[2];

        // Get timezone abbreviation
        const timezoneAbbr = getTimezoneAbbreviation(userTimezone);

        return {
            date: datePart,
            time: timePart,
            timezone: timezoneAbbr,
            fullDateTime: utcDate.toLocaleString('en-US', { timeZone: userTimezone })
        };
    } catch (error) {
        console.error('Error converting timezone:', error);
        return null;
    }
}

function getTimezoneAbbreviation(timezone) {
    const abbreviations = {
        'Asia/Dubai': 'GST',
        'Europe/London': 'GMT/BST',
        'America/New_York': 'EST/EDT',
        'Asia/Kolkata': 'IST',
        'Asia/Tokyo': 'JST'
    };
    return abbreviations[timezone] || timezone;
}

function getLocationDisplayName(location) {
    const displayNames = {
        'middle-east': 'Middle East (GST)',
        'europe': 'European Standard Time (GMT/BST)',
        'us': 'Eastern Standard Time - US (EST/EDT)',
        'india': 'India (IST)',
        'japan': 'Japan (JST)'
    };
    return displayNames[location] || location;
}

function selectTimeSlot(element, value) {
    const currentSelectedSlotValue = document.getElementById('selected-slot').value;
    if (currentSelectedSlotValue === value) {
        clearTimeSlotSelection();
        return;
    }
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    element.classList.add('selected');

    document.getElementById('selected-slot').value = value;
    const timeMatch = value.match(/(\d{2}:\d{2}:\d{2})/);
    if (timeMatch && document.getElementById('selected-time')) {
        document.getElementById('selected-time').value = timeMatch[1];
    }
}

function clearTimeSlotSelection() {
    // 1. Remove the 'selected' class from any visually selected time slot
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });

    // 2. Clear the hidden form inputs that store the time selection
    document.getElementById('selected-slot').value = '';

    // Also clear the secondary 'selected-time' input if it exists
    if (document.getElementById('selected-time')) {
        document.getElementById('selected-time').value = '';
    }
}

// Session type selection
document.querySelectorAll('[data-type]').forEach(option => {
    option.addEventListener('click', function () {
        document.querySelectorAll('[data-type]').forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');

        const sessionType = this.dataset.type;
        document.getElementById('session-type').value = sessionType;
        document.getElementById('session-type').setAttribute('required', '');

        // Generate dynamic questions - FIXED: Show "What is covered" section immediately after session type selection
        const questionsContainer = document.getElementById('dynamic-questions');
        const additionalQuestionsContainer = document.getElementById('additional-dynamic-questions');
        questionsContainer.innerHTML = '';
        additionalQuestionsContainer.innerHTML = '';

        if (sessionQuestions[sessionType]) {
            questionsContainer.style.display = 'block';

            // FIXED: Add "What is covered" section first, right after session type selection
            if (sessionDescriptions[sessionType]) {
                const descriptionDiv = document.createElement('div');
                descriptionDiv.className = 'form-group';
                descriptionDiv.innerHTML = `
      <div class="session-description" style="background: rgba(52, 152, 219, 0.1); border: 1px solid rgba(52, 152, 219, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <h6 style="color: #3498db; margin-bottom: 0.5rem;">${sessionDescriptions[sessionType].title}</h6>
        <div style="color: #333;">${sessionDescriptions[sessionType].content}</div>
      </div>
    `;
                questionsContainer.appendChild(descriptionDiv);
            }

            // Add topic question to the main dynamic-questions container (shows before domain/region)
            if (sessionType === 'generalized' || sessionType === 'super-specialized' || sessionType === 'long-term-engagement') {
                const topicDiv = document.createElement('div');
                topicDiv.className = 'form-group';
                topicDiv.id = 'dynamic-topic-container';
                topicDiv.innerHTML = `
      <label class="form-label" for="dynamic-topic">What do you want to talk about? <span class="mandatory">*</span> <span style="font-size: 0.85rem; color: var(--accent-color); font-weight: normal; font-style: italic;">
        <i class="fas fa-info-circle"></i> Please ask your question in 50-100 words.
      </span></label>
      <textarea class="form-control" id="dynamic-topic" name="dynamic-topic" rows="4" required
        placeholder="Please describe the topics you'd like to discuss..."></textarea>
    `;
                questionsContainer.appendChild(topicDiv);
            }
        } else {
            questionsContainer.style.display = 'none';
        }

        // Show domain selection for specialized sessions
        const domainSelection = document.getElementById('domain-selection');
        const domainSelect = document.getElementById('domain-select');
        const customDomainInput = document.getElementById('custom-domain-input');
        
        if (sessionType === 'generalized' || sessionType === 'specialized' || sessionType === 'super-specialized') {
            domainSelection.style.display = 'block';
            document.getElementById('selected-domains').setAttribute('required', '');
            if (domainSelect) domainSelect.setAttribute('required', '');
        } else {
            domainSelection.style.display = 'none';
            document.getElementById('selected-domains').removeAttribute('required');
            // FIX: Remove required from domain-select dropdown for long-term engagement
            if (domainSelect) {
                domainSelect.removeAttribute('required');
                domainSelect.value = '';
            }
            if (customDomainInput) customDomainInput.removeAttribute('required');
            document.getElementById('selected-domains').value = '';
            hideCustomDomainInput(); // Hide custom input if visible
        }

        const regionSelection = document.getElementById('region-selection');
        const regionSelect = document.getElementById('region-select');
        const customRegionInput = document.getElementById('custom-region-domain-input');
        
        if (sessionType === 'generalized' || sessionType === 'specialized' || sessionType === 'super-specialized') {
            regionSelection.style.display = 'block';
            if (regionSelect) regionSelect.setAttribute('required', '');
            document.getElementById('selected-regions').setAttribute('required', '');
        } else {
            regionSelection.style.display = 'none';
            // FIX: Remove required from region-select dropdown for long-term engagement
            if (regionSelect) {
                regionSelect.removeAttribute('required');
                regionSelect.value = '';
            }
            if (customRegionInput) customRegionInput.removeAttribute('required');
            document.getElementById('selected-regions').removeAttribute('required');
            document.getElementById('selected-regions').value = '';
            hideCustomRegionInput(); // Hide custom input if visible
        }

        // Reset region selection (this was duplicated, keeping it for other cases)
        if (sessionType !== 'long-term-engagement') {
            const regionSelect = document.getElementById('region-select');
            if (regionSelect) regionSelect.value = '';
            document.getElementById('selected-regions').value = '';
            hideCustomRegionInput();
        }

        // FIX: Handle selected-slot field for special session types
        const selectedSlotField = document.getElementById('selected-slot');
        if (sessionType === 'super-specialized' || sessionType === 'long-term-engagement') {
            // Remove required attribute for special sessions that don't need time slot selection
            selectedSlotField.removeAttribute('required');
            // Set the value immediately to prevent validation issues
            selectedSlotField.value = `${sessionType}-pending`;
        } else {
            // Add back required attribute for regular sessions
            selectedSlotField.setAttribute('required', '');
            // Clear the value so user must select a time slot
            selectedSlotField.value = '';
        }

        // Always show topic section for consultancy
        // FIXED: Handle topic section visibility and required attribute properly
        const topicSection = document.getElementById('topic-section');
        const topicTextarea = document.getElementById('topic');

        // Hide topic section for consultancy sessions (it will be shown in dynamic questions if needed)
        topicSection.style.display = 'none';
        topicTextarea.removeAttribute('required'); // Remove required attribute when hidden

        document.querySelector('.consent-section').style.display = 'block';

        // Continue with additional dynamic questions after domain/region selection
        if (sessionQuestions[sessionType]) {
            additionalQuestionsContainer.style.display = 'block';

            sessionQuestions[sessionType].forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'form-group';

                const isRequired = sessionType === 'super-specialized' || sessionType === 'long-term-engagement';
                const requiredAttribute = isRequired ? 'required' : '';
                const mandatorySpan = isRequired ? '<span class="mandatory">*</span>' : '';

                // Get proper field name for this question
                const fieldName = questionFieldMapping[question] || `dynamic-q${index}`;

                if (question === 'Are you looking for general guidance or specific insights?') {
                    questionDiv.innerHTML = `
    <label class="form-label">${question} <span class="mandatory">*</span></label>
    <div style="display: flex; gap: 2rem; margin-top: 0.5rem;">
      <div class="form-check">
        <input class="form-check-input" type="radio" name="guidance-type" id="guidance-general" value="general" required>
        <label class="form-check-label" for="guidance-general">General Guidance</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="guidance-type" id="guidance-specific" value="specific" required>
        <label class="form-check-label" for="guidance-specific">Specific Insights</label>
      </div>
    </div>
  `;
                    // Append the div now so we can add listeners to its elements
                    additionalQuestionsContainer.appendChild(questionDiv);

                    // Add listener for "General Guidance" to remove the textarea if it exists
                    document.getElementById('guidance-general').addEventListener('change', function () {
                        const detailsDiv = document.getElementById('guidance-details');
                        if (detailsDiv) {
                            detailsDiv.remove();
                        }
                    });

                    // Add listener for "Specific Insights" to show the textarea
                    document.getElementById('guidance-specific').addEventListener('change', function () {
                        // Prevent adding multiple textareas by checking if one exists
                        if (!document.getElementById('guidance-details')) {
                            const detailsDiv = document.createElement('div');
                            detailsDiv.className = 'form-group';
                            detailsDiv.id = 'guidance-details';
                            detailsDiv.style.marginTop = '1rem';
                            detailsDiv.innerHTML = `
        <label class="form-label" for="guidance-details-text">Please explain in 50-100 words <span class="mandatory">*</span></label>
        <textarea class="form-control" id="guidance-details-text" name="specific-insights-details" rows="3" 
                  placeholder="Please provide details..." required></textarea>
      `;
                            // Append the new textarea to the question's container div
                            questionDiv.appendChild(detailsDiv);
                        }
                    });

                    // Return here to prevent this questionDiv from being appended a second time at the end of the loop
                    return;
                } else if (question.startsWith('Is ')) {
                    // Handle "Is" questions with Yes/No radio buttons
                    // Create proper detail field name mapping
                    let detailsFieldName;
                    if (fieldName === 'geopolitical-situation') {
                        detailsFieldName = 'geopolitical-details';
                    } else if (fieldName === 'specific-entity') {
                        detailsFieldName = 'entity-details';
                    } else if (fieldName === 'policy-directive') {
                        detailsFieldName = 'policy-directive-details';
                    } else if (fieldName === 'use-case') {
                        detailsFieldName = 'use-case-details';
                    } else if (fieldName === 'additional-info') {
                        detailsFieldName = 'additional-info-details';
                    } else {
                        detailsFieldName = fieldName + '-details';
                    }

                    questionDiv.innerHTML = `
    <label class="form-label">${question} <span class="mandatory">*</span></label>
    <div style="display: flex; gap: 2rem; margin-top: 0.5rem; margin-bottom: 1rem;">
      <div class="form-check">
        <input class="form-check-input" type="radio" name="${fieldName}" id="${fieldName}-yes" value="yes" required>
        <label class="form-check-label" for="${fieldName}-yes">Yes</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="${fieldName}" id="${fieldName}-no" value="no" required>
        <label class="form-check-label" for="${fieldName}-no">No</label>
      </div>
    </div>
    <div class="form-group" id="${fieldName}-details-container" style="display: none;">
      <label class="form-label" for="${fieldName}-details-text">Please mention: <span class="mandatory">*</span> </label>
      <input class="form-control" id="${fieldName}-details-text" name="${detailsFieldName}" rows="3" placeholder="Please provide details..." required></input>
    </div>
  `;

                    // Add event listeners after appending to DOM
                    additionalQuestionsContainer.appendChild(questionDiv);

                    // Add event listeners for Yes/No radio buttons
                    document.getElementById(`${fieldName}-yes`).addEventListener('change', function () {
                        if (this.checked) {
                            document.getElementById(`${fieldName}-details-container`).style.display = 'block';
                            document.getElementById(`${fieldName}-details-text`).setAttribute('required', '');
                        }
                    });

                    document.getElementById(`${fieldName}-no`).addEventListener('change', function () {
                        if (this.checked) {
                            document.getElementById(`${fieldName}-details-container`).style.display = 'none';
                            document.getElementById(`${fieldName}-details-text`).removeAttribute('required');
                            document.getElementById(`${fieldName}-details-text`).value = '';
                        }
                    });

                    return; // Skip the appendChild at the end since we already did it
                } else {
                    // Handle regular text input questions
                    questionDiv.innerHTML = `
      <label class="form-label" for="${fieldName}">${question} ${mandatorySpan}</label>
      <input type="text" class="form-control" id="${fieldName}" name="${fieldName}" 
             placeholder="Your answer..." ${requiredAttribute}>
    `;
                }
                if (!question.startsWith('Is ')) {
                    additionalQuestionsContainer.appendChild(questionDiv);
                }
            });
        }

        document.querySelector('.consent-section').style.display = 'block';

        // Generate time slots for schedule tab (only for consultancy)
        const category = document.getElementById('service-category').value;
        const location = document.getElementById('location').value;
        if (category === 'consultancy' && location) {
            // Clear any existing calendar selections when changing session type
            selectedDate = null;
            document.getElementById('selected-date').value = '';
            
            // FIX: Don't clear selected-slot for special session types - it will be set by generateTimeSlots
            // Only clear it for regular sessions that require time slot selection
            if (sessionType !== 'super-specialized' && sessionType !== 'long-term-engagement') {
                document.getElementById('selected-slot').value = '';
            }
            
            document.getElementById('time-slots-container').innerHTML = '';
            document.getElementById('selected-date-display').innerHTML = 'Select a date to view available time slots';

            // Remove selected class from all calendar days
            document.querySelectorAll('.calendar-day.selected').forEach(el => {
                el.classList.remove('selected');
            });

            generateTimeSlots(sessionType);
        }
    });
});

let selectedDomains = [];

// Domain dropdown selection functionality (wrapped in DOMContentLoaded)
document.addEventListener('DOMContentLoaded', function () {
    const domainSelect = document.getElementById('domain-select');
    if (domainSelect) {
        domainSelect.addEventListener('change', function () {
            const domain = this.value;

            // Set value to hidden input
            document.getElementById('selected-domains').value = domain;

            // Show text input if "Others" is selected
            if (domain === 'others') {
                showCustomDomainInput();
            } else {
                hideCustomDomainInput();
            }
        });
    }
});

function showCustomDomainInput() {
    const container = document.getElementById('custom-domain-container');
    if (container) {
        container.style.display = 'block';
        document.getElementById('custom-domain-input').required = true;
    }
}

function hideCustomDomainInput() {
    const container = document.getElementById('custom-domain-container');
    if (container) {
        container.style.display = 'none';
        document.getElementById('custom-domain-input').required = false;
        document.getElementById('custom-domain-input').value = '';
    }
}

// Email validation
document.getElementById('email').addEventListener('blur', function () {
    const email = this.value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (email && !emailRegex.test(email)) {
        this.setCustomValidity('Please enter a valid email address');
        this.classList.add('is-invalid');
    } else {
        this.setCustomValidity('');
        this.classList.remove('is-invalid');
    }
});

// Region dropdown selection functionality (wrapped in DOMContentLoaded)
document.addEventListener('DOMContentLoaded', function () {
    const regionSelect = document.getElementById('region-select');
    if (regionSelect) {
        regionSelect.addEventListener('change', function () {
            const region = this.value;

            // Set value to hidden input
            document.getElementById('selected-regions').value = region;

            // Show text input if "Others" is selected
            if (region === 'others') {
                showCustomRegionInput();
            } else {
                hideCustomRegionInput();
            }
        });
    }
});

function showCustomRegionInput() {
    const container = document.getElementById('custom-region-domain-container');
    if (container) {
        container.style.display = 'block';
        document.getElementById('custom-region-domain-input').required = true;
    }
}

function hideCustomRegionInput() {
    const container = document.getElementById('custom-region-domain-container');
    if (container) {
        container.style.display = 'none';
        document.getElementById('custom-region-domain-input').required = false;
        document.getElementById('custom-region-domain-input').value = '';
    }
}

// Phone number validation
document.getElementById('phone').addEventListener('input', function () {
    // Remove non-numeric characters except + at the beginning
    let value = this.value.replace(/[^\d+]/g, '');
    if (value.length > 1) {
        value = value.charAt(0) === '+' ? '+' + value.slice(1).replace(/[^\d]/g, '') : value.replace(/[^\d]/g, '');
    }
    this.value = value;
});

document.getElementById('phone').addEventListener('blur', function () {
    const phone = this.value;
    const phoneRegex = /^[+]?\d{10,15}$/;

    if (phone && !phoneRegex.test(phone)) {
        this.setCustomValidity('Please enter a valid phone number (10-15 digits)');
        this.classList.add('is-invalid');
    } else {
        this.setCustomValidity('');
        this.classList.remove('is-invalid');
    }
});



function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// Tab navigation
function showTab(tabIndex) {

    scrollToTop();


    const tabs = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    const steps = document.querySelectorAll('.step');

    tabs.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    steps.forEach(step => step.classList.remove('active', 'completed'));

    tabs[tabIndex].classList.add('active');
    tabButtons[tabIndex].classList.add('active');
    steps[tabIndex].classList.add('active');

    // Mark previous steps as completed
    for (let i = 0; i < tabIndex; i++) {
        steps[i].classList.add('completed');
    }

    // Get current service category to determine button display
    const category = document.getElementById('service-category').value;

    // Initialize calendar when schedule tab is shown
    if (tabIndex === 2 && category === 'consultancy') {
        const sessionType = document.getElementById('session-type').value;
        const location = document.getElementById('location').value;

        if (sessionType && location) {
            // Initialize calendar if first time
            if (!calendarInitialized) {
                initializeCalendar();
                calendarInitialized = true;
            }
            generateTimeSlots(sessionType);
        }
    }

    // Re-initialize checkboxes when session details tab is shown
    if (tabIndex === 1) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            initializeCustomCheckboxes();
        }, 100);
    }

    // Update navigation buttons
    document.getElementById('prev-btn').style.display = tabIndex > 0 ? 'block' : 'none';

    // For advisory: show submit button on tab 1 (second tab), hide next button
    // For consultancy: show next button on tabs 0 and 1, submit button on tab 2
    if (category === 'advisory') {
        document.getElementById('next-btn').style.display = tabIndex < 1 ? 'block' : 'none';
        document.getElementById('submit-btn').style.display = tabIndex >= 1 ? 'block' : 'none';
        if (currentTab >= 1) {
            document.getElementById('next-btn').style.display = 'none';
            document.getElementById('submit-btn').style.display = 'block';
        }
    } else if (category === 'consultancy') {
        document.getElementById('next-btn').style.display = tabIndex < totalTabs - 1 ? 'block' : 'none';
        document.getElementById('submit-btn').style.display = tabIndex === totalTabs - 1 ? 'block' : 'none';
    } else {
        // Default state when no category is selected (initial load)
        document.getElementById('next-btn').style.display = tabIndex < 2 ? 'block' : 'none';
        document.getElementById('submit-btn').style.display = 'none';
    }

    // Update region display when showing schedule tab
    if (tabIndex === 2) {
        updateSelectedRegionDisplay();
        // Show CAPTCHA section on the schedule tab (last tab)
        document.getElementById('captcha-section').style.display = 'block';
        // Also regenerate time slots to ensure they're current
        const sessionType = document.getElementById('session-type').value;
        if (sessionType && sessionType !== 'advisory-service') {
            generateTimeSlots(sessionType);
        }
    } else {
        // For advisory forms (2 tabs total), show CAPTCHA on tab 1 (last tab)
        const serviceCategory = document.getElementById('service-category').value;
        if (serviceCategory === 'advisory' && tabIndex === 1) {
            document.getElementById('captcha-section').style.display = 'block';
        } else {
            // Hide CAPTCHA section on other tabs
            document.getElementById('captcha-section').style.display = 'none';
        }
    }

    // Scroll form-tabs horizontally to show active tab on mobile
    scrollFormTabsToActiveTab(tabIndex);
}

/**
 * Scrolls the form-tabs container horizontally to ensure the active tab is visible
 * This is especially important on mobile devices where tabs might overflow
 */
function scrollFormTabsToActiveTab(tabIndex) {
    const formTabsContainer = document.querySelector('.form-tabs');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    if (!formTabsContainer || !tabButtons[tabIndex]) {
        return;
    }

    // Get the active tab button
    const activeTabButton = tabButtons[tabIndex];
    
    // Add a small delay to ensure DOM is updated
    setTimeout(() => {
        // Check if scrolling is necessary (container is overflowing)
        const isScrollable = formTabsContainer.scrollWidth > formTabsContainer.clientWidth;
        
        if (!isScrollable) {
            return; // No need to scroll if content fits
        }

        // Get container and tab dimensions
        const containerWidth = formTabsContainer.clientWidth;
        const containerScrollLeft = formTabsContainer.scrollLeft;
        
        // Get active tab position relative to the container
        const tabOffsetLeft = activeTabButton.offsetLeft;
        const tabWidth = activeTabButton.offsetWidth;
        
        // Calculate if the tab is fully visible
        const tabStart = tabOffsetLeft;
        const tabEnd = tabOffsetLeft + tabWidth;
        const viewStart = containerScrollLeft;
        const viewEnd = containerScrollLeft + containerWidth;
        
        let newScrollPosition = containerScrollLeft;
        
        // If tab is partially or completely hidden on the left
        if (tabStart < viewStart) {
            newScrollPosition = tabStart - 20; // Add 20px padding
        }
        // If tab is partially or completely hidden on the right
        else if (tabEnd > viewEnd) {
            newScrollPosition = tabEnd - containerWidth + 20; // Add 20px padding
        }
        // If tab is already fully visible, center it for better UX
        else {
            // Center the active tab in the container
            newScrollPosition = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);
        }
        
        // Ensure scroll position is within valid bounds
        const maxScrollLeft = formTabsContainer.scrollWidth - containerWidth;
        newScrollPosition = Math.max(0, Math.min(newScrollPosition, maxScrollLeft));
        
        // Apply smooth scrolling to the calculated position
        formTabsContainer.scrollTo({
            left: newScrollPosition,
            behavior: 'smooth'
        });
        
        // Add subtle visual feedback only on mobile
        if (window.innerWidth <= 768) {
            formTabsContainer.style.transition = 'box-shadow 0.3s ease';
            formTabsContainer.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.2)';
            
            // Remove the highlight effect after scrolling completes
            setTimeout(() => {
                formTabsContainer.style.boxShadow = '';
                setTimeout(() => {
                    formTabsContainer.style.transition = '';
                }, 300);
            }, 600);
        }
        
    }, 100); // Small delay to ensure layout is complete
}

// Tab button clicks
document.querySelectorAll('.tab-button').forEach((button, index) => {
    button.addEventListener('click', () => {
        if (index <= currentTab || validateCurrentTab()) {
            currentTab = index;
            showTab(currentTab);
        }
    });
});

// Navigation button clicks
document.getElementById('next-btn').addEventListener('click', () => {
    if (validateCurrentTab() && currentTab < totalTabs - 1) {
        currentTab++;
        showTab(currentTab);
    }
});

document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentTab > 0) {
        currentTab--;
        showTab(currentTab);
    }
});

document.getElementById('location').addEventListener('change', function () {
    const customRegionContainer = document.getElementById('custom-region-container');
    const customRegionInput = document.getElementById('custom-region');

    if (this.value === 'others') {
        customRegionContainer.style.display = 'block';
        customRegionInput.setAttribute('required', '');
    } else {
        customRegionContainer.style.display = 'none';
        customRegionInput.removeAttribute('required');
        customRegionInput.value = '';
    }

    // Update the display in schedule tab
    updateSelectedRegionDisplay();

    // Regenerate time slots with new region
    const sessionType = document.getElementById('session-type').value;
    if (sessionType && sessionType !== 'advisory-service') {
        generateTimeSlots(sessionType);
    }
});

document.getElementById('timezone-selector').addEventListener('change', function () {
    updateSelectedRegionDisplay();
    const sessionType = document.getElementById('session-type').value;
    if (sessionType && sessionType !== 'advisory-service') {
        generateTimeSlots(sessionType);
    }
});

document.getElementById('custom-region').addEventListener('input', function () {
    updateSelectedRegionDisplay();

    // Regenerate time slots with new region
    const sessionType = document.getElementById('session-type').value;
    if (sessionType && sessionType !== 'advisory-service') {
        generateTimeSlots(sessionType);
    }
});

function updateSelectedRegionDisplay() {
    const locationSelect = document.getElementById('location');
    const customRegion = document.getElementById('custom-region').value;
    const customTimezone = document.getElementById('timezone-selector').value;
    const displayElement = document.getElementById('display-selected-region');

    let displayText = '';

    if (locationSelect.value === 'others' && customRegion) {
        displayText = customRegion;
    } else if (locationSelect.value) {
        const selectedOption = locationSelect.options[locationSelect.selectedIndex];
        displayText = selectedOption.text;
    } else {
        displayText = 'Not selected';
    }

    // Add timezone info if custom timezone is selected
    if (customTimezone) {
        const timezoneDisplayName = getTimezoneDisplayName(customTimezone);
        displayText += ` (${timezoneDisplayName})`;
    }

    displayElement.textContent = displayText;
}

// Form validation for current tab
function validateCurrentTab() {
    const currentTabContent = document.querySelectorAll('.tab-content')[currentTab];

    // Get only visible required inputs to avoid the focusability issue
    const requiredInputs = currentTabContent.querySelectorAll('input[required], textarea[required], select[required]');
    const visibleRequiredInputs = Array.from(requiredInputs).filter(input => {
        return input.offsetParent !== null &&
            window.getComputedStyle(input).display !== 'none' &&
            window.getComputedStyle(input.parentElement).display !== 'none';
    });

    if (currentTab === 0) {
        // Validate email
        const email = document.getElementById('email').value;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (email && !emailRegex.test(email)) {
            showCustomAlert('Please enter a valid email address.', 'warning', 4000);
            document.getElementById('email').focus();
            return false;
        }

        // Validate country code
        const countryCode = document.getElementById('country-code').value;
        if (!countryCode) {
            showCustomAlert('Please select a country code.', 'warning', 4000);
            document.getElementById('country-code').focus();
            return false;
        }

        // Validate phone
        const phone = document.getElementById('phone').value;
        const phoneRegex = /^\d{6,15}$/; // Updated to not include + as it's in country code
        if (phone && !phoneRegex.test(phone)) {
            showCustomAlert('Please enter a valid phone number (6-15 digits only).', 'warning', 4000);
            document.getElementById('phone').focus();
            return false;
        }
    }

    // Validate custom region if "Others" is selected
    const location = document.getElementById('location').value;
    if (location === 'others') {
        const customRegion = document.getElementById('custom-region').value;
        if (!customRegion.trim()) {
            showCustomAlert('Please specify your region.', 'warning', 4000);
            document.getElementById('custom-region').focus();
            return false;
        }
    }    // Special validation for domains
    if (currentTab === 1) {
        const domainSelection = document.getElementById('domain-selection');
        if (domainSelection.style.display !== 'none') {
            const selectedDomain = document.getElementById('selected-domains').value;
            if (!selectedDomain) {
                showCustomAlert('Please select at least one specialized domain.', 'warning', 4000);
                domainSelection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
            // Validate "Others" input if selected 
            if (selectedDomain === 'others') {
                const othersInput = document.getElementById('custom-domain-input');
                if (!othersInput || !othersInput.value.trim()) {
                    showCustomAlert('Please specify your domain in the "Others" field.', 'warning', 4000);
                    othersInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    othersInput.focus();
                    return false;
                }
            }
        }
    }

    if (currentTab === 1) {
        const regionSelection = document.getElementById('region-selection');
        if (regionSelection.style.display !== 'none') {
            const selectedRegion = document.getElementById('selected-regions').value;
            if (!selectedRegion) {
                showCustomAlert('Please select at least one region.', 'warning', 4000);
                regionSelection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
            // You can also add validation for the "Others" region text input here if needed 
            if (selectedRegion === 'others') {
                const othersInput = document.getElementById('custom-region-domain-input');
                if (!othersInput || !othersInput.value.trim()) {
                    showCustomAlert('Please specify your region in the "Others" field.', 'warning', 4000);
                    othersInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    othersInput.focus();
                    return false;
                }
            }
        }
    }


    for (let input of visibleRequiredInputs) {
        if (!input.value.trim()) {
            input.focus();
            showCustomAlert('Please fill in all required fields to continue.', 'warning', 4000);
            return false;
        }
    }

    // Special validation for service category
    if (currentTab === 1 && !document.getElementById('service-category').value) {
        showCustomAlert('Please select a service category.', 'warning', 4000);
        return false;
    }

    if (currentTab === 1) {
        const guidanceRadios = document.querySelectorAll('input[name="guidance-type"]');
        // Check if this question is visible on the page
        if (guidanceRadios.length > 0) {
            const isChecked = Array.from(guidanceRadios).some(radio => radio.checked);
            if (!isChecked) {
                showCustomAlert('Please specify if you are looking for general guidance or specific insights.', 'warning', 4000);
                guidanceRadios[0].focus(); // Focus on the first radio button for better UX
                return false;
            }
        }
    }

    // Special validation for dynamic questions marked with ** (asterisks)
    if (currentTab === 1) {
        const sessionType = document.getElementById('session-type').value;

        if (sessionType === 'specialized' || sessionType === 'super-specialized') {
            // Check all dynamic questions that are marked as required (contain **)
            const dynamicQuestions = document.querySelectorAll('#dynamic-questions input[required], #dynamic-questions textarea[required]');

            for (let input of dynamicQuestions) {
                const isVisible = input.offsetParent !== null &&
                    window.getComputedStyle(input).display !== 'none';

                if (isVisible && !input.value.trim()) {
                    input.focus();
                    showCustomAlert('Please fill in all required fields marked with *.', 'warning', 4000);
                    return false;
                }
            }

            // Check radio button groups for "Is" questions
            const radioGroups = document.querySelectorAll('#dynamic-questions input[type="radio"]');
            const groupNames = [...new Set(Array.from(radioGroups).map(radio => radio.name))];

            for (let groupName of groupNames) {
                const radios = document.querySelectorAll(`input[name="${groupName}"]`);
                if (radios.length > 0) {
                    const isChecked = Array.from(radios).some(radio => radio.checked);
                    if (!isChecked) {
                        showCustomAlert('Please answer all required questions marked with *.', 'warning', 4000);
                        radios[0].focus();
                        return false;
                    }
                }
            }
        }
    }

    // Special validation for session type (only for consultancy)
    if (currentTab === 1) {
        const category = document.getElementById('service-category').value;
        const consentSection = document.querySelector('.consent-section');
        if (category === 'consultancy' && !document.getElementById('session-type').value) {
            showCustomAlert('Please select a session type to continue.', 'warning', 4000);
            return false;
        }

        if (consentSection.style.display !== 'none') {
            const dataConsent = document.getElementById('data-consent').checked;
            const termsConsent = document.getElementById('terms-consent').checked;

            if (!dataConsent) {
                showCustomAlert('Please give consent to save your data for session management.', 'warning', 4000);
                return false;
            }

            if (!termsConsent) {
                showCustomAlert('Please agree to the Terms and Conditions to proceed.', 'warning', 4000);
                return false;
            }
        }
    }

    // Special validation for advisory datetime
    if (currentTab === 1) {
        const category = document.getElementById('service-category').value;
        if (category === 'advisory') {
            const topic = document.getElementById('topic').value;
            const advisorySelectedDate = document.getElementById('advisory-selected-date').value;
            const advisorySelectedTime = document.getElementById('advisory-selected-time').value;

            // Skip topic validation in reschedule mode (already pre-filled)
            if (!isRescheduleMode && !topic.trim()) {
                showCustomAlert('Please describe what you want to discuss in the session.', 'warning', 4000);
                document.getElementById('topic').focus();
                return false;
            }

            if (!advisorySelectedDate || !advisorySelectedTime) {
                showCustomAlert('Please select your preferred date and time for us to contact you.', 'warning', 4000);
                // Focus on the calendar area
                document.getElementById('advisory-calendar-grid').scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
        }
        
        // Special validation for consultancy dynamic topic field
        if (category === 'consultancy') {
            const sessionType = document.getElementById('session-type').value;
            if (sessionType === 'generalized' || sessionType === 'super-specialized' || sessionType === 'long-term-engagement') {
                // In reschedule mode, skip this validation since topic is already filled in static #topic field
                if (!isRescheduleMode) {
                    const dynamicTopic = document.getElementById('dynamic-topic');
                    if (dynamicTopic && !dynamicTopic.value.trim()) {
                        showCustomAlert('Please describe what you want to discuss in the session.', 'warning', 4000);
                        dynamicTopic.focus();
                        return false;
                    }
                }
            }

        }
    }

    // Special validation for time slot (only for consultancy)
    if (currentTab === 2) {
        const category = document.getElementById('service-category').value;
        if (category === 'consultancy') {
            const sessionType = document.getElementById('session-type').value;
            const selectedSlot = document.getElementById('selected-slot').value;
            const selectedSlotField = document.getElementById('selected-slot');

            // FIX: For special session types, ensure the field is set and not required
            if (sessionType === 'super-specialized' || sessionType === 'long-term-engagement') {
                if (!selectedSlot) {
                    selectedSlotField.value = `${sessionType}-pending`;
                }
                // Remove required attribute to prevent HTML5 validation from blocking submission
                selectedSlotField.removeAttribute('required');
            } else if (!selectedSlot) {
                // For regular sessions, require time slot selection
                showCustomAlert('Please select a time slot.', 'warning', 4000);
                return false;
            }
        }
    }

    return true;
}

// Handle accept button in modal
document.getElementById('accept-terms').addEventListener('click', () => {
    const termsCheckbox = document.getElementById('terms-consent');
    const termsDisplay = termsCheckbox.closest('.custom-checkbox').querySelector('.checkbox-custom');

    // Set checkbox to checked
    termsCheckbox.checked = true;


    // Update visual state
    if (termsCheckbox.checked) {
        termsDisplay.classList.add('checked');
    } else {
        termsDisplay.classList.remove('checked');
    }

    // Add visual feedback animation
    if (termsDisplay) {
        termsDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => {
            termsDisplay.style.transform = 'scale(1)';
        }, 200);
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('termsModal'));
    modal.hide();
});

// Handle modal close without accepting (reject)
document.getElementById('termsModal').addEventListener('hidden.bs.modal', function () {
    // If terms are not checked when modal closes, ensure checkbox remains unchecked
    if (!document.getElementById('terms-consent').checked) {
        document.getElementById('terms-consent').checked = false;
    }
});

// Function to clear all form data
function clearFormData() {
    // Reset all form inputs
    document.getElementById('booking-form').reset();

    // Clear specific form fields
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('organization').value = '';
    document.getElementById('designation').value = '';
    document.getElementById('location').value = '';
    document.getElementById('custom-region').value = '';
    document.getElementById('timezone-selector').value = '';
    document.getElementById('additional-notes').value = '';

    // Clear custom domain and region inputs
    const customDomainInput = document.getElementById('custom-domain-input');
    const customRegionDomainInput = document.getElementById('custom-region-domain-input');
    if (customDomainInput) customDomainInput.value = '';
    if (customRegionDomainInput) customRegionDomainInput.value = '';

    // Clear hidden fields
    document.getElementById('service-category').value = '';
    document.getElementById('session-type').value = '';
    document.getElementById('selected-domains').value = '';
    document.getElementById('selected-regions').value = '';
    document.getElementById('selected-slot').value = '';
    document.getElementById('selected-date').value = '';
    document.getElementById('selected-time').value = '';

    // Clear advisory fields
    document.getElementById('advisory-selected-date').value = '';
    document.getElementById('advisory-selected-time').value = '';
    document.getElementById('advisory-selected-datetime').value = '';

    // Clear topic fields (both static and dynamic)
    const originalTopic = document.getElementById('topic');
    const dynamicTopic = document.getElementById('dynamic-topic');
    const dynamicTopicContainer = document.getElementById('dynamic-topic-container');
    
    if (originalTopic) {
        originalTopic.value = '';
        originalTopic.removeAttribute('required');
    }
    if (dynamicTopic) {
        dynamicTopic.value = '';
        dynamicTopic.removeAttribute('required');
    }
    // Remove the dynamic topic container if it exists
    if (dynamicTopicContainer) {
        dynamicTopicContainer.remove();
    }

    // Clear checkboxes
    document.getElementById('data-consent').checked = false;
    document.getElementById('terms-consent').checked = false;

    // Update visual state of custom checkboxes
    const dataConsentCheckbox = document.getElementById('data-consent').closest('.custom-checkbox').querySelector('.checkbox-custom');
    const termsConsentCheckbox = document.getElementById('terms-consent').closest('.custom-checkbox').querySelector('.checkbox-custom');

    if (dataConsentCheckbox) {
        dataConsentCheckbox.classList.remove('checked');
    }
    if (termsConsentCheckbox) {
        termsConsentCheckbox.classList.remove('checked');
    }

    // Remove all selections from session options, domains, and regions
    document.querySelectorAll('[data-category]').forEach(opt => opt.classList.remove('selected'));
    document.querySelectorAll('[data-type]').forEach(opt => opt.classList.remove('selected'));

    // Reset dropdowns
    const domainSelect = document.getElementById('domain-select');
    const regionSelect = document.getElementById('region-select');
    if (domainSelect) domainSelect.value = '';
    if (regionSelect) regionSelect.value = '';

    // Hide custom inputs
    hideCustomDomainInput();
    hideCustomRegionInput();

    // Clear calendar selections
    document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.time-slot.selected').forEach(slot => slot.classList.remove('selected'));
    document.querySelectorAll('.advisory-time-slot.selected').forEach(slot => slot.classList.remove('selected'));

    // Clear time slots container
    document.getElementById('time-slots-container').innerHTML = '';
    document.getElementById('advisory-time-slots-container').innerHTML = '<div class="calendar-no-slots">Select a date from the calendar to view available time slots</div>';

    // Clear dynamic questions
    document.getElementById('dynamic-questions').innerHTML = '';

    // Reset selected date displays
    document.getElementById('selected-date-display').innerHTML = 'Select a date to view available time slots';
    document.getElementById('advisory-selected-date-display').textContent = 'Select a date to choose time';
    document.getElementById('display-selected-region').textContent = 'Not selected';

    // Hide all conditional sections
    resetFormSections();

    // Reset calendar state variables
    selectedDate = null;
    advisorySelectedDate = null;
    selectedDomains = [];
    currentTab = 0;

    // Reset calendar instances
    if (calendarInitialized) {
        calendarInitialized = false;
        availableSlots = {};
    }
    if (advisoryCalendarInitialized) {
        advisoryCalendarInitialized = false;
    }

    // Remove validation states
    document.querySelectorAll('.form-control').forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });

    // Hide others input containers
    const othersContainer = document.getElementById('others-input-container');
    if (othersContainer) {
        othersContainer.style.display = 'none';
    }
    const othersRegionContainer = document.getElementById('others-region-container');
    if (othersRegionContainer) {
        othersRegionContainer.style.display = 'none';
    }
    const customRegionContainer = document.getElementById('custom-region-container');
    if (customRegionContainer) {
        customRegionContainer.style.display = 'none';
    }

    // Go back to first tab
    showTab(0);

    // Scroll to top
    scrollToTop();
}

// Enhanced Alert System
function showCustomAlert(message, type = 'success', duration = 5000) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert custom-alert-${type}`;

    // Set icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'info':
            icon = '<i class="fas fa-info-circle"></i>';
            break;
        default:
            icon = '<i class="fas fa-bell"></i>';
    }

    alertDiv.innerHTML = `
        <div class="custom-alert-content">
            <div class="custom-alert-icon">${icon}</div>
            <div class="custom-alert-message">${message}</div>
            <button class="custom-alert-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="custom-alert-progress"></div>
    `;

    // Add to body
    document.body.appendChild(alertDiv);

    // Trigger animation
    setTimeout(() => alertDiv.classList.add('show'), 10);

    // Auto remove
    if (duration > 0) {
        const progressBar = alertDiv.querySelector('.custom-alert-progress');
        progressBar.style.animationDuration = `${duration}ms`;

        setTimeout(() => {
            alertDiv.classList.add('hide');
            setTimeout(() => alertDiv.remove(), 300);
        }, duration);
    }
}

function showLoadingOverlay(message = 'Processing...') {
    // Remove existing overlay
    const existingOverlay = document.querySelector('.loading-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
            </div>
            <div class="loading-message">${message}</div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
}

function hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.add('hide');
        setTimeout(() => overlay.remove(), 300);
    }
}

function showSuccessAnimation() {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-animation';
    successDiv.innerHTML = `
        <div class="success-container">
            <div class="success-checkmark">
                <i class="fas fa-check success-icon"></i>
            </div>
            <div class="success-message">
                <h3>Success!</h3>
                <p>Your booking request has been submitted</p>
            </div>
        </div>
    `;

    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.classList.add('show'), 10);

    // Remove after animation
    setTimeout(() => {
        successDiv.classList.add('hide');
        setTimeout(() => successDiv.remove(), 500);
    }, 3000);
}

// Form submission
document.getElementById('booking-form').addEventListener('submit', function (e) {
    console.log('Form submission started');
    e.preventDefault();

    // Add comprehensive console logging for advisory forms
    const serviceCategory = document.getElementById('service-category').value;
    console.log('Service category:', serviceCategory);
    
    if (serviceCategory === 'advisory') {
        console.log('Advisory form submission detected');
        const topic = document.getElementById('topic').value;
        const advisorySelectedDate = document.getElementById('advisory-selected-date');
        const advisorySelectedTime = document.getElementById('advisory-selected-time');
        
        console.log('Topic value:', topic);
        console.log('Advisory selected date element:', advisorySelectedDate);
        console.log('Advisory selected date value:', advisorySelectedDate ? advisorySelectedDate.value : 'Element not found');
        console.log('Advisory selected time element:', advisorySelectedTime);
        console.log('Advisory selected time value:', advisorySelectedTime ? advisorySelectedTime.value : 'Element not found');
        
        // Check if required hidden fields exist
        const advisorySelectedDatetime = document.getElementById('advisory-selected-datetime');
        console.log('Advisory datetime element:', advisorySelectedDatetime);
        console.log('Advisory datetime value:', advisorySelectedDatetime ? advisorySelectedDatetime.value : 'Element not found');
    }

    console.log('Starting form validation...');
    if (validateCurrentTab()) {
        console.log('Form validation passed');
        
        // Check CAPTCHA validation
        const captchaResponse = grecaptcha.getResponse();
        console.log('CAPTCHA response:', captchaResponse);
        if (!captchaResponse) {
            console.log('CAPTCHA validation failed');
            document.getElementById('captcha-error').style.display = 'block';
            // Scroll to CAPTCHA section
            document.getElementById('captcha-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        console.log('CAPTCHA validation passed');
        // Hide CAPTCHA error if it was shown previously
        document.getElementById('captcha-error').style.display = 'none';

        // Show loading overlay
        showLoadingOverlay('Submitting your booking request...');
        console.log('Loading overlay shown');

        try {
        // Collect form data
        console.log('Collecting form data...');
        const formData = new FormData(this);
        const data = {};
        
        // Safely process FormData entries
        for (let [key, value] of formData.entries()) {
            console.log(`Processing form entry: ${key}`, typeof value, value);
            
            // Check if value is a DOM element (this should not happen but we're being safe)
            if (value && typeof value === 'object' && value.nodeType) {
                console.warn(`DOM element detected for key: ${key}`, value);
                if (value.value !== undefined) {
                    data[key] = value.value;
                } else {
                    console.warn(`Skipping DOM element without value property: ${key}`);
                }
            } else {
                data[key] = value;
            }
        }

        // Debug: Check for any DOM elements accidentally included in converted data
        Object.keys(data).forEach(key => {
            if (data[key] && typeof data[key] === 'object' && data[key].nodeType) {
                console.error(`DOM element still found in form data for key: ${key}`, data[key]);
                // Convert DOM element to its value if it's a form control
                if (data[key].value !== undefined) {
                    data[key] = data[key].value;
                } else {
                    delete data[key];
                }
            }
        });

        // Handle checkboxes properly - FormData doesn't include unchecked checkboxes
        const checkboxes = this.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            data[checkbox.name] = checkbox.checked ? 'on' : 'off';
        });

        // Ensure domain-select value is properly captured
        const domainSelect = document.getElementById('domain-select');
        if (domainSelect && domainSelect.value) {
            data['domain-select'] = domainSelect.value;
        }

        // Ensure selected-domains hidden field is used for domain data
        const selectedDomainsField = document.getElementById('selected-domains');
        if (selectedDomainsField && selectedDomainsField.value) {
            data['selected-domains'] = selectedDomainsField.value;
        }

        // Convert values to display text for specific fields
        if (data['location'] && displayTextMappings.location[data['location']]) {
            data['location'] = displayTextMappings.location[data['location']];
        }

        if (data['country-code'] && displayTextMappings['country-code'][data['country-code']]) {
            data['country-code'] = displayTextMappings['country-code'][data['country-code']];
        }

        if (data['service-category'] && displayTextMappings.category[data['service-category']]) {
            data['service-category'] = displayTextMappings.category[data['service-category']];
        }

        if (data['session-type'] && displayTextMappings.sessionType[data['session-type']]) {
            data['session-type'] = displayTextMappings.sessionType[data['session-type']];
        }

        if (data['guidance-type'] && displayTextMappings.guidanceType[data['guidance-type']]) {
            data['guidance-type'] = displayTextMappings.guidanceType[data['guidance-type']];
        }

        // Convert Yes/No values for all dynamic questions
        Object.keys(data).forEach(key => {
            if (data[key] && displayTextMappings.yesNo[data[key]]) {
                data[key] = displayTextMappings.yesNo[data[key]];
            }
        });

        // Clear domains and regions for long-term engagement sessions
        if (data['session-type'] === 'long-term-engagement' || data['session-type'] === 'Long-term Projects') {
            data['selected-domains'] = '';
            data['selected-regions'] = '';
        }

        if (data['selected-domains'] && displayTextMappings.domains[data['selected-domains']]) {
            data['selected-domains'] = displayTextMappings.domains[data['selected-domains']];
        }

        // If domain is "others", use the custom input value
        if (data['selected-domains'] === 'others' && data['custom-domain-input']) {
            data['selected-domains'] = data['custom-domain-input'];
        }

        if (data['selected-regions'] && displayTextMappings.regions[data['selected-regions']]) {
            data['selected-regions'] = displayTextMappings.regions[data['selected-regions']];
        }

        // If region is "others", use the custom input value
        if (data['selected-regions'] === 'others' && data['custom-region-domain-input']) {
            data['selected-regions'] = data['custom-region-domain-input'];
        }

        // Add timestamp
        data.timestamp = new Date().toISOString();

        // If in reschedule mode, add reschedule-specific fields
        if (isRescheduleMode && rescheduleData) {
            data['reschedule-mode'] = 'true';
            data['original-session-id'] = rescheduleData.sessionId;
            data['reschedule-reason'] = rescheduleData.rescheduleReason || '';
            console.log('Reschedule mode - Original Session ID:', rescheduleData.sessionId);
        }

        // Final cleanup: Remove any remaining DOM elements or non-serializable objects
        Object.keys(data).forEach(key => {
            if (data[key] && typeof data[key] === 'object' && data[key].nodeType) {
                console.warn(`Removing DOM element from form data: ${key}`);
                delete data[key];
            }
        });

        // Debug: Log the form data being submitted (with safety check)
        console.log('Form data being submitted:', data);
        console.log('Service category:', data['service-category']);
        console.log('Session type:', data['session-type']);
        console.log('Country code:', data['country-code']);
        console.log('Phone number:', data['phone']);
        
        // ADDITIONAL DEBUG: Check if country-code field exists and has value
        const countryCodeField = document.getElementById('country-code');
        console.log('Country code field exists:', !!countryCodeField);
        console.log('Country code field value:', countryCodeField ? countryCodeField.value : 'Field not found');
        console.log('Country code in FormData:', data['country-code'] ? 'Found' : 'NOT FOUND');
        
        console.log('Selected domains:', data['selected-domains']);
        console.log('Domain select value:', data['domain-select']);
        console.log('Custom domain input:', data['custom-domain-input']);
        console.log('Selected regions:', data['selected-regions']);
        console.log('Custom region domain input:', data['custom-region-domain-input']);
        console.log('Location (Region):', data['location']);
        console.log('Custom region:', data['custom-region']);
        console.log('Selected date:', data['selected-date']);
        console.log('Selected time:', data['selected-time']);
        console.log('Advisory date:', data['advisory-selected-date']);
        console.log('Advisory time:', data['advisory-selected-time']);

        // Send to Google Sheets
        submitToGoogleSheets(data)
            .then(response => {
                console.log('Form submission response:', response);
                hideLoadingOverlay();

                if (response.status === 'success') {
                    // Show success animation
                    showSuccessAnimation();

                    // Show success message after animation starts
                    setTimeout(() => {
                        // Check if in reschedule mode
                        if (isRescheduleMode) {
                            showCustomAlert(
                                '✅ Session Rescheduled Successfully! Your session has been rescheduled. Confirmation email has been sent. Redirecting to home page...',
                                'success',
                                3000
                            );
                            
                            // Redirect to home page after successful reschedule
                            setTimeout(() => {
                                window.location.href = 'index.html';
                            }, 2500);
                        } else {
                            showCustomAlert(
                                'Your session booking request has been submitted successfully! We will contact you shortly to confirm the appointment.',
                                'success',
                                6000
                            );
                            
                            // Clear all form data after successful submission
                            setTimeout(() => {
                                clearFormData();
                            }, 1500);
                        }
                    }, 500);

                } else {
                    throw new Error(response.message || 'Submission failed');
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    serviceCategory: data['service-category']
                });
                hideLoadingOverlay();

                // Provide more specific error messages
                let errorMessage = 'There was an error submitting your request. ';

                if (error.message.includes('Failed to fetch')) {
                    errorMessage += 'Please check your internet connection and try again.';
                } else if (error.message.includes('not configured')) {
                    errorMessage += 'Configuration error. Please contact support.';
                } else {
                    errorMessage += 'Please try again or contact us directly.';
                }

                showCustomAlert(errorMessage, 'error', 8000);
            });
        } catch (formError) {
            console.error('Critical form processing error:', formError);
            hideLoadingOverlay();
            showCustomAlert('A critical error occurred while processing your form. Please refresh the page and try again.', 'error', 8000);
        }
    } else {
        console.log('Form validation failed');
        console.log('Current tab:', currentTab);
        console.log('Service category:', document.getElementById('service-category')?.value);
        console.log('Topic value:', document.getElementById('topic')?.value);
        console.log('Advisory selected date:', document.getElementById('advisory-selected-date')?.value);
        console.log('Advisory selected time:', document.getElementById('advisory-selected-time')?.value);
    }
});

// Function to submit data to Google Sheets
async function submitToGoogleSheets(data) {
    // Get the Google Apps Script URL from config
    const GOOGLE_SCRIPT_URL = window.CONFIG?.GOOGLE_SCRIPT_URL || 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        console.warn('Google Apps Script URL not configured. Please update config.js');
        throw new Error('Google Apps Script URL not configured');
    }

    // Final data cleanup before sending
    console.log('Data before final cleanup:', data);
    
    // Remove any remaining DOM elements or non-serializable objects
    const cleanData = {};
    Object.keys(data).forEach(key => {
        const value = data[key];
        if (value && typeof value === 'object' && value.nodeType) {
            console.warn(`Removing DOM element from final data: ${key}`, value);
        } else {
            cleanData[key] = value;
        }
    });
    
    console.log('Clean data ready for submission:', cleanData);

    try {
        // Submit with proper CORS handling
        console.log('Submitting form data to Google Apps Script...');
        
        const formData = new URLSearchParams();
        Object.keys(cleanData).forEach(key => {
            const value = cleanData[key];
            if (value !== null && value !== undefined) {
                formData.append(key, String(value));
            }
        });

        console.log('Submitting to:', GOOGLE_SCRIPT_URL);
        console.log('Form data:', Object.fromEntries(formData));

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            redirect: 'follow'
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the response
        const result = await response.json();
        console.log('Response data:', result);
        
        return result;
        
    } catch (error) {
        console.error('Error submitting to Google Sheets:', error);
        throw error;
    }
}

// Initialize the form
showTab(0);

// Initialize datetime picker and calendar on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeDateTimePicker();
    initializeCustomCheckboxes();

    // Check if in reschedule mode
    checkRescheduleMode();

    // Test and fetch blocked dates and available dates from server
    initializeDateData();

    // Set up current month for calendar
    currentCalendarDate = new Date();
    const today = new Date();
    currentCalendarDate.setFullYear(today.getFullYear(), today.getMonth(), 1);
});

// Initialize date data - fetch blocked and available dates in parallel for faster load
async function initializeDateData() {
    console.log('Initializing date data...');

    // Show cached data immediately while fetching fresh data
    try {
        const cachedBlocked = localStorage.getItem('blockedDates');
        const cachedAvailable = localStorage.getItem('availableDates');
        if (cachedBlocked) blockedDates = JSON.parse(cachedBlocked);
        if (cachedAvailable) availableDates = JSON.parse(cachedAvailable);
        if (cachedBlocked || cachedAvailable) {
            console.log('Showing cached data while fetching fresh data...');
            updateCalendarDisplay();
        }
    } catch (e) {
        console.warn('Could not load cached dates:', e);
    }

    // Fetch both blocked and available dates in parallel (skip redundant test call)
    await Promise.all([
        fetchBlockedDates(),
        fetchAvailableDates().catch(err => {
            console.warn('Available dates fetch failed, using fallback:', err.message);
            // Use empty array or cached data as fallback
            if (!availableDates || availableDates.length === 0) {
                availableDates = [];
                try {
                    const cached = localStorage.getItem('availableDates');
                    if (cached) {
                        availableDates = JSON.parse(cached);
                        console.log('Using cached available dates:', availableDates.length);
                    }
                } catch (error) {
                    console.warn('Could not load cached available dates:', error);
                }
            }
        })
    ]);

    // Update calendar display after fetching dates
    updateCalendarDisplay();
    
    console.log('Date data initialization complete');
    
    // Hide the page loader after dates are loaded
    const pageLoader = document.getElementById('page-loader');
    if (pageLoader) {
        pageLoader.style.display = 'none';
    }
}



function updateAdvisoryCalendarDisplay() {
    const calendarTitle = document.getElementById('advisory-calendar-title');
    const calendarGrid = document.getElementById('advisory-calendar-grid');

    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    calendarTitle.textContent = `${monthNames[advisoryCurrentCalendarDate.getMonth()]} ${advisoryCurrentCalendarDate.getFullYear()}`;

    // Update navigation buttons state based on advisory requirements
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 7); // Advisory requires 7 days minimum
    
    const prevBtn = document.getElementById('advisory-prev-month');
    const nextBtn = document.getElementById('advisory-next-month');

    const currentMonth = advisoryCurrentCalendarDate.getMonth();
    const currentYear = advisoryCurrentCalendarDate.getFullYear();

    // Disable previous button if we're at the earliest month that contains valid dates
    const minAllowedMonth = minDate.getMonth();
    const minAllowedYear = minDate.getFullYear();
    const isMinMonth = currentYear === minAllowedYear && currentMonth === minAllowedMonth;
    prevBtn.disabled = isMinMonth;

    // Disable next button if we're at 6 months from now
    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 6);
    const maxAllowedMonth = maxDate.getMonth();
    const maxAllowedYear = maxDate.getFullYear();

    const isMaxMonth = currentYear === maxAllowedYear && currentMonth === maxAllowedMonth;
    nextBtn.disabled = isMaxMonth;

    // Clear existing calendar days (keep headers)
    const dayElements = calendarGrid.querySelectorAll('.calendar-day');
    dayElements.forEach(el => el.remove());

    // Generate calendar days
    const firstDay = new Date(advisoryCurrentCalendarDate.getFullYear(), advisoryCurrentCalendarDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    for (let i = 0; i < 42; i++) { // 6 weeks
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();

        const isCurrentMonth = date.getMonth() === advisoryCurrentCalendarDate.getMonth();
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < today;
        
        // For advisory, dates must be at least 7 days from today
        const minDate = new Date(today);
        minDate.setDate(today.getDate() + 7);
        const isTooSoon = date < minDate;
        
        const isAvailable = !isPast && !isTooSoon && isCurrentMonth; // Advisory dates available only after 7 days

        if (!isCurrentMonth) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        if (isPast || isTooSoon) {
            dayElement.classList.add('disabled');
        } else if (isAvailable) {
            dayElement.classList.add('available');
            dayElement.addEventListener('click', () => selectAdvisoryDate(date, dayElement));
        }

        // Apply selected class if this date matches the currently selected date
        if (advisorySelectedDate && date.toDateString() === advisorySelectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }

        calendarGrid.appendChild(dayElement);
    }
}

function selectAdvisoryDate(date, element) {
    // Remove previous selection from all calendar days
    document.querySelectorAll('#advisory-calendar-grid .calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selection to clicked element with enhanced visual feedback
    element.classList.add('selected');

    // Add a temporary highlight effect
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow - intentionally using expression
    element.style.animation = 'selectedPulse 0.3s ease-out';

    // Store the selected date globally
    advisorySelectedDate = new Date(date);
    const dateKey = date.toISOString().split('T')[0];

    // Update selected date display
    const selectedDateDisplay = document.getElementById('advisory-selected-date-display');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    selectedDateDisplay.innerHTML = `<i class="fas fa-calendar-check"></i> ${date.toLocaleDateString('en-US', options)} - Choose Time`;

    // Store selected date in form
    document.getElementById('advisory-selected-date').value = dateKey;

    // Clear any previously selected time slot when selecting a new date
    document.getElementById('advisory-selected-time').value = '';
    document.getElementById('advisory-selected-datetime').value = '';
    document.querySelectorAll('.advisory-time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });

    // Display time slots for the selected date
    displayAdvisoryTimeSlots();
}

function displayAdvisoryTimeSlots() {
    const container = document.getElementById('advisory-time-slots-container');
    const timezoneNoticeWrapper = document.getElementById('advisory-timezone-notice-wrapper');

    // Generate time slots for advisory (more flexible than consultancy)
    const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
        '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];

    // Clear both containers first
    container.className = 'advisory-time-slots-container has-slots';
    container.innerHTML = '';
    timezoneNoticeWrapper.innerHTML = '';

    // Create timezone notice in the separate wrapper
    const noticeDiv = document.createElement('div');
    noticeDiv.className = 'calendar-availability-notice';
    noticeDiv.innerHTML = `
        <i class="fas fa-globe"></i>
        <div class="timezone-info">
            <strong>Timezone:</strong>
            <span>All times shown are in India Standard Time (IST)</span>
        </div>
    `;
    timezoneNoticeWrapper.appendChild(noticeDiv);

    // Create and add all time slot buttons directly to the container
    timeSlots.forEach(time => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'advisory-time-slot';
        slotDiv.innerHTML = `<strong>${time}</strong>`;

        slotDiv.addEventListener('click', () => selectAdvisoryTimeSlot(slotDiv, time));
        container.appendChild(slotDiv);
    });
}

function selectAdvisoryTimeSlot(element, time) {
    // Remove previous selection from all time slots
    document.querySelectorAll('.advisory-time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });

    // Add selection to clicked element
    element.classList.add('selected');

    // Store selected time
    document.getElementById('advisory-selected-time').value = time;

    // Create combined datetime value
    const selectedDate = document.getElementById('advisory-selected-date').value;
    const combinedDateTime = `${selectedDate} ${time}`;
    document.getElementById('advisory-selected-datetime').value = combinedDateTime;
}

// Custom checkbox functionality
function initializeCustomCheckboxes() {

    // Handle data consent checkbox
    const dataConsentCheckbox = document.getElementById('data-consent');
    const dataConsentContainer = dataConsentCheckbox?.closest('.custom-checkbox');
    const dataConsentDisplay = dataConsentContainer?.querySelector('.checkbox-custom');
    const dataConsentLabel = dataConsentContainer?.parentNode?.querySelector('.form-check-label');

    // Handle terms consent checkbox - special case for modal
    const termsConsentCheckbox = document.getElementById('terms-consent');
    const termsConsentContainer = termsConsentCheckbox?.closest('.custom-checkbox');
    const termsConsentDisplay = termsConsentContainer?.querySelector('.checkbox-custom');
    const termsConsentLabel = termsConsentContainer?.parentNode?.querySelector('.form-check-label');

    // Function to update visual state
    function updateCheckboxVisual(checkbox, display) {
        if (checkbox.checked) {
            display.classList.add('checked');
        } else {
            display.classList.remove('checked');
        }
    }

    // Remove existing event listeners to prevent duplicates
    if (dataConsentDisplay && !dataConsentDisplay.hasAttribute('data-initialized')) {
        dataConsentDisplay.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            dataConsentCheckbox.checked = !dataConsentCheckbox.checked;
            updateCheckboxVisual(dataConsentCheckbox, dataConsentDisplay);

            // Add pulse animation
            setTimeout(() => {
                dataConsentDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    dataConsentDisplay.style.transform = 'scale(1)';
                }, 200);
            }, 50);
        });
        dataConsentDisplay.setAttribute('data-initialized', 'true');
    }

    if (dataConsentLabel && !dataConsentLabel.hasAttribute('data-initialized')) {
        dataConsentLabel.addEventListener('click', function (e) {
            e.preventDefault();
            dataConsentCheckbox.checked = !dataConsentCheckbox.checked;
            updateCheckboxVisual(dataConsentCheckbox, dataConsentDisplay);

            // Add pulse animation
            setTimeout(() => {
                dataConsentDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    dataConsentDisplay.style.transform = 'scale(1)';
                }, 200);
            }, 50);
        });
        dataConsentLabel.setAttribute('data-initialized', 'true');
    }

    // Make the terms consent checkbox clickable with modal
    if (termsConsentDisplay && !termsConsentDisplay.hasAttribute('data-initialized')) {
        termsConsentDisplay.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (!termsConsentCheckbox.checked) {
                // Show modal for terms
                const modal = new bootstrap.Modal(document.getElementById('termsModal'));
                modal.show();
            } else {
                // Allow unchecking
                termsConsentCheckbox.checked = false;
                updateCheckboxVisual(termsConsentCheckbox, termsConsentDisplay);
            }
        });
        termsConsentDisplay.setAttribute('data-initialized', 'true');
    }

    if (termsConsentLabel && !termsConsentLabel.hasAttribute('data-initialized')) {
        termsConsentLabel.addEventListener('click', function (e) {
            // Don't handle if clicking on the terms link
            if (e.target.classList.contains('terms-link')) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            if (!termsConsentCheckbox.checked) {
                // Show modal for terms
                const modal = new bootstrap.Modal(document.getElementById('termsModal'));
                modal.show();
            } else {
                // Allow unchecking
                termsConsentCheckbox.checked = false;
                updateCheckboxVisual(termsConsentCheckbox, termsConsentDisplay);
            }
        });
        termsConsentLabel.setAttribute('data-initialized', 'true');
    }

    // Handle keyboard accessibility
    if (dataConsentCheckbox && !dataConsentCheckbox.hasAttribute('data-keyboard-initialized')) {
        dataConsentCheckbox.addEventListener('keydown', function (e) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                dataConsentCheckbox.checked = !dataConsentCheckbox.checked;
                updateCheckboxVisual(dataConsentCheckbox, dataConsentDisplay);

                // Add pulse animation
                setTimeout(() => {
                    dataConsentDisplay.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        dataConsentDisplay.style.transform = 'scale(1)';
                    }, 200);
                }, 50);
            }
        });
        dataConsentCheckbox.setAttribute('data-keyboard-initialized', 'true');
    }

    if (termsConsentCheckbox && !termsConsentCheckbox.hasAttribute('data-keyboard-initialized')) {
        termsConsentCheckbox.addEventListener('keydown', function (e) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!this.checked) {
                    const modal = new bootstrap.Modal(document.getElementById('termsModal'));
                    modal.show();
                } else {
                    this.checked = false;
                    updateCheckboxVisual(this, termsConsentDisplay);
                }
            }
        });
        termsConsentCheckbox.setAttribute('data-keyboard-initialized', 'true');
    }

    // Handle focus styles for accessibility
    [dataConsentCheckbox, termsConsentCheckbox].forEach(checkbox => {
        if (checkbox && !checkbox.hasAttribute('data-focus-initialized')) {
            checkbox.addEventListener('focus', function () {
                const customDisplay = checkbox.closest('.custom-checkbox').querySelector('.checkbox-custom');
                if (customDisplay) {
                    customDisplay.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.3)';
                }
            });

            checkbox.addEventListener('blur', function () {
                const customDisplay = checkbox.closest('.custom-checkbox').querySelector('.checkbox-custom');
                if (customDisplay) {
                    customDisplay.style.boxShadow = '';
                }
            });

            checkbox.setAttribute('data-focus-initialized', 'true');
        }
    });

    // Initialize visual states
    if (dataConsentCheckbox && dataConsentDisplay) {
        updateCheckboxVisual(dataConsentCheckbox, dataConsentDisplay);
    }
    if (termsConsentCheckbox && termsConsentDisplay) {
        updateCheckboxVisual(termsConsentCheckbox, termsConsentDisplay);
    }
}

// Initialize datetime picker
function initializeDateTimePicker() {
    // Check if flatpickr element exists for advisory services
    const advisoryDateTimePicker = document.getElementById('advisory-datetime-picker');
    if (advisoryDateTimePicker) {
        flatpickr(advisoryDateTimePicker, {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            minDate: "today",
            time_24hr: false,
            minuteIncrement: 30,
            placeholder: "Select preferred date and time..."
        });
    }
}

// Initialize the form
showTab(0);

// Check if in reschedule mode and handle URL parameters
function checkRescheduleMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'reschedule') {
        isRescheduleMode = true;
        
        // Extract all data from URL parameters
        rescheduleData = {
            sessionId: urlParams.get('sessionId'),
            name: urlParams.get('name'),
            email: urlParams.get('email'),
            phone: urlParams.get('phone'),
            countryCode: urlParams.get('countryCode'),
            organization: urlParams.get('organization'),
            designation: urlParams.get('designation'),
            location: urlParams.get('location'),
            serviceCategory: urlParams.get('serviceCategory'),
            sessionType: urlParams.get('sessionType'),
            selectedDomains: urlParams.get('selectedDomains'),
            customDomain: urlParams.get('customDomain'),
            selectedRegions: urlParams.get('selectedRegions'),
            customRegion: urlParams.get('customRegion'),
            topic: urlParams.get('topic'),
            dataConsent: urlParams.get('dataConsent'),
            termsConsent: urlParams.get('termsConsent'),
            rescheduleReason: urlParams.get('rescheduleReason')
        };
        
        // Add dynamic session question fields
        const dynamicFields = [
            'space-policy-area', 'guidance-type', 'specific-insights-details',
            'policy-directive', 'policy-directive-details', 'geopolitical-situation',
            'geopolitical-details', 'use-case', 'use-case-details', 'additional-info',
            'additional-info-details', 'specific-entity', 'entity-details', 'detail-level',
            'strategic-objectives', 'expected-outcomes', 'engagement-model', 'deliverables-needed',
            'complex-challenges', 'relevant-regional-dynamics', 'analysis-type', 'customized-frameworks'
        ];
        
        dynamicFields.forEach(field => {
            const value = urlParams.get(field);
            if (value) {
                rescheduleData[field] = value;
            }
        });
        
        console.log('Reschedule mode activated with data:', rescheduleData);
        console.log('Service Category from URL:', rescheduleData.serviceCategory);
        console.log('Session Type from URL:', rescheduleData.sessionType);
        
        // Navigate to schedule tab (tab index 2)
        currentTab = 2;
        showTab(currentTab);
        
        // Show reschedule banner
        showRescheduleBanner();
        
        // Prefill after a delay to let the page fully load
        setTimeout(() => {
            console.log('Starting form prefill after delay...');
            prefillFormForReschedule();
        }, 1000);
    }
}

// Pre-fill form fields with reschedule data
function prefillFormForReschedule() {
    if (!rescheduleData) return;
    
    console.log('Prefilling form with reschedule data:', rescheduleData);
    
    // Personal Details
    if (rescheduleData.name) document.getElementById('name').value = rescheduleData.name;
    if (rescheduleData.email) document.getElementById('email').value = rescheduleData.email;
    if (rescheduleData.phone) document.getElementById('phone').value = rescheduleData.phone;
    if (rescheduleData.countryCode) document.getElementById('country-code').value = rescheduleData.countryCode;
    if (rescheduleData.organization) document.getElementById('organization').value = rescheduleData.organization;
    if (rescheduleData.designation) document.getElementById('designation').value = rescheduleData.designation;
    if (rescheduleData.location) document.getElementById('location').value = rescheduleData.location;
    
    // Service Category - click the appropriate tile
    if (rescheduleData.serviceCategory) {
        console.log('Clicking service category tile:', rescheduleData.serviceCategory);
        const categoryTile = document.querySelector(`[data-category="${rescheduleData.serviceCategory}"]`);
        if (categoryTile) {
            categoryTile.click();
            console.log('Service category tile clicked successfully');
            
            // Wait for session types to appear, then select session type
            setTimeout(() => {
                prefillSessionType();
            }, 500);
        } else {
            console.error('Could not find service category tile for:', rescheduleData.serviceCategory);
            prefillSessionType();
        }
    } else {
        prefillSessionType();
    }
}

// Helper function to prefill session type after service category selection
function prefillSessionType() {
    if (!rescheduleData || !rescheduleData.sessionType) {
        prefillOtherFields();
        return;
    }
    
    console.log('Clicking session type tile:', rescheduleData.sessionType);
    const sessionTile = document.querySelector(`[data-type="${rescheduleData.sessionType}"]`);
    if (sessionTile) {
        sessionTile.click();
        console.log('Session type tile clicked successfully');
        
        // Wait for domains/regions and dynamic questions to appear
        setTimeout(() => {
            prefillOtherFields();
        }, 500);
    } else {
        console.error('Could not find session type tile for:', rescheduleData.sessionType);
        prefillOtherFields();
    }
}

// Helper function to prefill other fields after session type selection
function prefillOtherFields() {
    if (!rescheduleData) return;
    
    console.log('Prefilling other fields...');
    
    // Fill topic field - the "What do you want to talk about?" textarea#topic
    // Set with longer delay to ensure the field is visible and ready
    if (rescheduleData.topic) {
        setTimeout(() => {
            // Make sure topic section is visible
            const topicSection = document.getElementById('topic-section');
            if (topicSection) {
                topicSection.style.display = 'block';
            }
            
            // Hide dynamic topic container to avoid duplicate
            const dynamicTopicContainer = document.getElementById('dynamic-topic-container');
            if (dynamicTopicContainer) {
                dynamicTopicContainer.style.display = 'none';
            }
            
            // The field ID is 'topic' - it's a textarea
            const topicElement = document.getElementById('topic');
            
            if (topicElement) {
                topicElement.value = rescheduleData.topic;
                // Trigger input event to ensure any listeners are notified
                topicElement.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('Topic filled in "What do you want to talk about?":', rescheduleData.topic);
            } else {
                console.log('Topic textarea#topic not found');
            }
        }, 800);  // Longer delay to ensure form is fully loaded
    }
    
    // Fill selected domains (dropdown #domain-select) - map display text to values
    if (rescheduleData.selectedDomains) {
        const domainDisplayText = rescheduleData.selectedDomains.trim();
        console.log('Filling domain:', domainDisplayText);
        
        // Domain value mapping: display text → form value
        const domainMapping = {
            'Technology Diplomacy': 'technology-diplomacy',
            'Space Diplomacy': 'space-power',
            'Economic Diplomacy': 'economic-diplomacy',
            'Defence': 'defence',
            'Multi-Domain': 'multi-domain',
            'Others': 'others'
        };
        
        const mappedDomainValue = domainMapping[domainDisplayText] || domainDisplayText.toLowerCase().replace(/\s+/g, '-');
        
        setTimeout(() => {
            // Target the actual select element: #domain-select
            const domainSelect = document.getElementById('domain-select');
            if (domainSelect) {
                // Check if this is a custom domain (not in mapping - means "Others")
                const isOthersDomain = !domainMapping[domainDisplayText] && domainDisplayText !== '';
                
                if (isOthersDomain) {
                    // Set dropdown to "others" and show custom input
                    domainSelect.value = 'others';
                    console.log('Domain is custom/Others:', domainDisplayText);
                    
                    // Show custom domain container and fill it
                    const customDomainContainer = document.getElementById('custom-domain-container');
                    if (customDomainContainer) {
                        customDomainContainer.style.display = 'block';
                    }
                    const customDomainInput = document.getElementById('custom-domain-input');
                    if (customDomainInput) {
                        customDomainInput.value = domainDisplayText;
                        console.log('Custom domain input filled:', domainDisplayText);
                    }
                } else {
                    domainSelect.value = mappedDomainValue;
                    console.log('Domain dropdown set:', domainDisplayText, '→', mappedDomainValue);
                }
                
                // Also set the hidden input
                const hiddenDomainInput = document.getElementById('selected-domains');
                if (hiddenDomainInput) {
                    hiddenDomainInput.value = domainDisplayText;
                }
                
                // Trigger change event to update any dependent UI
                domainSelect.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                console.log('Domain dropdown #domain-select not found');
            }
        }, 300);
    }
    
    // Fill custom domain input
    if (rescheduleData.customDomain) {
        const customDomainInput = document.getElementById('custom-domain-input');
        if (customDomainInput) {
            customDomainInput.value = rescheduleData.customDomain;
            console.log('Custom domain filled:', rescheduleData.customDomain);
        }
    }
    
    // Fill selected regions (dropdown #region-select) - map display text to values
    if (rescheduleData.selectedRegions) {
        const regionDisplayText = rescheduleData.selectedRegions.trim();
        console.log('Filling region:', regionDisplayText);
        
        // Region value mapping: display text → form value
        const regionMapping = {
            'Outer Space': 'outer-space',
            'Rimland': 'rimland',
            'Antarctic': 'antarctic',
            'Arctic': 'arctic',
            'Deep Sea': 'deep-sea',
            'Others': 'others'
        };
        
        const mappedRegionValue = regionMapping[regionDisplayText] || regionDisplayText.toLowerCase().replace(/\s+/g, '-');
        
        setTimeout(() => {
            // First make region selection visible
            const regionSelectionDiv = document.getElementById('region-selection');
            if (regionSelectionDiv) {
                regionSelectionDiv.style.display = 'block';
            }
            
            // Target the actual select element: #region-select
            const regionSelect = document.getElementById('region-select');
            if (regionSelect) {
                // Check if this is a custom region (not in mapping - means "Others")
                const isOthersRegion = !regionMapping[regionDisplayText] && regionDisplayText !== '';
                
                if (isOthersRegion) {
                    // Set dropdown to "others" and show custom input
                    regionSelect.value = 'others';
                    console.log('Region is custom/Others:', regionDisplayText);
                    
                    // Show custom region container and fill it
                    const customRegionContainer = document.getElementById('custom-region-domain-container');
                    if (customRegionContainer) {
                        customRegionContainer.style.display = 'block';
                    }
                    const customRegionInput = document.getElementById('custom-region-domain-input');
                    if (customRegionInput) {
                        customRegionInput.value = regionDisplayText;
                        console.log('Custom region input filled:', regionDisplayText);
                    }
                } else {
                    regionSelect.value = mappedRegionValue;
                    console.log('Region dropdown set:', regionDisplayText, '→', mappedRegionValue);
                }
                
                // Also set the hidden input
                const hiddenRegionInput = document.getElementById('selected-regions');
                if (hiddenRegionInput) {
                    hiddenRegionInput.value = regionDisplayText;
                }
                
                // Trigger change event to update any dependent UI
                regionSelect.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                console.log('Region dropdown #region-select not found');
            }
        }, 400);
    }

    // Fill custom region input
    if (rescheduleData.customRegion) {
        const customRegionInput = document.getElementById('custom-region-domain-input');
        if (customRegionInput) {
            customRegionInput.value = rescheduleData.customRegion;
            console.log('Custom region filled:', rescheduleData.customRegion);
        }
    }
    
    // Fill consent checkboxes - check if values are 'on' or truthy
    if (rescheduleData.dataConsent && rescheduleData.dataConsent !== 'null' && rescheduleData.dataConsent !== 'off') {
        const dataConsentCheckbox = document.getElementById('data-consent');
        if (dataConsentCheckbox) {
            dataConsentCheckbox.checked = true;
            console.log('Data consent checkbox checked');
        }
    }
    
    if (rescheduleData.termsConsent && rescheduleData.termsConsent !== 'null' && rescheduleData.termsConsent !== 'off') {
        const termsConsentCheckbox = document.getElementById('terms-consent');
        if (termsConsentCheckbox) {
            termsConsentCheckbox.checked = true;
            console.log('Terms consent checkbox checked');
        }
    }
    
    // Wait longer for dynamic questions to be generated, then fill them
    setTimeout(() => {
        console.log('Filling dynamic questions after delay...');
        
        // Fill dynamic session question fields with improved element detection
        Object.keys(rescheduleData).forEach(key => {
            if (key.includes('-') && rescheduleData[key]) {
                let element = document.getElementById(key);
                if (!element) {
                    // Try finding by name attribute
                    element = document.querySelector(`[name="${key}"]`);
                }
                if (!element) {
                    // Try finding in dynamic questions container
                    const container = document.getElementById('dynamic-questions-container') || 
                                    document.getElementById('dynamic-questions') ||
                                    document.querySelector('.dynamic-questions');
                    if (container) {
                        element = container.querySelector(`#${key}`) || container.querySelector(`[name="${key}"]`);
                    }
                }
                
                if (element) {
                    // Handle different input types properly
                    if (element.type === 'radio') {
                        // For radio buttons, find the one with matching value
                        const radioGroup = document.querySelectorAll(`input[name="${key}"]`);
                        let matched = false;
                        radioGroup.forEach(radio => {
                            if (radio.value === rescheduleData[key] || radio.value.toLowerCase() === rescheduleData[key].toLowerCase()) {
                                radio.checked = true;
                                matched = true;
                                console.log('Dynamic radio field selected:', key, rescheduleData[key], 'matched value:', radio.value);
                            }
                        });
                        if (!matched) {
                            console.log('No radio match for:', key, rescheduleData[key], 'available values:', Array.from(radioGroup).map(r => r.value));
                        }
                    } else if (element.type === 'checkbox') {
                        element.checked = (rescheduleData[key] === 'yes' || rescheduleData[key] === 'on' || rescheduleData[key] === true || rescheduleData[key] === 'true');
                        console.log('Dynamic checkbox field set:', key, element.checked, 'from value:', rescheduleData[key]);
                    } else if (element.tagName === 'SELECT') {
                        // For select elements
                        const options = Array.from(element.options);
                        const matchingOption = options.find(opt => opt.value === rescheduleData[key] || opt.text === rescheduleData[key]);
                        if (matchingOption) {
                            element.value = matchingOption.value;
                            console.log('Dynamic select field set:', key, matchingOption.value);
                        } else {
                            console.log('No select option match for:', key, rescheduleData[key], 'available:', options.map(o => o.value));
                        }
                    } else {
                        // For input fields (text, textarea, etc.)
                        element.value = rescheduleData[key];
                        console.log('Dynamic field filled:', key, rescheduleData[key]);
                    }
                } else {
                    console.log('Dynamic field element not found:', key, 'value:', rescheduleData[key]);
                    // Debug: show what elements are available
                    const similarElements = document.querySelectorAll(`[id*="${key.split('-')[0]}"], [name*="${key.split('-')[0]}"]`);
                    if (similarElements.length > 0) {
                        console.log('Similar elements found:', Array.from(similarElements).map(el => `${el.tagName}#${el.id || 'no-id'}.${el.name || 'no-name'}`));
                    }
                }
            }
        });
        
        // Make all fields non-editable except schedule
        setTimeout(() => {
            makeFieldsReadOnly();
            console.log('Form prefilling completed!');
        }, 500);
    }, 1500);
}

// Wait for form to be fully initialized
function waitForFormInitialization() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const checkFormReady = () => {
            attempts++;
            
            const serviceCategoryElement = document.getElementById('service-category');
            const hasServiceOptions = serviceCategoryElement && serviceCategoryElement.options && serviceCategoryElement.options.length > 1;
            
            console.log(`Form check attempt ${attempts}: Service category options available:`, hasServiceOptions);
            
            if (hasServiceOptions || attempts >= maxAttempts) {
                console.log('Form initialization check complete');
                resolve();
            } else {
                setTimeout(checkFormReady, 100);
            }
        };
        
        checkFormReady();
    });
}

// Make form fields read-only in reschedule mode
function makeFieldsReadOnly() {
    if (!isRescheduleMode) return;
    
    console.log('Making all fields readonly for reschedule mode...');
    
    // Hide dynamic topic container to avoid duplicate
    const dynamicTopicContainer = document.getElementById('dynamic-topic-container');
    if (dynamicTopicContainer) {
        dynamicTopicContainer.style.display = 'none';
    }
    
    // Disable service category tiles 
    const categoryTiles = document.querySelectorAll('[data-category]');
    categoryTiles.forEach(tile => {
        tile.style.pointerEvents = 'none';
        tile.style.opacity = '0.7';
    });
    
    // Disable session type tiles
    const sessionTiles = document.querySelectorAll('[data-type]');
    sessionTiles.forEach(tile => {
        tile.style.pointerEvents = 'none';
        tile.style.opacity = '0.7';
    });
    
    // Personal Details tab - make all fields readonly
    const personalFields = ['name', 'email', 'phone', 'country-code', 'organization', 'designation', 'location'];
    personalFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.setAttribute('readonly', true);
            field.setAttribute('disabled', true);
            field.style.backgroundColor = '#e9ecef';
            field.style.color = '#495057';
            field.style.cursor = 'not-allowed';
            field.style.fontWeight = '500';
            field.style.pointerEvents = 'none';
        }
    });
    
    // Session Details tab - make all fields readonly including dropdowns
    const sessionFields = ['topic', 'dynamic-topic', 'custom-domain-input', 'custom-region-domain-input', 'domain-select', 'region-select'];
    sessionFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.setAttribute('readonly', true);
            field.setAttribute('disabled', true);
            field.style.backgroundColor = '#e9ecef';
            field.style.color = '#495057';
            field.style.cursor = 'not-allowed';
            field.style.fontWeight = '500';
            field.style.pointerEvents = 'none';
        }
    });
    
    // Disable ALL select dropdowns on the page (except schedule-related)
    const allSelects = document.querySelectorAll('select:not(#schedule-select)');
    allSelects.forEach(select => {
        select.setAttribute('disabled', true);
        select.style.backgroundColor = '#e9ecef';
        select.style.color = '#495057';
        select.style.cursor = 'not-allowed';
        select.style.pointerEvents = 'none';
    });
    
    // Disable ALL textareas (except any schedule-related)
    const allTextareas = document.querySelectorAll('textarea');
    allTextareas.forEach(textarea => {
        textarea.setAttribute('readonly', true);
        textarea.setAttribute('disabled', true);
        textarea.style.backgroundColor = '#e9ecef';
        textarea.style.color = '#495057';
        textarea.style.cursor = 'not-allowed';
        textarea.style.pointerEvents = 'none';
    });
    
    // Disable ALL text inputs (except any schedule-related)
    const allTextInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    allTextInputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.setAttribute('disabled', true);
        input.style.backgroundColor = '#e9ecef';
        input.style.color = '#495057';
        input.style.cursor = 'not-allowed';
        input.style.pointerEvents = 'none';
    });
    
    // Disable ALL radio buttons
    const allRadios = document.querySelectorAll('input[type="radio"]');
    allRadios.forEach(radio => {
        radio.setAttribute('disabled', true);
        radio.style.cursor = 'not-allowed';
        radio.style.pointerEvents = 'none';
    });
    
    // Disable domain and region hidden inputs
    const domainCheckboxes = document.querySelectorAll('input[name="selected-domains"]');
    domainCheckboxes.forEach(checkbox => {
        checkbox.setAttribute('disabled', true);
        checkbox.style.cursor = 'not-allowed';
    });
    
    const regionCheckboxes = document.querySelectorAll('input[name="selected-regions"]');
    regionCheckboxes.forEach(checkbox => {
        checkbox.setAttribute('disabled', true);
        checkbox.style.cursor = 'not-allowed';
    });
    
    // Disable consent checkboxes
    const dataConsentCheckbox = document.getElementById('data-consent');
    if (dataConsentCheckbox) {
        dataConsentCheckbox.setAttribute('disabled', true);
        dataConsentCheckbox.style.cursor = 'not-allowed';
    }
    
    const termsConsentCheckbox = document.getElementById('terms-consent');
    if (termsConsentCheckbox) {
        termsConsentCheckbox.setAttribute('disabled', true);
        termsConsentCheckbox.style.cursor = 'not-allowed';
    }
    
    // Make all dynamic question fields readonly
    const dynamicContainer = document.getElementById('dynamic-questions-container');
    if (dynamicContainer) {
        const inputs = dynamicContainer.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.setAttribute('readonly', true);
            input.style.backgroundColor = '#e9ecef';
            input.style.color = '#495057';
            input.style.cursor = 'not-allowed';
            input.style.fontWeight = '500';
            if (input.tagName === 'SELECT' || input.tagName === 'TEXTAREA') {
                input.setAttribute('disabled', true);
                input.style.pointerEvents = 'none';
            }
        });
    }
    
    console.log('All fields made readonly for reschedule mode');
}

// Show reschedule banner
function showRescheduleBanner() {
    const formContainer = document.querySelector('.booking-form');
    if (formContainer) {
        const banner = document.createElement('div');
        banner.className = 'alert alert-warning reschedule-banner';
        banner.style.marginBottom = '20px';
        banner.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>Rescheduling Mode:</strong> Your existing booking information is pre-filled and cannot be edited. 
            Please select a new date and time from the schedule tab below.
            ${rescheduleData.rescheduleReason ? `<br><small><strong>Reason:</strong> ${rescheduleData.rescheduleReason}</small>` : ''}
        `;
        formContainer.insertBefore(banner, formContainer.firstChild);
    }
}

// Update navigation buttons for reschedule mode
function updateNavigationForReschedule() {
    if (!isRescheduleMode) return;
    
    // Allow navigation but keep fields readonly
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.style.display = 'inline-block';
    if (nextBtn) nextBtn.style.display = 'inline-block';
}

// Mobile menu handling for navbar scroll fix
document.addEventListener('DOMContentLoaded', function () {
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('.navbar-collapse');

  // Handle mobile menu open/close for body scroll prevention
  if (navbarToggler && navbarCollapse) {
    navbarToggler.addEventListener('click', function () {
      // Small delay to check the state after Bootstrap processes the click
      setTimeout(() => {
        if (navbarCollapse.classList.contains('show') || navbarCollapse.classList.contains('collapsing')) {
          document.body.classList.add('mobile-menu-open');
        } else {
          document.body.classList.remove('mobile-menu-open');
        }
      }, 50);
    });

    // Listen to Bootstrap's collapse events for more reliable state management
    navbarCollapse.addEventListener('shown.bs.collapse', function () {
      document.body.classList.add('mobile-menu-open');
    });

    navbarCollapse.addEventListener('hidden.bs.collapse', function () {
      document.body.classList.remove('mobile-menu-open');
    });

    // Close mobile menu when clicking on a nav link
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function () {
        if (navbarCollapse.classList.contains('show')) {
          navbarToggler.click();
        }
      });
    });
  }
});
