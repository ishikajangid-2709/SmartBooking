/**
 * Automated Verification Script for Test Cases 1 - 10
 * Fully idempotent test suite: Dynamically queries seat layout
 */
const BASE_URL = "http://127.0.0.1:5000/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("=================================================");
  console.log("🚀 STARTING AUTOMATED VERIFICATION OF TEST CASES");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function report(testName, isSuccess, details = "") {
    if (isSuccess) {
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   └─ ${details}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST CASE 1: Duplicate Registration (Requirement 44: Test Case 1 -> 409)
    // -------------------------------------------------------------------------
    const email = `test_dup_${Date.now()}@example.com`;
    await request("/auth/register", {
      method: "POST",
      body: { name: "Test User", email, password: "Password123!" },
    });

    // Try duplicate
    const dupRes = await request("/auth/register", {
      method: "POST",
      body: { name: "Test User Duplicate", email, password: "Password123!" },
    });
    report(
      "Test Case 1 — Duplicate Registration",
      dupRes.status === 409,
      `Received HTTP ${dupRes.status}: "${dupRes.data?.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST CASE 2: Invalid Login (Requirement 44: Test Case 2 -> 401)
    // -------------------------------------------------------------------------
    const invalidLoginRes = await request("/auth/login", {
      method: "POST",
      body: { email: "user@example.com", password: "WrongPassword999" },
    });
    report(
      "Test Case 2 — Invalid Login",
      invalidLoginRes.status === 401,
      `Received HTTP ${invalidLoginRes.status}: "${invalidLoginRes.data?.message}"`
    );

    // Login user and admin for subsequent tests
    const userLoginRes = await request("/auth/login", {
      method: "POST",
      body: { email: "user@example.com", password: "User@123" },
    });
    const userToken = userLoginRes.data.token;

    const user2LoginRes = await request("/auth/login", {
      method: "POST",
      body: { email: "jane@example.com", password: "User@123" },
    });
    const user2Token = user2LoginRes.data.token;

    // -------------------------------------------------------------------------
    // TEST CASE 3: Unauthorized Admin Access (Requirement 44: Test Case 3 -> 403)
    // -------------------------------------------------------------------------
    const adminAccessRes = await request("/admin/dashboard", {
      method: "GET",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    report(
      "Test Case 3 — Unauthorized Admin Access",
      adminAccessRes.status === 403,
      `Received HTTP ${adminAccessRes.status}: "${adminAccessRes.data?.message}"`
    );

    // Get an active show
    const showsRes = await request("/shows", { method: "GET" });
    const testShow = showsRes.data.shows[0];
    const showId = testShow._id;

    // Dynamically retrieve available seats for testing
    const layoutRes = await request(`/shows/${showId}/seats`);
    const availableSeatsList = (layoutRes.data.seats || [])
      .filter((s) => s.status === "AVAILABLE")
      .map((s) => s.seatNumber);

    if (availableSeatsList.length < 4) {
      throw new Error("Not enough available seats in test show to run tests.");
    }

    const [seatConflict, seatToBook, seatPriceTest] = availableSeatsList;

    // -------------------------------------------------------------------------
    // TEST CASE 4: Seat Conflict (Requirement 44: Test Case 4 -> 409)
    // -------------------------------------------------------------------------
    // User A locks seatConflict
    await request("/seats/lock", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: { showId, seatIds: [seatConflict] },
    });

    // User B attempts to lock same seatConflict
    const conflictRes = await request("/seats/lock", {
      method: "POST",
      headers: { Authorization: `Bearer ${user2Token}` },
      body: { showId, seatIds: [seatConflict] },
    });
    report(
      "Test Case 4 — Seat Conflict Prevention",
      conflictRes.status === 409,
      `User B rejected with HTTP ${conflictRes.status}: "${conflictRes.data?.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST CASE 5: Lock State Verification
    // -------------------------------------------------------------------------
    const seatStatusRes = await request(`/shows/${showId}/seats`, {
      method: "GET",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const lockedSeatFound = seatStatusRes.data.seats.find(
      (s) => s.seatNumber === seatConflict
    );
    report(
      "Test Case 5 — Temporary Seat Lock State & Verification",
      lockedSeatFound?.status === "LOCKED",
      `Seat ${seatConflict} is currently reported with status: ${lockedSeatFound?.status}`
    );

    // Unlock seatConflict
    await request("/seats/unlock", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: { showId, seatIds: [seatConflict] },
    });

    // -------------------------------------------------------------------------
    // TEST CASE 6: Booking (LOCKED -> BOOKED) (Requirement 44: Test Case 6)
    // -------------------------------------------------------------------------
    // User locks seatToBook
    await request("/seats/lock", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: { showId, seatIds: [seatToBook] },
    });

    // Book seat
    const bookingRes = await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: { showId, seats: [seatToBook] },
    });

    const bookingId = bookingRes.data.booking?._id;
    const humanBookingId = bookingRes.data.booking?.bookingId;

    // Verify seat is BOOKED
    const seatsAfterBooking = await request(`/shows/${showId}/seats`, {
      method: "GET",
    });
    const seatBooked = seatsAfterBooking.data.seats.find(
      (s) => s.seatNumber === seatToBook
    );
    report(
      "Test Case 6 — Booking (LOCKED -> BOOKED)",
      seatBooked?.status === "BOOKED",
      `Seat ${seatToBook} successfully transitioned to BOOKED with Booking ID: ${humanBookingId}`
    );

    // -------------------------------------------------------------------------
    // TEST CASE 7: Invalid Booking (Attempt to book without lock -> rejected)
    // -------------------------------------------------------------------------
    const invalidBookingRes = await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${user2Token}` },
      body: { showId, seats: ["Z99"] }, // Not locked
    });
    report(
      "Test Case 7 — Invalid Booking Without Valid Lock",
      invalidBookingRes.status === 400,
      `Rejected with HTTP ${invalidBookingRes.status}: "${invalidBookingRes.data?.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST CASE 8: Price Manipulation Protection (Server calculates amount)
    // -------------------------------------------------------------------------
    await request("/seats/lock", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: { showId, seatIds: [seatPriceTest] },
    });

    const priceManipRes = await request("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: { showId, seats: [seatPriceTest], totalAmount: 1, subtotal: 1 },
    });

    const chargedAmount = priceManipRes.data.booking?.totalAmount;
    report(
      "Test Case 8 — Price Manipulation Protection",
      chargedAmount > 100,
      `Backend calculated authentic total ₹${chargedAmount} and ignored client manipulation ₹1`
    );

    // Cancel this test booking to keep database clean
    if (priceManipRes.data.booking?._id) {
      await request(`/bookings/${priceManipRes.data.booking._id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${userToken}` },
      });
    }

    // -------------------------------------------------------------------------
    // TEST CASE 9: Booking Ownership Protection (User 2 accesses User 1's booking -> 403)
    // -------------------------------------------------------------------------
    const ownershipRes = await request(`/bookings/${bookingId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    report(
      "Test Case 9 — Booking Ownership Protection",
      ownershipRes.status === 403,
      `User 2 blocked with HTTP ${ownershipRes.status}: "${ownershipRes.data?.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST CASE 10: Cancellation (>24 hours before show -> 100% refund)
    // -------------------------------------------------------------------------
    const cancelRes = await request(`/bookings/${bookingId}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${userToken}` },
    });

    const is100Refund =
      cancelRes.data.refundPercentage === 100 && cancelRes.data.refundAmount > 0;
    report(
      "Test Case 10 — Cancellation Refund (>24h = 100%)",
      is100Refund,
      `Refund granted: ${cancelRes.data.refundPercentage}% (₹${cancelRes.data.refundAmount})`
    );

    // -------------------------------------------------------------------------
    // DSA Seat Recommendation Verification
    // -------------------------------------------------------------------------
    const dsaRes = await request("/seats/recommend", {
      method: "POST",
      body: { showId, count: 3, strategy: "best" },
    });
    const dsaSeats = dsaRes.data.recommendation?.seats;
    report(
      "DSA Best Seat Recommendation Algorithm",
      dsaSeats?.length === 3,
      `Recommended seats: [${dsaSeats?.join(", ")}] — ${dsaRes.data.recommendation?.reason}`
    );

    console.log("\n=================================================");
    console.log(`🎯 TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");
  } catch (err) {
    console.error("Test execution fatal error:", err);
  }
}

runTests();
