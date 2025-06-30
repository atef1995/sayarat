class ListingsSortAlgorithm {
  constructor(highlightedListings, regularListings, totalLimit) {
    this.highlightedListings = highlightedListings || [];
    this.regularListings = regularListings || [];
    this.totalLimit = totalLimit || 10;
  }

  /**
   * Mix highlighted and regular listings strategically
   * @private
   */
  _mixListingsStrategically(strategy = 'mixed') {
    switch (strategy) {
      case 'distributed':
        return this._distributeListings(this.highlightedListings, this.regularListings, this.totalLimit);

      case 'top-bottom':
        return this._topBottomMix(
          this.highlightedListings,
          this.regularListings,
          this.totalLimit
        );

      case 'golden-ratio':
        return this._goldenRatioMix(
          this.highlightedListings,
          this.regularListings,
          this.totalLimit
        );

      case 'alternating':
        return this._alternatingMix(
          this.highlightedListings,
          this.regularListings,
          this.totalLimit
        );

      case 'weighted':
        return this._weightedMix(
          this.highlightedListings,
          this.regularListings,
          this.totalLimit
        );

      case 'mixed':
      default:
        return this._randomMix(
          this.highlightedListings,
          this.regularListings,
          this.totalLimit
        );
    }
  }

  /**
   * Distribute highlighted listings evenly throughout the page
   * @private
   */
  _distributeListings(highlighted, regular, totalLimit) {
    const mixed = [];
    const totalHighlighted = highlighted.length;
    const totalRegular = regular.length;

    if (totalHighlighted === 0) {
      return regular.slice(0, totalLimit);
    }
    if (totalRegular === 0) {
      return highlighted.slice(0, totalLimit);
    }

    // Calculate distribution interval
    const interval = Math.floor(totalLimit / totalHighlighted);

    let highlightIndex = 0;
    let regularIndex = 0;

    for (let i = 0; i < totalLimit && (highlightIndex < totalHighlighted || regularIndex < totalRegular); i++) {
      // Place highlighted listing at calculated intervals
      if (i % interval === 0 && highlightIndex < totalHighlighted) {
        mixed.push({ ...highlighted[highlightIndex], _placement: 'highlighted' });
        highlightIndex++;
      } else if (regularIndex < totalRegular) {
        mixed.push({ ...regular[regularIndex], _placement: 'regular' });
        regularIndex++;
      } else if (highlightIndex < totalHighlighted) {
        mixed.push({ ...highlighted[highlightIndex], _placement: 'highlighted' });
        highlightIndex++;
      }
    }

    return mixed.slice(0, totalLimit);
  }

  /**
   * Place highlighted listings at top and bottom
   * @private
   */
  _topBottomMix(highlighted, regular, totalLimit) {
    const mixed = [];
    const topHighlighted = Math.ceil(highlighted.length / 2);

    // Add top highlighted
    mixed.push(...highlighted.slice(0, topHighlighted).map(l => ({ ...l, _placement: 'highlighted-top' })));

    // Add regular listings
    mixed.push(...regular.map(l => ({ ...l, _placement: 'regular' })));

    // Add bottom highlighted
    mixed.push(...highlighted.slice(topHighlighted).map(l => ({ ...l, _placement: 'highlighted-bottom' })));

    return mixed.slice(0, totalLimit);
  }

  /**
   * Random mix of highlighted and regular listings
   * @private
   */
  _randomMix(highlighted, regular, totalLimit) {
    const allListings = [
      ...highlighted.map(l => ({ ...l, _placement: 'highlighted' })),
      ...regular.map(l => ({ ...l, _placement: 'regular' }))
    ];

    // Simple shuffle algorithm
    for (let i = allListings.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allListings[i], allListings[j]] = [allListings[j], allListings[i]];
    }

    return allListings.slice(0, totalLimit);
  }

  /**
   * Golden ratio distribution (1:1.618 ratio for visual appeal)
   * @private
   */
  _goldenRatioMix(highlighted, regular, totalLimit) {
    const mixed = [];
    const goldenRatio = 1.618;
    let highlightIndex = 0;
    let regularIndex = 0;
    let highlightCounter = 0;
    let regularCounter = 0;

    for (let i = 0; i < totalLimit && (highlightIndex < highlighted.length || regularIndex < regular.length); i++) {
      // Use golden ratio to determine placement
      const shouldPlaceHighlighted =
        highlightCounter / goldenRatio <= regularCounter && highlightIndex < highlighted.length;

      if (shouldPlaceHighlighted) {
        mixed.push({ ...highlighted[highlightIndex], _placement: 'highlighted-golden' });
        highlightIndex++;
        highlightCounter++;
      } else if (regularIndex < regular.length) {
        mixed.push({ ...regular[regularIndex], _placement: 'regular' });
        regularIndex++;
        regularCounter++;
      } else if (highlightIndex < highlighted.length) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-golden' });
        highlightIndex++;
      }
    }

    return mixed.slice(0, totalLimit);
  }

  /**
   * Alternating pattern (regular, regular, highlighted)
   * @private
   */
  _alternatingMix(highlighted, regular, totalLimit) {
    const mixed = [];
    const pattern = [false, false, true]; // Two regular, one highlighted
    let highlightIndex = 0;
    let regularIndex = 0;
    let patternIndex = 0;

    for (let i = 0; i < totalLimit && (highlightIndex < highlighted.length || regularIndex < regular.length); i++) {
      const shouldPlaceHighlighted = pattern[patternIndex] && highlightIndex < highlighted.length;

      if (shouldPlaceHighlighted) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-alt' });
        highlightIndex++;
      } else if (regularIndex < regular.length) {
        mixed.push({ ...regular[regularIndex], _placement: 'regular' });
        regularIndex++;
      } else if (highlightIndex < highlighted.length) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-alt' });
        highlightIndex++;
      }

      patternIndex = (patternIndex + 1) % pattern.length;
    }

    return mixed.slice(0, totalLimit);
  }

  /**
   * Weighted distribution based on page position
   * @private
   */
  _weightedMix(highlighted, regular, totalLimit) {
    const mixed = [];
    let highlightIndex = 0;
    let regularIndex = 0;

    for (let i = 0; i < totalLimit && (highlightIndex < highlighted.length || regularIndex < regular.length); i++) {
      // Higher weight for highlighted at strategic positions (positions 2, 5, 8, etc.)
      const isStrategicPosition = (i + 1) % 3 === 2; // Positions 2, 5, 8, 11...
      const shouldPlaceHighlighted = isStrategicPosition && highlightIndex < highlighted.length;

      if (shouldPlaceHighlighted) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-weighted' });
        highlightIndex++;
      } else if (regularIndex < regular.length) {
        mixed.push({ ...regular[regularIndex], _placement: 'regular' });
        regularIndex++;
      } else if (highlightIndex < highlighted.length) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-weighted' });
        highlightIndex++;
      }
    }

    return mixed.slice(0, totalLimit);
  }
}

module.exports = ListingsSortAlgorithm;