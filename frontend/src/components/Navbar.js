import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="navbar">
      <h1>Travel Manager</h1>
      {user ? (
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/trips">Trips</Link>
          <Link to="/bookings">Bookings</Link>
          <Link to="/expenses">Expenses</Link>
          <button onClick={logout}>Logout</button>
        </nav>
      ) : (
        <nav>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      )}
    </div>
  );
};

export default Navbar;
