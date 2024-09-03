// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from './authservice';
import { $user } from '@iot-prototype-kit/stores/user';
import { authenticateUser } from '@iot-prototype-kit/utils/user'
import { useStore } from '@iot-prototype-kit/core/store';
import type { UserConfig } from '@iot-prototype-kit/types';
import type { ComponentProps } from '@iot-prototype-kit/core/utils/element';


import './LoginPage.css';
import { $appConfig } from '@iot-prototype-kit/stores/config';

const LoginPage = () => {
  const appConfig =useStore($appConfig);
  const userConfig = appConfig.userConfigs[0]
  const user = useStore($user);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();


  const handleSignIn = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    try {
      const { AuthenticationResult, UserAttributes } = await signIn(email, password);
  
      if (AuthenticationResult && AuthenticationResult.AccessToken) {
        sessionStorage.setItem('accessToken', AuthenticationResult.AccessToken);
        
        const authenticatedUser = await authenticateUser(
          appConfig.cognito,
          password,
          {
            ...appConfig.userConfigs[0],
            firstName: UserAttributes?.["name"] || '', 
            lastName: UserAttributes?.["lastName"] || '',  // Ensure lastName is provided
            email: email,
            title: UserAttributes?.["custom:title"] || '',
          }
        );

        if (authenticatedUser) {
          $user.set(authenticatedUser);
          navigate('/home');
        } else {
          sessionStorage.removeItem('accessToken');
          console.error('Failed to retrieve AWS credentials.');
        }
      } else {
        $user.set(null);
        console.error('SignIn session or AccessToken is undefined.');
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      alert(`Sign in failed: ${error}`);
    }
  };
  
  

  const handleSignUp = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      await signUp(email, name, password);
      navigate('/confirm', { state: { email } });
    } catch (error) {
      alert(`Sign up failed: ${error}`);
    }
  };


  return (
    <div className="loginForm">
      <h1>Welcome</h1>
      <h4>{isSignUp ? 'Sign up to create an account' : 'Sign in to your account'}</h4>
      <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
        <div>
          <input
            className="inputText"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        {isSignUp && (
          <div>
            <input
              className="inputText"
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              required
            />
          </div>
        )}
        <div>
          <input
            className="inputText"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        {isSignUp && (
          <div>
            <input
              className="inputText"
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
          </div>
        )}
        <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </button>
    </div>
  );
};

export default LoginPage;