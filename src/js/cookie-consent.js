/* Cookie Consent Management JavaScript */

/* ############## Cookie Consent Management ############### */

// Check if user has already made a cookie consent choice
function checkCookieConsent() {
  const consent = getCookie('cookieConsent');
  if (!consent) {
    // Show cookie banner if no consent recorded
    const showCookieBanner = () => {
      const cookieBanner = document.getElementById('cookieConsent');
      if (cookieBanner) {
        cookieBanner.classList.add('show');
      }
    };
    
    // Show after 1 second delay
    setTimeout(showCookieBanner, 1000);
  } else {
    // User has made a choice, apply the settings
    let settings;
    
    try {
      // Try to parse as JSON (new format)
      settings = JSON.parse(consent);
    } catch (e) {
      // Handle old format ("accepted" or "declined")
      if (consent === 'accepted') {
        settings = {
          essential: true,
          analytics: true,
          functional: false,
          marketing: false,
          timestamp: new Date().toISOString()
        };
        // Update to new format
        setCookie('cookieConsent', JSON.stringify(settings), 365);
      } else {
        // Old "declined" or any other old format - show banner again
        const showCookieBanner = () => {
          const cookieBanner = document.getElementById('cookieConsent');
          if (cookieBanner) {
            cookieBanner.classList.add('show');
          }
        };
        setTimeout(showCookieBanner, 1000);
        return;
      }
    }
    
    // Apply the settings
    if (settings) {
      applyCookieSettings(settings);
    }
  }
}

// Open Cookie Manager Modal
function openCookieManager() {
  const modal = document.getElementById('cookieModal');
  if (modal) {
    modal.style.display = 'block';
    
    // Add click event to handle backdrop clicks
    modal.addEventListener('click', handleModalClick);
    
    // Prevent closing with Escape key if no consent given
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        const consent = getCookie('cookieConsent');
        if (!consent) {
          event.preventDefault();
          event.stopPropagation();
          // Visual feedback that action is required
          const modalContent = modal.querySelector('.cookie-modal-content');
          if (modalContent) {
            modalContent.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
              modalContent.style.animation = '';
            }, 500);
          }
        }
      }
    };
    
    // Add escape key handler
    document.addEventListener('keydown', handleEscapeKey);
    
    // Store the escape handler so we can remove it later
    modal.escapeHandler = handleEscapeKey;
    
    // Load existing preferences if any
    const consent = getCookie('cookieConsent');
    if (consent) {
      try {
        const settings = JSON.parse(consent);
        const analyticsEl = document.getElementById('analyticsCookies');
        const functionalEl = document.getElementById('functionalCookies');
        const marketingEl = document.getElementById('marketingCookies');
        
        if (analyticsEl) analyticsEl.checked = settings.analytics || false;
        if (functionalEl) functionalEl.checked = settings.functional || false;
        if (marketingEl) marketingEl.checked = settings.marketing || false;
      } catch (e) {
        // Handle old format or invalid JSON
        console.warn('Invalid cookie consent format, using defaults');
      }
    }
  }
}

// Close Cookie Manager Modal - only allow closing after consent is given
function closeCookieManager() {
  // Check if user has made a consent choice
  const consent = getCookie('cookieConsent');
  if (consent) {
    // User has made a choice, allow closing
    const modal = document.getElementById('cookieModal');
    if (modal) {
      modal.style.display = 'none';
      
      // Clean up event listeners
      modal.removeEventListener('click', handleModalClick);
      if (modal.escapeHandler) {
        document.removeEventListener('keydown', modal.escapeHandler);
        modal.escapeHandler = null;
      }
    }
  } else {
    // User hasn't made a choice, keep modal open and show banner
    console.log('Please make a choice about cookies before continuing.');
    // Optionally show a message to the user
    const modal = document.getElementById('cookieModal');
    if (modal) {
      // Add a brief shake animation to indicate action is required
      const modalContent = modal.querySelector('.cookie-modal-content');
      if (modalContent) {
        modalContent.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          modalContent.style.animation = '';
        }, 500);
      }
    }
  }
}

// Handle cookie consent choice
function handleCookieConsent(choice) {
  let settings = {
    essential: true, // Always true
    analytics: false,
    functional: false,
    marketing: false,
    timestamp: new Date().toISOString()
  };

  switch (choice) {
    case 'all':
      settings.analytics = true;
      settings.functional = true;
      settings.marketing = true;
      break;
    case 'essential':
      // Keep defaults (only essential = true)
      break;
    case 'selected':
      const analyticsEl = document.getElementById('analyticsCookies');
      const functionalEl = document.getElementById('functionalCookies');
      const marketingEl = document.getElementById('marketingCookies');
      
      settings.analytics = analyticsEl ? analyticsEl.checked : false;
      settings.functional = functionalEl ? functionalEl.checked : false;
      settings.marketing = marketingEl ? marketingEl.checked : false;
      break;
  }

  // Save consent settings
  setCookie('cookieConsent', JSON.stringify(settings), 365);
  
  // Apply the settings
  applyCookieSettings(settings);
  
  // Hide banner and modal
  const cookieBanner = document.getElementById('cookieConsent');
  if (cookieBanner) {
    cookieBanner.style.animation = 'slideDown 0.5s ease-out';
    setTimeout(() => {
      cookieBanner.style.display = 'none';
    }, 500);
  }
  
  closeCookieManager();
}

// Function to handle modal clicks and prevent closing when clicking outside
function handleModalClick(event) {
  const modal = document.getElementById('cookieModal');
  if (modal && event.target === modal) {
    // Clicked on the backdrop - check if consent has been given
    const consent = getCookie('cookieConsent');
    if (!consent) {
      // No consent given, prevent closing with visual feedback
      const modalContent = modal.querySelector('.cookie-modal-content');
      if (modalContent) {
        modalContent.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          modalContent.style.animation = '';
        }, 500);
      }
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }
}

// Make functions globally accessible
window.openCookieManager = openCookieManager;
window.closeCookieManager = closeCookieManager;
window.handleCookieConsent = handleCookieConsent;
window.handleModalClick = handleModalClick;

// Apply cookie settings
function applyCookieSettings(settings) {
  // Always enable essential cookies (they're needed for the site to function)
  
  // Handle analytics cookies (Google Analytics)
  if (settings.analytics) {
    enableAnalytics();
  } else {
    disableAnalytics();
  }
  
  // Handle functional cookies
  if (settings.functional) {
    enableFunctionalCookies();
  }
  
  // Handle marketing cookies  
  if (settings.marketing) {
    enableMarketingCookies();
  }
}

// Enable analytics
function enableAnalytics() {
  if (typeof gtag !== 'undefined') {
    gtag('consent', 'update', {
      'analytics_storage': 'granted'
    });
  }
}

// Disable analytics
function disableAnalytics() {
  if (typeof gtag !== 'undefined') {
    gtag('consent', 'update', {
      'analytics_storage': 'denied'
    });
  }
}

// Enable functional cookies
function enableFunctionalCookies() {
  // Add functionality for functional cookies (e.g., user preferences, language settings)
  console.log('Functional cookies enabled');
}

// Enable marketing cookies
function enableMarketingCookies() {
  // Add functionality for marketing cookies (e.g., advertising, social media)
  console.log('Marketing cookies enabled');
}

// Set cookie
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Get cookie
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Initialize cookie consent on page load
document.addEventListener('DOMContentLoaded', function() {
  // Check cookie consent status
  checkCookieConsent();
});