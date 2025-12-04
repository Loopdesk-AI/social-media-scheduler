# LinkedIn Provider

## Overview
This provider enables OAuth authentication and content publishing to LinkedIn personal profiles and organization pages using the official LinkedIn API v2.

## OAuth Setup

### 1. Create LinkedIn App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Sign in with your LinkedIn account
3. Click "Create app"
4. Fill in required information:
   - App name
   - LinkedIn Page (create one if needed)
   - App logo
   - Legal agreement acceptance

### 2. Configure OAuth Settings
1. In app settings, go to "Auth" tab
2. Add redirect URLs:
   - Development: `http://localhost:3000/api/integrations/linkedin/callback`
   - Production: `https://yourdomain.com/api/integrations/linkedin/callback`
3. Request access to required products:
   - Sign In with LinkedIn
   - Share on LinkedIn
   - Marketing Developer Platform (for organization posting)

### 3. Add OAuth 2.0 Scopes
1. In "Auth" tab, add scopes:
   - `r_liteprofile` - Basic profile information
   - `r_emailaddress` - Email address
   - `w_member_social` - Post to personal profile
   - `w_organization_social` - Post to organization pages
2. Submit for review if required

### 4. Get API Credentials
1. In "Auth" tab, find:
   - Client ID
   - Client Secret
2. Copy these credentials

### 5. Environment Variables
```env
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
BACKEND_URL=http://localhost:3000
```

## API Documentation
- **Official API Docs**: https://docs.microsoft.com/en-us/linkedin/
- **UGC Post API**: https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
- **OAuth 2.0**: https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication
- **Rate Limits**: 
  - Application limit: 100,000 calls per day
  - Per-user limit: Varies by endpoint
  - Throttle limit: 100 requests per user per 10 seconds

## Features Supported
- [x] OAuth 2.0 authentication
- [x] Personal profile posting
- [x] Organization page posting
- [x] Image upload (up to 9 images)
- [x] Video upload (1 video)
- [x] Article sharing with URL
- [x] Visibility settings (public, connections)
- [x] Media upload with multi-part support
- [x] Organization analytics
- [x] Long-lived tokens (60 days)

## Content Requirements
- **Text**: 1-3,000 characters
- **Images**: 
  - Max 9 images per post
  - Max 10MB per image
  - Formats: JPG, PNG, GIF
  - Recommended: 1200x627px (1.91:1 aspect ratio)
- **Videos**:
  - 1 video per post
  - Max 5GB
  - Formats: MP4, MOV, AVI
  - Duration: 3 seconds to 10 minutes
  - Recommended: 1080p, 30fps
- **Articles**:
  - Valid HTTP/HTTPS URL
  - Open Graph tags recommended

## Post Types
- **Text Only**: Simple text post
- **Text + Images**: Up to 9 images
- **Text + Video**: Single video
- **Text + Article**: Link preview with title

## Visibility Options
- `PUBLIC` - Visible to all LinkedIn members
- `CONNECTIONS` - Visible only to your connections

## Error Codes
| Code | Description | Handling |
|------|-------------|----------|
| 401 | Unauthorized | Trigger token refresh |
| 403 | Forbidden/Insufficient permissions | Show error, request re-auth |
| 404 | Resource not found | Show error |
| 409 | Duplicate content | Show error, modify content |
| 429 | Rate limit exceeded | Retry with exponential backoff |
| 500 | Internal server error | Retry operation |
| 503 | Service unavailable | Retry later |

## Testing

### Development Testing
1. Set up environment variables
2. Start backend server
3. Navigate to integration page
4. Click "Connect LinkedIn"
5. Complete OAuth flow
6. Select personal or organization posting
7. Create a test post

### Organization Posting
- User must be admin of the LinkedIn Page
- Organization posting requires "Marketing Developer Platform" product
- May require LinkedIn review and approval

## Media Upload Process
1. Register upload with LinkedIn
2. Receive upload URL and asset URN
3. Upload file to provided URL
4. Use asset URN in post creation
5. LinkedIn processes media asynchronously

## Rate Limits
- **Application**: 100,000 calls per day
- **Per User**: Varies by endpoint
- **Throttle**: 100 requests per 10 seconds per user
- **Media Upload**: 100 uploads per day per user

## Common Issues

### "Insufficient permissions"
- Ensure all required scopes are granted
- Check if user approved all permissions during OAuth
- Re-authenticate if permissions changed

### "Organization not found"
- User must be admin of the LinkedIn Page
- Verify organization ID is correct
- Check if organization page is active

### "Media upload failed"
- Check file size limits (10MB images, 5GB videos)
- Verify file format is supported
- Ensure stable network connection
- Check if upload URL expired (valid for 24 hours)

### "Rate limit exceeded"
- Implement exponential backoff
- Cache data where possible
- Monitor API usage
- Request rate limit increase if needed

### "Token expired"
- LinkedIn tokens last 60 days
- Implement token refresh before expiration
- Store refresh token securely
- Re-authenticate if refresh fails

## Best Practices
1. Always validate content length before posting
2. Optimize images before upload (compress, resize)
3. Use appropriate aspect ratios for images
4. Implement retry logic with exponential backoff
5. Cache analytics data to reduce API calls
6. Handle rate limits gracefully
7. Provide clear error messages to users
8. Test with both personal and organization accounts
9. Monitor API usage and quotas
10. Keep tokens encrypted and secure

## Analytics Metrics
- **Impressions**: Number of times content was displayed
- **Clicks**: Number of clicks on content
- **Likes**: Number of likes received
- **Comments**: Number of comments
- **Shares**: Number of shares
- **Engagement Rate**: (Likes + Comments + Shares) / Impressions * 100

## Limitations
- Personal analytics are limited compared to organization analytics
- Video processing may take several minutes
- Media upload URLs expire after 24 hours
- Maximum 9 images per post
- Maximum 1 video per post
- Organization posting requires admin access
- Some features require LinkedIn review

## Support
- LinkedIn Developer Support: https://www.linkedin.com/help/linkedin/answer/a1338350
- API Documentation: https://docs.microsoft.com/en-us/linkedin/
- Community Forum: https://www.linkedin.com/groups/4973032/
- Status Page: https://www.linkedin-apistatus.com/
