import React, { useState } from 'react';
import apiService from '../config/api';

const JoinGroupModal = ({ isOpen, toggleModal, onGroupJoined }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    try {
      const results = await apiService.searchGroups(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (group) => {
    if (!group.isPublic) {
      setSelectedGroup(group);
      return;
    }
    await performJoin(group.id, '');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    await performJoin(selectedGroup.id, password);
  };

  const performJoin = async (groupId, pwd) => {
    console.log(`Attempting to join group ${groupId} with password: "${pwd}"`);
    console.log('Password length:', pwd.length);
    console.log('Password is empty:', pwd === '');
    console.log('Password is undefined:', pwd === undefined);
    console.log('Password is null:', pwd === null);
    
    setLoading(true);
    setError('');
    try {
      const joinData = { groupId, password: pwd };
      console.log('Join data object:', joinData);
      await apiService.joinGroup(joinData);
      onGroupJoined();
      toggleModal();
      setPassword(''); // Clear password only on success
      setSelectedGroup(null); // Clear selected group on success
    } catch (err) {
      let errorMessage = 'Failed to join group';
      if (err.message.includes('400')) {
        errorMessage += ': Invalid password or already a member';
      } else if (err.message.includes('404')) {
        errorMessage += ': Group not found';
      } else if (err.message.includes('401')) {
        errorMessage += ': Please log in';
      } else {
        errorMessage += ': ' + (err.message || 'Unknown error');
      }
      setError(errorMessage);
      // Don't clear selectedGroup on error to allow retry
    } finally {
      setLoading(false);
      // Removed password clearing from finally block
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white z-50">
        <h2 className="text-xl font-bold mb-4">Join a Group</h2>
        <form onSubmit={handleSearch} className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups by name"
            className="px-4 py-2 border rounded-md w-full mb-2"
          />
          <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded w-full">
            Search
          </button>
        </form>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <ul>
          {searchResults.map(group => (
            <li key={group.id} className="mb-2">
              {group.name} ({group.isPublic ? 'Public' : 'Private'})
              <button onClick={() => handleJoin(group)} className="ml-2 bg-green-500 text-white py-1 px-2 rounded">
                Join
              </button>
            </li>
          ))}
        </ul>
        {selectedGroup && (
          <form onSubmit={handlePasswordSubmit} className="mt-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="px-4 py-2 border rounded-md w-full mb-2"
            />
            <button type="submit" disabled={loading} className="bg-green-500 text-white py-2 px-4 rounded w-full">
              {loading ? 'Joining...' : 'Join with Password'}
            </button>
          </form>
        )}
        <button onClick={toggleModal} className="mt-4 bg-red-500 text-white py-2 px-4 rounded w-full">
          Close
        </button>
      </div>
    </div>
  );
};

export default JoinGroupModal; 