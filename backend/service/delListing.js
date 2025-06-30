const axios = require('axios');

const deleteListing = async(db, listingId, userId) => {
  // Get images to delete
  const images = await new Promise((resolve, reject) => {
    db.all('SELECT delete_url FROM car_images WHERE car_listing_id = ?', [listingId], (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });

  // Delete images from storage service
  if (images && images.length > 0) {
    for (const image of images) {
      try {
        const res = await axios.delete(image.delete_url);
        if (res.status !== 204) {
          console.warn('Failed to delete image from storage:', image.delete_url);
        } else {
          console.log('Image deleted successfully:', image.delete_url);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  }

  // Delete images from database
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM car_images WHERE car_listing_id = ?', [listingId], err => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

module.exports = deleteListing;
