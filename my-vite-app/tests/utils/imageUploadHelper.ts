import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

// Simple and reliable directory resolution for tests
const getTestsDir = (): string => {
  // Use process.cwd() and navigate to tests directory
  const cwd = process.cwd();

  // Check if we're already in tests directory or a subdirectory
  if (cwd.includes("tests")) {
    const testsIndex = cwd.indexOf("tests");
    return cwd.substring(0, testsIndex + 5); // Include 'tests'
  }

  // Otherwise, assume we're in project root and add tests path
  return path.join(cwd, "tests");
};

const __dirname = getTestsDir();

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

export interface ImageInfo {
  path: string;
  size: number;
  created: Date;
  modified: Date;
  extension: string;
}

export interface ImageUploadOptions {
  count?: number;
  sourceDir?: string;
  targetDir?: string;
  extensions?: string[];
  minSize?: number; // minimum file size in bytes
  maxSize?: number; // maximum file size in bytes
}

export class ImageUploadHelper {
  private static readonly DEFAULT_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
  ];
  private static readonly DEFAULT_TARGET_DIR = path.join(__dirname, "fixtures");

  /**
   * Get the fixtures directory path
   */
  private static getFixturesDir(): string {
    return path.join(__dirname, "fixtures");
  }
  /**
   * Get random images from a source directory
   */
  static async getRandomImages(
    options: ImageUploadOptions = {}
  ): Promise<string[]> {
    const {
      count = 2,
      sourceDir = ImageUploadHelper.getFixturesDir(),
      extensions = ImageUploadHelper.DEFAULT_EXTENSIONS,
      minSize = 1024, // 1KB minimum
      maxSize = 10 * 1024 * 1024, // 10MB maximum
    } = options;

    try {
      const files = await readdir(sourceDir);
      const validImages: string[] = [];

      for (const file of files) {
        const filePath = path.join(sourceDir, file);
        const isValidExtension = extensions.some((ext) =>
          file.toLowerCase().endsWith(ext.toLowerCase())
        );

        if (isValidExtension) {
          try {
            const stats = await stat(filePath);
            if (stats.size >= minSize && stats.size <= maxSize) {
              validImages.push(filePath);
            }
          } catch (error) {
            console.warn(`Could not stat file ${filePath}:`, error);
          }
        }
      }

      // Shuffle and select random images
      const shuffled = validImages.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, shuffled.length));
    } catch (error) {
      console.error("Error reading source directory:", error);
      return ImageUploadHelper.getFallbackImages(count);
    }
  }

  /**
   * Get random images from multiple directories
   */
  static async getRandomImagesFromMultipleDirs(
    directories: string[],
    options: ImageUploadOptions = {}
  ): Promise<string[]> {
    const { count = 2 } = options;
    const allImages: string[] = [];

    for (const dir of directories) {
      try {
        const dirImages = await ImageUploadHelper.getRandomImages({
          ...options,
          sourceDir: dir,
          count: 999, // Get all valid images from each directory
        });
        allImages.push(...dirImages);
      } catch (error) {
        console.warn(`Could not read directory ${dir}:`, error);
      }
    }

    // Shuffle and select
    const shuffled = allImages.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Copy random images from source to target directory
   */
  static async copyRandomImages(
    sourceDir: string,
    targetDir: string,
    options: ImageUploadOptions = {}
  ): Promise<string[]> {
    const { count = 2 } = options;

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const sourceImages = await ImageUploadHelper.getRandomImages({
      ...options,
      sourceDir,
      count: 999, // Get all valid images
    });

    const copiedImages: string[] = [];
    const selectedImages = sourceImages.slice(0, count);

    for (let i = 0; i < selectedImages.length; i++) {
      const sourceFile = selectedImages[i];
      const fileName = `test-image-${Date.now()}-${i}${path.extname(
        sourceFile
      )}`;
      const targetFile = path.join(targetDir, fileName);

      try {
        await copyFile(sourceFile, targetFile);
        copiedImages.push(targetFile);
      } catch (error) {
        console.warn(`Could not copy ${sourceFile} to ${targetFile}:`, error);
      }
    }

    return copiedImages;
  }
  /**
   * Generate test images programmatically (requires canvas or similar)
   */
  static async generateTestImages(
    count: number = 2,
    targetDir?: string
  ): Promise<string[]> {
    const target = targetDir || ImageUploadHelper.getFixturesDir();

    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const generatedImages: string[] = [];

    // This is a placeholder - in a real scenario, you might use canvas or sharp
    // to generate actual test images
    for (let i = 0; i < count; i++) {
      const fileName = `generated-test-${Date.now()}-${i}.txt`;
      const filePath = path.join(target, fileName);

      // For demo purposes, create placeholder files
      // In reality, you'd generate actual image data
      fs.writeFileSync(filePath, `Test image placeholder ${i}`);
      generatedImages.push(filePath);
    }

    return generatedImages;
  }
  /**
   * Fallback method when no images are found
   */
  private static getFallbackImages(count: number): string[] {
    const fallbackDir = ImageUploadHelper.getFixturesDir();
    const fallbackImages = [
      path.join(fallbackDir, "car1.jpg"),
      path.join(fallbackDir, "car2.jpg"),
      path.join(fallbackDir, "clio.png"),
    ];

    return fallbackImages.slice(0, count);
  }

  /**
   * Validate image files
   */
  static async validateImages(imagePaths: string[]): Promise<string[]> {
    const validImages: string[] = [];

    for (const imagePath of imagePaths) {
      try {
        const stats = await stat(imagePath);
        if (stats.isFile() && stats.size > 0) {
          validImages.push(imagePath);
        }
      } catch (error) {
        console.warn(`Invalid image file ${imagePath}:`, error);
      }
    }

    return validImages;
  }
  /**
   * Get image metadata (size, dimensions, etc.)
   */
  static async getImageInfo(imagePath: string): Promise<ImageInfo | null> {
    try {
      const stats = await stat(imagePath);
      return {
        path: imagePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: path.extname(imagePath).toLowerCase(),
      };
    } catch (error) {
      console.error(`Could not get info for ${imagePath}:`, error);
      return null;
    }
  }
}

// Convenience functions for direct use in tests
export const getRandomImages = (options?: ImageUploadOptions) =>
  ImageUploadHelper.getRandomImages(options);

export const getRandomImagesFromDirs = (
  directories: string[],
  options?: ImageUploadOptions
) => ImageUploadHelper.getRandomImagesFromMultipleDirs(directories, options);

export const copyRandomImages = (
  sourceDir: string,
  targetDir: string,
  options?: ImageUploadOptions
) => ImageUploadHelper.copyRandomImages(sourceDir, targetDir, options);

export const validateImages = (imagePaths: string[]) =>
  ImageUploadHelper.validateImages(imagePaths);
