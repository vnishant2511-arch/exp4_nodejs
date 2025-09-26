const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for playing cards
let cards = [
  { id: 1, suit: 'Hearts', value: 'A' },
  { id: 2, suit: 'Diamonds', value: 'K' },
  { id: 3, suit: 'Clubs', value: 'Q' },
  { id: 4, suit: 'Spades', value: 'J' },
  { id: 5, suit: 'Hearts', value: '10' }
];

let nextId = 6;

// Helper function to validate card data
const validateCard = (suit, value) => {
  const validSuits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const validValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  if (!validSuits.includes(suit)) {
    return { isValid: false, message: 'Invalid suit. Must be Hearts, Diamonds, Clubs, or Spades' };
  }
  
  if (!validValues.includes(value)) {
    return { isValid: false, message: 'Invalid value. Must be A, 2-10, J, Q, or K' };
  }
  
  return { isValid: true };
};

// Routes

// GET /api/cards - Get all cards
app.get('/api/cards', (req, res) => {
  res.json({
    success: true,
    count: cards.length,
    data: cards
  });
});

// GET /api/cards/:id - Get a specific card by ID
app.get('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  
  if (isNaN(cardId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid card ID. Must be a number.'
    });
  }
  
  const card = cards.find(c => c.id === cardId);
  
  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  res.json({
    success: true,
    data: card
  });
});

// POST /api/cards - Add a new card
app.post('/api/cards', (req, res) => {
  const { suit, value } = req.body;
  
  // Validate required fields
  if (!suit || !value) {
    return res.status(400).json({
      success: false,
      message: 'Both suit and value are required'
    });
  }
  
  // Validate card data
  const validation = validateCard(suit, value);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }
  
  // Check if card already exists
  const existingCard = cards.find(c => c.suit === suit && c.value === value);
  if (existingCard) {
    return res.status(409).json({
      success: false,
      message: 'Card with this suit and value already exists'
    });
  }
  
  // Create new card
  const newCard = {
    id: nextId++,
    suit: suit,
    value: value
  };
  
  cards.push(newCard);
  
  res.status(201).json({
    success: true,
    message: 'Card created successfully',
    data: newCard
  });
});

// PUT /api/cards/:id - Update a specific card
app.put('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  const { suit, value } = req.body;
  
  if (isNaN(cardId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid card ID. Must be a number.'
    });
  }
  
  const cardIndex = cards.findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  // Validate required fields
  if (!suit || !value) {
    return res.status(400).json({
      success: false,
      message: 'Both suit and value are required'
    });
  }
  
  // Validate card data
  const validation = validateCard(suit, value);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }
  
  // Check if another card with same suit and value exists
  const existingCard = cards.find(c => c.suit === suit && c.value === value && c.id !== cardId);
  if (existingCard) {
    return res.status(409).json({
      success: false,
      message: 'Another card with this suit and value already exists'
    });
  }
  
  // Update card
  cards[cardIndex] = {
    ...cards[cardIndex],
    suit: suit,
    value: value
  };
  
  res.json({
    success: true,
    message: 'Card updated successfully',
    data: cards[cardIndex]
  });
});

// DELETE /api/cards/:id - Delete a specific card
app.delete('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  
  if (isNaN(cardId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid card ID. Must be a number.'
    });
  }
  
  const cardIndex = cards.findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  const deletedCard = cards[cardIndex];
  cards.splice(cardIndex, 1);
  
  res.json({
    success: true,
    message: 'Card deleted successfully',
    data: deletedCard
  });
});

// GET /api/cards/suit/:suit - Get all cards by suit
app.get('/api/cards/suit/:suit', (req, res) => {
  const suit = req.params.suit;
  const validSuits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  
  if (!validSuits.includes(suit)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid suit. Must be Hearts, Diamonds, Clubs, or Spades'
    });
  }
  
  const suitCards = cards.filter(c => c.suit === suit);
  
  res.json({
    success: true,
    count: suitCards.length,
    suit: suit,
    data: suitCards
  });
});

// GET /api/cards/value/:value - Get all cards by value
app.get('/api/cards/value/:value', (req, res) => {
  const value = req.params.value;
  const validValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  if (!validValues.includes(value)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid value. Must be A, 2-10, J, Q, or K'
    });
  }
  
  const valueCards = cards.filter(c => c.value === value);
  
  res.json({
    success: true,
    count: valueCards.length,
    value: value,
    data: valueCards
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});