# Facebook Page Provider

## Overview
This provider enables OAuth authentication and content publishing to Facebook Pages using the Facebook Graph API v20.0.

## OAuth Setup

### 1. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Select "Business" type
4. Fill in app details and create

### 2. Add Facebook Login Product
1. In app dashboard, click "Add Product"
2. Select "Facebook Login"
3. Choose "Web" platform
4. Add redirect URIs:
   - Development: `http://localhost:3001/api/integrations/facebook/callback`
   - Production: `https://yourdomain.com/api/integrations/facebook/callback`

### 3. Configure Permissions
1. Go to "App Review" > "Permissions and Features"
2. Request advanced access for:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_manage_metadata`
3. Submit for review if required

### 4. Get App Credentials
1. Go to "Settings" > "Basic"
2. Copy App ID and App Secret

### 5. Environment Variables
```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
BACKEND_URL=http://localhost:3001
```

## API Documentation
- **Graph API**: https://developers.facebook.com/docs/graph-api
- **Pages API**: https://developers.facebook.com/docs/pages-api
- **Publishing**: https://developers.facebook.com/docs/pages-api/posts
- **Rate Limits**: 200 calls per hour per user

## Features Supported
- [x] OAuth 2.0 authentication
- [x] Page selection
- [x] Text posts
- [x] Link posts with preview
- [x] Single photo posts
- [x] Multiple photo posts (albums)
- [x] Video posts with resumable upload
- [x] Page insights/analytics
- [x] Long-lived page tokens (never expire)

## Content Requirements
- **Text**: 1-63,206 characters
- **Photos**:
  - Max 4MB per photo
  - Formats: JPG, PNG, GIF, BMP
  - Multiple photos supported
- **Videos**:
  - Max 10GB
  - Formats: MP4, MOV, AVI, WMV, FLV, WebM
  - Duration: Up to 240 minutes
  - Resumable upload for large files

## Post Types
- **Text Only**: Simple status update
- **Link**: URL with Open Graph preview
- **Photo**: Single or multiple photos
- **Video**: Video with description

## Error Codes
| Code | Description | Handling |
|------|-------------|----------|
| 190 | Invalid access token | Trigger re-authentication |
| 200 | Permissions error | Request required permissions |
| 368 | Duplicate post/Spam/Temporary block | Show error, modify content |
| 4 | Rate limit exceeded | Retry with backoff |
| 17 | Too many requests | Slow down requests |
| 1363041 | Video upload failed | Check format and retry |
| 1363037 | Video too large | Reduce file size |
| 100 | Invalid parameter | Check request parameters |

## Testing
1. Create a Facebook Page (required)
2. Set up environment variables
3. Start backend server
4. Connect Facebook account
5. Select page to manage
6. Create test posts

## Video Upload Process
1. Start upload session with file size
2. Upload file in 5MB chunks
3. Finish upload session
4. Poll video processing status
5. Update video with description

## Rate Limits
- **Application**: 200 calls per hour per user
- **Page**: Varies by page size and engagement
- **Video Upload**: 1 concurrent upload per page

## Common Issues

### "No Facebook Pages found"
- User must create a Facebook Page first
- Guide users to https://www.facebook.com/pages/create

### "Duplicate post detected"
- Facebook prevents posting identical content
- Modify post content or wait before reposting

### "Video upload failed"
- Check video format and codec
- Ensure file size is under 10GB
- Verify stable network connection

### "Permissions error"
- Ensure all required permissions granted
- Complete app review if needed
- Re-authenticate with correct permissions

## Best Practices
1. Create Facebook Page before connecting
2. Use page access tokens (never expire)
3. Implement resumable upload for large videos
4. Handle duplicate post detection
5. Respect rate limits
6. Provide clear error messages
7. Test with various content types
8. Monitor page insights regularly
9. Cache analytics data
10. Handle video processing delays

## Analytics Metrics
- **Impressions**: Times content was displayed
- **Engaged Users**: Users who engaged with content
- **Post Engagements**: Total engagements
- **Page Fans**: Total page likes

## Limitations
- Requires Facebook Page (not personal profile)
- Page tokens never expire but can be revoked
- Video processing may take several minutes
- Duplicate content detection
- Rate limits vary by page size
- Some features require app review

## Support
- Facebook Developer Support: https://developers.facebook.com/support
- Community Forum: https://developers.facebook.com/community
- API Status: https://developers.facebook.com/status
- Bug Reports: https://developers.facebook.com/bugs
