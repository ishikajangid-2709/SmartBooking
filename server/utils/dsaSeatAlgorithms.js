/**
 * DSA Seat Booking Algorithms
 * Smart Event & Seat Booking Management System
 * 
 * Algorithms implemented:
 * 1. Find Consecutive Seats in Same Row
 * 2. Best Seat Recommendation (Center Proximity, Contiguity, Tier/Price Optimization)
 * 3. Availability and Occupancy Analysis
 */

/**
 * -----------------------------------------------------------------------------
 * DSA REQUIREMENT 1: FIND CONSECUTIVE SEATS
 * -----------------------------------------------------------------------------
 * Problem:
 * Given a venue seat layout, a set of currently unavailable (booked or locked) seats,
 * and the number of required seats (k), find a contiguous block of k available seats
 * located within the same row.
 * 
 * Algorithm:
 * 1. Group all venue seats by their row label (e.g. 'A', 'B', 'C').
 * 2. For each row, sort seats by their column order (1, 2, 3, ...).
 * 3. Use a sliding window / two-pointer linear scan along each row:
 *    - Maintain a running sequence of contiguous available seats.
 *    - If an unavailable seat is encountered, reset the window starting position
 *      to the next seat, avoiding redundant re-scanning of failed seats.
 *    - Once the contiguous sequence length reaches k, return that group immediately.
 * 4. If no single row has k contiguous seats, return an empty array or the best
 *    available partial match.
 * 
 * Complexity Analysis:
 * - Time Complexity: O(R * C)
 *   Where R is the number of rows and C is the number of seats per row.
 *   Each seat is visited at most twice during the sliding window scan, making it O(N)
 *   overall where N = R * C is the total number of seats.
 * - Space Complexity: O(N)
 *   To store the grouped seat layout and O(k) for the returned result array.
 */
function findConsecutiveSeats(allSeats, unavailableSeatNumbers, requiredCount) {
  if (!requiredCount || requiredCount <= 0 || !Array.isArray(allSeats)) {
    return [];
  }

  const unavailableSet = new Set(unavailableSeatNumbers || []);

  // Group seats by row
  const rowMap = new Map();
  for (const seat of allSeats) {
    if (!rowMap.has(seat.row)) {
      rowMap.set(seat.row, []);
    }
    rowMap.get(seat.row).push(seat);
  }

  // Iterate each row in alphabetical/natural order
  const sortedRows = Array.from(rowMap.keys()).sort();

  for (const rowKey of sortedRows) {
    const rowSeats = rowMap.get(rowKey);
    // Sort seats by column index
    rowSeats.sort((a, b) => a.column - b.column);

    let currentWindow = [];

    for (let i = 0; i < rowSeats.length; i++) {
      const seat = rowSeats[i];
      const isAvailable = !unavailableSet.has(seat.seatNumber);

      if (isAvailable) {
        // Ensure column contiguity (e.g., column 2 must follow column 1)
        if (
          currentWindow.length > 0 &&
          seat.column !== currentWindow[currentWindow.length - 1].column + 1
        ) {
          currentWindow = [seat];
        } else {
          currentWindow.push(seat);
        }

        if (currentWindow.length === requiredCount) {
          return currentWindow.map((s) => s.seatNumber);
        }
      } else {
        // Reset window if current seat is unavailable
        currentWindow = [];
      }
    }
  }

  return [];
}

