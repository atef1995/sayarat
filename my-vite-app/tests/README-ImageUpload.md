# Random Image Upload Guide for Playwright Tests

This guide explains different methods to upload random images from directories in your Playwright tests.

## Overview

We've implemented several approaches to handle random image uploads:

1. **Simple Random Selection** - Select random images from a fixtures directory
2. **Advanced Helper Utility** - Comprehensive image handling with validation
3. **Multi-source Selection** - Pick images from multiple directories
4. **Temporary Image Copying** - Copy images to temp directory for testing
5. **Fallback Strategies** - Handle errors gracefully

## Method 1: Simple Random Selection

### Basic Implementation

```typescript
// Simple random image selection from fixtures
const getRandomImages = async (count: number = 2): Promise<string[]> => {
  return await getRandomImagesHelper({
    count,
    sourceDir: path.join(__dirname, "fixtures"),
  });
};

// Usage in test
const randomImages = await getRandomImages(2);
await uploadInput.setInputFiles(randomImages);
```

### Pros:

- Simple and straightforward
- Good for basic testing needs
- Minimal dependencies

### Cons:

- Limited error handling
- No file validation
- Single directory only

## Method 2: Advanced Helper Utility

### Features

The `ImageUploadHelper` class provides:

- File size validation (min/max)
- Multiple file format support
- Error handling and fallbacks
- Image metadata extraction
- Cross-platform compatibility

### Usage Examples

```typescript
import {
  getRandomImages,
  copyRandomImages,
  validateImages,
} from "./utils/imageUploadHelper";

// Basic usage
const images = await getRandomImages({ count: 3 });

// With validation options
const validatedImages = await getRandomImages({
  count: 2,
  sourceDir: "/path/to/images",
  minSize: 1024, // 1KB minimum
  maxSize: 5 * 1024 * 1024, // 5MB maximum
  extensions: [".jpg", ".png", ".webp"],
});

// Copy images to temp directory
const copiedImages = await copyRandomImages(sourceDir, tempDir, { count: 3 });
```

### Configuration Options

```typescript
interface ImageUploadOptions {
  count?: number; // Number of images to select
  sourceDir?: string; // Source directory path
  targetDir?: string; // Target directory for copying
  extensions?: string[]; // Allowed file extensions
  minSize?: number; // Minimum file size in bytes
  maxSize?: number; // Maximum file size in bytes
}
```

## Method 3: Multi-source Selection

### Implementation

```typescript
// Select from multiple directories
const testDirectories = [
  path.join(__dirname, "fixtures"),
  "C:\\Users\\Public\\Pictures",
  path.join(process.env.USERPROFILE || "", "Pictures"),
];

const multiSourceImages = await getRandomImagesFromDirs(testDirectories, {
  count: 3,
  maxSize: 5 * 1024 * 1024,
});
```

### Use Cases:

- Testing with diverse image sets
- Using system-wide image collections
- Combining test fixtures with real images

## Method 4: Temporary Image Handling

### When to Use

- Need to modify images before upload
- Want isolated test environment
- Require cleanup after tests

### Implementation

```typescript
const tempDir = path.join(__dirname, "temp-images");
const copiedImages = await copyRandomImages(sourceDir, tempDir, {
  count: 2,
  minSize: 1024,
});

// Use copied images in test
await uploadInput.setInputFiles(copiedImages);

// Cleanup in afterEach hook
afterEach(async () => {
  // Remove temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
});
```

## Method 5: Error Handling and Fallbacks

### Robust Error Handling

```typescript
test("should handle image upload with fallback", async ({ page }) => {
  try {
    const randomImages = await getRandomImages(3);
    await uploadInput.setInputFiles(randomImages);
  } catch {
    console.log("Random selection failed, using fallback");
    // Fallback to known good images
    await uploadInput.setInputFiles(["tests/fixtures/car1.jpg"]);
  }
});
```

### Validation Strategy

```typescript
// Validate images before upload
const selectedImages = await getRandomImages(3);
const validImages = await validateImages(selectedImages);

if (validImages.length === 0) {
  throw new Error("No valid images found");
}

await uploadInput.setInputFiles(validImages);
```

## Real-world Test Examples

### Test Case 1: Basic Random Upload

