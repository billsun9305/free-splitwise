import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage'; // Make sure this component exists
import Group from './pages/Group'; // Make sure this component exists
import Check from './components/Check';
import ApiDebugInfo from './components/ApiDebugInfo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/groups" element={<Group />} />
        <Route path="/checks/:groupId" element={<Check />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      <ApiDebugInfo />
    </Router>
  );
}

export default App;
