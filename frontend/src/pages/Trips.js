import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'planning',
    budget: 0
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await api.getTrips();
      setTrips(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrip) {
        await api.updateTrip(editingTrip._id, formData);
      } else {
        await api.createTrip(formData);
      }
      setShowModal(false);
      setEditingTrip(null);
      resetForm();
      fetchTrips();
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setFormData({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate.split('T')[0],
      endDate: trip.endDate.split('T')[0],
      description: trip.description || '',
      status: trip.status,
      budget: trip.budget || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await api.deleteTrip(id);
        fetchTrips();
      } catch (error) {
        console.error('Error deleting trip:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      description: '',
      status: 'planning',
      budget: 0
    });
  };

  const openModal = () => {
    resetForm();
    setEditingTrip(null);
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading trips...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Trips</h2>
        <button className="btn btn-primary" onClick={openModal}>Create New Trip</button>
      </div>

      {trips.length === 0 ? (
        <div className="card">
          <p>No trips yet. Create your first trip to get started!</p>
        </div>
      ) : (
        <div className="grid">
          {trips.map((trip) => (
            <div key={trip._id} className="card">
              <h3>{trip.title}</h3>
              <p><strong>Destination:</strong> {trip.destination}</p>
              <p><strong>Dates:</strong> {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
              <p><strong>Budget:</strong> ${trip.budget}</p>
              <p><strong>Status:</strong> <span className={`badge badge-${trip.status}`}>{trip.status}</span></p>
              {trip.description && <p>{trip.description}</p>}
              <div className="actions" style={{ marginTop: '1rem' }}>
                <button className="btn btn-small btn-primary" onClick={() => handleEdit(trip)}>Edit</button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(trip._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTrip ? 'Edit Trip' : 'Create New Trip'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Destination</label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Budget</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="planning">Planning</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn btn-primary">
                  {editingTrip ? 'Update Trip' : 'Create Trip'}
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

export default Trips;
