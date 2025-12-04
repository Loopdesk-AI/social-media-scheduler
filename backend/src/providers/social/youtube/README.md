# YouTube Provider

## Overview
This provider enables OAuth authentication and video publishing to YouTube channels using the official Google APIs Node.js client library.

## OAuth Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - YouTube Data API v3
   - YouTube Analytics API
   - Google OAuth2 API

### 2. Create OAuth 2.0 Credentials
1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as application type
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/integrations/youtube/callback`
   - Production: `https://yourdomain.com/api/integrations/youtube/callback`
5. Note down your Client ID and Client Secret

### 3. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (or "Internal" for Google Workspace)
3. Fill in application information
4. Add the following scopes:
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Add test users if in testing mode

### 4. Environment Variables
```env
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
BACKEND_URL=http://localhost:3000
```

## API Documentation
- **Official API Docs**: https://developers.google.com/youtube/v3
- **Analytics API**: https://developers.google.com/youtube/analytics
- **Node.js Client**: https://github.com/googleapis/google-api-nodejs-client
- **Rate Limits**: 
  - Default quota: 10,000 units per day
  - Video upload: 1,600 units per upload
  - Quota resets at midnight Pacific Time

## Features Supported
- [x] OAuth 2.0 authentication with offline access
- [x] Automatic token refresh
- [x] Video upload with metadata (title, description, tags)
- [x] Custom thumbnail upload
- [x] Privacy settings (public, private, unlisted)
- [x] Scheduled publishing
- [x] Made for kids declaration
- [x] Analytics (views, watch time, subscribers, likes)
- [x] Channel information retrieval

## SDK Used
- **Package**: `googleapis` v137+
- **Installation**: `npm install googleapis`
- **Documentation**: https://github.com/googleapis/google-api-nodejs-client

## Video Requirements
- **Formats**: MP4, AVI, MOV, WMV, FLV, 3GP, WebM, MPEG
- **Max File Size**: 256 GB or 12 hours (whichever is less)
- **Recommended**: H.264 video codec, AAC audio codec
- **Title**: 1-100 characters
- **Description**: Up to 5,000 characters
- **Tags**: Maximum 500 tags, 400 characters total, 30 characters per tag

## Thumbnail Requirements
- **Format**: JPG, GIF, or PNG
- **Size**: 2MB maximum
- **Resolution**: 1280x720 (16:9 aspect ratio recommended)
- **Note**: Custom thumbnails require verified account

## Error Codes
| Code | Description | Handling |
|------|-------------|----------|
| `uploadLimitExceeded` | Daily upload quota exceeded | Show error, retry tomorrow |
| `quotaExceeded` | API quota exceeded | Show error, retry later |
| `failedPrecondition` | Thumbnail upload failed (size/format/verification) | Log warning, continue without thumbnail |
| `youtubeSignupRequired` | No YouTube channel linked to account | Show error, prompt user to create channel |
| `unauthorized` | Invalid or expired token | Trigger token refresh |
| `rateLimitExceeded` | Too many requests | Retry with exponential backoff |
| `backendError` | YouTube service error | Retry operation |

## Testing

### Local Testing
1. Set up environment variables
2. Start the backend server
3. Navigate to integration page
4. Click "Connect YouTube"
5. Complete OAuth flow
6. Upload a test video

### Test Accounts
- Use Google test accounts for development
- Ensure test accounts have YouTube channels created
- Verify accounts to test custom thumbnails

## Quota Management
- Monitor quota usage in Google Cloud Console
- Each video upload costs 1,600 units
- Default quota is 10,000 units/day
- Request quota increase if needed: https://support.google.com/youtube/contact/yt_api_form

## Common Issues

### "No YouTube channel found"
- User must create a YouTube channel before connecting
- Guide users to https://www.youtube.com/create_channel

### "Thumbnail upload failed"
- Account may not be verified
- Check image size (max 2MB)
- Verify image format (JPG, PNG, GIF)

### "Quota exceeded"
- Check quota usage in Google Cloud Console
- Wait for quota reset (midnight PT)
- Request quota increase if needed

### Token refresh failures
- Ensure refresh token is stored correctly
- Check that offline access was granted
- Re-authenticate if refresh token is invalid

## Best Practices
1. Always request offline access to get refresh tokens
2. Store refresh tokens securely (encrypted)
3. Implement automatic token refresh before expiration
4. Handle quota limits gracefully
5. Provide clear error messages to users
6. Monitor API usage and quota consumption
7. Use appropriate video categories
8. Validate video metadata before upload
9. Implement upload progress tracking for large files
10. Cache analytics data to reduce API calls

## Support
- YouTube API Support: https://support.google.com/youtube/topic/9257498
- Stack Overflow: https://stackoverflow.com/questions/tagged/youtube-api
- Issue Tracker: https://issuetracker.google.com/issues?q=componentid:187200
