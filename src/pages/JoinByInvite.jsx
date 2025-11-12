import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService, { tokenManager } from '../config/api';

const JoinByInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('Invalid invite link - no token provided');
      setLoading(false);
      return;
    }

    // Check if user is authenticated
    const isAuthenticated = tokenManager.isAuthenticated();

    if (!isAuthenticated) {
      // Store the invite token in localStorage and redirect to login
      localStorage.setItem('pendingInviteToken', token);
      navigate('/login');
      return;
    }

    const joinGroup = async () => {
      try {
        const response = await apiService.joinByInvite(token);
        setGroupName(response.name || 'the group');
        setSuccess(true);

        // Clear any stored invite token
        localStorage.removeItem('pendingInviteToken');

        // Redirect to the group after 2 seconds
        setTimeout(() => {
          navigate(`/checks/${response.id}`);
        }, 2000);
      } catch (err) {
        console.error('Error joining group:', err);
        let errorMessage = 'Failed to join group';

        if (err.status === 404) {
          errorMessage = 'Invite link is invalid or has expired';
        } else if (err.status === 400) {
          errorMessage = 'You are already a member of this group';
        } else if (err.status === 401) {
          // Not authenticated - redirect to login
          localStorage.setItem('pendingInviteToken', token);
          navigate('/login');
          return;
        } else if (err.responseBody?.message) {
          errorMessage = err.responseBody.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    joinGroup();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Joining Group...</h2>
            <p className="text-gray-600">Please wait while we process your invite</p>
          </div>
        )}

        {!loading && success && (
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🎉 Success!</h2>
            <p className="text-gray-600 mb-4">
              You've successfully joined <strong>{groupName}</strong>
            </p>
            <p className="text-sm text-gray-500">Redirecting to group page...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">❌ Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/groups')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Go to Groups
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinByInvite;
