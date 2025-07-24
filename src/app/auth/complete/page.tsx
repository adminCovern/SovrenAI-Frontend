'use client';

import React, { useEffect } from 'react';
import { useEmailAuth } from '../../../hooks/useEmailAuth';
import { useRouter } from 'next/navigation';

/**
 * Page for handling authentication completion
 */
export default function AuthCompletePage() {
  const { isAuthenticating, authError } = useEmailAuth();
  const router = useRouter();

  // Redirect to dashboard after successful authentication
  useEffect(() => {
    if (!isAuthenticating && !authError) {
      // Short delay to allow state to update
      const timer = setTimeout(() => {
        router.push('/');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticating, authError, router]);

  return (
    <div className="auth-complete-container">
      <div className="auth-complete-card">
        <h1>Email Authentication</h1>
        
        {isAuthenticating ? (
          <div className="auth-status">
            <div className="loading-spinner"></div>
            <p>Completing authentication...</p>
          </div>
        ) : authError ? (
          <div className="auth-error">
            <h2>Authentication Failed</h2>
            <p>{authError}</p>
            <button onClick={() => router.push('/')}>Return to Dashboard</button>
          </div>
        ) : (
          <div className="auth-success">
            <h2>Authentication Successful</h2>
            <p>You have successfully connected your email account.</p>
            <p>Redirecting to dashboard...</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .auth-complete-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #000;
          color: #fff;
        }
        
        .auth-complete-card {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(0, 170, 255, 0.3);
          border-radius: 8px;
          padding: 32px;
          width: 100%;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 0 20px rgba(0, 170, 255, 0.2);
        }
        
        h1 {
          color: #0af;
          margin-top: 0;
          margin-bottom: 24px;
        }
        
        h2 {
          margin-top: 0;
        }
        
        .auth-status, .auth-success, .auth-error {
          margin-top: 24px;
        }
        
        .auth-success h2 {
          color: #4caf50;
        }
        
        .auth-error h2 {
          color: #f33;
        }
        
        .loading-spinner {
          border: 4px solid rgba(0, 170, 255, 0.1);
          border-left: 4px solid #0af;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button {
          background: rgba(0, 170, 255, 0.2);
          border: 1px solid #0af;
          color: #0af;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 16px;
          transition: all 0.2s;
        }
        
        button:hover {
          background: rgba(0, 170, 255, 0.3);
        }
      `}</style>
    </div>
  );
}