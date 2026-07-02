import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initGA } from '../utils/analytics';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    } else if (consent === 'accepted') {
      // If already accepted, initialize GA
      initGA();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
    // Initialize GA4 upon acceptance
    initGA();
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:right-8 md:left-auto md:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 z-50 transition-all duration-300 animate-bounce-subtle">
      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">🍪 Cookie Consent</h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
        We use essential cookies to keep you logged in and analytics cookies to improve your dashboard experience. 
        Read our <Link to="/cookie-policy" className="text-primary hover:underline font-medium">Cookie Policy</Link> for details.
      </p>
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={handleDecline}
          className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer dark:text-gray-300 transition-colors"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-xs font-semibold text-white rounded-lg shadow-md shadow-primary/20 cursor-pointer transition-colors"
        >
          Accept All
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
