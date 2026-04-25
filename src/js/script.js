// Smooth scrolling for anchor links - MOVED TO DOMContentLoaded handler below
// (Old handler removed to prevent conflicts with mobile fix)

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
    
    // Check if preloader is active
    const preloaderContainer = document.getElementById('preloader-container');
    if (preloaderContainer && preloaderContainer.style.display !== 'none') {
      // Wait for preloader to finish (3 seconds + 1 second delay)
      setTimeout(showCookieBanner, 4000);
    } else {
      // No preloader or already finished, show after 1 second
      setTimeout(showCookieBanner, 1000);
    }
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
    
    applyCookieSettings(settings);
  }
}

// Open Cookie Manager Modal
function openCookieManager() {
  const modal = document.getElementById('cookieModal');
  if (modal) {
    modal.style.display = 'block';
    
    // Load existing preferences if any
    const consent = getCookie('cookieConsent');
    if (consent) {
      try {
        const settings = JSON.parse(consent);
        document.getElementById('analyticsCookies').checked = settings.analytics || false;
        document.getElementById('functionalCookies').checked = settings.functional || false;
        document.getElementById('marketingCookies').checked = settings.marketing || false;
      } catch (e) {
        // Handle old format or invalid JSON
        console.warn('Invalid cookie consent format, using defaults');
      }
    }
  }
}

// Close Cookie Manager Modal
function closeCookieManager() {
  const modal = document.getElementById('cookieModal');
  if (modal) {
    modal.style.display = 'none';
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

// Make functions globally accessible
window.openCookieManager = openCookieManager;
window.closeCookieManager = closeCookieManager;
window.handleCookieConsent = handleCookieConsent;

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
  document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
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

// Add slideDown animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
  const modal = document.getElementById('cookieModal');
  if (event.target === modal) {
    closeCookieManager();
  }
});

// Make functions global so they can be called from HTML onclick
window.handleCookieConsent = handleCookieConsent;

// Check cookie consent on page load
document.addEventListener('DOMContentLoaded', checkCookieConsent);

// Handle page load with hash in URL (for cross-page navigation like index.html#expertise)
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.hash) {
    const hash = window.location.hash;
    const targetElement = document.querySelector(hash);
    
    if (targetElement) {
      // Prevent browser's default scroll to hash
      history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      
      // Wait for page to fully render, then scroll
      setTimeout(() => {
        const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 70;
        const isMobile = window.innerWidth <= 768;
        const offset = isMobile ? 10 : 20;
        const targetPosition = targetElement.offsetTop - navbarHeight - offset;
        
        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth'
        });
      }, 300);
    }
  }
});

