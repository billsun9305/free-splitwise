import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';
import NewGroupModal from '../components/NewGroupModal';


const Group = () => {
  const [groups, setGroups] = useState([]); // Initialize groups as an empty array
  const [showForm, setShowForm] = useState(false); // State to show/hide the form
  const [shouldFetchGroups, setShouldFetchGroups] = useState(true);

  // Function to fetch groups
  const fetchGroups = async () => {
    try {
      const response = await fetch('https://api.splitwise.world/api/groups/all', {
      // const response = await fetch('http://pheasant-lucky-owl.ngrok-free.app/api/groups/all', {
      // const response = await fetch('http://localhost:8080/api/groups/all', {
      // const response = await fetch('https://free-splitwise-f7e9136cd3b7.herokuapp.com/api/groups/all/', {
        credentials: 'include', // Ensure cookies, such as session cookies, are sent with the request
        redirect: 'follow' // This might be the default, allows following redirects automatically
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
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
      const response = await fetch('https://api.splitwise.world/api/groups', {
        // const response = await fetch('http://localhost:8080/api/groups', {

        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: groupName }), // Send the group name in the body
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Group created:', data);
      setShouldFetchGroups(true);
    } catch (error) {
      console.error("Could not create group: ", error);
    }


    // Once created, fetch the groups again to update the list
    // fetchGroups();
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

        <NewGroupModal 
          isOpen={showForm} 
          toggleModal={toggleForm} 
          createGroup={createGroup} 
        />

        <div className="bg-white p-6 rounded-lg shadow-lg">
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Group cards */}
              {groups.map(group => (
                <div key={group.id} className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:shadow-xl transition duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{group.name}</h3>
                  <Link
                    to={`/checks/${group.id}`}
                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition duration-300 ease-in-out"
                  >
                    View Check
                  </Link>
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
