# Icon Files for MIMESISS 2025

This directory should contain the following static icon files for optimal cross-platform support:

## Required Icon Files (place in /public)

### Favicon

- `favicon.ico` - 16x16, 32x32 (already exists)
- `icon-32.png` - 32x32 PNG version
- `icon.svg` - Scalable vector version (optional but recommended)

### Apple Touch Icons

- `apple-touch-icon.png` - 180x180 (iOS default)
- `apple-touch-icon-152x152.png` - 152x152 (iPad)
- `apple-touch-icon-120x120.png` - 120x120 (iPhone)

### Progressive Web App Icons

- `icon-192.png` - 192x192 (Android home screen)
- `icon-512.png` - 512x512 (Android splash screen & maskable)

## How to Generate Icons

1. **Design your base icon** - 512x512 PNG with transparent background
2. **Use online tools**:

   - [realfavicongenerator.net](https://realfavicongenerator.net/) (recommended - generates all sizes)
   - [favicon.io](https://favicon.io/)
   - [app-manifest-generator.netlify.app](https://app-manifest-generator.netlify.app/)

3. **Manual creation**:
   - Start with 512x512 base image
   - Resize to required dimensions
   - Ensure proper padding for Apple icons (10% margin recommended)

## Current Implementation

- ✅ Static icon configuration in layout.tsx
- ✅ PWA manifest.json configured
- ✅ Cross-platform compatibility
- 🔄 **Next steps**: Add your actual icon files to /public directory

## File Naming Convention

All icon files should be placed directly in the `/public` directory with exact names as listed above.
