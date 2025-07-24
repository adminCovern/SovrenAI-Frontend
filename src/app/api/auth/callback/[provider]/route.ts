import { NextRequest, NextResponse } from 'next/server';
import { EmailProvider } from '../../../../../types';

/**
 * Handle OAuth2 callback from email providers
 * This route is called by the OAuth2 provider after user authorization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    // Get the provider from the URL params
    const provider = params.provider.toLowerCase();
    
    // Get the authorization code from the query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Handle errors from the OAuth2 provider
    if (error) {
      console.error(`OAuth error: ${error}`);
      return NextResponse.redirect(new URL(`/auth/error?error=${error}`, request.url));
    }
    
    // Validate the code
    if (!code) {
      console.error('No authorization code provided');
      return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
    }
    
    // Map the provider to our EmailProvider type
    let emailProvider: EmailProvider;
    switch (provider) {
      case 'gmail':
        emailProvider = 'Gmail';
        break;
      case 'outlook':
        emailProvider = 'Outlook';
        break;
      case 'exchange':
        emailProvider = 'Exchange';
        break;
      default:
        console.error(`Unsupported provider: ${provider}`);
        return NextResponse.redirect(new URL('/auth/error?error=unsupported_provider', request.url));
    }
    
    // Redirect to the frontend with the code and provider
    // The frontend will handle the token exchange
    return NextResponse.redirect(
      new URL(`/auth/complete?code=${code}&provider=${emailProvider}`, request.url)
    );
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.redirect(new URL('/auth/error?error=server_error', request.url));
  }
}