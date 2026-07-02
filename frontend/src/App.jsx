import React from 'react'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

import Home from './pages/Dashboard/Home';
import Income from './pages/Dashboard/Income';
import Expense from './pages/Dashboard/Expense';
import RecycleBin from './pages/Dashboard/RecycleBin';
import Support from './pages/Dashboard/Support';
import Settings from './pages/Dashboard/Settings';

// Compliance
import PrivacyPolicy from './pages/Compliance/PrivacyPolicy';
import TermsOfService from './pages/Compliance/TermsOfService';
import CookiePolicy from './pages/Compliance/CookiePolicy';
import DataDisclosure from './pages/Compliance/DataDisclosure';
import AccountDeletionPolicy from './pages/Compliance/AccountDeletionPolicy';

import UserProvider from './context/UserContext';
import { Toaster } from "react-hot-toast";
import CookieConsent from './components/CookieConsent';
import { useEffect } from 'react';
import { trackPageView } from './utils/analytics';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
};

const App = () => {
  return (
    <UserProvider>
      <div>
        <Router>
          <AnalyticsTracker />
          <Routes>
            <Route path='/' element={<Root />} />
            <Route path='/login' exact element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/verify-email' element={<VerifyEmail />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/reset-password' element={<ResetPassword />} />
            <Route path='/dashboard' element={<Home />} />
            <Route path='/home' element={<Home />} />
            <Route path='/income' element={<Income />} />
            <Route path='/expense' element={<Expense />} />
            <Route path='/recycle-bin' element={<RecycleBin />} />
            <Route path='/support' element={<Support />} />
            <Route path='/settings' element={<Settings />} />

            {/* Compliance routes */}
            <Route path='/privacy-policy' element={<PrivacyPolicy />} />
            <Route path='/terms-of-service' element={<TermsOfService />} />
            <Route path='/cookie-policy' element={<CookiePolicy />} />
            <Route path='/data-disclosure' element={<DataDisclosure />} />
            <Route path='/account-deletion-policy' element={<AccountDeletionPolicy />} />
          </Routes>
          <CookieConsent />
        </Router>
      </div>

      <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: "13px"
          },
        }}
      />
    </UserProvider>
  )
}

export default App;


const Root = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  return isAuthenticated ?
    (<Navigate to='/dashboard' />) :
    (<Navigate to='/login' />);
};
