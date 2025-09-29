import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';
import NewGroupModal from '../components/NewGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';
import apiService from '../config/api';


const Group = () => {
  const [groups, setGroups] = useState([]); // Initialize groups as an empty array
  const [showForm, setShowForm] = useState(false); // State to show/hide the form
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [shouldFetchGroups, setShouldFetchGroups] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Function to fetch groups
  const fetchGroups = async () => {
    try {
      const data = await apiService.getAllGroups();
      setGroups(data); // Set fetched groups to state
      setShouldFetchGroups(false);
    } catch (error) {
      console.error("Could not fetch groups: ", error);
    }
  };

  const createGroup = async (groupName) => {
    // Implement your logic to create a new group with the given name
    console.log(`Creating group: ${groupName}`);
    
    try {
      const data = await apiService.createGroup(groupName);
      console.log('Group created:', data);
      setShouldFetchGroups(true);
    } catch (error) {
      console.error("Could not create group: ", error);
    }
  };
  
  // Effect for fetching groups initially when component mounts and after adding a new group
  useEffect(() => {
    if (shouldFetchGroups) {
      fetchGroups();
    }
  }, [shouldFetchGroups]); // Dependency array includes the flag

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const toggleJoinModal = () => {
    setShowJoinModal(!showJoinModal);
  };

  const handleGroupJoined = () => {
    setShouldFetchGroups(true);
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    const confirmed = window.confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    try {
      await apiService.deleteGroup(groupId);
      alert(`Group "${groupName}" has been deleted successfully.`);
      setShouldFetchGroups(true);
    } catch (error) {
      console.error("Could not delete group: ", error);
      alert(`Failed to delete group: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-teal-400">
      <div className="container max-w-5xl mx-auto py-10 px-4">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Your Groups</h1>
          <LogoutButton className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition ease-in duration-200" />
        </div>

        <button 
          onClick={toggleForm} 
          className="text-sm bg-blue-600 hover:bg-blue-800 text-white font-bold my-2 py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          New Group
        </button>
        <button 
          onClick={toggleJoinModal} 
          className="ml-4 text-sm bg-purple-600 hover:bg-purple-800 text-white font-bold my-2 py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Join Group
        </button>

        <NewGroupModal 
          isOpen={showForm} 
          toggleModal={toggleForm} 
          createGroup={createGroup} 
        />

        <JoinGroupModal 
          isOpen={showJoinModal} 
          toggleModal={toggleJoinModal} 
          onGroupJoined={handleGroupJoined} 
        />

        <div className="bg-white p-6 rounded-lg shadow-lg">
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Group cards */}
              {groups.map(group => (
                <div key={group.id} className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-gray-200 hover:shadow-xl transition duration-300">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{group.name}</h3>
                  <div className="flex flex-col w-full space-y-2">
                    <Link
                      to={`/checks/${group.id}`}
                      className="w-full text-center bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition duration-300 ease-in-out shadow-md"
                    >
                      💰 Manage Expenses
                    </Link>
                    <button
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="w-full text-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out shadow-md"
                    >
                      🗑️ Delete Group
                    </button>
                    <div className="text-xs text-gray-500 text-center mt-2">
                      Split bills • Track balances • Simple entries
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center">No groups found. Start by creating one!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Group;
