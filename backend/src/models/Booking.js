const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  type: {
    type: String,
    enum: ['flight', 'hotel', 'car_rental'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  bookingReference: {
    type: String,
    trim: true
  },
  provider: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // Flight specific fields
  flightDetails: {
    airline: String,
    flightNumber: String,
    departureAirport: String,
    arrivalAirport: String,
    departureTime: Date,
    arrivalTime: Date,
    seatNumber: String
  },
  // Hotel specific fields
  hotelDetails: {
    hotelName: String,
    address: String,
    checkInDate: Date,
    checkOutDate: Date,
    roomType: String,
    numberOfGuests: Number
  },
  // Car rental specific fields
  carRentalDetails: {
    company: String,
    carModel: String,
    pickupLocation: String,
    dropoffLocation: String,
    pickupDate: Date,
    dropoffDate: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