// COMPREHENSIVE SMOOTH SCROLLING FIX - handles all anchor links on mobile and desktop
document.addEventListener('DOMContentLoaded', function() {
  // Get ALL anchor links that point to sections on the page
  const allAnchorLinks = document.querySelectorAll('a[href^="#"]');
  
  allAnchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        e.preventDefault();
        
        // Close mobile navbar if open
        const navbarCollapse = document.querySelector('.navbar-collapse');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
          const navbarToggler = document.querySelector('.navbar-toggler');
          navbarToggler?.click();
        }
        
        // Remove mobile menu restrictions
        document.body.classList.remove('mobile-menu-open');
        
        // Update active state
        document.querySelectorAll('.nav-link').forEach(navLink => {
          navLink.classList.remove('active');
          if (navLink.getAttribute('href') === `#${targetId}`) {
            navLink.classList.add('active');
          }
        });
        
        // Simple scroll - let CSS handle the offset with scroll-padding-top
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// document.addEventListener("DOMContentLoaded", function () {
//   setTimeout(() => {
//     document.getElementById("preloader").style.display = "none";
//     // document.getElementById("content").style.display = "block";
//   }, 3000); // Hides the preloader after 3 seconds
// });

/* ############## Page Loading Animation ############### */

var myVar;

function myFunction() {
  // Add preloading class to body to hide content
  document.body.classList.add('preloading');
  document.body.style.overflow = 'hidden';
  
  myVar = setTimeout(showPage, 3000);
}

// Update the showPage function
function showPage() {
  document.getElementById("preloader-container").style.display = "none";
  document.body.classList.remove('preloading');
  document.body.style.overflow = '';
}

// Then make sure myFunction gets called when the page loads
// document.addEventListener("DOMContentLoaded", function() {
//   myFunction();
// });

// Add this CSS to your head
document.addEventListener("DOMContentLoaded", function() {
  // Check if preloader container exists before running preloader
  const preloaderContainer = document.getElementById("preloader-container");
  
  if (preloaderContainer) {
    // Add required CSS for preloader to work correctly
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      #preloader-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        background: #3f3251;
        background-image: linear-gradient(45deg, #3f3251 2%, #002025 100%);
      }
      
      body.preloading {
        overflow: hidden;
      }
      
      body.preloading .navbar,
      body.preloading #content,
      body.preloading main,
      body.preloading section:not(#preloader-container) {
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Call myFunction to start the preloader
    myFunction();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  window.addEventListener("scroll", function () {
    let navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
});

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
      // Ensure body scroll is fully restored
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    });
  }

  // Close the navbar menu when clicking outside
  document.addEventListener('click', function (event) {
    const isClickInsideNavbar = navbarCollapse.contains(event.target) || navbarToggler.contains(event.target);

    if (!isClickInsideNavbar && navbarCollapse.classList.contains('show')) {
      navbarToggler.click(); // Programmatically trigger the toggler to close the menu
    }
  });

  // Close mobile menu when clicking on a nav link
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link, .navbar-nav .btn');
  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      // Remove mobile-menu-open class before navigation
      document.body.classList.remove('mobile-menu-open');
      
      if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        navbarToggler.click();
      }
    });
  });
});


// Back to top button visibility
window.addEventListener("scroll", function () {
  const backToTopButton = document.getElementById("back-to-top");
  if (window.pageYOffset > 300) {
    backToTopButton.style.display = "flex";
  } else {
    backToTopButton.style.display = "none";
  }
});

// Back to top button click animation - rocket flies upward
const backToTopBtn = document.getElementById("back-to-top");
if (backToTopBtn) {
  backToTopBtn.addEventListener("click", function(e) {
    e.preventDefault();
    
    // Add flying animation
    backToTopBtn.style.transition = "transform 0.6s ease-out, opacity 0.6s ease-out";
    backToTopBtn.style.transform = "translateY(-100vh)";
    backToTopBtn.style.opacity = "0";
    
    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    
    // Reset button position after animation
    setTimeout(() => {
      backToTopBtn.style.transition = "none";
      backToTopBtn.style.transform = "translateY(0)";
      backToTopBtn.style.opacity = "0.7";
      // The button will hide automatically due to scroll position
    }, 600);
  });
}

// Navbar background change on scroll
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.style.backgroundColor = "rgba(11, 61, 145, 0.95)";
    navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
  } else {
    navbar.style.backgroundColor = "var(--primary-color)";
    navbar.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
  }
});

// Active navigation on scroll
window.addEventListener("scroll", function () {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  const navbar = document.querySelector('.navbar');
  const navbarHeight = navbar?.offsetHeight || 70;

  let current = "";
  const scrollPosition = window.pageYOffset + navbarHeight + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    const sectionId = section.getAttribute("id");

    // Check if the current scroll position is within this section
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      current = sectionId;
    }
  });

  // If at the top of the page, default to home
  if (window.pageYOffset < 200 && !current) {
    current = "home";
  }

  // Update active state for all nav links
  navLinks.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    
    // Check if link matches current section
    if (href === `#${current}`) {
      link.classList.add("active");
    }
  });
});


