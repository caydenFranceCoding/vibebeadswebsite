import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './src/main/styles/home.css';

// Import your existing components
import HomePage from './components/HomePage';
import CandlesPage from './components/CandlesPage';
import DiffusersPage from './components/DiffusersPage';
import WaxMeltsPage from './components/WaxMeltsPage';
import CheckoutPage from './components/CheckoutPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pages/candles" element={<CandlesPage />} />
          <Route path="/pages/diffusers" element={<DiffusersPage />} />
          <Route path="/pages/wax-melts" element={<WaxMeltsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;