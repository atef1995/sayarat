const FormData = require('form-data');
const fs = require('fs').promises;
const sharp = require('sharp');
const axios = require('axios');
const streamifier = require('streamifier');
const path = require('path');
const logger = require('./utils/logger');

require('dotenv').config();

let nsfwModel = null;
let tensorflowAvailable = false;

// Try to load TensorFlow and NSFW detection
async function initializeImageProcessing() {
  try {
    const nsfw = require('nsfwjs');
    const tf = require('@tensorflow/tfjs-node');

    logger.info('TensorFlow loaded successfully');
    tensorflowAvailable = true;

    // Load NSFW detection model
    if (!nsfwModel) {
      nsfwModel = await nsfw.load();
      logger.info('NSFW model loaded successfully');
    }

    return { nsfw, tf };
  } catch (error) {
    logger.warn('TensorFlow not available in this environment:', error.message);
    logger.warn('Image content checking will be disabled');
    tensorflowAvailable = false;
    return null;
  }
}

// Load NSFW detection model
async function loadModel() {
  if (!tensorflowAvailable) {
    logger.warn('TensorFlow not available - skipping model load');
    return null;
  }

  if (!nsfwModel) {
    const modules = await initializeImageProcessing();
    if (!modules) return null;
  }
  return nsfwModel;
}

async function checkImage(imageBuffer) {
  logger.info('Checking image...');

  if (!tensorflowAvailable) {
    logger.warn('TensorFlow not available - returning safe by default');
    return {
      safe: true,
      predictions: [],
      warning: 'Content checking disabled - TensorFlow not available'
    };
  }

  try {
    const modules = await initializeImageProcessing();
    if (!modules) {
      return {
        safe: true,
        predictions: [],
        warning: 'Content checking disabled'
      };
    }

    const { tf } = modules;

    // Process with TensorFlow directly
    const tensor = await tf.node.decodeImage(imageBuffer, 3);
    const predictions = await nsfwModel.classify(tensor);

    // Clean up tensor
    tf.dispose(tensor);

    // Check for explicit content
    const explicit = predictions.some(
      prediction =>
        (prediction.className === 'Porn' || prediction.className === 'Hentai' || prediction.className === 'Sexy') &&
        prediction.probability > 0.7
    );

    return {
      safe: !explicit,
      predictions
    };
  } catch (error) {
    logger.error('Error in image checking:', error);
    return {
      safe: true,
      predictions: [],
      warning: 'Content checking failed - allowing by default'
    };
  }
}

/**
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<string>} URL of the uploaded image
 */
async function uploadToImgBB(imageBuffer) {
  // const imageStream = streamifier.createReadStream(imageBuffer);
  const base64Image = imageBuffer.toString('base64');
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('API Key missing');
  }

  const formData = new FormData();
  formData.append('image', base64Image);

  const headers = formData.getHeaders();

  try {
    const response = await axios.post(`https://api.imgbb.com/1/upload?expiration=15552000&key=${apiKey}`, formData, {
      headers
    });

    const result = response.data;

    // logger.info('Response result:', JSON.stringify(result, null, 2));

    if (result.status !== 200) {
      throw new Error(`Upload failed: ${result.status}`);
    }

    return { url: result.data.url, delete_url: result.data.delete_url };
  } catch (error) {
    console.error('Error uploading image:', error.response?.data || error.message);
    throw new Error('Image upload failed');
  }
}

/**
 *
 * @param {Array} images - Array of image objects with { filename, path }
 * @description Handles image upload, checks for NSFW content, and uploads to ImgBB.
 * @returns {Promise<Array>} - Returns an array of uploaded file objects with { filename, url, delete_url }
 * @throws {Error} - Throws an error if the upload fails or if there are issues processing images.
 */
async function handleImageUpload(images) {
  const uploadedFiles = [];
  try {
    // Load NSFW model if not loaded
    await loadModel();

    for (const image of images) {
      try {
        logger.info('Processing image:', { fileName: image.filename });
        const imageBuffer = await sharp(image.path).resize({ width: 512 }).toBuffer();

        const safetyResult = await checkImage(imageBuffer);

        if (!safetyResult.safe) {
          logger.info('Explicit content detected in', { fileName: image.filename });
          continue;
        }

        // Upload image if safe
        const { url, delete_url } = await uploadToImgBB(imageBuffer);
        uploadedFiles.push({ filename: image.filename, url, delete_url });

        // Close any open file handles
        imageBuffer.clear && imageBuffer.clear();

        // Try to delete the temp file
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
          await fs.unlink(image.path);
        } catch (unlinkError) {
          console.warn(`Warning: Could not delete temporary file ${image.filename}:`, unlinkError);
          // Continue processing even if we can't delete the temp file
        }
      } catch (processError) {
        console.error(`Error processing image ${image.filename}:`, processError);
        // Continue with other images even if one fails
      }
    }

    return uploadedFiles;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  } finally {
    // Cleanup any remaining files in a separate try-catch
    for (const image of images) {
      try {
        if (
          await fs
            .access(image.path)
            .then(() => true)
            .catch(() => false)
        ) {
          await fs.unlink(image.path);
        }
      } catch (cleanupError) {
        console.warn(`Warning: Could not cleanup file ${image.filename}:`, cleanupError);
      }
    }
  }
}

// Add this cleanup function to handle temporary files
async function cleanupTempFiles() {
  const uploadsDir = path.join(__dirname, 'uploads');
  try {
    const files = await fs.readdir(uploadsDir);
    await Promise.all(
      files.map(file =>
        fs.unlink(path.join(uploadsDir, file)).catch(err => console.warn(`Could not delete ${file}:`, err))
      )
    );
  } catch (error) {
    console.warn('Error cleaning up temp files:', error);
  }
}

module.exports = {
  handleImageUpload,
  uploadToImgBB,
  cleanupTempFiles,
  initializeImageProcessing
};
