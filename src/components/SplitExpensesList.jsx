import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import apiService from '../config/api';

const SplitExpensesList = forwardRef(({ groupId, refreshTrigger, onEdit, onEntryUpdated }, ref) => {
  const [entries, setEntries] = useState([]);
  const [myBalance, setMyBalance] = useState(null);
  const [unpaidSplits, setUnpaidSplits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filteredAndSortedEntries, setFilteredAndSortedEntries] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [groupId, refreshTrigger]);

  // Function to update a single entry locally without full refetch
  const updateEntryLocally = async (updatedEntry) => {
    console.log('Updating entry locally:', updatedEntry);

    // Save previous state for potential rollback
    const previousEntries = entries;

    try {
      // Update the entry in local state (optimistic update)
      setEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry
        )
      );

      // Refresh balance in background
      const balanceData = await apiService.getMyBalance(groupId);
      if (balanceData) {
        setMyBalance(balanceData);
      }
    } catch (error) {
      console.error('Error refreshing balance after update:', error);

      // ROLLBACK: Revert to previous state
      setEntries(previousEntries);

      // Show error message
      setError(`Failed to update expense. ${error.responseBody?.message || error.message}`);

      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);

      // Optionally refetch everything to ensure consistency
      await fetchData();
    }
  };

  // Expose updateEntryLocally to parent via ref
  useImperativeHandle(ref, () => ({
    updateEntryLocally
  }));

  useEffect(() => {
    const sortedEntries = [...entries].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'amount-desc':
          return (b.totalAmount || b.amount || 0) - (a.totalAmount || a.amount || 0);
        case 'amount-asc':
          return (a.totalAmount || a.amount || 0) - (b.totalAmount || b.amount || 0);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'status':
          const aSettled = a.splits?.every(split => split.isPaid || split.paid) ? 1 : 0;
          const bSettled = b.splits?.every(split => split.isPaid || split.paid) ? 1 : 0;
          return aSettled - bSettled;
        default:
          return 0;
      }
    });
    setFilteredAndSortedEntries(sortedEntries);
  }, [entries, sortBy]);

  const fetchData = async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [entriesData, balanceData, unpaidData, usersData] = await Promise.all([
        apiService.getEntries(groupId),
        apiService.getMyBalance(groupId).catch(() => null),
        apiService.getUnpaidSplits(groupId, 'me').catch(() => []),
        apiService.getGroupMembers(groupId).catch(() => [])
      ]);

      setEntries(entriesData);
      setMyBalance(balanceData);
      setUnpaidSplits(unpaidData);
      setUsers(usersData);
      
      // Debug balance calculation
      console.log('=== BALANCE DEBUG ===');
      console.log('My balance data:', balanceData);
      console.log('Current user info:', balanceData?.userInfo);
      console.log('Current user ID:', balanceData?.userInfo?.id);
      console.log('All users:', usersData);
      console.log('Entries with splits:', entriesData.map(entry => ({
        title: entry.title,
        paidBy: entry.paidBy,
        totalAmount: entry.totalAmount || entry.amount || 0,
        amount: entry.amount,
        splits: entry.splits?.map(split => ({
          userId: split.userId,
          amount: split.amount,
          paid: split.paid || split.isPaid,
          userEmail: usersData.find(u => u.id === split.userId)?.email,
          userName: usersData.find(u => u.id === split.userId)?.name
        }))
      })));
      
      // Manual balance calculation for debugging
      if (balanceData?.userInfo?.id && entriesData.length > 0) {
        const currentUserId = balanceData.userInfo.id;
        let manualBalance = 0;
        
        entriesData.forEach(entry => {
          // Normalize the amount field - use totalAmount if available, otherwise amount
          const totalAmount = entry.totalAmount || entry.amount || 0;

          console.log(`\n--- Processing entry: ${entry.title} ---`);
          console.log('Entry paidBy:', entry.paidBy);
          console.log('Entry total amount:', totalAmount);
          console.log('Current user is payer:', entry.paidBy === currentUserId);

          if (entry.paidBy === currentUserId) {
            // I paid this expense, so I should be owed money
            console.log('I paid this expense, adding to balance:', totalAmount);
            manualBalance += totalAmount;

            // Subtract my own share (I don't owe myself)
            const myShare = entry.splits?.find(split => split.userId === currentUserId)?.amount || 0;
            console.log('My share of this expense:', myShare);
            manualBalance -= myShare;
            console.log('Balance after subtracting my share:', manualBalance);
          } else {
            // Someone else paid, I owe my share if not paid
            const myShare = entry.splits?.find(split => split.userId === currentUserId);
            if (myShare && !(myShare.paid || myShare.isPaid)) {
              console.log('I owe my unpaid share:', myShare.amount);
              manualBalance -= myShare.amount;
            }
          }
        });
        
        console.log('Manual calculated balance:', manualBalance);
        console.log('Backend calculated balance:', balanceData.balance);
      }
    } catch (error) {
      console.error('Error fetching split data:', error);
      setError('Failed to load split expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (entryId, userId, skipRefresh = false) => {
    // Find the entry to check if this user is the payer
    const entry = entries.find(e => e.id === entryId);

    // Skip if user is the payer (they should always be marked as paid)
    if (entry && entry.paidBy === userId) {
      console.log('Skipping mark as paid - user is the payer');
      return;
    }

    console.log('=== FRONTEND MARK AS PAID ===');
    console.log('Entry ID:', entryId);
    console.log('User ID:', userId);

    const paidDate = new Date().toISOString();
    const paymentData = { entryId, userId, paidDate };
    console.log('Payment data being sent:', paymentData);

    // Save the previous state for rollback
    const previousEntries = entries;

    try {
      // Update local state FIRST for instant UI feedback (optimistic update)
      setEntries(prevEntries =>
        prevEntries.map(entry => {
          if (entry.id === entryId) {
            return {
              ...entry,
              splits: entry.splits.map(split =>
                split.userId === userId
                  ? { ...split, isPaid: true, paid: true, stateChangeDate: paidDate }
                  : split
              )
            };
          }
          return entry;
        })
      );

      // Then make API call in background
      const result = await apiService.markSplitAsPaid(paymentData);
      console.log('Mark as paid result:', result);

      // Only refresh balance data if not part of a batch operation
      if (!skipRefresh) {
        // Refresh only balance without refetching everything
        const balanceData = await apiService.getMyBalance(groupId).catch(() => null);
        if (balanceData) {
          setMyBalance(balanceData);
        }
      }
    } catch (error) {
      console.error('Error marking split as paid:', error);
      console.error('Error details:', error.message);

      // ROLLBACK: Revert to previous state
      setEntries(previousEntries);

      // Show error message to user
      setError(`Failed to mark split as paid. ${error.responseBody?.message || error.message}`);

      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleMarkAsUnpaid = async (entryId, userId, skipRefresh = false) => {
    // Find the entry to check if this user is the payer
    const entry = entries.find(e => e.id === entryId);

    // Skip if user is the payer (they should always remain marked as paid)
    if (entry && entry.paidBy === userId) {
      console.log('Skipping mark as unpaid - user is the payer and must remain paid');
      return;
    }

    console.log('=== FRONTEND MARK AS UNPAID ===');
    console.log('Entry ID:', entryId);
    console.log('User ID:', userId);

    const unpaidDate = new Date().toISOString();
    const paymentData = { entryId, userId, unpaidDate };
    console.log('Unpaid data being sent:', paymentData);

    // Save the previous state for rollback
    const previousEntries = entries;

    try {
      // Update local state FIRST for instant UI feedback (optimistic update)
      setEntries(prevEntries =>
        prevEntries.map(entry => {
          if (entry.id === entryId) {
            return {
              ...entry,
              splits: entry.splits.map(split =>
                split.userId === userId
                  ? { ...split, isPaid: false, paid: false, stateChangeDate: unpaidDate }
                  : split
              )
            };
          }
          return entry;
        })
      );

      // Then make API call in background
      const result = await apiService.markSplitAsUnpaid(paymentData);
      console.log('Mark as unpaid result:', result);

      // Only refresh balance data if not part of a batch operation
      if (!skipRefresh) {
        // Refresh only balance without refetching everything
        const balanceData = await apiService.getMyBalance(groupId).catch(() => null);
        if (balanceData) {
          setMyBalance(balanceData);
        }
      }
    } catch (error) {
      console.error('Error marking split as unpaid:', error);
      console.error('Error details:', error.message);

      // ROLLBACK: Revert to previous state
      setEntries(previousEntries);

      // Show error message to user
      setError(`Failed to mark split as unpaid. ${error.responseBody?.message || error.message}`);

      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  const toggleExpenseSelection = (entryId) => {
    setSelectedExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const selectAllExpenses = () => {
    setSelectedExpenses(new Set(filteredAndSortedEntries.map(entry => entry.id)));
  };

  const deselectAllExpenses = () => {
    setSelectedExpenses(new Set());
  };

  const handleBatchSettleSelected = async (markAsPaid) => {
    const selectedEntries = filteredAndSortedEntries.filter(entry => selectedExpenses.has(entry.id));

    console.log('=== BATCH SETTLE SELECTED ===');
    console.log('Selected entries:', selectedEntries.length);
    console.log('Mark as paid:', markAsPaid);
    console.log('Selected entries data:', selectedEntries.map(e => ({
      id: e.id,
      title: e.title,
      paidBy: e.paidBy,
      splits: e.splits.map(s => ({
        userId: s.userId,
        isPaid: s.isPaid,
        paid: s.paid
      }))
    })));

    // Set loading state
    setBatchProcessing(true);

    // Save previous state for rollback
    const previousEntries = entries;

    try {

      // Process all splits - use Promise.allSettled to continue even if some fail
      const promises = [];
      let skippedCount = 0;
      let processedCount = 0;

      selectedEntries.forEach(entry => {
        console.log(`\n--- Processing Entry ${entry.id}: "${entry.title}" ---`);
        console.log(`Entry paidBy: ${entry.paidBy}`);
        console.log(`Entry has ${entry.splits?.length || 0} splits`);

        if (!entry.splits || entry.splits.length === 0) {
          console.warn(`⚠️ Entry ${entry.id} has no splits array!`);
          return;
        }

        entry.splits.forEach(split => {
          console.log(`\nEvaluating split: userId=${split.userId}, isPaid=${split.isPaid}, paid=${split.paid}`);

          // ALWAYS skip if user is the payer (payer must stay paid)
          if (split.userId === entry.paidBy) {
            console.log(`⏭️ Skipping payer split: Entry ${entry.id}, User ${split.userId} (payer must stay paid)`);
            skippedCount++;
            return;
          }

          // Process ALL non-payer splits to ensure consistent state
          const isCurrentlyPaid = split.isPaid || split.paid;
          console.log(`🔄 Processing split: Entry ${entry.id}, User ${split.userId}, Current: ${isCurrentlyPaid ? 'paid' : 'unpaid'}, Target: ${markAsPaid ? 'paid' : 'unpaid'}`);

          processedCount++;

          const paymentData = markAsPaid
            ? {
                entryId: entry.id,
                userId: split.userId,
                paidDate: new Date().toISOString()
              }
            : {
                entryId: entry.id,
                userId: split.userId,
                unpaidDate: new Date().toISOString()
              };

          console.log(`API call data:`, paymentData);

          const promise = markAsPaid
            ? apiService.markSplitAsPaid(paymentData)
            : apiService.markSplitAsUnpaid(paymentData);

          promises.push(
            promise
              .then(result => {
                console.log(`✅ Success: Entry ${entry.id}, User ${split.userId}`, result);
                return { success: true, entryId: entry.id, userId: split.userId, result };
              })
              .catch(error => {
                console.error(`❌ Failed: Entry ${entry.id}, User ${split.userId}`, error);
                console.error(`Error details:`, {
                  message: error.message,
                  status: error.status,
                  statusText: error.statusText,
                  responseBody: error.responseBody
                });
                return { success: false, entryId: entry.id, userId: split.userId, error };
              })
          );
        });
      });

      console.log(`\n=== SUMMARY ===`);
      console.log(`Total splits evaluated: ${processedCount + skippedCount}`);
      console.log(`Skipped (payers): ${skippedCount}`);
      console.log(`Processing: ${processedCount}`);
      console.log(`Promises created: ${promises.length}`);

      if (promises.length === 0) {
        console.warn('⚠️ No promises to process! Check if all splits are payers.');
        await fetchData();
        setBatchProcessing(false);
        return;
      }

      // Wait for all promises to complete (even if some fail)
      console.log('\n⏳ Waiting for all API calls to complete...');
      const results = await Promise.allSettled(promises);
      console.log('✅ All API calls completed');

      // Log ALL results for debugging
      console.log('\n=== DETAILED RESULTS ===');
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            console.log(`${index + 1}. ✅ SUCCESS - Entry ${result.value.entryId}, User ${result.value.userId}`);
          } else {
            console.error(`${index + 1}. ❌ FAILED - Entry ${result.value.entryId}, User ${result.value.userId}`);
            console.error(`   Error:`, result.value.error);
          }
        } else {
          console.error(`${index + 1}. ❌ REJECTED -`, result.reason);
        }
      });

      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failures = results.filter(r => r.status === 'fulfilled' && !r.value.success).map(r => r.value);
      const rejected = results.filter(r => r.status === 'rejected');
      const failureCount = failures.length + rejected.length;

      console.log(`\n=== FINAL RESULTS ===`);
      console.log(`✅ Succeeded: ${successCount}/${promises.length}`);
      console.log(`❌ Failed: ${failureCount}/${promises.length}`);
      console.log(`📊 Success Rate: ${((successCount / promises.length) * 100).toFixed(1)}%`);

      if (failureCount > 0) {
        console.error('\n❌ FAILURE DETAILS:');
        failures.forEach(f => {
          console.error(`  Entry ${f.entryId}, User ${f.userId}:`, f.error?.message || f.error);
          if (f.error?.responseBody) {
            console.error(`    Server response:`, f.error.responseBody);
          }
        });
        rejected.forEach(r => {
          console.error(`  Rejected promise:`, r.reason);
        });
      }

      // Refetch data to get accurate state from server
      await fetchData();

      // If all succeeded, clear selection and exit multi-select mode
      if (failureCount === 0) {
        setSelectedExpenses(new Set());
        setIsMultiSelectMode(false);
      } else {
        // Some failed - show detailed error
        const errorMessages = failures.map(f => {
          const userName = users.find(u => u.id === f.userId)?.name || `User ${f.userId}`;
          const entryTitle = entries.find(e => e.id === f.entryId)?.title || `Entry ${f.entryId}`;
          return `${entryTitle} - ${userName}`;
        });

        setError(`Failed to update ${failureCount} split(s):\n${errorMessages.slice(0, 3).join(', ')}${errorMessages.length > 3 ? '...' : ''}`);
        setTimeout(() => setError(''), 8000);
      }
    } catch (error) {
      console.error('Error in batch settle:', error);

      // Refetch to get accurate state
      await fetchData();

      setError('Failed to complete batch operation.');
      setTimeout(() => setError(''), 5000);
    } finally {
      // Always clear loading state
      setBatchProcessing(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await apiService.deleteEntry(entryId);
        fetchData();
      } catch (error) {
        setError('Failed to delete expense');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return timestamp;
    }
  };

  const getUserNameById = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : null;
  };

  const getUserDisplayName = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    // Use email as the unique identifier, with name as display
    return `${user.name} (${user.email})`;
  };

  const getSplitTypeLabel = (splitType) => {
    switch (splitType) {
      case 'EQUAL': return 'Equal Split';
      case 'PERCENTAGE': return 'Percentage Split';
      case 'MANUAL': return 'Manual Split';
      default: return 'Split';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Loading split expenses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      {myBalance && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Your Balance</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Current Balance:</span>
            <span className={`text-xl font-bold ${myBalance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(myBalance.balance))}
              {myBalance.balance >= 0 ? ' (you are owed)' : ' (you owe)'}
            </span>
          </div>
          {myBalance.userInfo && (
            <div className="text-sm text-gray-500 mt-1">
              {myBalance.userInfo.name} ({myBalance.userInfo.email})
            </div>
          )}
        </div>
      )}

      {/* Unpaid Splits Summary */}
      {unpaidSplits.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Outstanding Payments ({unpaidSplits.length})
          </h3>
          <div className="space-y-2">
            {unpaidSplits.slice(0, 3).map((split, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{split.entryTitle}</span>
                <span className="text-red-600 font-bold">
                  {formatCurrency(split.amount)}
                </span>
              </div>
            ))}
            {unpaidSplits.length > 3 && (
              <div className="text-xs text-gray-500">
                ...and {unpaidSplits.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Split Expenses List */}
      <div>
        <div className="flex justify-between items-center mb-6 gap-3">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-7 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
            Split Expenses
          </h3>

          <div className="flex items-center gap-2">
            {/* Multi-Select Toggle */}
            <button
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedExpenses(new Set());
              }}
              className={`relative p-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg ${
                isMultiSelectMode
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                  : 'bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
              title={isMultiSelectMode ? 'Multi-Select Mode Active' : 'Enable Multi-Select Mode'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMultiSelectMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                )}
              </svg>
              {isMultiSelectMode && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            {/* Sort Dropdown Menu */}
            <div className="relative group">
              <button className="p-2.5 bg-white border-2 border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-md hover:shadow-lg" title="Sort Options">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2">Sort By</div>
                  {[
                    { value: 'date-desc', label: '📅 Date (Newest First)', icon: '↓' },
                    { value: 'date-asc', label: '📅 Date (Oldest First)', icon: '↑' },
                    { value: 'amount-desc', label: '💰 Amount (High to Low)', icon: '↓' },
                    { value: 'amount-asc', label: '💰 Amount (Low to High)', icon: '↑' },
                    { value: 'title-asc', label: '🔤 Title (A-Z)', icon: '↓' },
                    { value: 'title-desc', label: '🔤 Title (Z-A)', icon: '↑' },
                    { value: 'status', label: '✓ Settlement Status', icon: '' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                        sortBy === option.value
                          ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Select Controls */}
        {isMultiSelectMode && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={selectAllExpenses}
                  disabled={batchProcessing}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✓ Select All
                </button>
                <button
                  onClick={deselectAllExpenses}
                  disabled={batchProcessing}
                  className="text-sm bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✕ Clear
                </button>
                <span className="text-sm font-semibold text-blue-700 bg-white px-3 py-2 rounded-lg shadow-sm">
                  {selectedExpenses.size} selected
                </span>
              </div>
              {selectedExpenses.size > 0 && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleBatchSettleSelected(true)}
                    disabled={batchProcessing}
                    className="flex-1 sm:flex-none text-sm bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {batchProcessing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      '✓ Settle Selected'
                    )}
                  </button>
                  <button
                    onClick={() => handleBatchSettleSelected(false)}
                    disabled={batchProcessing}
                    className="flex-1 sm:flex-none text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {batchProcessing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      '✕ Unsettle Selected'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No split expenses found. Create your first split expense!
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedEntries.map((entry) => (
              <div key={entry.id} className={`bg-white border rounded-xl p-5 transition-all ${
                selectedExpenses.has(entry.id)
                  ? 'border-blue-500 border-2 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-[1.02]'
                  : 'border-gray-200 hover:shadow-lg hover:border-gray-300'
              }`}>
                {/* Entry Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    {/* Checkbox for multi-select */}
                    {isMultiSelectMode && (
                      <input
                        type="checkbox"
                        checked={selectedExpenses.has(entry.id)}
                        onChange={() => toggleExpenseSelection(entry.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{entry.title}</h4>
                      <div className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString()} • {getSplitTypeLabel(entry.splitType)}
                      </div>
                      {entry.paidBy && (
                        <div className="text-xs text-blue-600 mt-1">
                          Paid by: {getUserDisplayName(entry.paidBy) || 'Unknown User'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {formatCurrency(entry.totalAmount || entry.amount || 0)}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        Total Amount
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(entry)}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm"
                      >
                        ✕ Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Split Details */}
                {entry.splits && entry.splits.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h5 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-500 rounded"></span>
                      Split Details
                    </h5>
                    <div className="grid grid-cols-1 gap-3">
                      {entry.splits.map((split, index) => (
                        <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                          <div className="flex flex-col gap-1 flex-grow">
                            <span className="text-sm font-semibold text-gray-800">
                              {getUserDisplayName(split.userId) || split.userName || split.user?.name || `User ${index + 1}`}
                            </span>
                            {(split.stateChangeDate || split.paidDate) && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${(split.isPaid || split.paid) ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                {(split.isPaid || split.paid) ? 'Settled' : 'Pending'} on {formatTimestamp(split.stateChangeDate || split.paidDate)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm font-semibold">
                              {formatCurrency(split.amount)}
                            </span>
                            {entry.paidBy === split.userId ? (
                              // Payer's split is always marked as paid and cannot be changed
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs font-semibold bg-green-100 text-green-800 px-3 py-1.5 rounded-lg border border-green-300">
                                  ✓ Settled (Payer)
                                </span>
                              </div>
                            ) : (split.isPaid || split.paid) ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs font-semibold bg-green-100 text-green-800 px-3 py-1.5 rounded-lg border border-green-300">
                                    ✓ Settled
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleMarkAsUnpaid(entry.id, split.userId)}
                                  className="text-xs font-medium bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-all shadow-sm"
                                  title="Mark as unpaid"
                                >
                                  ✕ Unsettle
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <button
                                  onClick={() => handleMarkAsPaid(entry.id, split.userId)}
                                  className="text-xs font-medium bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-all shadow-sm"
                                >
                                  ⚠ Mark Settled
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settlement Status */}
                {entry.splits && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <span className="w-1 h-4 bg-purple-500 rounded"></span>
                        Settlement Status
                      </span>
                      <div className="flex flex-col items-start sm:items-end gap-1">
                        <span className={`text-sm font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 ${
                          entry.splits.every(split => split.isPaid || split.paid)
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                        }`}>
                          {entry.splits.every(split => split.isPaid || split.paid) ? (
                            <>
                              <span className="w-2 h-2 bg-white rounded-full"></span>
                              ✓ Fully Settled
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              ⚠ Pending Settlement
                            </>
                          )}
                        </span>
                        <div className="text-xs text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
                          {entry.splits.filter(split => split.isPaid || split.paid).length} / {entry.splits.length} settled
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default SplitExpensesList; 