// Company data - add descriptions for each company
const companyData = {
  borderman: {
    name: "Borderman",
    description: "Borderman is a leading company specializing in border security and management solutions. We've worked together on implementing advanced digital systems for efficient border crossing protocols."
  },
  embassy: {
    name: "Embassy",
    description: "Embassy provides diplomatic solutions and international relations consulting. Our collaboration focused on developing communication systems for diplomatic missions worldwide."
  },
  samvada: {
    name: "Samvada",
    description: "Samvada is a premier communication platform offering innovative solutions for businesses. We partnered to enhance their digital presence and user experience across multiple channels."
  },
  coneast: {
    name: "Coneast",
    description: "Coneast specializes in eastern market connectivity and business solutions. Our partnership resulted in streamlined operations and enhanced market penetration strategies."
  },
  cprg: {
    name: "CPRG",
    description: "The Center for Policy Research and Governance (CPRG) focuses on data-driven policy solutions. We collaborated on creating visualization tools for complex policy analysis and reporting."
  },
  eicbi: {
    name: "EICBI",
    description: "The European Indian Chamber of Business and Industry promotes trade relations between Europe and India. We worked together on building digital platforms for cross-continental business networking."
  },
  cnh: {
    name: "CNH",
    description: "CNH is a leader in agricultural and construction equipment. Our partnership focused on developing innovative digital solutions for equipment management and monitoring."
  },
  sonalika: {
    name: "Sonalika",
    description: ""
  }
};

document.addEventListener('DOMContentLoaded', function () {
  const slider = document.querySelector('.companies-slider');
  const sliderContainer = document.querySelector('.companies-slider-container');

  // Only proceed if slider elements exist
  if (slider && sliderContainer) {
    // Function to duplicate logos for seamless looping
    function duplicateLogos() {
      const logos = Array.from(slider.children);
      const containerWidth = sliderContainer.offsetWidth;
      let totalWidth = slider.scrollWidth;

      // Duplicate logos until the total width exceeds the container width
      while (totalWidth < containerWidth * 2) {
        logos.forEach((logo) => {
          const clone = logo.cloneNode(true);
          slider.appendChild(clone);
        });
        totalWidth = slider.scrollWidth;
      }
    }

    // Call the function on page load and resize
    duplicateLogos();
    window.addEventListener('resize', duplicateLogos);

    // Pause animation on hover
    sliderContainer.addEventListener('mouseenter', function () {
      slider.style.animationPlayState = 'paused';
    });

    sliderContainer.addEventListener('mouseleave', function () {
      slider.style.animationPlayState = 'running';
    });
  }
});

