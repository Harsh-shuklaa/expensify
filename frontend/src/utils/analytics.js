// Google Analytics 4 Event Tracking Module

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";

/**
 * Dynamically load Google Analytics script if cookies are accepted
 */
export const initGA = () => {
  const consent = localStorage.getItem('cookieConsent');
  if (consent !== 'accepted') {
    console.log('[Analytics] Opt-in consent not granted. Running in simulator mode.');
    return;
  }

  if (window.gtag) return; // Already initialized

  try {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', { 'send_page_view': false });
    `;
    document.head.appendChild(script2);
    console.log(`[Analytics] Google Analytics 4 (${GA_MEASUREMENT_ID}) initialized successfully.`);
  } catch (error) {
    console.error('[Analytics] Failed to load GA4 script:', error);
  }
};

/**
 * Track a Page View event
 * @param {string} path - URL path (e.g. /dashboard)
 */
export const trackPageView = (path) => {
  const consent = localStorage.getItem('cookieConsent');
  if (consent === 'accepted' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
    });
    console.log(`[Analytics] Page View tracked: ${path}`);
  } else {
    console.log(`[Analytics Simulation] Page View: ${path}`);
  }
};

/**
 * Track a Custom User Event
 * @param {string} action - Event action name (e.g. signup, add_expense)
 * @param {string} category - Event category (e.g. Authentication, Budgeting)
 * @param {string} label - Additional metadata context
 */
export const trackEvent = (action, category, label = '') => {
  const consent = localStorage.getItem('cookieConsent');
  if (consent === 'accepted' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
    console.log(`[Analytics] Custom Event: ${action} | Category: ${category} | Label: ${label}`);
  } else {
    console.log(`[Analytics Simulation] Event: ${action} | Category: ${category} | Label: ${label}`);
  }
};

/**
 * Track Application Exceptions and JavaScript Errors
 * @param {string} description - Error message or stack description
 * @param {boolean} fatal - Whether the exception is fatal to application flow
 */
export const trackError = (description, fatal = false) => {
  const consent = localStorage.getItem('cookieConsent');
  if (consent === 'accepted' && window.gtag) {
    window.gtag('event', 'exception', {
      description,
      fatal,
    });
    console.log(`[Analytics] Exception logged: ${description} (Fatal: ${fatal})`);
  } else {
    console.error(`[Analytics Simulation] Exception: ${description} (Fatal: ${fatal})`);
  }
};
