import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
    const navigate = useNavigate();

    const handleBackToGroup = () => {
      navigate('/groups'); // Navigate back to the group page
    };

  return (
    <button
      onClick={handleBackToGroup}
      className="text-gray-700 hover:text-black transition duration-150 ease-in-out flex items-center"
      aria-label="Back to Group"
    >
      <img src="/images/back-arrow.png" alt="Back" className="h-6 w-6" /> 
      <div className="text-xl font-bold">Groups</div>
    </button>
  );
};

export default BackButton;