// Initialize popup functionality
document.addEventListener('DOMContentLoaded', function () {
  const companyLogos = document.querySelectorAll('.company-logo');
  const popupOverlay = document.querySelector('.company-popup-overlay');
  const popupClose = document.querySelector('.popup-close');
  const popupLogo = document.querySelector('.popup-logo img');
  const popupTitle = document.querySelector('.popup-description h3');
  const popupDescription = document.querySelector('.popup-description p');
  const sliderContainer = document.querySelector('.companies-slider-container');
  const slider = document.querySelector('.companies-slider');

  // Exit early if company slider elements don't exist (not on a page with company slider)
  if (!sliderContainer || !slider) {
    return;
  }

  function checkVisibility() {
    // Check if elements exist before proceeding
    if (!sliderContainer || !slider) return;
    
    // Get the width of the slider container
    const containerWidth = sliderContainer.offsetWidth;

    // Get the width of the slider
    const sliderWidth = slider.scrollWidth;

    // Ensure animation has enough space
    if (sliderWidth < containerWidth * 3) {
      // Get the first set of company logos to duplicate
      const firstLogoSet = document.querySelectorAll('.company-logo');
      if (firstLogoSet.length > 0) {
        // Create duplicates of existing logos
        firstLogoSet.forEach(logo => {
          const duplicate = logo.cloneNode(true);
          slider.appendChild(duplicate);
        });
      }
    }
  }

  // Check logo visibility after the page has loaded
  window.addEventListener('load', checkVisibility);
  window.addEventListener('resize', checkVisibility);

  // Function to open popup
  function openPopup(company) {
    const companyInfo = companyData[company];

    if (!companyInfo || !popupOverlay || !popupLogo || !popupTitle || !popupDescription) return;

    // Set popup content
    popupLogo.src = `./assets/${company}.${getFileExtension(company)}`;
    popupLogo.alt = companyInfo.name;
    popupTitle.textContent = companyInfo.name;
    popupDescription.textContent = companyInfo.description;

    // Show popup
    popupOverlay.classList.add('active');

    // Pause slider animation when popup is open
    if (slider) {
      slider.style.animationPlayState = 'paused';
    }
  }

  // Helper function to get correct file extension
  function getFileExtension(company) {
    switch (company) {
      case 'borderman':
        return 'jpg';
      case 'embassy':
      case 'samvada':
      case 'cnh':
        return 'jpeg';
      case 'sonalika':
        return 'jpeg';
      case 'coneast':
      case 'cprg':
      case 'eicbi':
        return 'png';
      default:
        return 'png';
    }
  }

  // Add click event to all company logos
  companyLogos.forEach(logo => {
    logo.addEventListener('click', function () {
      const company = this.getAttribute('data-company');
      openPopup(company);
    });
  });

  // Close popup
  if (popupClose) {
    popupClose.addEventListener('click', function () {
      if (popupOverlay) {
        popupOverlay.classList.remove('active');
      }
      // Resume slider animation
      if (slider) {
        slider.style.animationPlayState = 'running';
      }
    });
  }

  // Close popup when clicking outside
  if (popupOverlay) {
    popupOverlay.addEventListener('click', function (e) {
      if (e.target === popupOverlay) {
        popupOverlay.classList.remove('active');
        // Resume slider animation
        if (slider) {
          slider.style.animationPlayState = 'running';
        }
      }
    });
  }

  // Close popup with ESC key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popupOverlay && popupOverlay.classList.contains('active')) {
      popupOverlay.classList.remove('active');
      // Resume slider animation if it exists
      const companiesSlider = document.querySelector('.companies-slider');
      if (companiesSlider) {
        companiesSlider.style.animationPlayState = 'running';
      }
    }
  });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 70,
        behavior: "smooth",
      });
    }

    // Close the navbar collapse on mobile after clicking a link
    const navbarCollapse = document.querySelector(".navbar-collapse");
    if (navbarCollapse.classList.contains("show")) {
      const navbarToggler = document.querySelector(".navbar-toggler");
      navbarToggler.click();
    }
  });
});


