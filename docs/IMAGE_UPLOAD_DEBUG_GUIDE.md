# Image Upload Debug Guide

## 🔧 Debugging Steps Implemented

### Frontend Improvements (`CompanyImageManager.tsx`)

1. **Enhanced Error Handling & Debugging**

   - Added comprehensive console logging for all upload steps
   - Improved error messages with specific details
   - Added loading messages during upload process
   - Added file validation logging

2. **Upload Props Fixes**

   - Fixed `name` property to match backend expectation (`"image"` instead of `"logo"`/`"header"`)
   - Added proper `onSuccess` and `onError` callbacks
   - Added `accept="image/*"` for better file picker
   - Set `multiple={false}` explicitly

3. **API Connection Testing**
   - Added debug function to test API connectivity
   - Development-only debug panel
   - Automatic API test on component mount

### Service Layer Improvements (`companyService.ts`)

1. **Enhanced Service Debugging**
   - Added detailed console logs for FormData creation
   - Added response status and headers logging
   - Improved error messages with status codes
   - Added validation for response data structure

### How to Debug

1. **Open Browser Developer Tools** (F12)
2. **Go to Console Tab**
3. **Try uploading an image**
4. **Look for these log messages:**

```javascript
// File validation
"Validating file: { name: ..., type: ..., size: ... }";

// Upload start
"Logo upload request: { file: ... }";
"CompanyService.uploadCompanyImage called with: { ... }";

// FormData creation
"FormData created: { hasImage: true, hasType: true, type: 'logo' }";

// API response
"Upload response: { status: 200, statusText: 'OK', ok: true }";
"Upload response data: { success: true, data: { url: '...' } }";

// Success
"Upload successful: { imageUrl: '...', type: 'logo' }";
```

## 🚨 Common Issues & Solutions

### 1. **No Console Logs Appearing**

- **Issue**: JavaScript not executing
- **Check**: Component is properly loaded, no syntax errors
- **Solution**: Check browser console for any script errors

### 2. **File Validation Failing**

- **Issue**: `beforeUpload` returning false due to file type/size
- **Check**: Console logs showing "Invalid file type" or "File too large"
- **Solution**: Ensure file is JPG/PNG and under 5MB

### 3. **API Request Not Sent**

- **Issue**: Network request not appearing in Network tab
- **Check**: Console logs stop before "Upload response"
- **Solution**: Check authentication, API endpoint configuration

### 4. **API Request Failing**

- **Issue**: HTTP error status (400, 401, 403, 500)
- **Check**: Console logs showing "Upload failed with response"
- **Common fixes**:
  - **401**: User not authenticated - check login status
  - **403**: User lacks permissions - check company membership/role
  - **400**: Bad request - check FormData structure
  - **500**: Server error - check backend logs

### 5. **Backend Issues**

- **Issue**: Server-side processing failing
- **Check**: Backend console/logs for errors
- **Common fixes**:
  - Check `imageHandler.js` dependencies (sharp, tensorflow, etc.)
  - Verify file upload middleware configuration
  - Check database connection and company record existence

## 🧪 Step-by-Step Testing

### 1. **Test API Connectivity**

```javascript
// In development, use the debug panel button
// Or manually in console:
fetch("/api/company/profile", { credentials: "include" })
  .then((r) => r.json())
  .then(console.log);
```

### 2. **Test File Selection**

- Click upload button
- Select a valid JPG/PNG file under 5MB
- Check console for "Validating file" message

### 3. **Test Upload Process**

- Monitor console logs step by step
- Check Network tab for HTTP request
- Verify FormData contains correct fields

### 4. **Test Upload Response**

- Check for successful response (status 200)
- Verify response contains `success: true` and `data.url`
- Confirm image URL is valid

## 🔍 Network Tab Investigation

1. **Open Network Tab in DevTools**
2. **Filter by "XHR" or "Fetch"**
3. **Look for `/api/company/upload-image` request**
4. **Check request details:**
   - Method: POST
   - Content-Type: multipart/form-data
   - Form Data should contain: `image` (file) and `type` (string)

## ⚙️ Environment Variables

Ensure these are set correctly:

```env
VITE_API_ENDPOINT=http://localhost:3000  # or your backend URL
```

## 🛠️ Backend Dependencies

Ensure these packages are installed:

```bash
npm install sharp @tensorflow/tfjs-node nsfwjs formdata streamifier
```

## 📝 What to Check Next

1. **Browser Console**: Any JavaScript errors?
2. **Network Tab**: Is the request being sent?
3. **Backend Logs**: Any server-side errors?
4. **File Permissions**: Can backend write uploaded files?
5. **Database**: Does user have company association?

Try uploading again and let me know what logs you see in the console! This will help identify exactly where the issue is occurring.
