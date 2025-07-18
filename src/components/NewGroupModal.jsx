// NewGroupFormModal.jsx
import React, { useState } from 'react';

const NewGroupFormModal = ({ isOpen, toggleModal, createGroup }) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');

  const handleGroupCreation = (event) => {
    event.preventDefault();
    const groupData = {
      name: newGroupName,
      isPublic,
      memberIds: []
    };
    if (!isPublic && password) {
      groupData.password = password;
    }
    console.log('Group data being sent to API:', groupData);
    createGroup(groupData);
    setNewGroupName('');
    setIsPublic(true);
    setPassword('');
    toggleModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <form onSubmit={handleGroupCreation} className="inline-block w-full max-w-md mt-6">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name"
              required
              className="px-4 py-2 border rounded-md focus:outline-none focus:border-blue-300 w-full"
            />
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2"
                />
                Public Group (No password required)
              </label>
            </div>
            {!isPublic && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter group password"
                required
                className="mt-2 px-4 py-2 border rounded-md focus:outline-none focus:border-blue-300 w-full"
              />
            )}
            <button 
              type="submit" 
              className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Create Group
            </button>
            <button 
              type="button" 
              onClick={toggleModal} 
              className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewGroupFormModal;