document.addEventListener('DOMContentLoaded', function () {
  const tabStrategic = document.getElementById('tab-strategic');
  const tabRegional = document.getElementById('tab-regional');
  const strategicContent = document.getElementById('strategic-content');
  const regionalContent = document.getElementById('regional-content');

  // Only proceed if all required elements exist
  if (tabStrategic && tabRegional && strategicContent && regionalContent) {
    tabStrategic.addEventListener('click', function () {
      // Update active tab
      tabStrategic.classList.add('active');
      tabRegional.classList.remove('active');
      tabRegional.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';

      // Show/hide content
      strategicContent.style.display = 'block';
      regionalContent.style.display = 'none';
    });

    tabRegional.addEventListener('click', function () {
      // Update active tab
      tabRegional.classList.add('active');
      tabStrategic.classList.remove('active');
      tabStrategic.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';

      // Show/hide content
      regionalContent.style.display = 'block';
      strategicContent.style.display = 'none';
    });
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const polyglot = document.getElementById('polyglot');
  const popup = document.getElementById('polyglot-popup');
  
  if (!polyglot || !popup) {
    // Elements don't exist on this page - this is normal
    return;
  }

  // Show popup on click
  polyglot.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent event bubbling
    const rect = polyglot.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.classList.toggle('active');
  });

  // Hide popup when clicking outside
  document.addEventListener('click', function(event) {
    if (!popup.contains(event.target) && event.target !== polyglot) {
      popup.classList.remove('active');
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // --- Google Form Integration ---
  const contactForm = document.getElementById("contact-form");
  const feedbackDiv = document.getElementById("form-feedback");
  // !!! REPLACE WITH YOUR GOOGLE FORM ACTION URL !!!
  const googleFormActionURL = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLScUx1V-zSMealgmtcawYYSQrR3HS_qjodFbubFciMSwnW9ljQ/formResponse'; // Find this in your form's source code

  // --- Session Type Button Logic ---
  const categoryButtons = document.querySelectorAll(".category-buttons .btn-category");
  const hiddenSessionTypeInput = document.getElementById("session-type-hidden");
  const sessionTypeErrorDiv = document.getElementById("session-type-error");

  categoryButtons.forEach(button => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      categoryButtons.forEach(btn => btn.classList.remove("active"));
      // Add active class to the clicked button
      this.classList.add("active");
      // Update the hidden input's value
      hiddenSessionTypeInput.value = this.getAttribute("data-value");
      // Hide error message if shown
      sessionTypeErrorDiv.style.display = 'none';
      // Trigger validation state change (optional, good practice)
      hiddenSessionTypeInput.dispatchEvent(new Event('input'));
    });
  });

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent default form submission

      // Basic validation check for session type selection
      if (!hiddenSessionTypeInput.value) {
        sessionTypeErrorDiv.style.display = 'block';
        hiddenSessionTypeInput.focus(); // Focus element to guide user (optional)
        return; // Stop submission
      } else {
        sessionTypeErrorDiv.style.display = 'none';
      }


      const formData = new FormData(contactForm);
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;

      // Disable button and show loading state
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
      feedbackDiv.style.display = 'none'; // Hide previous messages
      feedbackDiv.className = ''; // Reset feedback class

      fetch(googleFormActionURL, {
        method: "POST",
        body: formData,
        mode: "no-cors", // Important for submitting to Google Forms cross-origin
      })
        .then(response => {
          // Because of 'no-cors', we can't *read* the response status.
          // We optimistically assume success if the fetch itself didn't throw an error.
          console.log("Form submitted (no-cors mode). Check Google Sheet.");
          feedbackDiv.textContent = "Thank you! Your message has been sent successfully.";
          feedbackDiv.className = 'alert alert-success'; // Use Bootstrap alert classes
          feedbackDiv.style.display = 'block';
          contactForm.reset(); // Clear the form fields
          // Reset category buttons visually
          categoryButtons.forEach(btn => btn.classList.remove("active"));

        })
        .catch(error => {
          console.error("Error submitting form:", error);
          feedbackDiv.textContent = "Sorry, there was an error sending your message. Please try again later.";
          feedbackDiv.className = 'alert alert-danger'; // Use Bootstrap alert classes
          feedbackDiv.style.display = 'block';
        })
        .finally(() => {
          // Re-enable button and restore text
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        });
    });
  }

  // --- Existing Back to Top Button Logic etc. ---
  const backToTopButton = document.getElementById("back-to-top");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      // Check if button exists before trying to style it
      if (backToTopButton) {
        backToTopButton.style.display = "flex";
      }
    } else {
      if (backToTopButton) {
        backToTopButton.style.display = "none";
      }
    }
  });

  // --- Existing Navbar Active Link Logic ---
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const sections = document.querySelectorAll('section'); // Assuming your sections have IDs matching hrefs

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      // Adjust offset if needed (e.g., for fixed navbar height)
      if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      // Check if the link's href matches the current section ID
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
    // Special case for home when at the very top
    if (window.scrollY < 200) {
      navLinks.forEach(link => link.classList.remove('active'));
      const homeLink = document.querySelector('.navbar-nav .nav-link[href="#home"]');
      if (homeLink) homeLink.classList.add('active');
    }
  });

  // --- Existing Companies Slider and Popup Logic ---
  const logos = document.querySelectorAll('.company-logo');
  const popupOverlay = document.querySelector('.company-popup-overlay');
  const popup = document.querySelector('.company-popup');
  const popupClose = document.querySelector('.popup-close');
  const popupLogoImg = document.querySelector('.popup-logo img');
  const popupTitle = document.querySelector('.popup-description h3');
  const popupText = document.querySelector('.popup-description p');

  // Define company descriptions (replace with actual content)
  const companyData = {
    borderman: { name: "Borderman", logo: "./assets/borderman.jpg", description: "" },
    embassy: { name: "Embassy of Lebanon", logo: "./assets/embassy.jpeg", description: "" },
    samvada: { name: "Samvada World", logo: "./assets/samvada.jpeg", description: "" },
    coneast: { name: "Center for North East Asian Studies", logo: "./assets/coneast.png", description: "" },
    cprg: { name: "CPRG", logo: "./assets/cprg-3.png", description: "" },
    eicbi: { name: "EICBI", logo: "./assets/eicbi.png", description: "" },
    cnh: { name: "CNH Industrial", logo: "./assets/cnh.jpeg", description: "" },
    // Add other companies if needed
  };

  logos.forEach(logo => {
    logo.addEventListener('click', () => {
      const companyKey = logo.getAttribute('data-company');
      const data = companyData[companyKey];
      if (data && popupOverlay && popupLogoImg && popupTitle && popupText) {
        popupLogoImg.src = data.logo;
        popupLogoImg.alt = data.name + " Logo";
        popupTitle.textContent = data.name;
        popupText.textContent = data.description;
        popupOverlay.style.display = 'flex';
        // Add class to body to prevent scrolling
        document.body.classList.add('popup-open');
      } else {
        console.error("Popup elements or company data not found for key:", companyKey);
      }
    });
  });

  if (popupClose) {
    popupClose.addEventListener('click', () => {
      if (popupOverlay) {
        popupOverlay.style.display = 'none';
        // Remove class from body to allow scrolling
        document.body.classList.remove('popup-open');
      }
    });
  }

  // Close popup if clicking outside the content area
  if (popupOverlay) {
    popupOverlay.addEventListener('click', (event) => {
      // Check if the click was directly on the overlay, not the popup content
      if (event.target === popupOverlay) {
        popupOverlay.style.display = 'none';
        // Remove class from body to allow scrolling
        document.body.classList.remove('popup-open');
      }
    });
  }

  // --- Expertise Tabs ---
  const tabButtons = document.querySelectorAll('.expertise-tabs .tab-button');
  const tabContents = document.querySelectorAll('.expertise-section .tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get the target content ID from the button's ID
      const targetId = button.id.replace('tab-', '') + '-content';
      const targetContent = document.getElementById(targetId);

      // Update button styles
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // Default non-active style
      });
      button.classList.add('active');
      button.style.backgroundColor = 'var(--primary-color)'; // Active style

      // Hide all tab contents
      tabContents.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
      });

      // Show the target tab content
      if (targetContent) {
        targetContent.style.display = 'block'; // Or 'flex' or 'grid' depending on layout
        targetContent.classList.add('active');
      }
    });
  });

});

