import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle OAuth2 callback from CalDAV
 * This route is called by the CalDAV provider after user authorization
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Handle errors from CalDAV OAuth2
    if (error) {
      console.error(`CalDAV OAuth error: ${error}`);
      return NextResponse.redirect(new URL(`/auth/error?error=${error}`, request.url));
    }
    
    // Validate the code
    if (!code) {
      console.error('No authorization code provided for CalDAV');
      return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
    }
    
    // Redirect to the frontend with the code and provider
    // The frontend will handle the token exchange
    return NextResponse.redirect(
      new URL(`/auth/complete?code=${code}&provider=CalDAV&type=calendar`, request.url)
    );
  } catch (error) {
    console.error('Error handling CalDAV OAuth callback:', error);
    return NextResponse.redirect(new URL('/auth/error?error=server_error', request.url));
  }
} 