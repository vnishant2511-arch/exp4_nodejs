// server.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;  // Changed to port 8080

// Error handling for port already in use
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy. Trying port ${PORT + 1}`);
    server.listen(PORT + 1);
  } else {
    console.error('Server error:', err);
  }
});

app.use(cors());
app.use(express.json());

// In-memory data structure for seats
const seats = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  status: 'available', // available, locked, booked
  lockedBy: null,
  lockedAt: null,
  bookedBy: null
}));

// Lock expiration time (1 minute)
const LOCK_EXPIRATION_TIME = 60 * 1000; // 1 minute in milliseconds

// Middleware to clean expired locks
const cleanExpiredLocks = (req, res, next) => {
  const currentTime = Date.now();
  seats.forEach(seat => {
    if (seat.status === 'locked' && currentTime - seat.lockedAt > LOCK_EXPIRATION_TIME) {
      seat.status = 'available';
      seat.lockedBy = null;
      seat.lockedAt = null;
    }
  });
  next();
};

app.use(cleanExpiredLocks);

// GET /api/seats - Get all seats and their status
app.get('/api/seats', (req, res) => {
  res.json({
    success: true,
    data: seats
  });
});

// POST /api/seats/:id/lock - Lock a seat
app.post('/api/seats/:id/lock', (req, res) => {
  const seatId = parseInt(req.params.id);
  const userId = req.body.userId; // Should be provided in request body

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  const seat = seats.find(s => s.id === seatId);

  if (!seat) {
    return res.status(404).json({
      success: false,
      message: 'Seat not found'
    });
  }

  if (seat.status !== 'available') {
    return res.status(400).json({
      success: false,
      message: `Seat is ${seat.status}. Cannot lock at this time.`
    });
  }

  seat.status = 'locked';
  seat.lockedBy = userId;
  seat.lockedAt = Date.now();

  res.json({
    success: true,
    message: 'Seat locked successfully',
    data: seat
  });
});

// POST /api/seats/:id/confirm - Confirm booking for a locked seat
app.post('/api/seats/:id/confirm', (req, res) => {
  const seatId = parseInt(req.params.id);
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  const seat = seats.find(s => s.id === seatId);

  if (!seat) {
    return res.status(404).json({
      success: false,
      message: 'Seat not found'
    });
  }

  if (seat.status !== 'locked') {
    return res.status(400).json({
      success: false,
      message: 'Seat must be locked before confirming'
    });
  }

  if (seat.lockedBy !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Seat is locked by another user'
    });
  }

  // Check if lock has expired
  if (Date.now() - seat.lockedAt > LOCK_EXPIRATION_TIME) {
    seat.status = 'available';
    seat.lockedBy = null;
    seat.lockedAt = null;
    return res.status(400).json({
      success: false,
      message: 'Lock has expired. Please lock the seat again'
    });
  }

  seat.status = 'booked';
  seat.bookedBy = userId;
  seat.lockedBy = null;
  seat.lockedAt = null;

  res.json({
    success: true,
    message: 'Booking confirmed successfully',
    data: seat
  });
});

// POST /api/seats/:id/release - Release a locked seat
app.post('/api/seats/:id/release', (req, res) => {
  const seatId = parseInt(req.params.id);
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  const seat = seats.find(s => s.id === seatId);

  if (!seat) {
    return res.status(404).json({
      success: false,
      message: 'Seat not found'
    });
  }

  if (seat.status !== 'locked') {
    return res.status(400).json({
      success: false,
      message: 'Seat is not locked'
    });
  }

  if (seat.lockedBy !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Seat is locked by another user'
    });
  }

  seat.status = 'available';
  seat.lockedBy = null;
  seat.lockedAt = null;

  res.json({
    success: true,
    message: 'Seat released successfully',
    data: seat
  });
});

// GET /api/seats/available - Get all available seats
app.get('/api/seats/available', (req, res) => {
  const availableSeats = seats.filter(seat => seat.status === 'available');
  res.json({
    success: true,
    count: availableSeats.length,
    data: availableSeats
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(cors());
app.use(express.json());

// Helper: clear lock timer safely
function clearSeatTimer(seat) {
  if (seat && seat.timeoutId) {
    clearTimeout(seat.timeoutId);
    seat.timeoutId = undefined;
  }
}

// Helper: set auto-expiry for a locked seat
function armSeatExpiry(seatId) {
  const seat = seats[seatId];
  clearSeatTimer(seat);
  seat.timeoutId = setTimeout(() => {
    // If still locked and past expiry, release it
    const now = Date.now();
    if (seats[seatId].status === 'locked' && seats[seatId].lockExpiresAt && seats[seatId].lockExpiresAt <= now) {
      seats[seatId] = { status: 'available' };
    }
  }, LOCK_TTL + 50); // slight buffer to ensure time check
}

// GET /seats -> map of seatId -> status
app.get('/seats', (_req, res) => {
  // Return minimal public view
  const view = {};
  Object.entries(seats).forEach(([id, seat]) => {
    view[id] = { status: seat.status };
  });
  res.status(200).json(view);
});

// POST /lock/:id?user=U123 -> lock seat for user for 1 minute
app.post('/lock/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = String(req.query.user || 'anonymous');

  if (!seats[id]) {
    return res.status(404).json({ message: `Seat ${id} does not exist.` });
  }

  const seat = seats[id];
  const now = Date.now();

  // If locked but expired, release first
  if (seat.status === 'locked' && seat.lockExpiresAt && seat.lockExpiresAt <= now) {
    clearSeatTimer(seat);
    seats[id] = { status: 'available' };
  }

  if (seats[id].status === 'booked') {
    return res.status(409).json({ message: `Seat ${id} is already booked.` });
  }

  if (seats[id].status === 'locked') {
    return res.status(423).json({ message: `Seat ${id} is already locked. Try another seat.` });
  }

  // Acquire lock
  const lockExpiresAt = now + LOCK_TTL;
  seats[id] = { status: 'locked', lockedBy: user, lockExpiresAt };
  armSeatExpiry(id);

  return res.status(200).json({ message: `Seat ${id} locked successfully. Confirm within 1 minute.` });
});

// POST /confirm/:id?user=U123 -> confirm booking if locked by same user and not expired
app.post('/confirm/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = String(req.query.user || 'anonymous');

  if (!seats[id]) {
    return res.status(404).json({ message: `Seat ${id} does not exist.` });
  }

  const seat = seats[id];
  const now = Date.now();

  if (seat.status !== 'locked') {
    return res.status(400).json({ message: 'Seat is not locked and cannot be booked' });
  }

  if (seat.lockExpiresAt && seat.lockExpiresAt <= now) {
    clearSeatTimer(seat);
    seats[id] = { status: 'available' };
    return res.status(408).json({ message: 'Lock expired. Please lock the seat again.' });
  }

  if (seat.lockedBy !== user) {
    return res.status(403).json({ message: 'Seat locked by another user.' });
  }

  // Confirm booking
  clearSeatTimer(seat);
  seats[id] = { status: 'booked' };
  return res.status(200).json({ message: `Seat ${id} booked successfully!` });
});

// Optional: unlock an active lock (admin/debug)
// POST /unlock/:id
app.post('/unlock/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!seats[id]) {
    return res.status(404).json({ message: `Seat ${id} does not exist.` });
  }
  const seat = seats[id];
  if (seat.status === 'available') {
    return res.status(200).json({ message: `Seat ${id} already available.` });
  }
  if (seat.status === 'booked') {
    return res.status(409).json({ message: `Seat ${id} is booked; cannot unlock.` });
  }
  clearSeatTimer(seat);
  seats[id] = { status: 'available' };
  return res.status(200).json({ message: `Seat ${id} lock cleared.` });
});

// Server is already started at the top of the file