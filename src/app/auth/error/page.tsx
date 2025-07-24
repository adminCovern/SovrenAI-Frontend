'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Page for displaying authentication errors
 */
export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get error from query params
  const error = searchParams?.get('error') || 'Unknown error';
  
  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'access_denied': 'You denied access to your email account.',
    'invalid_request': 'The authentication request was invalid.',
    'unauthorized_client': 'The application is not authorized to use this authentication method.',
    'unsupported_response_type': 'The authentication server does not support this type of response.',
    'invalid_scope': 'The requested scope is invalid or unknown.',
    'server_error': 'The authentication server encountered an error.',
    'temporarily_unavailable': 'The authentication server is temporarily unavailable.',
    'no_code': 'No authorization code was provided.',
    'unsupported_provider': 'The selected email provider is not supported.',
    'default': 'An unknown error occurred during authentication.'
  };
  
  const errorMessage = errorMessages[error] || errorMessages.default;

  return (
    <div className="auth-error-container">
      <div className="auth-error-card">
        <h1>Authentication Error</h1>
        
        <div className="error-details">
          <h2>Unable to Connect Email Account</h2>
          <p className="error-message">{errorMessage}</p>
          <p className="error-code">Error code: {error}</p>
        </div>
        
        <div className="actions">
          <button onClick={() => router.push('/')}>Return to Dashboard</button>
        </div>
      </div>
      
      <style jsx>{`
        .auth-error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #000;
          color: #fff;
        }
        
        .auth-error-card {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 50, 50, 0.3);
          border-radius: 8px;
          padding: 32px;
          width: 100%;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 0 20px rgba(255, 50, 50, 0.2);
        }
        
        h1 {
          color: #f33;
          margin-top: 0;
          margin-bottom: 24px;
        }
        
        h2 {
          margin-top: 0;
          color: #fff;
        }
        
        .error-details {
          margin: 24px 0;
        }
        
        .error-message {
          font-size: 16px;
          margin-bottom: 16px;
        }
        
        .error-code {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .actions {
          margin-top: 24px;
        }
        
        button {
          background: rgba(0, 170, 255, 0.2);
          border: 1px solid #0af;
          color: #0af;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        button:hover {
          background: rgba(0, 170, 255, 0.3);
        }
      `}</style>
    </div>
  );
}