/*!
 * Particleground
 *
 * @author Jonathan Nicol - @mrjnicol
 * @version 1.1.0
 * @description Creates a canvas based particle system background
 *
 * Inspired by http://requestlab.fr/ and http://disruptivebydesign.com/
 */
!function(a,b){"use strict";function c(a){a=a||{};for(var b=1;b<arguments.length;b++){var c=arguments[b];if(c)for(var d in c)c.hasOwnProperty(d)&&("object"==typeof c[d]?deepExtend(a[d],c[d]):a[d]=c[d])}return a}function d(d,g){function h(){if(y){r=b.createElement("canvas"),r.className="pg-canvas",r.style.display="block",d.insertBefore(r,d.firstChild),s=r.getContext("2d"),i();for(var c=Math.round(r.width*r.height/g.density),e=0;c>e;e++){var f=new n;f.setStackPos(e),z.push(f)}a.addEventListener("resize",function(){k()},!1),b.addEventListener("mousemove",function(a){A=a.pageX,B=a.pageY},!1),D&&!C&&a.addEventListener("deviceorientation",function(){F=Math.min(Math.max(-event.beta,-30),30),E=Math.min(Math.max(-event.gamma,-30),30)},!0),j(),q("onInit")}}function i(){r.width=d.offsetWidth,r.height=d.offsetHeight,s.fillStyle=g.dotColor,s.strokeStyle=g.lineColor,s.lineWidth=g.lineWidth}function j(){if(y){u=a.innerWidth,v=a.innerHeight,s.clearRect(0,0,r.width,r.height);for(var b=0;b<z.length;b++)z[b].updatePosition();for(var b=0;b<z.length;b++)z[b].draw();G||(t=requestAnimationFrame(j))}}function k(){i();for(var a=d.offsetWidth,b=d.offsetHeight,c=z.length-1;c>=0;c--)(z[c].position.x>a||z[c].position.y>b)&&z.splice(c,1);var e=Math.round(r.width*r.height/g.density);if(e>z.length)for(;e>z.length;){var f=new n;z.push(f)}else e<z.length&&z.splice(e);for(c=z.length-1;c>=0;c--)z[c].setStackPos(c)}function l(){G=!0}function m(){G=!1,j()}function n(){switch(this.stackPos,this.active=!0,this.layer=Math.ceil(3*Math.random()),this.parallaxOffsetX=0,this.parallaxOffsetY=0,this.position={x:Math.ceil(Math.random()*r.width),y:Math.ceil(Math.random()*r.height)},this.speed={},g.directionX){case"left":this.speed.x=+(-g.maxSpeedX+Math.random()*g.maxSpeedX-g.minSpeedX).toFixed(2);break;case"right":this.speed.x=+(Math.random()*g.maxSpeedX+g.minSpeedX).toFixed(2);break;default:this.speed.x=+(-g.maxSpeedX/2+Math.random()*g.maxSpeedX).toFixed(2),this.speed.x+=this.speed.x>0?g.minSpeedX:-g.minSpeedX}switch(g.directionY){case"up":this.speed.y=+(-g.maxSpeedY+Math.random()*g.maxSpeedY-g.minSpeedY).toFixed(2);break;case"down":this.speed.y=+(Math.random()*g.maxSpeedY+g.minSpeedY).toFixed(2);break;default:this.speed.y=+(-g.maxSpeedY/2+Math.random()*g.maxSpeedY).toFixed(2),this.speed.x+=this.speed.y>0?g.minSpeedY:-g.minSpeedY}}function o(a,b){return b?void(g[a]=b):g[a]}function p(){console.log("destroy"),r.parentNode.removeChild(r),q("onDestroy"),f&&f(d).removeData("plugin_"+e)}function q(a){void 0!==g[a]&&g[a].call(d)}var r,s,t,u,v,w,x,y=!!b.createElement("canvas").getContext,z=[],A=0,B=0,C=!navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i),D=!!a.DeviceOrientationEvent,E=0,F=0,G=!1;return g=c({},a[e].defaults,g),n.prototype.draw=function(){s.beginPath(),s.arc(this.position.x+this.parallaxOffsetX,this.position.y+this.parallaxOffsetY,g.particleRadius/2,0,2*Math.PI,!0),s.closePath(),s.fill(),s.beginPath();for(var a=z.length-1;a>this.stackPos;a--){var b=z[a],c=this.position.x-b.position.x,d=this.position.y-b.position.y,e=Math.sqrt(c*c+d*d).toFixed(2);e<g.proximity&&(s.moveTo(this.position.x+this.parallaxOffsetX,this.position.y+this.parallaxOffsetY),g.curvedLines?s.quadraticCurveTo(Math.max(b.position.x,b.position.x),Math.min(b.position.y,b.position.y),b.position.x+b.parallaxOffsetX,b.position.y+b.parallaxOffsetY):s.lineTo(b.position.x+b.parallaxOffsetX,b.position.y+b.parallaxOffsetY))}s.stroke(),s.closePath()},n.prototype.updatePosition=function(){if(g.parallax){if(D&&!C){var a=(u-0)/60;w=(E- -30)*a+0;var b=(v-0)/60;x=(F- -30)*b+0}else w=A,x=B;this.parallaxTargX=(w-u/2)/(g.parallaxMultiplier*this.layer),this.parallaxOffsetX+=(this.parallaxTargX-this.parallaxOffsetX)/10,this.parallaxTargY=(x-v/2)/(g.parallaxMultiplier*this.layer),this.parallaxOffsetY+=(this.parallaxTargY-this.parallaxOffsetY)/10}var c=d.offsetWidth,e=d.offsetHeight;switch(g.directionX){case"left":this.position.x+this.speed.x+this.parallaxOffsetX<0&&(this.position.x=c-this.parallaxOffsetX);break;case"right":this.position.x+this.speed.x+this.parallaxOffsetX>c&&(this.position.x=0-this.parallaxOffsetX);break;default:(this.position.x+this.speed.x+this.parallaxOffsetX>c||this.position.x+this.speed.x+this.parallaxOffsetX<0)&&(this.speed.x=-this.speed.x)}switch(g.directionY){case"up":this.position.y+this.speed.y+this.parallaxOffsetY<0&&(this.position.y=e-this.parallaxOffsetY);break;case"down":this.position.y+this.speed.y+this.parallaxOffsetY>e&&(this.position.y=0-this.parallaxOffsetY);break;default:(this.position.y+this.speed.y+this.parallaxOffsetY>e||this.position.y+this.speed.y+this.parallaxOffsetY<0)&&(this.speed.y=-this.speed.y)}this.position.x+=this.speed.x,this.position.y+=this.speed.y},n.prototype.setStackPos=function(a){this.stackPos=a},h(),{option:o,destroy:p,start:m,pause:l}}var e="particleground",f=a.jQuery;a[e]=function(a,b){return new d(a,b)},a[e].defaults={minSpeedX:.1,maxSpeedX:.7,minSpeedY:.1,maxSpeedY:.7,directionX:"center",directionY:"center",density:1e4,dotColor:"#666666",lineColor:"#666666",particleRadius:7,lineWidth:1,curvedLines:!1,proximity:100,parallax:!0,parallaxMultiplier:5,onInit:function(){},onDestroy:function(){}},f&&(f.fn[e]=function(a){if("string"==typeof arguments[0]){var b,c=arguments[0],g=Array.prototype.slice.call(arguments,1);return this.each(function(){f.data(this,"plugin_"+e)&&"function"==typeof f.data(this,"plugin_"+e)[c]&&(b=f.data(this,"plugin_"+e)[c].apply(this,g))}),void 0!==b?b:this}return"object"!=typeof a&&a?void 0:this.each(function(){f.data(this,"plugin_"+e)||f.data(this,"plugin_"+e,new d(this,a))})})}(window,document),/**
 * requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
 * @see: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * @see: http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 * @license: MIT license
 */
