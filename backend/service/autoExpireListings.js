// const { DateTime } = require('luxon'); // or use native Date
const deleteListing = require('./delListing'); // your service

/**
 *  Setup auto-expire listings older than 9 months
 *  and change their status to 'expired'.
 * @param {Object} db - SQLite database instance
 * @returns {void}
 */
const setupAutoExpire = db => {
  setInterval(
    async() => {
      const now = new Date();
      // Find listings older than 9 months and not already expired
      db.all(
        "SELECT id, seller_id FROM listed_cars WHERE status = 'active' AND datetime(created_at) <= datetime('now', '-9 months')",
        [],
        async(err, rows) => {
          if (err) {
            console.error('Auto-expire error:', err);
            return;
          }

          for (const row of rows) {
            try {
              await deleteListing(db, row.id, row.seller_id);
              db.run("UPDATE listed_cars SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
                row.id
              ]);
              console.log(`Listing ${row.id} auto-expired`);
            } catch (e) {
              console.error('Error auto-expiring listing:', row.id, e);
            }
          }
        }
      );
    },
    1000 * 60 * 60
  ); // every hour
};

/**
 *  Setup auto-delete for disabled listings
 *  that are older than 14 days.
 * This will run every 24 hours.
 * @function setupAutoDeleteDisabledListings
 * @param {Object} db - SQLite database instance
 * @returns {void}
 */
const setupAutoDeleteDisabledListings = db => {
  setInterval(
    () => {
      db.run(
        "DELETE FROM listed_cars WHERE status = 'disabled' OR status = 'changed_mind' OR status = 'sold' OR status = 'other' AND datetime(updated_at) < datetime('now', '-14 days')",
        err => {
          if (err) {
            console.error('Error deleting disabled listings:', err);
          } else {
            console.log('Disabled listings older than 14 days deleted');
          }
        }
      );
    },
    1000 * 60 * 60 * 24
  ); // every 24 hours
};

module.exports = {
  setupAutoExpire,
  setupAutoDeleteDisabledListings
};