```typescript
test("should upload random images", async ({ page }) => {
  await page.goto("/create-listing");

  // Get 2-3 random images
  const images = await getRandomImages(Math.floor(Math.random() * 2) + 2);
  console.log(
    "Selected images:",
    images.map((img) => path.basename(img))
  );

  const uploadInput = page.locator('input[type="file"]').first();
  await uploadInput.setInputFiles(images);

  await expect(page.locator(".ant-upload-list-item")).toHaveCount(
    images.length
  );
});
```

### Test Case 2: Size-constrained Upload

```typescript
test("should upload images within size limits", async ({ page }) => {
  const images = await getRandomImages({
    count: 3,
    minSize: 10 * 1024, // 10KB minimum
    maxSize: 2 * 1024 * 1024, // 2MB maximum
  });

  // Validate all images meet size requirements
  for (const imagePath of images) {
    const info = await ImageUploadHelper.getImageInfo(imagePath);
    expect(info?.size).toBeGreaterThan(10 * 1024);
    expect(info?.size).toBeLessThan(2 * 1024 * 1024);
  }

  await uploadInput.setInputFiles(images);
});
```

### Test Case 3: Performance Testing

```typescript
test("should handle large image uploads", async ({ page }) => {
  // Test with maximum allowed images
  const maxImages = await getRandomImages({ count: 10 });

  const startTime = Date.now();
  await uploadInput.setInputFiles(maxImages);

  // Wait for all uploads to complete
  await page.waitForSelector(".ant-upload-list-item", { state: "attached" });
  await expect(page.locator(".ant-upload-list-item")).toHaveCount(
    maxImages.length
  );

  const uploadTime = Date.now() - startTime;
  console.log(`Upload completed in ${uploadTime}ms`);

  // Assert reasonable upload time
  expect(uploadTime).toBeLessThan(30000); // 30 seconds max
});
```

## Best Practices

### 1. Directory Structure

```
tests/
├── fixtures/           # Primary test images
│   ├── car1.jpg
│   ├── car2.jpg
│   └── clio.png
├── temp-images/       # Temporary test files (gitignored)
├── utils/
│   └── imageUploadHelper.ts
└── create-listing.spec.ts
```

### 2. Gitignore Configuration

```gitignore
# Ignore temporary test files
tests/temp-images/
tests/generated-images/
tests/downloaded-images/
```

### 3. Environment Variables

```typescript
// Use environment variables for flexible configuration
const TEST_IMAGE_DIR =
  process.env.TEST_IMAGE_DIR || path.join(__dirname, "fixtures");
const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || "5242880"); // 5MB
```

### 4. Cleanup Hooks

```typescript
test.afterEach(async () => {
  // Clean up temporary files
  const tempDirs = ["temp-images", "generated-images"];
  for (const dir of tempDirs) {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
});
```

### 5. Parallel Test Considerations

```typescript
// Use unique temp directories for parallel test execution
const testId = Math.random().toString(36).substring(7);
const tempDir = path.join(__dirname, `temp-images-${testId}`);
```

## Troubleshooting

### Common Issues

1. **File Not Found Errors**

   - Ensure fixture directory exists
   - Check file permissions
   - Verify image file extensions

2. **Upload Timeouts**

   - Increase timeout values
   - Reduce image sizes
   - Limit concurrent uploads

3. **Memory Issues**
   - Limit number of images per test
   - Use smaller image files
   - Clean up temp files promptly

### Debug Helpers

```typescript
// Add logging for debugging
const debugImages = async (images: string[]) => {
  for (const img of images) {
    const info = await ImageUploadHelper.getImageInfo(img);
    console.log(`Image: ${path.basename(img)}, Size: ${info?.size} bytes`);
  }
};
```

## Advanced Features

### 1. Dynamic Image Generation

```typescript
// Generate test images programmatically (requires additional dependencies)
import sharp from "sharp";

const generateTestImage = async (
  width: number,
  height: number,
  filename: string
) => {
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg()
    .toFile(filename);

  return filename;
};
```

### 2. Remote Image Download

```typescript
import fetch from "node-fetch";

const downloadRandomImage = async (url: string, filename: string) => {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFileSync(filename, buffer);
  return filename;
};
```

### 3. Image Format Conversion

```typescript
import sharp from "sharp";

const convertImageFormat = async (
  inputPath: string,
  outputPath: string,
  format: "jpeg" | "png" | "webp"
) => {
  await sharp(inputPath).toFormat(format).toFile(outputPath);

  return outputPath;
};
```

This comprehensive guide should help you implement robust random image uploads in your Playwright tests with proper error handling, validation, and cleanup strategies.
