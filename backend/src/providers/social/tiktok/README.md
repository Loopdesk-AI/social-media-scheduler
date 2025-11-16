# TikTok Provider

## Overview
This provider enables OAuth authentication and video publishing to TikTok using the official TikTok for Developers API v2.

## OAuth Setup

### 1. Create TikTok Developer Account
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign up or log in with your TikTok account
3. Complete the developer registration process

### 2. Create App
1. Navigate to "My Apps" in the developer portal
2. Click "Create App"
3. Fill in application details:
   - App name
   - App description
   - Category
   - Platform (Web)
4. Submit for review (required for production use)

### 3. Configure OAuth Settings
1. In your app settings, go to "Login Kit"
2. Add redirect URIs:
   - Development: `http://localhost:3001/api/integrations/tiktok/callback`
   - Production: `https://yourdomain.com/api/integrations/tiktok/callback`
3. Select required scopes:
   - `user.info.basic` - Basic user information
   - `video.list` - List user's videos
   - `video.upload` - Upload videos
   - `video.publish` - Publish videos
4. Save settings

### 4. Get API Credentials
1. In app settings, find "Client Key" and "Client Secret"
2. Copy these credentials

### 5. Environment Variables
```env
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
BACKEND_URL=http://localhost:3001
```

## API Documentation
- **Official API Docs**: https://developers.tiktok.com/doc/content-posting-api-get-started
- **OAuth Documentation**: https://developers.tiktok.com/doc/login-kit-web
- **Research API**: https://developers.tiktok.com/doc/research-api-specs-query-videos
- **Rate Limits**: 
  - OAuth: 100 requests per minute
  - Content Posting: 10 videos per day per user
  - Research API: 1000 requests per day

## Features Supported
- [x] OAuth 2.0 authentication
- [x] Automatic token refresh (24-hour expiration)
- [x] Video upload with chunked upload support
- [x] Privacy settings (public, friends, private)
- [x] Disable comments, duet, and stitch
- [x] Custom video cover timestamp
- [x] Analytics (views, likes, comments, shares, engagement rate)
- [x] Video duration validation (3s - 10min)
- [x] File size validation (max 4GB)

## SDK Used
- **Package**: `axios` for HTTP requests
- **Installation**: `npm install axios`
- **Note**: TikTok doesn't have an official Node.js SDK, so we use direct API calls

## Video Requirements
- **Formats**: MP4, MOV, MPEG, AVI, FLV, WebM
- **Max File Size**: 4GB
- **Duration**: 3 seconds to 10 minutes
- **Resolution**: Minimum 360p, recommended 1080p
- **Aspect Ratio**: 9:16 (vertical) recommended, 16:9 (horizontal) supported
- **Frame Rate**: 23-60 FPS
- **Bitrate**: Recommended 16 Mbps for 1080p

## Privacy Levels
- `PUBLIC_TO_EVERYONE` - Visible to all TikTok users
- `MUTUAL_FOLLOW_FRIENDS` - Visible only to mutual followers
- `SELF_ONLY` - Private, visible only to creator
- `FOLLOWER_OF_CREATOR` - Visible to all followers

## Error Codes
| Code | Description | Handling |
|------|-------------|----------|
| `rate_limit_exceeded` | Too many requests | Retry with exponential backoff |
| `access_token_expired` | Token expired (24h) | Trigger token refresh |
| `spam_risk_too_many_posts` | Too many posts detected | Show error, wait before retry |
| `spam_risk_user_banned_from_posting` | Account restricted | Show error, contact TikTok support |
| `video_duration_too_short` | Video < 3 seconds | Validate before upload |
| `video_duration_too_long` | Video > 10 minutes | Validate before upload |
| `video_size_too_large` | File > 4GB | Validate before upload |
| `video_format_invalid` | Unsupported format | Validate format |
| `upload_failed` | Upload error | Retry operation |
| `processing_failed` | Video processing error | Check video and retry |
| `unaudited_client_in_live_env` | App not approved | Complete app review |

## Testing

### Development Mode
1. Set up environment variables
2. Start backend server
3. Navigate to integration page
4. Click "Connect TikTok"
5. Complete OAuth flow
6. Upload a test video

### Test Accounts
- Use TikTok test accounts for development
- Test accounts have same limitations as regular accounts
- Videos posted in development mode are real posts

### App Review
- TikTok requires app review for production use
- Submit app for review in developer portal
- Provide detailed use case and demo video
- Review typically takes 1-2 weeks

## Chunked Upload Process
1. Initialize upload with video metadata
2. Receive upload URL and publish ID
3. Split video into chunks (5-10MB each)
4. Upload chunks sequentially with Content-Range headers
5. Poll publish status until complete
6. Receive video ID and share URL

## Rate Limits
- **OAuth**: 100 requests per minute
- **Content Posting**: 10 videos per day per user
- **Video Upload**: 1 concurrent upload per user
- **Research API**: 1000 requests per day
- **User Info**: 100 requests per minute

## Common Issues

### "App not approved for production"
- Complete TikTok app review process
- Provide detailed use case documentation
- Submit demo video showing app functionality
- Wait for approval (1-2 weeks)

### "Video upload failed"
- Check video format and size
- Ensure video duration is 3s-10min
- Verify video codec compatibility
- Check network connection

### "Token expired"
- TikTok tokens expire after 24 hours
- Implement automatic token refresh
- Store refresh token securely
- Re-authenticate if refresh fails

### "Spam detected"
- Respect posting limits (10 videos/day)
- Avoid posting duplicate content
- Space out posts over time
- Contact TikTok if account is restricted

### "Chunked upload timeout"
- Increase timeout for large files
- Check network stability
- Retry failed chunks
- Consider smaller chunk sizes

## Best Practices
1. Always validate video before upload (format, size, duration)
2. Implement chunked upload for files > 100MB
3. Poll publish status with reasonable intervals (5s)
4. Handle token refresh proactively (before 24h expiration)
5. Respect rate limits and posting quotas
6. Provide clear error messages to users
7. Cache analytics data to reduce API calls
8. Monitor upload progress for user feedback
9. Test with various video formats and sizes
10. Complete app review before production launch

## Analytics Metrics
- **Views**: Total video views
- **Likes**: Total likes received
- **Comments**: Total comments
- **Shares**: Total shares
- **Engagement Rate**: (Likes + Comments + Shares) / Views * 100
- **Watch Time**: Total time watched (if available)
- **Average Watch Time**: Average viewing duration

## Limitations
- Maximum 10 videos per day per user
- Token expires after 24 hours
- No support for live streaming
- No support for TikTok Stories
- Analytics limited to own videos
- Requires app review for production

## Support
- TikTok Developer Support: https://developers.tiktok.com/support
- Community Forum: https://developers.tiktok.com/community
- API Status: https://developers.tiktok.com/status
- Contact: developer@tiktok.com
