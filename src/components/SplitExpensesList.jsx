import React, { useState, useEffect } from 'react';
import apiService from '../config/api';

const SplitExpensesList = ({ groupId, refreshTrigger, onEdit }) => {
  const [entries, setEntries] = useState([]);
  const [myBalance, setMyBalance] = useState(null);
  const [unpaidSplits, setUnpaidSplits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filteredAndSortedEntries, setFilteredAndSortedEntries] = useState([]);

  useEffect(() => {
    fetchData();
  }, [groupId, refreshTrigger]);

  useEffect(() => {
    const sortedEntries = [...entries].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'amount-desc':
          return (b.amount || b.totalAmount) - (a.amount || a.totalAmount);
        case 'amount-asc':
          return (a.amount || a.totalAmount) - (b.amount || b.totalAmount);
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
        totalAmount: entry.amount || entry.totalAmount,
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
          console.log(`\n--- Processing entry: ${entry.title} ---`);
          console.log('Entry paidBy:', entry.paidBy);
          console.log('Entry total amount:', entry.amount || entry.totalAmount);
          console.log('Current user is payer:', entry.paidBy === currentUserId);
          
          if (entry.paidBy === currentUserId) {
            // I paid this expense, so I should be owed money
            const totalAmount = entry.amount || entry.totalAmount;
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

  const handleMarkAsPaid = async (entryId, userId) => {
    try {
      console.log('=== FRONTEND MARK AS PAID ===');
      console.log('Entry ID:', entryId);
      console.log('User ID:', userId);
      
      const paidDate = new Date().toISOString();
      const paymentData = { entryId, userId, paidDate };
      console.log('Payment data being sent:', paymentData);
      
      const result = await apiService.markSplitAsPaid(paymentData);
      console.log('Mark as paid result:', result);
      
      // Refresh data after marking as paid
      fetchData();
    } catch (error) {
      console.error('Error marking split as paid:', error);
      console.error('Error details:', error.message);
      setError('Failed to mark split as paid: ' + error.message);
    }
  };

  const handleMarkAsUnpaid = async (entryId, userId) => {
    try {
      console.log('=== FRONTEND MARK AS UNPAID ===');
      console.log('Entry ID:', entryId);
      console.log('User ID:', userId);
      
      const unpaidDate = new Date().toISOString();
      const paymentData = { entryId, userId, unpaidDate };
      console.log('Unpaid data being sent:', paymentData);
      
      const result = await apiService.markSplitAsUnpaid(paymentData);
      console.log('Mark as unpaid result:', result);
      
      // Refresh data after marking as unpaid
      fetchData();
    } catch (error) {
      console.error('Error marking split as unpaid:', error);
      console.error('Error details:', error.message);
      setError('Failed to mark split as unpaid: ' + error.message);
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Split Expenses</h3>

          {/* Sorting Dropdown */}
          <div className="flex items-center space-x-2">
            <label htmlFor="sort-select" className="text-sm text-gray-600">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="status">Settlement Status</option>
            </select>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No split expenses found. Create your first split expense!
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedEntries.map((entry) => (
              <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Entry Header */}
                <div className="flex justify-between items-start mb-3">
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
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-800">
                      {formatCurrency(entry.amount || entry.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Amount
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => onEdit(entry)} className="text-blue-500 hover:text-blue-700">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Split Details */}
                {entry.splits && entry.splits.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2">Split Details:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {entry.splits.map((split, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {getUserDisplayName(split.userId) || split.userName || split.user?.name || `User ${index + 1}`}
                            </span>
                            {(split.stateChangeDate || split.paidDate) && (
                              <span className="text-xs text-gray-500">
                                {(split.isPaid || split.paid) ? 'Paid' : 'Unpaid'} on {formatTimestamp(split.stateChangeDate || split.paidDate)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold">
                              {formatCurrency(split.amount)}
                            </span>
                            {(split.isPaid || split.paid) ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Paid
                                </span>
                                <button
                                  onClick={() => handleMarkAsUnpaid(entry.id, split.userId)}
                                  className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                                  title="Mark as unpaid"
                                >
                                  Unpay
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleMarkAsPaid(entry.id, split.userId)}
                                className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settlement Status */}
                {entry.splits && (
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Settlement Status:</span>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${
                        entry.splits.every(split => split.isPaid || split.paid)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.splits.every(split => split.isPaid || split.paid) ? 'Fully Settled' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {entry.splits.filter(split => split.isPaid || split.paid).length} of {entry.splits.length} splits paid
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
};

export default SplitExpensesList; 