/**
 * -----------------------------------------------------------------------------
 * DSA REQUIREMENT 2: BEST SEAT RECOMMENDATION
 * -----------------------------------------------------------------------------
 * Problem:
 * Given number of seats required, seat layout, seat availability, seat types, and prices,
 * recommend the optimal group of seats according to hierarchical criteria:
 * 1. Prefer seats in the same row.
 * 2. Prefer consecutive (contiguous) seats.
 * 3. Prefer seats closest to the center of the row (and center row of the venue for optimal viewing angle).
 * 4. If multiple groups are equally suitable, prefer the lower-priced group (or matching requested tier).
 * 
 * Algorithm:
 * 1. Extract all valid candidate contiguous windows of size k across all rows.
 * 2. For each candidate window, calculate a multi-factor fitness score:
 *    - Center Proximity Score:
 *      Calculate average column distance from the center column:
 *      centerCol = (totalColumnsInRow + 1) / 2
 *      colDist = average(|seat.column - centerCol|)
 *    - Row Optimal Viewing Score:
 *      Row in middle of venue gives best screen angle:
 *      centerRowIndex = (totalRows - 1) / 2
 *      rowDist = |rowIndex - centerRowIndex|
 *    - Price Score:
 *      Average seat price (lower price favored unless specific tier requested).
 *    - Total Penalty = (colDist * 10) + (rowDist * 15) + (avgPrice * 0.05)
 *      (Lower penalty = better seat).
 * 3. If no contiguous window of size k is available in any row, find the best k
 *    available seats with minimal total penalty across adjacent rows.
 * 4. Select the candidate with the lowest penalty score.
 * 
 * Complexity Analysis:
 * - Time Complexity: O(R * C)
 *   Scanning each row takes O(C) for a window of size k. Across R rows, total time is O(R * C).
 *   Candidate evaluation takes O(W) where W <= R * C is the number of valid windows.
 *   Overall Time Complexity: O(R * C).
 * - Space Complexity: O(R * C)
 *   To store seat indexing and candidate list. Auxiliary space: O(k) for the recommended seats.
 */
function recommendBestSeats(allSeats, unavailableSeatNumbers, requiredCount, preferredType = null) {
  if (!requiredCount || requiredCount <= 0 || !Array.isArray(allSeats) || allSeats.length === 0) {
    return {
      recommendedSeats: [],
      reason: "Invalid input or empty seats layout"
    };
  }

  const unavailableSet = new Set(unavailableSeatNumbers || []);

  // Filter available seats
  const availableSeats = allSeats.filter((s) => !unavailableSet.has(s.seatNumber));

  if (availableSeats.length < requiredCount) {
    return {
      recommendedSeats: [],
      reason: "Not enough available seats in the venue"
    };
  }

  // Group seats by row
  const rowMap = new Map();
  for (const seat of allSeats) {
    if (!rowMap.has(seat.row)) {
      rowMap.set(seat.row, []);
    }
    rowMap.get(seat.row).push(seat);
  }

  const sortedRows = Array.from(rowMap.keys()).sort();
  const totalRows = sortedRows.length;
  const midRowIndex = (totalRows - 1) / 2;

  const candidateWindows = [];

  for (let rIdx = 0; rIdx < sortedRows.length; rIdx++) {
    const rowKey = sortedRows[rIdx];
    const rowSeats = rowMap.get(rowKey);
    rowSeats.sort((a, b) => a.column - b.column);

    const totalCols = rowSeats.length;
    const midCol = (totalCols + 1) / 2;

    // Sliding window of size requiredCount
    for (let i = 0; i <= rowSeats.length - requiredCount; i++) {
      const windowSeats = rowSeats.slice(i, i + requiredCount);

      // Check if all seats in this window are available and contiguous
      let isWindowValid = true;
      for (let j = 0; j < windowSeats.length; j++) {
        if (unavailableSet.has(windowSeats[j].seatNumber)) {
          isWindowValid = false;
          break;
        }
        if (j > 0 && windowSeats[j].column !== windowSeats[j - 1].column + 1) {
          isWindowValid = false;
          break;
        }
      }

      if (isWindowValid) {
        // Calculate penalty score
        const avgColDist =
          windowSeats.reduce((acc, s) => acc + Math.abs(s.column - midCol), 0) / requiredCount;
        const rowDist = Math.abs(rIdx - midRowIndex);
        const totalPrice = windowSeats.reduce((acc, s) => acc + (s.price || 150), 0);
        const avgPrice = totalPrice / requiredCount;

        // Tier matching bonus/penalty
        let tierPenalty = 0;
        if (preferredType) {
          const matchingTypes = windowSeats.filter((s) => s.type === preferredType).length;
          tierPenalty = (requiredCount - matchingTypes) * 50;
        }

        // Fitness score formula (lower is superior)
        const penalty = avgColDist * 10 + rowDist * 15 + avgPrice * 0.05 + tierPenalty;

        candidateWindows.push({
          seats: windowSeats.map((s) => s.seatNumber),
          row: rowKey,
          avgColDist,
          rowDist,
          totalPrice,
          penalty
        });
      }
    }
  }

  if (candidateWindows.length > 0) {
    // Sort by lowest penalty
    candidateWindows.sort((a, b) => a.penalty - b.penalty);
    const best = candidateWindows[0];
    return {
      recommendedSeats: best.seats,
      row: best.row,
      totalPrice: best.totalPrice,
      isContiguous: true,
      reason: `Best consecutive seats in Row ${best.row} closest to the center`
    };
  }

  // Fallback: If no single row has k contiguous seats, pick the k closest available seats to center
  const scoredAvailableSeats = availableSeats.map((seat) => {
    const rIdx = sortedRows.indexOf(seat.row);
    const rowSeats = rowMap.get(seat.row) || [];
    const midCol = (rowSeats.length + 1) / 2;
    const colDist = Math.abs(seat.column - midCol);
    const rowDist = Math.abs(rIdx - midRowIndex);
    const penalty = colDist * 10 + rowDist * 15 + (seat.price || 150) * 0.05;

    return {
      seatNumber: seat.seatNumber,
      penalty,
      price: seat.price || 150
    };
  });

  scoredAvailableSeats.sort((a, b) => a.penalty - b.penalty);
  const fallbackSeats = scoredAvailableSeats.slice(0, requiredCount);

  return {
    recommendedSeats: fallbackSeats.map((s) => s.seatNumber),
    isContiguous: false,
    totalPrice: fallbackSeats.reduce((sum, s) => sum + s.price, 0),
    reason: "No single row has consecutive seats available; recommended closest available seats to center"
  };
}

