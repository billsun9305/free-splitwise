import React from 'react';
import { getApiInfo } from '../config/api';

const ApiDebugInfo = () => {
  const apiInfo = getApiInfo();
  
  // Only show in development or when debug is enabled
  if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_DEBUG) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-50">
      <div className="font-bold">API Config:</div>
      <div>Environment: {apiInfo.environment}</div>
      <div>Base URL: {apiInfo.baseURL}</div>
    </div>
  );
};

export default ApiDebugInfo; 