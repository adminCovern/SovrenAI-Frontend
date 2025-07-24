import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  startAuthFlow, 
  handleAuthCallback, 
  removeAuthentication,
  initializeAuthState
} from '../store/slices/emailAuthSlice';
import { EmailProvider } from '../types';
import { AppDispatch, RootState } from '../store';

/**
 * Hook for using email authentication
 */
export const useEmailAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { 
    authenticatedProviders, 
    isAuthenticating, 
    authError, 
    currentUserId 
  } = useSelector((state: RootState) => state.emailAuth);

  // Initialize auth state on mount
  useEffect(() => {
    dispatch(initializeAuthState());
  }, [dispatch]);

  // Handle OAuth callback if code is present in URL
  useEffect(() => {
    const code = searchParams?.get('code');
    const provider = searchParams?.get('provider');
    
    if (code && provider && window.location.pathname === '/auth/complete') {
      dispatch(handleAuthCallback(code))
        .unwrap()
        .then(() => {
          // Redirect to success page or dashboard
          router.push('/dashboard');
        })
        .catch((error) => {
          console.error('Auth error:', error);
          // Stay on the page, error will be displayed
        });
    }
  }, [searchParams, dispatch, router]);

  /**
   * Start authentication flow for a provider
   * @param provider The email provider to authenticate with
   */
  const authenticate = (provider: EmailProvider) => {
    dispatch(startAuthFlow(provider));
  };

  /**
   * Remove authentication for a provider
   * @param provider The email provider to remove authentication for
   */
  const deauthenticate = (provider: EmailProvider) => {
    dispatch(removeAuthentication(provider));
  };

  /**
   * Check if a provider is authenticated
   * @param provider The email provider to check
   * @returns True if the provider is authenticated
   */
  const isAuthenticated = (provider: EmailProvider) => {
    return authenticatedProviders[provider];
  };

  return {
    authenticatedProviders,
    isAuthenticating,
    authError,
    currentUserId,
    authenticate,
    deauthenticate,
    isAuthenticated
  };
};