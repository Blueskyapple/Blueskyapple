import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTrips: 0,
    upcomingTrips: 0,
    totalBookings: 0,
    totalExpenses: 0
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tripsRes, bookingsRes, expensesRes] = await Promise.all([
        api.getTrips(),
        api.getBookings(),
        api.getExpenses()
      ]);

      const trips = tripsRes.data.data;
      const bookings = bookingsRes.data.data;
      const expenses = expensesRes.data.data;

      const now = new Date();
      const upcomingTrips = trips.filter(trip => new Date(trip.startDate) > now);

      setStats({
        totalTrips: trips.length,
        upcomingTrips: upcomingTrips.length,
        totalBookings: bookings.length,
        totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0)
      });

      setRecentTrips(trips.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="container dashboard">
      <h2>Welcome back, {user?.name}!</h2>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h4>Total Trips</h4>
          <p>{stats.totalTrips}</p>
        </div>
        <div className="stat-card">
          <h4>Upcoming Trips</h4>
          <p>{stats.upcomingTrips}</p>
        </div>
        <div className="stat-card">
          <h4>Total Bookings</h4>
          <p>{stats.totalBookings}</p>
        </div>
        <div className="stat-card">
          <h4>Total Expenses</h4>
          <p>${stats.totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="card">
        <h3>Recent Trips</h3>
        {recentTrips.length === 0 ? (
          <p>No trips yet. <Link to="/trips">Create your first trip!</Link></p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Destination</th>
                <th>Start Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip) => (
                <tr key={trip._id}>
                  <td>{trip.title}</td>
                  <td>{trip.destination}</td>
                  <td>{new Date(trip.startDate).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${trip.status}`}>{trip.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <div className="actions">
          <Link to="/trips" className="btn btn-primary">Manage Trips</Link>
          <Link to="/bookings" className="btn btn-success">View Bookings</Link>
          <Link to="/expenses" className="btn btn-secondary">Track Expenses</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
