import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';
import BackButton from './BackButton';
import SplitExpenseModal from './SplitExpenseModal';
import SplitExpensesList from './SplitExpensesList';
import apiService from '../config/api';

const Check = () => {
    const { groupId } = useParams();
    const [editingEntry, setEditingEntry] = useState(null);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [groupDetails, setGroupDetails] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [error, setError] = useState('');
    const [inviteLink, setInviteLink] = useState(null);
    const [showInviteSection, setShowInviteSection] = useState(false);
    const [generatingInvite, setGeneratingInvite] = useState(false);


    const listRef = React.useRef();

    const handleEditSplitExpense = (entry) => {
      setEditingEntry(entry);
      setShowSplitModal(true);
    };

    // Handle both create and update from modal
    const handleExpenseSubmitted = (expense) => {
      console.log('Expense submitted:', expense);
      console.log('Is editing?', !!editingEntry);

      if (editingEntry) {
        // UPDATE: Use optimistic update for existing entry
        setEditingEntry(null);
        if (listRef.current) {
          listRef.current.updateEntryLocally(expense);
        }
      } else {
        // CREATE: Trigger full refresh to add new entry
        console.log('Creating new expense, triggering refresh');
        setRefreshTrigger(prev => prev + 1);
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

    const handleGenerateInvite = async () => {
      setGeneratingInvite(true);
      try {
        const response = await apiService.generateInviteLink(groupId, 7);
        const inviteUrl = `${window.location.origin}/#/join?token=${response.inviteToken}`;
        setInviteLink({
          ...response,
          fullUrl: inviteUrl
        });
        setShowInviteSection(true);
      } catch (err) {
        console.error('Error generating invite link:', err);
        setError('Failed to generate invite link. Please try again.');
      } finally {
        setGeneratingInvite(false);
      }
    };

    const handleCopyInviteLink = () => {
      if (inviteLink?.fullUrl) {
        navigator.clipboard.writeText(inviteLink.fullUrl);
        alert('Invite link copied to clipboard!');
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
            <div className="p-6">
              {/* Split Expenses Section */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Split Expenses</h2>
                <button
                  onClick={() => setShowSplitModal(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  ➕ New Expense
                </button>
              </div>

              <SplitExpensesList
                ref={listRef}
                groupId={groupId}
                refreshTrigger={refreshTrigger}
                onEdit={handleEditSplitExpense}
              />
            </div>
          </div>
        </div>

        {groupDetails && (
          <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Header with Delete Button */}
            <div className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    Group Settings
                  </h2>
                  <p className="text-indigo-100 text-sm">Manage your group preferences and members</p>
                </div>
                {currentUser && groupDetails.ownerId === currentUser.id && (
                  <button
                    onClick={handleDeleteGroup}
                    className="group flex items-center gap-2 bg-white/20 hover:bg-red-600 text-white backdrop-blur-sm px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl border border-white/30 hover:border-red-500"
                    title="Delete Group"
                  >
                    <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="font-semibold text-sm hidden sm:inline">Delete Group</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Group Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Group Name</p>
                  <p className="text-lg font-bold text-gray-800">{groupDetails.name}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Visibility</p>
                  <p className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {groupDetails.isPublic ? (
                      <>
                        <span className="text-green-500">🌐</span> Public
                      </>
                    ) : (
                      <>
                        <span className="text-orange-500">🔒</span> Private
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Members Section */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-6 bg-indigo-500 rounded"></span>
                  Members
                  <span className="text-sm font-normal text-gray-500">({groupDetails.memberIds.length})</span>
                </h3>
                <div className="space-y-2">
                  {groupDetails.memberIds.map(userId => (
                    <div key={userId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {userId.toString().slice(0, 2)}
                        </span>
                        User {userId}
                        {groupDetails.ownerId === userId && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">👑 Owner</span>
                        )}
                      </span>
                      {currentUser && groupDetails.ownerId === currentUser.id && userId !== groupDetails.ownerId && (
                        <button
                          onClick={() => handleRemoveMember(userId)}
                          className="text-xs font-medium bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleLeaveGroup}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
                >
                  🚪 Leave Group
                </button>
                {currentUser && groupDetails.ownerId === currentUser.id && (
                  <>
                    <button
                      onClick={handleGenerateInvite}
                      disabled={generatingInvite}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingInvite ? '⏳ Generating...' : '🔗 Generate Invite Link'}
                    </button>
                    {!groupDetails.isPublic && (
                      <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                      >
                        🔑 Update Password
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Invite Link Section */}
              {showInviteSection && inviteLink && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border-2 border-green-300">
                  <h4 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    🎉 Invite Link Generated!
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Share this link with friends to invite them to join <strong>{inviteLink.groupName}</strong>.
                    Link expires on {new Date(inviteLink.expirationDate).toLocaleDateString()}.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={inviteLink.fullUrl}
                      readOnly
                      className="flex-1 px-4 py-2 border-2 border-green-300 rounded-lg bg-white text-sm focus:outline-none"
                    />
                    <button
                      onClick={handleCopyInviteLink}
                      className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md whitespace-nowrap"
                    >
                      📋 Copy Link
                    </button>
                  </div>
                  <button
                    onClick={() => setShowInviteSection(false)}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Password Form */}
              {showPasswordForm && (
                <form onSubmit={handleUpdatePassword} className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                    >
                      💾 Save Password
                    </button>
                  </div>
                </form>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <p className="text-red-700 font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </p>
                </div>
              )}
            </div>
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
          onExpenseCreated={handleExpenseSubmitted}
          existingEntry={editingEntry}
        />
      </div>
    );
};

export default Check;
