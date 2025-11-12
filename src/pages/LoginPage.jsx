import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import apiService from '../config/api';

const LoginPage = () => {
  const navigate = useNavigate();

  const responseGoogle = async (response) => {
    console.log("In responseGoogle.")
    console.log(response);
    console.log(response.credential);

    // Check for Google response token
    if (response.credential) {
      try {
        const authResponse = await apiService.authenticate(response.credential);

        // Store JWT token if returned
        if (authResponse && authResponse.token) {
          localStorage.setItem('jwt_token', authResponse.token);
          console.log("JWT token stored successfully");
        }

        console.log("Login successfully.");

        // Check if there's a pending invite token
        const pendingInviteToken = localStorage.getItem('pendingInviteToken');

        if (pendingInviteToken) {
          console.log("Found pending invite token, redirecting to join page...");
          // Redirect to join page with the invite token
          navigate(`/join?token=${pendingInviteToken}`);
        } else {
          // Normal flow - go to groups page
          navigate('/groups');
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.error('Received non-JSON response from the server. Raw response:', error);
        } else {
          console.error('Login error:', error);
        }
      }
    } else {
      // Handle failed Google login
      console.error('Google login was unsuccessful');
    }
  };
  const errorMessage = (error) => {
    console.log(error);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-blue-500 to-teal-400">
      <div className="bg-white p-12 rounded-lg shadow-xl transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-105">
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-800 animate-pulse">
          Login to Splitwise
        </h2>
        <div className="flex justify-center">
          <GoogleOAuthProvider clientId="1033713354586-vd63nc2lamnk1khtu5oleotpl0s81767.apps.googleusercontent.com">
            <GoogleLogin
              buttonText="Login with Google"
              onSuccess={responseGoogle}
              onFailure={errorMessage}
              isSignedIn={true}
              render={(renderProps) => (
                <button
                  onClick={renderProps.onClick}
                  disabled={renderProps.disabled}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded inline-flex items-center animate-bounce"
                >
                  <img src="google-icon.svg" className="w-6 h-6 mr-2" alt="Google Icon" />
                  <span>Login with Google</span>
                </button>
              )}
            />
          </GoogleOAuthProvider>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
