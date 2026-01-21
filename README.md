# Travel Management System

A full-stack web application for managing travel plans, bookings, and expenses. Built with React, Node.js, Express, and MongoDB.

## Features

### User Authentication
- Secure user registration and login
- JWT-based authentication
- Protected routes

### Trip Planning & Itinerary Management
- Create and manage trips
- Set destinations, dates, and budgets
- Track trip status (planning, confirmed, ongoing, completed, cancelled)
- Add detailed itineraries with daily activities

### Booking Management
- **Flight Bookings**: Track airline, flight numbers, airports, departure/arrival times
- **Hotel Bookings**: Manage hotel reservations, check-in/out dates, room details
- **Car Rental Bookings**: Keep track of rental companies, pickup/dropoff locations and dates
- Link bookings to specific trips
- Track booking status and references

### Expense Tracking
- Record expenses by category (accommodation, transportation, food, entertainment, shopping, other)
- Link expenses to specific trips
- Multiple payment methods support
- Expense statistics and analytics by category
- Currency tracking
- Add receipts and notes

### Dashboard
- Overview of all trips, bookings, and expenses
- Quick statistics
- Recent activity
- Quick access to all features

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Routing
- **Axios** - HTTP client
- **CSS3** - Styling

## Project Structure

```
travel-management-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── tripController.js
│   │   │   ├── bookingController.js
│   │   │   └── expenseController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Trip.js
│   │   │   ├── Booking.js
│   │   │   └── Expense.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── tripRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   └── expenseRoutes.js
│   │   ├── utils/
│   │   │   └── generateToken.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── PrivateRoute.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js
    │   │   ├── Trips.js
    │   │   ├── Bookings.js
    │   │   └── Expenses.js
    │   ├── services/
    │   │   └── api.js
    │   ├── styles/
    │   │   └── App.css
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/travel-management
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

5. Start the backend server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

### MongoDB Setup

#### Option 1: Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service
3. Use the connection string: `mongodb://localhost:27017/travel-management`

#### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env` with your Atlas connection string

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Trips
- `GET /api/trips` - Get all trips (protected)
- `GET /api/trips/:id` - Get single trip (protected)
- `POST /api/trips` - Create new trip (protected)
- `PUT /api/trips/:id` - Update trip (protected)
- `DELETE /api/trips/:id` - Delete trip (protected)

### Bookings
- `GET /api/bookings` - Get all bookings (protected)
- `GET /api/bookings/:id` - Get single booking (protected)
- `POST /api/bookings` - Create new booking (protected)
- `PUT /api/bookings/:id` - Update booking (protected)
- `DELETE /api/bookings/:id` - Delete booking (protected)

### Expenses
- `GET /api/expenses` - Get all expenses (protected)
- `GET /api/expenses/:id` - Get single expense (protected)
- `GET /api/expenses/stats` - Get expense statistics (protected)
- `POST /api/expenses` - Create new expense (protected)
- `PUT /api/expenses/:id` - Update expense (protected)
- `DELETE /api/expenses/:id` - Delete expense (protected)

## Usage

1. **Register/Login**: Create an account or login to access the application
2. **Create a Trip**: Go to the Trips page and create a new trip with destination, dates, and budget
3. **Add Bookings**: Navigate to Bookings to add flights, hotels, or car rentals for your trips
4. **Track Expenses**: Use the Expenses page to record and categorize your travel spending
5. **View Dashboard**: Monitor all your travel information in one place

## Features in Detail

### Trip Management
- Create trips with title, destination, dates, budget, and description
- Track trip status throughout the travel lifecycle
- Add detailed daily itineraries
- View all trips in a card-based layout

### Booking System
- Support for three booking types: flights, hotels, and car rentals
- Type-specific fields for each booking category
- Link bookings to trips for better organization
- Track booking references and provider information

### Expense Tracker
- Categorize expenses for better tracking
- View expense statistics by category
- Filter expenses by trip
- Support for multiple currencies and payment methods
- Calculate total expenses automatically

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes
- Input validation
- CORS enabled for frontend-backend communication

## Future Enhancements

- File upload for receipts and travel documents
- Email notifications for upcoming trips
- Integration with flight/hotel booking APIs
- Mobile responsive design improvements
- Export data to PDF/Excel
- Multi-currency conversion
- Travel recommendations based on history
- Social features to share trips with friends

## Author

@Blueskyapple

---

Made with love for travelers worldwide
