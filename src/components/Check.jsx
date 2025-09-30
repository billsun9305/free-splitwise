import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EntryForm from './EntryForm'; // You'll need to create this component for the form
import EntryList from './EntryList'; // You'll need to create this component for listing entries
import LogoutButton from '../components/LogoutButton';
import BackButton from './BackButton';
import SplitExpenseModal from './SplitExpenseModal';
import SplitExpensesList from './SplitExpensesList';
import apiService from '../config/api';

const Check = () => {
    const { groupId } = useParams();
    const [entries, setEntries] = useState([]);
    const [form, setForm] = useState({ date: '', title: '', amount: '', groupId});
    const [editingId, setEditingId] = useState(null);
    const [editingEntry, setEditingEntry] = useState(null);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState('splits'); // 'splits' or 'simple'
    const [groupDetails, setGroupDetails] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [error, setError] = useState('');
    const [simpleEntrySortBy, setSimpleEntrySortBy] = useState('date-desc');
    const [sortedEntries, setSortedEntries] = useState([]);

    const handleInputChange = (event) => {
      const { name, value } = event.target;
      setForm({ ...form, [name]: value });
    };
  
    // Modified handleSubmit to handle both add and update
    const handleSubmit = (event) => {
      event.preventDefault();
      if (editingId) {
        updateEntry({ ...form, id: editingId });
      } else {
        addEntry(form);
      }
      setForm({ date: '', title: '', amount: '' }); // Reset the form fields
      setEditingId(null); // Reset editingId
    };
  
    // Function to handle change on edit input fields
    const handleEditChange = (id, field, value) => {
      setEntries(entries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ));
      setSortedEntries(sortedEntries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ));
    };
  
    // If the effect doesn't rely on any props or state that change, it can be safe to omit functions from the dependency array — just be aware that this is more of an exception to the rule.
    // Fetch data from backend
    useEffect(() => {
      const fetchEntries = async () => {
        try {
          console.log("Fetch entry with group id = " + groupId);
          const data = await apiService.getEntries(groupId);
          setEntries(data);
        } catch (error) {
          console.error('Error fetching entries:', error);
        }
      };
      fetchEntries();
    }, [groupId]);

    // Sort entries whenever they change or sort criteria changes
    useEffect(() => {
      const sorted = [...entries].sort((a, b) => {
        switch (simpleEntrySortBy) {
          case 'date-desc':
            return new Date(b.date) - new Date(a.date);
          case 'date-asc':
            return new Date(a.date) - new Date(b.date);
          case 'amount-desc':
            return parseFloat(b.amount) - parseFloat(a.amount);
          case 'amount-asc':
            return parseFloat(a.amount) - parseFloat(b.amount);
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
      setSortedEntries(sorted);
    }, [entries, simpleEntrySortBy]);
  
      // Add entry to the backend
    const addEntry = async (newEntry) => {
      try {
        const entry = await apiService.createEntry(newEntry);
        setEntries([...entries, entry]);
      } catch (error) {
        console.error('Error adding entry:', error);
      }
    };
  
    // Function to delete entry
    const deleteEntry = async (id) => {
      try {
        await apiService.deleteEntry(id);
        setEntries(entries.filter(entry => entry.id !== id));
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    };
  
    const updateEntry = async (updatedEntry) => {
      try {
        const entry = await apiService.updateEntry(updatedEntry);
        // Update the entries state to reflect the update
        setEntries(entries.map(existing => existing.id === entry.id ? entry : existing));
        setEditingId(null); // Reset editingId
      } catch (error) {
        console.error('Error updating entry:', error);
      }
    };
  
    // Function to start editing an entry
    const startEditEntry = (id) => {
      setEditingId(id);
    };
  
    // Function to save the edited entry
    const saveEditEntry = (id) => {
      const entryToSave = sortedEntries.find(entry => entry.id === id) || entries.find(entry => entry.id === id);
      updateEntry(entryToSave);
      setEditingId(null); // Exit edit mode
    };

    // Handle split expense creation
    const handleSplitExpenseCreated = (newExpense) => {
      console.log('Split expense created:', newExpense);
      setRefreshTrigger(prev => prev + 1);
      // Also refresh simple entries if needed
      if (activeTab === 'simple') {
        const fetchEntries = async () => {
          try {
            const data = await apiService.getEntries(groupId);
            setEntries(data);
          } catch (error) {
            console.error('Error fetching entries:', error);
          }
        };
        fetchEntries();
      }
    };

    const handleEditSplitExpense = (entry) => {
      setEditingEntry(entry);
      setShowSplitModal(true);
    };

    // Update handleSplitExpenseCreated to handle both create and update
    const handleSplitExpenseUpdated = (updatedExpense) => {
      setRefreshTrigger(prev => prev + 1);
      setEditingEntry(null);
      // Refresh simple if needed
      if (activeTab === 'simple') {
        const fetchEntries = async () => {
          try {
            const data = await apiService.getEntries(groupId);
            setEntries(data);
          } catch (error) {
            console.error('Error fetching entries:', error);
          }
        };
        fetchEntries();
      }
    };

    useEffect(() => {
      const fetchGroupDetails = async () => {
        try {
          const data = await apiService.getGroupById(groupId);
          setGroupDetails(data);
        } catch (err) {
          console.error('Error fetching group details:', err);
        }
      };
      
      const fetchCurrentUser = async () => {
        try {
          const userBalance = await apiService.getMyBalance(groupId);
          setCurrentUser(userBalance.user);
        } catch (err) {
          console.error('Error fetching current user:', err);
        }
      };
      
      fetchGroupDetails();
      fetchCurrentUser();
    }, [groupId]);

    const handleLeaveGroup = async () => {
      if (window.confirm('Are you sure you want to leave this group?')) {
        try {
          await apiService.leaveGroup(groupId);
          // Redirect or refresh
          window.location.href = '/groups';
        } catch (err) {
          setError('Failed to leave group');
        }
      }
    };

    const handleRemoveMember = async (userId) => {
      if (window.confirm('Are you sure you want to remove this member?')) {
        try {
          await apiService.removeMember({ groupId, userId });
          setGroupDetails(prev => ({
            ...prev,
            memberIds: prev.memberIds.filter(id => id !== userId)
          }));
        } catch (err) {
          setError('Failed to remove member');
        }
      }
    };

    const handleUpdatePassword = async (e) => {
      e.preventDefault();
      try {
        await apiService.updateGroupPassword(groupId, { newPassword });
        setShowPasswordForm(false);
        setNewPassword('');
      } catch (err) {
        setError('Failed to update password');
      }
    };

    const handleDeleteGroup = async () => {
      if (window.confirm(`Are you sure you want to delete the group "${groupDetails?.name}"? This will permanently delete all expenses and cannot be undone.`)) {
        try {
          await apiService.deleteGroup(groupId);
          // Redirect to groups page after successful deletion
          window.location.href = '/groups';
        } catch (err) {
          console.error('Error deleting group:', err);
          setError('Failed to delete group. Please try again.');
        }
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-teal-400">
        <div className="container mx-auto px-2 sm:px-10 max-w-6xl py-10">
          <div className="px-2 sm:px-10 flex justify-between items-center mb-10">
            <BackButton />
            <h1 className="text-4xl font-bold text-white">Group Expenses</h1>
            <LogoutButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition ease-in duration-200" />
          </div>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('splits')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === 'splits'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                💰 Split Expenses
              </button>
              <button
                onClick={() => setActiveTab('simple')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === 'simple'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                📝 Simple Entries
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'splits' ? (
                <div>
                  {/* Split Expenses Section */}
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Split Expenses</h2>
                    <button
                      onClick={() => setShowSplitModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
                    >
                      ➕ Split New Expense
                    </button>
                  </div>
                  
                  <SplitExpensesList 
                    groupId={groupId} 
                    refreshTrigger={refreshTrigger}
                    onEdit={handleEditSplitExpense}
                  />
                </div>
              ) : (
                <div>
                  {/* Simple Entries Section */}
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Simple Entries</h2>

                    {/* Sorting Dropdown for Simple Entries */}
                    <div className="flex items-center space-x-2">
                      <label htmlFor="simple-sort-select" className="text-sm text-gray-600">Sort by:</label>
                      <select
                        id="simple-sort-select"
                        value={simpleEntrySortBy}
                        onChange={(e) => setSimpleEntrySortBy(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="date-desc">Date (Newest First)</option>
                        <option value="date-asc">Date (Oldest First)</option>
                        <option value="amount-desc">Amount (High to Low)</option>
                        <option value="amount-asc">Amount (Low to High)</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                      </select>
                    </div>
                  </div>

                  <EntryForm
                    handleSubmit={handleSubmit}
                    handleInputChange={handleInputChange}
                    form={form}
                    editingId={editingId}
                  />
                  <EntryList
                    entries={sortedEntries}
                    handleEditChange={handleEditChange}
                    saveEditEntry={saveEditEntry}
                    startEditEntry={startEditEntry}
                    deleteEntry={deleteEntry}
                    editingId={editingId}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {groupDetails && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Group Settings</h2>
            <p className="text-gray-600">Group Name: {groupDetails.name}</p>
            <p className="text-gray-600">Public: {groupDetails.isPublic ? 'Yes' : 'No'}</p>
            <h3 className="text-xl font-semibold mt-4 mb-2">Members</h3>
            <ul>
              {groupDetails.memberIds.map(userId => (
                <li key={userId} className="flex justify-between">
                  <span>{userId}</span> {/* Replace with user name if available */}
                  {currentUser && groupDetails.ownerId === currentUser.id && userId !== groupDetails.ownerId && (
                    <button onClick={() => handleRemoveMember(userId)} className="text-red-500">Remove</button>
                  )}
                </li>
              ))}
            </ul>
            <button onClick={handleLeaveGroup} className="mt-4 bg-red-500 text-white py-2 px-4 rounded">
              Leave Group
            </button>
            {currentUser && groupDetails.ownerId === currentUser.id && (
              <>
                {!groupDetails.isPublic && (
                  <>
                    <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="ml-4 bg-blue-500 text-white py-2 px-4 rounded">
                      Update Password
                    </button>
                    {showPasswordForm && (
                      <form onSubmit={handleUpdatePassword} className="mt-2">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New Password"
                          className="px-4 py-2 border rounded-md"
                        />
                        <button type="submit" className="ml-2 bg-green-500 text-white py-2 px-4 rounded">
                          Save
                        </button>
                      </form>
                    )}
                  </>
                )}
                <button onClick={handleDeleteGroup} className="ml-4 bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded transition duration-200">
                  🗑️ Delete Group
                </button>
              </>
            )}
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        )}

        {/* Split Expense Modal */}
        <SplitExpenseModal
          isOpen={showSplitModal}
          onClose={() => {
            setShowSplitModal(false);
            setEditingEntry(null);
          }}
          groupId={groupId}
          onExpenseCreated={handleSplitExpenseUpdated}
          existingEntry={editingEntry}
        />
      </div>
    );
};

export default Check;