/**
 * -----------------------------------------------------------------------------
 * DSA REQUIREMENT 3: AVAILABILITY ANALYSIS
 * -----------------------------------------------------------------------------
 * Problem:
 * Given total seats, booked seat IDs, and locked seat IDs (active, unexpired),
 * calculate Total Seats, Booked Seats, Locked Seats, Available Seats, and Occupancy Percentage.
 * 
 * Algorithm:
 * 1. Use hash sets for O(1) membership lookup.
 * 2. Total Seats = N.
 * 3. Booked Count = size of booked seats set.
 * 4. Locked Count = size of active locked seats set (excluding already booked).
 * 5. Available Count = Total Seats - (Booked Count + Locked Count).
 * 6. Occupancy Percentage = ((Booked Count + Locked Count) / Total Seats) * 100, rounded to 2 decimal places.
 * 
 * Complexity Analysis:
 * - Time Complexity: O(N)
 *   Single pass over seats and lock collections.
 * - Space Complexity: O(B + L)
 *   Where B is number of booked seats and L is number of locked seats stored in hash sets.
 */
function analyzeSeatAvailability(totalSeatsList, bookedSeatNumbers = [], lockedSeatNumbers = []) {
  const total = Array.isArray(totalSeatsList) ? totalSeatsList.length : 0;
  const bookedSet = new Set(bookedSeatNumbers || []);
  const lockedSet = new Set(
    (lockedSeatNumbers || []).filter((s) => !bookedSet.has(s))
  );

  const booked = bookedSet.size;
  const locked = lockedSet.size;
  const occupied = booked + locked;
  const available = Math.max(0, total - occupied);

  const occupancyPercentage =
    total > 0 ? Number(((occupied / total) * 100).toFixed(2)) : 0;

  return {
    totalSeats: total,
    bookedSeats: booked,
    lockedSeats: locked,
    availableSeats: available,
    occupancyPercentage
  };
}

module.exports = {
  findConsecutiveSeats,
  recommendBestSeats,
  analyzeSeatAvailability
};
