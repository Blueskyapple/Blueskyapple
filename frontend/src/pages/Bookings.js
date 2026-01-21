import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    trip: '',
    type: 'flight',
    status: 'pending',
    bookingReference: '',
    provider: '',
    cost: 0,
    currency: 'USD',
    flightDetails: {},
    hotelDetails: {},
    carRentalDetails: {},
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, tripsRes] = await Promise.all([
        api.getBookings(),
        api.getTrips()
      ]);
      setBookings(bookingsRes.data.data);
      setTrips(tripsRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };

      if (formData.type !== 'flight') delete submitData.flightDetails;
      if (formData.type !== 'hotel') delete submitData.hotelDetails;
      if (formData.type !== 'car_rental') delete submitData.carRentalDetails;

      if (editingBooking) {
        await api.updateBooking(editingBooking._id, submitData);
      } else {
        await api.createBooking(submitData);
      }
      setShowModal(false);
      setEditingBooking(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      trip: booking.trip?._id || '',
      type: booking.type,
      status: booking.status,
      bookingReference: booking.bookingReference || '',
      provider: booking.provider || '',
      cost: booking.cost,
      currency: booking.currency,
      flightDetails: booking.flightDetails || {},
      hotelDetails: booking.hotelDetails || {},
      carRentalDetails: booking.carRentalDetails || {},
      notes: booking.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.deleteBooking(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      trip: '',
      type: 'flight',
      status: 'pending',
      bookingReference: '',
      provider: '',
      cost: 0,
      currency: 'USD',
      flightDetails: {},
      hotelDetails: {},
      carRentalDetails: {},
      notes: ''
    });
  };

  const openModal = () => {
    resetForm();
    setEditingBooking(null);
    setShowModal(true);
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'flight':
        return (
          <>
            <div className="form-group">
              <label>Airline</label>
              <input
                type="text"
                value={formData.flightDetails.airline || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  flightDetails: { ...formData.flightDetails, airline: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>Flight Number</label>
              <input
                type="text"
                value={formData.flightDetails.flightNumber || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  flightDetails: { ...formData.flightDetails, flightNumber: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>Departure Airport</label>
              <input
                type="text"
                value={formData.flightDetails.departureAirport || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  flightDetails: { ...formData.flightDetails, departureAirport: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>Arrival Airport</label>
              <input
                type="text"
                value={formData.flightDetails.arrivalAirport || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  flightDetails: { ...formData.flightDetails, arrivalAirport: e.target.value }
                })}
              />
            </div>
          </>
        );
      case 'hotel':
        return (
          <>
            <div className="form-group">
              <label>Hotel Name</label>
              <input
                type="text"
                value={formData.hotelDetails.hotelName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  hotelDetails: { ...formData.hotelDetails, hotelName: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.hotelDetails.address || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  hotelDetails: { ...formData.hotelDetails, address: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>Check-in Date</label>
              <input
                type="date"
                value={formData.hotelDetails.checkInDate ? formData.hotelDetails.checkInDate.split('T')[0] : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  hotelDetails: { ...formData.hotelDetails, checkInDate: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>Check-out Date</label>
              <input
                type="date"
                value={formData.hotelDetails.checkOutDate ? formData.hotelDetails.checkOutDate.split('T')[0] : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  hotelDetails: { ...formData.hotelDetails, checkOutDate: e.target.value }
                })}
              />
            </div>
          </>
        );
      case 'car_rental':
        return (
          <>
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                value={formData.carRentalDetails.company || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  carRentalDetails: { ...formData.carRentalDetails, company: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>Car Model</label>
              <input
                type="text"
                value={formData.carRentalDetails.carModel || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  carRentalDetails: { ...formData.carRentalDetails, carModel: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>Pickup Location</label>
              <input
                type="text"
                value={formData.carRentalDetails.pickupLocation || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  carRentalDetails: { ...formData.carRentalDetails, pickupLocation: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label>Pickup Date</label>
              <input
                type="date"
                value={formData.carRentalDetails.pickupDate ? formData.carRentalDetails.pickupDate.split('T')[0] : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  carRentalDetails: { ...formData.carRentalDetails, pickupDate: e.target.value }
                })}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Bookings</h2>
        <button className="btn btn-primary" onClick={openModal}>Create New Booking</button>
      </div>

      {bookings.length === 0 ? (
        <div className="card">
          <p>No bookings yet. Create your first booking to get started!</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Provider</th>
              <th>Trip</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td>{booking.type.replace('_', ' ')}</td>
                <td>{booking.provider}</td>
                <td>{booking.trip?.title || 'N/A'}</td>
                <td>{booking.currency} {booking.cost}</td>
                <td><span className={`badge badge-${booking.status}`}>{booking.status}</span></td>
                <td>
                  <div className="actions">
                    <button className="btn btn-small btn-primary" onClick={() => handleEdit(booking)}>Edit</button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(booking._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBooking ? 'Edit Booking' : 'Create New Booking'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Trip (Optional)</label>
                <select
                  value={formData.trip}
                  onChange={(e) => setFormData({ ...formData, trip: e.target.value })}
                >
                  <option value="">Select a trip</option>
                  {trips.map((trip) => (
                    <option key={trip._id} value={trip._id}>{trip.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Booking Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="flight">Flight</option>
                  <option value="hotel">Hotel</option>
                  <option value="car_rental">Car Rental</option>
                </select>
              </div>
              <div className="form-group">
                <label>Provider</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Booking Reference</label>
                <input
                  type="text"
                  value={formData.bookingReference}
                  onChange={(e) => setFormData({ ...formData, bookingReference: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Cost</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {renderTypeSpecificFields()}

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-primary">
                  {editingBooking ? 'Update Booking' : 'Create Booking'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
