import React, { useState, useEffect } from 'react';
import apiService from '../config/api';

const SplitExpenseModal = ({ isOpen, onClose, groupId, onExpenseCreated, existingEntry = null }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [expenseData, setExpenseData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    totalAmount: '',
    description: ''
  });
  const [splitType, setSplitType] = useState('EQUAL');
  const [percentages, setPercentages] = useState({});
  const [manualAmounts, setManualAmounts] = useState({});
  const [paidBy, setPaidBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (existingEntry) {
        setExpenseData({
          title: existingEntry.title,
          date: new Date(existingEntry.date).toISOString().split('T')[0],
          totalAmount: existingEntry.totalAmount || existingEntry.amount,
          description: existingEntry.description || ''
        });
        setSplitType(existingEntry.splitType);
        setPaidBy(existingEntry.paidBy || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, existingEntry]);



  // Handle existing entry data when users are loaded
  useEffect(() => {
    if (existingEntry && users.length > 0 && existingEntry.splits) {
      const selected = users.filter(u => existingEntry.splits.some(s => s.userId === u.id));
      setSelectedUsers(selected);
      const newPercentages = {};
      const newManualAmounts = {};
      const totalAmount = existingEntry.totalAmount || existingEntry.amount;

      existingEntry.splits.forEach(s => {
        if (existingEntry.splitType === 'PERCENTAGE') {
          newPercentages[s.userId] = (s.amount / totalAmount * 100).toFixed(2);
        } else if (existingEntry.splitType === 'MANUAL') {
          newManualAmounts[s.userId] = s.amount;
        } else if (existingEntry.splitType === 'EQUAL') {
          // For equal splits, just set the amounts
          newManualAmounts[s.userId] = s.amount;
        }
      });
      setPercentages(newPercentages);
      setManualAmounts(newManualAmounts);
    }
  }, [users, existingEntry]);

  const fetchUsers = async () => {
    try {
      const [groupMembers, balanceData] = await Promise.all([
        apiService.getGroupMembers(groupId),
        apiService.getMyBalance(groupId).catch(() => null)
      ]);
      
      setUsers(groupMembers);
      
      // Set current user from balance data
      if (balanceData?.userInfo) {
        setCurrentUser(balanceData.userInfo);
        // Auto-set current user as payer for new expenses
        if (!existingEntry && !paidBy) {
          setPaidBy(balanceData.userInfo.id);
        }
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      setError('Failed to load group members');
    }
  };

  const resetForm = () => {
    setSelectedUsers([]);
    setExpenseData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      totalAmount: '',
      description: ''
    });
    setSplitType('EQUAL');
    setPercentages({});
    setManualAmounts({});
    setPaidBy(currentUser?.id || ''); // Set to current user if available
    setError('');
  };

  const handleUserToggle = (user) => {
    const isSelected = selectedUsers.find(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      // Remove from percentages and manual amounts
      const newPercentages = { ...percentages };
      const newManualAmounts = { ...manualAmounts };
      delete newPercentages[user.id];
      delete newManualAmounts[user.id];
      setPercentages(newPercentages);
      setManualAmounts(newManualAmounts);
    } else {
      setSelectedUsers([...selectedUsers, user]);
      // Initialize percentage and manual amount
      if (splitType === 'PERCENTAGE') {
        setPercentages({
          ...percentages,
          [user.id]: selectedUsers.length === 0 ? 100 : 0
        });
      } else if (splitType === 'MANUAL') {
        setManualAmounts({
          ...manualAmounts,
          [user.id]: 0
        });
      }
    }
  };

  const handlePercentageChange = (userId, percentage) => {
    setPercentages({
      ...percentages,
      [userId]: parseFloat(percentage) || 0
    });
  };

  const handleManualAmountChange = (userId, amount) => {
    setManualAmounts({
      ...manualAmounts,
      [userId]: parseFloat(amount) || 0
    });
  };

  const calculateEqualAmount = () => {
    if (selectedUsers.length === 0 || !expenseData.totalAmount) return 0;
    return (parseFloat(expenseData.totalAmount) / selectedUsers.length).toFixed(2);
  };

  const getTotalPercentage = () => {
    return Object.values(percentages).reduce((sum, p) => sum + p, 0);
  };

  const getTotalManualAmount = () => {
    return Object.values(manualAmounts).reduce((sum, a) => sum + a, 0);
  };

  const validateSplit = () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to split with');
      return false;
    }
    
    if (!expenseData.title.trim()) {
      setError('Please enter an expense title');
      return false;
    }
    
    if (!expenseData.totalAmount || parseFloat(expenseData.totalAmount) <= 0) {
      setError('Please enter a valid total amount');
      return false;
    }

    if (!paidBy) {
      setError('Please select who paid this expense');
      return false;
    }

    if (splitType === 'PERCENTAGE') {
      const total = getTotalPercentage();
      if (Math.abs(total - 100) > 0.01) {
        setError(`Percentages must add up to 100%. Current total: ${total.toFixed(1)}%`);
        return false;
      }
    }

    if (splitType === 'MANUAL') {
      const total = getTotalManualAmount();
      const expectedTotal = parseFloat(expenseData.totalAmount);
      if (Math.abs(total - expectedTotal) > 0.01) {
        setError(`Manual amounts must add up to ${expectedTotal}. Current total: ${total.toFixed(2)}`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateSplit()) return;

    setLoading(true);
    try {
      const userIds = selectedUsers.map(user => user.id);
      const totalAmount = parseFloat(expenseData.totalAmount);

      let result;

      if (existingEntry) {
        // UPDATE: Send complete Entry object with splits array
        const splits = [];

        userIds.forEach(userId => {
          let splitAmount = 0;

          // Calculate split amount based on type
          if (splitType === 'EQUAL') {
            splitAmount = totalAmount / userIds.length;
          } else if (splitType === 'PERCENTAGE') {
            splitAmount = (percentages[userId] * totalAmount) / 100;
          } else if (splitType === 'MANUAL') {
            splitAmount = manualAmounts[userId];
          }

          // Check if this user is the payer (should be marked as paid)
          const isPayer = userId === paidBy;

          // Find existing split to preserve its state if not the payer
          const existingSplit = existingEntry.splits?.find(s => s.userId === userId);

          splits.push({
            userId: userId,
            amount: parseFloat(splitAmount.toFixed(2)),
            isPaid: isPayer ? true : (existingSplit?.isPaid || existingSplit?.paid || false),
            paid: isPayer ? true : (existingSplit?.isPaid || existingSplit?.paid || false),
            ...(existingSplit?.paidDate && !isPayer && { paidDate: existingSplit.paidDate }),
            ...(existingSplit?.stateChangeDate && !isPayer && { stateChangeDate: existingSplit.stateChangeDate })
          });
        });

        // Check if all splits are settled
        const isSettled = splits.every(s => s.isPaid || s.paid);

        const updateData = {
          id: existingEntry.id,
          title: expenseData.title,
          date: expenseData.date,
          groupId: groupId,
          amount: totalAmount,  // Backend expects 'amount', not 'totalAmount'
          splitType: splitType,
          paidBy: paidBy,
          userIdCreateEntry: existingEntry.userIdCreateEntry || currentUser?.id,
          splits: splits,
          isSettled: isSettled
        };

        console.log('Updating entry with data:', updateData);
        result = await apiService.updateEntry(updateData);
      } else {
        // CREATE: Use the with-splits endpoint
        const entryData = {
          title: expenseData.title,
          date: expenseData.date,
          groupId: groupId,
          totalAmount: totalAmount,
          splitType: splitType,
          userIds: userIds,
          paidBy: paidBy,
          autoMarkPayerAsPaid: true
        };

        // Add split-specific data
        if (splitType === 'PERCENTAGE') {
          entryData.percentages = userIds.map(userId => percentages[userId]);
        } else if (splitType === 'MANUAL') {
          entryData.amounts = userIds.map(userId => manualAmounts[userId]);
        }

        console.log('Creating entry with data:', entryData);
        result = await apiService.createEntryWithSplits(entryData);
      }

      onExpenseCreated(result);
      onClose();
    } catch (error) {
      console.error('=== ERROR DETAILS ===');
      console.error('Error creating/updating split expense:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error object:', JSON.stringify(error, null, 2));

      // Try to get more detailed response from fetch error
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        try {
          const errorText = await error.response.text();
          console.error('Response body (text):', errorText);
          try {
            const errorJson = JSON.parse(errorText);
            console.error('Response body (json):', errorJson);
          } catch (parseError) {
            console.error('Could not parse error response as JSON');
          }
        } catch (textError) {
          console.error('Could not read response text:', textError);
        }
      }

      // Provide more specific error messages
      if (error.message.includes('403')) {
        setError('Access denied. Please make sure you are logged in.');
      } else if (error.message.includes('400')) {
        setError('Invalid data. Please check all fields are filled correctly.');
      } else if (error.message.includes('404')) {
        setError('API endpoint not found. Please check your backend is running.');
      } else if (error.message.includes('500')) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to ${existingEntry ? 'update' : 'create'} expense: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{existingEntry ? 'Edit Split Expense' : 'Split Expense'}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Expense Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Expense Title *
              </label>
              <input
                type="text"
                value={expenseData.title}
                onChange={(e) => setExpenseData({...expenseData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                placeholder="e.g., Dinner at restaurant"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={expenseData.date}
                onChange={(e) => setExpenseData({...expenseData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Total Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              value={expenseData.totalAmount}
              onChange={(e) => setExpenseData({...expenseData, totalAmount: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              placeholder="0.00"
              required
            />
          </div>

          {/* Who Paid Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Who Paid This Expense? *
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select who paid...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) {currentUser?.id === user.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Split Type Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Split Type
            </label>
            <div className="flex space-x-4">
              {['EQUAL', 'PERCENTAGE', 'MANUAL'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    value={type}
                    checked={splitType === type}
                    onChange={(e) => setSplitType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    {type === 'EQUAL' && 'Split Equally'}
                    {type === 'PERCENTAGE' && 'By Percentage'}
                    {type === 'MANUAL' && 'Manual Amounts'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Select Users to Split With *
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
              {users.map((user) => {
                const isSelected = selectedUsers.find(u => u.id === user.id);
                return (
                  <div key={user.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => handleUserToggle(user)}
                      className="mr-3"
                    />
                    <span className="flex-1">
                      {user.name} ({user.email})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Split Details */}
          {selectedUsers.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-gray-700 mb-3">Split Details</h4>
              <div className="space-y-3">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">{user.name}</span>
                    <div className="flex items-center space-x-2">
                      {splitType === 'EQUAL' && (
                        <span className="text-green-600 font-bold">
                          ${calculateEqualAmount()}
                        </span>
                      )}
                      {splitType === 'PERCENTAGE' && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.1"
                            value={percentages[user.id] || 0}
                            onChange={(e) => handlePercentageChange(user.id, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            placeholder="0"
                          />
                          <span>%</span>
                          <span className="text-green-600 font-bold">
                            ${((percentages[user.id] || 0) * parseFloat(expenseData.totalAmount || 0) / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {splitType === 'MANUAL' && (
                        <div className="flex items-center space-x-2">
                          <span>$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={manualAmounts[user.id] || 0}
                            onChange={(e) => handleManualAmountChange(user.id, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="text-sm text-gray-600">
                  {splitType === 'EQUAL' && (
                    <div>
                      <strong>Equal Split:</strong> ${calculateEqualAmount()} per person
                    </div>
                  )}
                  {splitType === 'PERCENTAGE' && (
                    <div>
                      <strong>Total Percentage:</strong> {getTotalPercentage().toFixed(1)}% 
                      {getTotalPercentage() !== 100 && (
                        <span className="text-red-600 ml-2">
                          (Must equal 100%)
                        </span>
                      )}
                    </div>
                  )}
                  {splitType === 'MANUAL' && (
                    <div>
                      <strong>Total Amount:</strong> ${getTotalManualAmount().toFixed(2)} / ${expenseData.totalAmount}
                      {Math.abs(getTotalManualAmount() - parseFloat(expenseData.totalAmount || 0)) > 0.01 && (
                        <span className="text-red-600 ml-2">
                          (Must equal total amount)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedUsers.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
            >
              {loading ? (existingEntry ? 'Updating...' : 'Creating...') : (existingEntry ? 'Update Expense' : 'Create Split Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SplitExpenseModal; 