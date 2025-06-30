class ListingsStrategy {
  constructor(listingDatabase) {
    this.listingDatabase = listingDatabase;
  }

  async getTotalListings() {
    const totalResult = await this.listingDatabase.getTotalListings();
    return parseInt((totalResult && totalResult.total) || 0, 10);
  }

  async getHighlightedListings() {
    const highlightedResult = await this.listingDatabase.getHighlightedListings();
    return parseInt((highlightedResult && highlightedResult.total) || 0, 10);
  }

  async getRecentListings() {
    const recentResult = await this.listingDatabase.getRecentListings();
    return parseInt((recentResult && recentResult.total) || 0, 10);
  }
}

module.exports = ListingsStrategy;