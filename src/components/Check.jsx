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
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [memberDetails, setMemberDetails] = useState({});

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
          console.log('Group details:', data);
          console.log('Group owner ID:', data.ownerId);
          setGroupDetails(data);
        } catch (err) {
          console.error('Error fetching group details:', err);
        }
      };
      
      const fetchCurrentUser = async () => {
        try {
          const userBalance = await apiService.getMyBalance(groupId);
          console.log('Full userBalance response:', userBalance);

          // Backend returns userInfo and userId
          if (userBalance.userInfo) {
            setCurrentUser(userBalance.userInfo);
          } else if (userBalance.userId) {
            // Fallback: create user object with just ID
            setCurrentUser({ id: userBalance.userId });
          }
        } catch (err) {
          console.error('Error fetching current user:', err);
        }
      };

      fetchGroupDetails();
      fetchCurrentUser();
    }, [groupId]);

    // Fetch member details when group details change
    useEffect(() => {
      const fetchMemberDetails = async () => {
        if (!groupDetails?.memberIds) return;

        const details = {};
        for (const userId of groupDetails.memberIds) {
          try {
            const user = await apiService.getUserById(userId);
            details[userId] = user;
          } catch (err) {
            console.error(`Error fetching user ${userId}:`, err);
            // Fallback to just ID if fetch fails
            details[userId] = { id: userId, name: `User ${userId.slice(0, 8)}` };
          }
        }
        setMemberDetails(details);
      };

      fetchMemberDetails();
    }, [groupDetails]);

    // Back to top button visibility
    useEffect(() => {
      const handleScroll = () => {
        setShowBackToTop(window.scrollY > 300);
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

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

    const handleShareInviteLink = async () => {
      if (!inviteLink?.fullUrl) return;

      // Check if Web Share API is supported
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Join ${inviteLink.groupName}`,
            text: `You're invited to join "${inviteLink.groupName}" on Splitwise!`,
            url: inviteLink.fullUrl
          });
        } catch (err) {
          // User cancelled or error occurred
          console.log('Share cancelled or failed:', err);
        }
      } else {
        // Fallback to copy
        handleCopyInviteLink();
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-teal-400 pb-20">
        <div className="container mx-auto px-3 sm:px-10 max-w-6xl py-4 sm:py-10">
          {/* Header - Mobile Optimized */}
          <div className="px-1 sm:px-10 mb-6 sm:mb-10">
            <div className="flex justify-between items-center gap-2 mb-4">
              <BackButton />
              <div className="flex items-center gap-2">
                {groupDetails && (
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 sm:p-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30"
                    title="Group Settings"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
                <LogoutButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:py-2 sm:px-4 rounded shadow-lg transition ease-in duration-200 text-sm sm:text-base" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white text-center">Group Expenses</h1>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6">
              {/* Split Expenses Section */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Split Expenses</h2>
                <button
                  onClick={() => setShowSplitModal(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2.5 px-4 sm:px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
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

        {/* Group Settings Modal */}
        {showSettingsModal && groupDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                      <span className="text-2xl">⚙️</span>
                      Group Settings
                    </h2>
                    <p className="text-indigo-100 text-sm">Manage your group preferences and members</p>
                  </div>
                  <div className="flex gap-2">
                    {currentUser && groupDetails.ownerId === currentUser.id && (
                      <button
                        onClick={handleDeleteGroup}
                        className="group flex items-center gap-2 bg-white/20 hover:bg-red-600 text-white backdrop-blur-sm px-3 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl border border-white/30 hover:border-red-500"
                        title="Delete Group"
                      >
                        <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="font-semibold text-sm hidden sm:inline">Delete</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowSettingsModal(false)}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-all"
                      title="Close"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
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
                  {groupDetails.memberIds.map(userId => {
                    const member = memberDetails[userId];
                    const displayName = member?.name || member?.email || `User ${userId.slice(0, 8)}`;
                    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                    return (
                      <div key={userId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                        <span className="text-gray-700 font-medium flex items-center gap-2">
                          <span className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {initials}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">{displayName}</span>
                            {member?.email && member.name !== member.email && (
                              <span className="text-xs text-gray-500">{member.email}</span>
                            )}
                          </div>
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
                    );
                  })}
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
                {(() => {
                  console.log('Ownership check:', {
                    currentUser,
                    currentUserId: currentUser?.id,
                    ownerId: groupDetails.ownerId,
                    isOwner: currentUser && groupDetails.ownerId === currentUser.id
                  });
                  return null;
                })()}
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
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={inviteLink.fullUrl}
                      readOnly
                      className="w-full px-4 py-2 border-2 border-green-300 rounded-lg bg-white text-sm focus:outline-none"
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleShareInviteLink}
                        className="flex-1 px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share Link
                      </button>
                      <button
                        onClick={handleCopyInviteLink}
                        className="flex-1 px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Link
                      </button>
                    </div>
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
          </div>
        )}

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-40 hover:scale-110 animate-bounce-slow"
            title="Back to Top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
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
