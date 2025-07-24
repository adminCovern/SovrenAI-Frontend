'use client';

import React from 'react';
import { useEmailAuth } from '../../hooks/useEmailAuth';
import { EmailProvider } from '../../types';

/**
 * Component for email authentication controls
 */
export const EmailAuthControls: React.FC = () => {
  const { 
    authenticatedProviders, 
    isAuthenticating, 
    authError,
    authenticate, 
    deauthenticate 
  } = useEmailAuth();

  const handleAuthenticate = (provider: EmailProvider) => {
    authenticate(provider);
  };

  const handleDeauthenticate = (provider: EmailProvider) => {
    deauthenticate(provider);
  };

  return (
    <div className="email-auth-controls">
      <h3>Email Provider Authentication</h3>
      
      {authError && (
        <div className="auth-error">
          Authentication Error: {authError}
        </div>
      )}
      
      <div className="provider-list">
        {Object.entries(authenticatedProviders).map(([provider, isAuthenticated]) => (
          <div key={provider} className="provider-item">
            <span className="provider-name">{provider}</span>
            
            <div className="provider-status">
              {isAuthenticated ? (
                <>
                  <span className="status-connected">Connected</span>
                  <button
                    onClick={() => handleDeauthenticate(provider as EmailProvider)}
                    disabled={isAuthenticating}
                    className="disconnect-button"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleAuthenticate(provider as EmailProvider)}
                  disabled={isAuthenticating}
                  className="connect-button"
                >
                  {isAuthenticating ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .email-auth-controls {
          background: rgba(0, 0, 0, 0.7);
          border-radius: 8px;
          padding: 16px;
          color: #fff;
          margin-bottom: 20px;
        }
        
        h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 18px;
          color: #0af;
        }
        
        .auth-error {
          background: rgba(255, 50, 50, 0.2);
          border-left: 3px solid #f33;
          padding: 8px 12px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .provider-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .provider-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .provider-name {
          font-weight: 500;
        }
        
        .provider-status {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .status-connected {
          color: #4caf50;
          font-size: 14px;
        }
        
        button {
          background: rgba(0, 170, 255, 0.2);
          border: 1px solid #0af;
          color: #0af;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        button:hover {
          background: rgba(0, 170, 255, 0.3);
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .disconnect-button {
          background: rgba(255, 50, 50, 0.2);
          border: 1px solid #f33;
          color: #f33;
        }
        
        .disconnect-button:hover {
          background: rgba(255, 50, 50, 0.3);
        }
      `}</style>
    </div>
  );
};