function(){for(var a=0,b=["ms","moz","webkit","o"],c=0;c<b.length&&!window.requestAnimationFrame;++c)window.requestAnimationFrame=window[b[c]+"RequestAnimationFrame"],window.cancelAnimationFrame=window[b[c]+"CancelAnimationFrame"]||window[b[c]+"CancelRequestAnimationFrame"];window.requestAnimationFrame||(window.requestAnimationFrame=function(b){var c=(new Date).getTime(),d=Math.max(0,16-(c-a)),e=window.setTimeout(function(){b(c+d)},d);return a=c+d,e}),window.cancelAnimationFrame||(window.cancelAnimationFrame=function(a){clearTimeout(a)})}();


// Initialize particle background only if elements exist
const particlesForeground = document.getElementById('particles-foreground');
const particlesBackground = document.getElementById('particles-background');

if (particlesForeground) {
  particleground(particlesForeground, {
    dotColor: 'rgba(255, 255, 255, 1)',
    lineColor: 'rgba(255, 255, 255, 0.05)',
    minSpeedX: 0.3,
    maxSpeedX: 0.6,
    minSpeedY: 0.3,
    maxSpeedY: 0.6,
    density: 50000, // One particle every n pixels
    curvedLines: false,
    proximity: 250, // How close two dots need to be before they join
    parallaxMultiplier: 10, // Lower the number is more extreme parallax
    particleRadius: 4, // Dot size
  });
}

if (particlesBackground) {
  particleground(particlesBackground, {
    dotColor: 'rgba(255, 255, 255, 0.5)',
    lineColor: 'rgba(255, 255, 255, 0.05)',
    minSpeedX: 0.075,
    maxSpeedX: 0.15,
    minSpeedY: 0.075,
    maxSpeedY: 0.15,
    density: 30000, // One particle every n pixels
    curvedLines: false,
    proximity: 20, // How close two dots need to be before they join
    parallaxMultiplier: 20, // Lower the number is more extreme parallax
    particleRadius: 2, // Dot size
  });
}
