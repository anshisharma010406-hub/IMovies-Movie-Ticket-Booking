# IMovies - Movie Ticket Booking System

## Requirements
- Node.js (LTS)
- MongoDB Community Server running locally, OR a MongoDB Atlas connection string
- VS Code (recommended)

## Step 1: Extract and open
Extract `imovies-project.zip`. Open the `imovies-project` folder in VS Code.

## Step 2: Install packages
Open VS Code terminal in this folder and run:
```bash
npm install
```

## Step 3: Configure MongoDB and environment
Copy `.env.example` and rename the copy to `.env`.
Keep the local MongoDB URI if MongoDB is installed locally:
`MONGO_URI=mongodb://127.0.0.1:27017/imovies`
For MongoDB Atlas, replace it with your Atlas connection string.
Change `SESSION_SECRET` to a long random value.
`ADMIN_EMAIL` is the email address that gets admin access.

## Step 4: Add sample movies
Make sure MongoDB is running, then run:
```bash
npm run seed
```

## Step 5: Start the project
```bash
npm run dev
```
Open http://localhost:3000

## Step 6: Test as a user
1. Click Sign Up and create an account.
2. Login.
3. Open a movie and choose a date and showtime.
4. Select seats (grey = booked, red = selected).
5. Confirm booking and view it in My Bookings.
6. Try booking the same seat for the same show again; it should be unavailable.

## Step 7: Open admin
1. In `.env`, set `ADMIN_EMAIL` to the email you want to use as admin.
2. Register an account using exactly that email.
3. Login and open http://localhost:3000/admin.
4. Add or delete movies.

## Main project structure
- `server.js` - Express server, MongoDB models, routes, login and booking logic
- `seed.js` - inserts sample movies
- `views/` - EJS pages
- `public/css/style.css` - website styling
- `public/js/seats.js` - seat selection and availability refresh

## Important notes for project submission
- This is a learning/demo project. Payment is simulated; it does not collect card/UPI details or process real payments.
- The seat availability endpoint refreshes when date or showtime changes. The database has a unique seat index as an additional duplicate-booking safeguard. For production systems, use a transaction/atomic reservation flow and handle duplicate-key errors.
- For production, add CSRF protection, rate limiting, stronger validation, secure cookie settings behind HTTPS, email verification and a real payment gateway.
- The built-in Express session store is MongoDB-backed using connect-mongo.
