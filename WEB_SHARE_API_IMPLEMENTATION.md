# Web Share API Implementation Guide

## Overview

The Share Project button now uses the **Web Share API** for native device sharing on mobile devices, with an intelligent fallback to clipboard copy on desktop browsers.

## How It Works

### Mobile Experience (iOS/Android)

```
User taps "Share Project" button
         ↓
Native share sheet opens
         ↓
User sees installed apps:
  📱 WhatsApp
  💬 Messages
  📧 Mail
  💼 Slack
  And more...
         ↓
User selects app
         ↓
Link is shared directly!
```

**No toast notifications needed** - the native share sheet provides its own feedback.

### Desktop Experience

```
User clicks "Copy Link" button
         ↓
Link copied to clipboard
         ↓
Toast notification appears:
  "✓ Link copied!"
         ↓
Button shows "Copied!" for 2 seconds
         ↓
User can paste link anywhere
```

## Code Implementation

### Feature Detection

```tsx
const [canShare, setCanShare] = useState(false)

useEffect(() => {
  setCanShare(
    typeof navigator !== "undefined" && 
    typeof navigator.share === "function"
  )
}, [])
```

### Share Function with Fallback

```tsx
const handleShare = async () => {
  const projectUrl = `${window.location.origin}/project/${projectId}`
  const shareTitle = projectName || "SharedTask Project"
  const shareText = `Check out this project: ${shareTitle}`

  // Try Web Share API first (mobile devices)
  if (canShare) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: projectUrl,
      })
      return // Success - no toast needed
    } catch (error) {
      if (error.name === "AbortError") {
        return // User cancelled - no error
      }
      // Fall through to clipboard copy
    }
  }

  // Fallback to clipboard copy
  await navigator.clipboard.writeText(projectUrl)
  setCopied(true)
  showToast({ type: "success", ... })
}
```

### Dynamic Button Content

```tsx
{copied ? (
  <>
    <Check className="w-5 h-5 md:w-4 md:h-4 mr-2" />
    Copied!
  </>
) : canShare ? (
  <>
    <Share2 className="w-5 h-5 md:w-4 md:h-4 mr-2" />
    Share Project
  </>
) : (
  <>
    <Copy className="w-5 h-5 md:w-4 md:h-4 mr-2" />
    Copy Link
  </>
)}
```

## Browser Support

| Platform | Browser | Share API | Clipboard API | Experience |
|----------|---------|-----------|---------------|------------|
| iOS | Safari 12.2+ | ✅ | ✅ | Native share sheet |
| Android | Chrome | ✅ | ✅ | Native share sheet |
| Android | Samsung Internet | ✅ | ✅ | Native share sheet |
| Desktop | Chrome | ❌ | ✅ | Copy to clipboard |
| Desktop | Firefox | ❌ | ✅ | Copy to clipboard |
| Desktop | Safari | ❌ | ✅ | Copy to clipboard |
| Desktop | Edge | ❌ | ✅ | Copy to clipboard |

## User Benefits

### Mobile Users
- **Familiar interface**: Uses their device's native share sheet
- **Quick sharing**: One tap to share to their favorite apps
- **More options**: Share to any installed app (WhatsApp, Messenger, Telegram, etc.)
- **Better UX**: No need to copy/paste manually
- **Universal**: Works with any communication app

### Desktop Users
- **Simple copy**: One click to copy link
- **Clear feedback**: Visual confirmation with toast and button state
- **Fast workflow**: Copy and paste into their preferred tool

## Testing Checklist

- [x] ✅ Detects Web Share API availability correctly
- [x] ✅ Opens native share sheet on mobile
- [x] ✅ Falls back to clipboard on desktop
- [x] ✅ Handles user cancellation gracefully (no error toast)
- [x] ✅ Shows correct icon based on capability (Share2 vs Copy)
- [x] ✅ Shows "Copied!" confirmation on clipboard copy
- [x] ✅ Toast only appears for clipboard operations
- [x] ✅ Button text adapts to capability
- [x] ✅ Works on HTTPS (required for clipboard API)
- [x] ✅ No linter errors

## Example Share Data

When sharing on mobile, the native share sheet includes:

```json
{
  "title": "My Birthday Party",
  "text": "Check out this project: My Birthday Party",
  "url": "https://sharedtask.ai/project/abc123"
}
```

This provides rich context when sharing to:
- **WhatsApp**: Shows title and link preview
- **Messages**: Includes message text and URL
- **Email**: Pre-fills subject and body
- **Social media**: Can include preview card

## Security & Privacy

### HTTPS Requirement
Both Web Share API and Clipboard API require secure contexts:
- ✅ Production: HTTPS required
- ✅ Development: localhost is considered secure
- ❌ HTTP sites: APIs not available

### User Permission
- **Web Share API**: No permission needed (user initiates)
- **Clipboard API**: May prompt for permission on first use
- **User control**: User can always cancel the share

### No Tracking
- We don't track which apps users share to
- No analytics on share events (can be added if needed)
- No personal data shared beyond the link

## Performance

- **Detection**: Runs once on component mount
- **No bundle size impact**: Uses native browser APIs
- **Fast**: Synchronous detection, asynchronous sharing
- **Lightweight**: No external dependencies

## Error Handling

### User Cancellation
```tsx
if (error.name === "AbortError") {
  return // Silent - user chose to cancel
}
```

### Share Failure
```tsx
// Falls back to clipboard copy
// Shows toast notification
```

### Clipboard Failure
```tsx
showToast({
  type: "error",
  title: "Copy failed",
  message: "Please try again"
})
```

## Mobile UX Best Practices Applied

1. **Progressive enhancement**: Desktop users still get great UX
2. **Platform conventions**: Uses native patterns per platform
3. **Clear affordances**: Button text changes based on capability
4. **Visual feedback**: Icons and states communicate clearly
5. **Error resilience**: Graceful fallbacks at every step

## Real-World Examples

### Sharing to WhatsApp (Mobile)
1. User taps "Share Project"
2. Native sheet appears
3. User taps WhatsApp icon
4. WhatsApp opens with pre-filled message
5. User can edit and send

### Sharing via Email (Desktop)
1. User clicks "Copy Link"
2. Toast confirms: "Link copied!"
3. User opens Gmail
4. Pastes link into email
5. Sends to recipients

## Future Enhancements

### Share Files
```tsx
// Could share project as file
await navigator.share({
  files: [projectFile],
  title: shareTitle,
})
```

### Share Images
```tsx
// Could generate QR code and share as image
await navigator.share({
  files: [qrCodeImage],
  title: 'Scan to view project',
})
```

### Custom Share Messages
```tsx
// Allow project hosts to customize share text
const shareText = projectSettings.customShareMessage || defaultText
```

## Conclusion

The Web Share API integration provides:
- ✨ **Better mobile UX**: Native sharing is faster and more intuitive
- 🎯 **Higher engagement**: Easier sharing = more shares
- 📱 **Platform native**: Follows OS conventions
- 🔄 **Graceful fallback**: Desktop users aren't left behind
- 🚀 **Zero dependencies**: Uses standard web APIs

This implementation follows mobile-first design principles while ensuring all users have an excellent experience!


