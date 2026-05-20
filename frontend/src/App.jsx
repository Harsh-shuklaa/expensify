import React from 'react'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Home from './pages/Dashboard/Home';
import Income from './pages/Dashboard/Income';
import Expense from './pages/Dashboard/Expense';
import RecycleBin from './pages/Dashboard/RecycleBin';
import UserProvider from './context/UserContext';
import { Toaster } from "react-hot-toast";


const App = () => {
  return (
    <UserProvider>
      <div>
        <Router>
          <Routes>
            <Route path='/' element={<Root />} />
            <Route path='/login' exact element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/dashboard' element={<Home />} />
            <Route path='/home' element={<Home />} />
            <Route path='/income' element={<Income />} />
            <Route path='/expense' element={<Expense />} />
            <Route path='/recycle-bin' element={<RecycleBin />} />
          </Routes>
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
