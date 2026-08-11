const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const isConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

function getAuthUrl({ redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an OAuth authorization code for the signed-in Google account's
 * profile. Uses the userinfo endpoint (a direct authenticated call to Google)
 * rather than decoding the id_token JWT, so no JWT-verification dependency
 * is needed.
 */
async function getProfileFromCode({ code, redirectUri }) {
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Google did not return an access token.');
  }

  const profileRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const profile = await profileRes.json();
  if (!profileRes.ok || !profile.sub) {
    throw new Error('Could not retrieve your Google profile.');
  }
  if (!profile.email || profile.email_verified !== true) {
    throw new Error('Your Google account email is not verified.');
  }

  return {
    googleId: profile.sub,
    email: profile.email,
    firstName: profile.given_name || profile.name || 'SkyPadel',
    lastName: profile.family_name || 'Player'
  };
}

module.exports = { isConfigured, getAuthUrl, getProfileFromCode };
