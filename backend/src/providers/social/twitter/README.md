# X (Twitter) Provider

## Overview
This provider enables OAuth 2.0 authentication with PKCE and tweet publishing to X (Twitter) using the official twitter-api-v2 Node.js SDK.

## OAuth Setup

### 1. Create Twitter Developer Account
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign up for a developer account
3. Complete the application process

### 2. Create App
1. In developer portal, click "Create Project"
2. Create a new app within the project
3. Note down your App ID

### 3. Configure OAuth 2.0
1. In app settings, go to "User authentication settings"
2. Enable OAuth 2.0
3. Set app permissions: Read and Write
4. Set Type of App: Web App
5. Add callback URLs:
   - Development: `http://localhost:3001/api/integrations/twitter/callback`
   - Production: `https://yourdomain.com/api/integrations/twitter/callback`
6. Add website URL

### 4. Get API Credentials
1. In app settings, find "Keys and tokens"
2. Copy:
   - API Key (Client ID)
   - API Key Secret (Client Secret)
   - Bearer Token (optional)

### 5. Environment Variables
```env
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
BACKEND_URL=http://localhost:3001
```

## API Documentation
- **API v2 Docs**: https://developer.twitter.com/en/docs/twitter-api
- **OAuth 2.0**: https://developer.twitter.com/en/docs/authentication/oauth-2-0
- **twitter-api-v2 SDK**: https://github.com/PLhery/node-twitter-api-v2
- **Rate Limits**: 
  - Tweet creation: 300 tweets per 3 hours
  - Media upload: 500 requests per 15 minutes
  - User timeline: 1500 requests per 15 minutes

## Features Supported
- [x] OAuth 2.0 with PKCE
- [x] Automatic token refresh
- [x] Tweet posting (max 280 characters)
- [x] Media upload (up to 4 images or 1 video/GIF)
- [x] Thread creation
- [x] Poll creation (2-4 options, 5min-7days)
- [x] Reply settings control
- [x] Quote tweets
- [x] Super Followers only tweets
- [x] Analytics (impressions, engagement)

## SDK Used
- **Package**: `twitter-api-v2` v1.15.2+
- **Installation**: `npm install twitter-api-v2`
- **Documentation**: https://github.com/PLhery/node-twitter-api-v2

## Tweet Requirements
- **Text**: 1-280 characters
- **Images**: 
  - Max 4 images per tweet
  - Max 5MB per image
  - Formats: JPG, PNG, GIF, WEBP
- **Videos**:
  - 1 video per tweet
  - Max 512MB
  - Max 2 minutes 20 seconds
  - Formats: MP4, MOV
- **GIFs**:
  - 1 GIF per tweet
  - Max 15MB

## Poll Requirements
- **Options**: 2-4 options
- **Option Length**: Max 25 characters each
- **Duration**: 5 minutes to 7 days

## Reply Settings
- `everyone` - Anyone can reply
- `mentionedUsers` - Only mentioned users can reply
- `following` - Only followers can reply

## Error Codes
| Type | Description | Handling |
|------|-------------|----------|
| `duplicate` | Duplicate content | Modify tweet text |
| `rate-limit-exceeded` | Rate limit hit | Wait 15 minutes |
| `unauthorized` | Invalid/expired token | Trigger token refresh |
| `forbidden` | Account restricted | Show error |
| `invalid-request` | Invalid parameters | Check tweet content |
| `media-error` | Media upload failed | Check file format/size |

## Testing
1. Set up environment variables
2. Start backend server
3. Navigate to integration page
4. Click "Connect X (Twitter)"
5. Complete OAuth flow with PKCE
6. Post a test tweet

## PKCE Flow
1. Generate code verifier (random string)
2. Generate code challenge (SHA-256 hash of verifier)
3. Send challenge in authorization request
4. Exchange code + verifier for tokens
5. Store access and refresh tokens

## Rate Limits
- **Tweet Creation**: 300 per 3 hours (user), 300 per 3 hours (app)
- **Media Upload**: 500 per 15 minutes
- **Timeline**: 1500 per 15 minutes
- **User Lookup**: 900 per 15 minutes
- **Rate Limit Window**: 15 minutes

## Common Issues

### "Duplicate content detected"
- Twitter prevents posting identical tweets
- Modify tweet text slightly
- Wait before reposting same content

### "Rate limit exceeded"
- Wait for rate limit window to reset (15 minutes)
- Implement exponential backoff
- Monitor rate limit headers

### "Media upload failed"
- Check file size limits
- Verify file format is supported
- Ensure stable network connection
- Try uploading smaller files

### "Token expired"
- Tokens expire after 2 hours
- Implement automatic token refresh
- Store refresh token securely
- Re-authenticate if refresh fails

### "Account restricted"
- Account may be suspended or limited
- Check Twitter account status
- Contact Twitter support if needed

## Best Practices
1. Always use OAuth 2.0 with PKCE for security
2. Implement automatic token refresh
3. Respect rate limits (300 tweets per 3 hours)
4. Handle duplicate content gracefully
5. Validate tweet length before posting
6. Optimize images before upload
7. Monitor rate limit headers
8. Implement retry logic with backoff
9. Cache analytics data
10. Test with various content types

## Thread Creation
To create a thread:
1. Post first tweet
2. Get tweet ID from response
3. Post reply with `reply` parameter set to first tweet ID
4. Continue chaining replies

## Analytics Metrics
- **Impressions**: Number of times tweet was viewed
- **Likes**: Number of likes received
- **Replies**: Number of replies
- **Retweets**: Number of retweets
- **Quotes**: Number of quote tweets
- **Engagement Rate**: (Likes + Replies + Retweets + Quotes) / Impressions * 100

## Limitations
- Maximum 280 characters per tweet
- Maximum 300 tweets per 3 hours
- Media processing may take a few seconds
- Rate limits apply per user and per app
- Some features require elevated access
- Analytics limited to own tweets

## Support
- Twitter Developer Support: https://twittercommunity.com/
- API Status: https://api.twitterstat.us/
- Documentation: https://developer.twitter.com/en/docs
- SDK Issues: https://github.com/PLhery/node-twitter-api-v2/issues
