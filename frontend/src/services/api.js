import axios from 'axios';

const API_URL = '/api';

const api = {
  // Trips
  getTrips: () => axios.get(`${API_URL}/trips`),
  getTrip: (id) => axios.get(`${API_URL}/trips/${id}`),
  createTrip: (data) => axios.post(`${API_URL}/trips`, data),
  updateTrip: (id, data) => axios.put(`${API_URL}/trips/${id}`, data),
  deleteTrip: (id) => axios.delete(`${API_URL}/trips/${id}`),

  // Bookings
  getBookings: (params) => axios.get(`${API_URL}/bookings`, { params }),
  getBooking: (id) => axios.get(`${API_URL}/bookings/${id}`),
  createBooking: (data) => axios.post(`${API_URL}/bookings`, data),
  updateBooking: (id, data) => axios.put(`${API_URL}/bookings/${id}`, data),
  deleteBooking: (id) => axios.delete(`${API_URL}/bookings/${id}`),

  // Expenses
  getExpenses: (params) => axios.get(`${API_URL}/expenses`, { params }),
  getExpense: (id) => axios.get(`${API_URL}/expenses/${id}`),
  createExpense: (data) => axios.post(`${API_URL}/expenses`, data),
  updateExpense: (id, data) => axios.put(`${API_URL}/expenses/${id}`, data),
  deleteExpense: (id) => axios.delete(`${API_URL}/expenses/${id}`),
  getExpenseStats: (params) => axios.get(`${API_URL}/expenses/stats`, { params })
};

export default api;
