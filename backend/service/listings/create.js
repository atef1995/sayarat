class create {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
  }

  async createListing(listingData) {
    try {
      const {
        title,
        carType,
        color,
        description,
        make,
        model,
        year,
        price,
        mileage,
        location,
        images,
        contactInfo
      } = listingData;

      const [newListing] = await this.db('listed_cars')
        .insert({
          title,
          car_type: carType,
          color,
          description,
          make,
          model,
          year,
          price,
          mileage,
          location,
          images: JSON.stringify(images),
          contact_info: JSON.stringify(contactInfo)
        })
        .returning('*');

      return {
        success: true,
        data: newListing,
        message: 'Listing created successfully'
      };
    } catch (error) {
      this.logger.error('Error in createListing:', error);
      return {
        success: false,
        message: 'Failed to create listing',
        error: error.message
      };
    }
  }

  async insertSpecs(listingId, specs) {
    try {
      if (!specs || specs.length === 0) {
        return { success: true, message: 'No specs to insert' };
      }

      await this.db('specs')
        .insert({
          car_listing_id: listingId,
          specs: JSON.stringify(specs)
        });
      return { success: true, message: 'Specs inserted successfully' };
    } catch (error) {
      this.logger.error('Error in insertSpecs:', error);
      return { success: false, message: 'Failed to insert specs', error: error.message };
    }
  }
}

module.exports = create;