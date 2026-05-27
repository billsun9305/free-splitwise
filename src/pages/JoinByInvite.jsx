import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService, { tokenManager } from '../config/api';

// Mobile devices may have the native Splitr app installed; we offer to open it.
const isMobile = () =>
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const JoinByInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // phase: 'choose' (mobile prompt) | 'joining' | 'success' | 'error'
  const [phase, setPhase] = useState(isMobile() ? 'choose' : 'joining');
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState('');

  const openInApp = useCallback(() => {
    if (token) {
      // Custom-scheme deep link: opens the native app if it's installed and
      // its /join handler joins the group. No-op if the app isn't installed.
      window.location.href = `splitr://join?token=${encodeURIComponent(token)}`;
    }
  }, [token]);

  const joinOnWeb = useCallback(async () => {
    if (!token) {
      setError('Invalid invite link - no token provided');
      setPhase('error');
      return;
    }

    if (!tokenManager.isAuthenticated()) {
      // Stash the token and send them through login; LoginPage resumes the join.
      localStorage.setItem('pendingInviteToken', token);
      navigate('/login');
      return;
    }

    setPhase('joining');
    try {
      const response = await apiService.joinByInvite(token);
      setGroupName(response.name || 'the group');
      setPhase('success');
      localStorage.removeItem('pendingInviteToken');
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
        localStorage.setItem('pendingInviteToken', token);
        navigate('/login');
        return;
      } else if (err.responseBody?.message) {
        errorMessage = err.responseBody.message;
      }

      setError(errorMessage);
      setPhase('error');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link - no token provided');
      setPhase('error');
      return;
    }
    // Desktop has no app to open, so join in the browser immediately.
    // Mobile shows the "Open in app / Join in browser" choice first.
    if (!isMobile()) {
      joinOnWeb();
    }
  }, [token, joinOnWeb]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        {phase === 'choose' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">You're invited to a group</h2>
            <p className="text-gray-600 mb-6">Join in the Splitr app, or continue in your browser.</p>
            <button
              onClick={openInApp}
              className="w-full px-6 py-3 mb-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              Open in the Splitr app
            </button>
            <button
              onClick={joinOnWeb}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
            >
              Join in browser
            </button>
            <p className="mt-4 text-xs text-gray-400">
              Don&apos;t have the app? &quot;Join in browser&quot; works without it.
            </p>
          </div>
        )}

        {phase === 'joining' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Joining Group...</h2>
            <p className="text-gray-600">Please wait while we process your invite</p>
          </div>
        )}

        {phase === 'success' && (
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

        {phase === 'error' && (
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
