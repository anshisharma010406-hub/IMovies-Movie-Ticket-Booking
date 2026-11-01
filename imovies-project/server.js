
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ================= USER SCHEMA =================

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

// ================= MOVIE SCHEMA =================

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  genre: String,
  duration: String,
  language: String,
  description: String,
  poster: String,
  price: {
    type: Number,
    default: 150
  },
  showtimes: {
    type: [String],
    default: ["10:00 AM", "1:30 PM", "6:00 PM", "9:00 PM"]
  }
}, { timestamps: true });

// ================= BOOKING SCHEMA =================

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true
  },
  showDate: {
    type: String,
    required: true
  },
  showtime: {
    type: String,
    required: true
  },
  seats: {
    type: [String],
    required: true
  },
  total: Number,
  bookingCode: {
    type: String,
    unique: true
  }
}, { timestamps: true });

bookingSchema.index(
  { movie: 1, showDate: 1, showtime: 1, seats: 1 },
  { unique: true }
);

// ================= MODELS =================

const User = mongoose.model("User", userSchema);
const Movie = mongoose.model("Movie", movieSchema);
const Booking = mongoose.model("Booking", bookingSchema);

// ================= SESSION =================

app.use(session({
  secret: process.env.SESSION_SECRET || "development-secret-change-me",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/imovies"
  }),
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.notice = req.session.notice || null;
  delete req.session.notice;
  next();
});

// ================= MIDDLEWARE =================

function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.notice = "Please login to continue.";
    return res.redirect("/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (
    !req.session.user ||
    req.session.user.email !== (process.env.ADMIN_EMAIL || "admin@imovies.com")
  ) {
    return res.status(403).send("Admin access only.");
  }
  next();
}

// ================= HOME PAGE =================

app.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.render("home", { movies });
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to load movies.");
  }
});

// ================= CHECK MOVIES =================
// Temporary route for checking Render database.
// Remove this route after checking.

app.get("/check-movies", async (req, res) => {
  try {
    const movies = await Movie.find({}, { title: 1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= REGISTER =================

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      throw new Error("Enter all details. Password must be at least 6 characters.");
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash
    });

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    res.redirect("/");
  } catch (error) {
    res.render("register", {
      error: error.code === 11000
        ? "Email already registered."
        : error.message
    });
  }
});

// ================= LOGIN =================

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: (req.body.email || "").toLowerCase()
    });

    if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) {
      return res.render("login", {
        error: "Invalid email or password."
      });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    res.redirect("/");
  } catch (error) {
    res.status(500).send("Login failed.");
  }
});

// ================= LOGOUT =================

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ================= MOVIE DETAILS =================

app.get("/movie/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).send("Movie not found");
    }

    res.render("movie", { movie });
  } catch (error) {
    res.status(400).send("Invalid movie ID.");
  }
});

// ================= BOOKED SEATS =================

app.get("/api/booked-seats", async (req, res) => {
  try {
    const { movie, date, time } = req.query;

    if (!movie || !date || !time) {
      return res.json({ seats: [] });
    }

    const bookings = await Booking.find({
      movie,
      showDate: date,
      showtime: time
    }).select("seats");

    res.json({
      seats: bookings.flatMap(booking => booking.seats)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= BOOK TICKETS =================

app.post("/book/:id", requireLogin, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).send("Movie not found");
    }

    const { showDate, showtime } = req.body;
    const seats = [...new Set([].concat(req.body.seats || []))];

    if (!showDate || !showtime || !seats.length) {
      throw new Error("Select a date, showtime and at least one seat.");
    }

    if (!movie.showtimes.includes(showtime)) {
      throw new Error("Invalid showtime.");
    }

    const chosenDate = new Date(showDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(chosenDate.getTime()) || chosenDate < today) {
      throw new Error("Please choose today or a future date.");
    }

    if (seats.some(seat => !/^([A-F])([1-8])$/.test(seat))) {
      throw new Error("Invalid seat selection.");
    }

    const existing = await Booking.find({
      movie: movie._id,
      showDate,
      showtime,
      seats: { $in: seats }
    });

    if (existing.length) {
      throw new Error("One or more seats have just been booked. Please choose again.");
    }

    const code = "IM" + Date.now().toString().slice(-8);

    const booking = await Booking.create({
      user: req.session.user.id,
      movie: movie._id,
      showDate,
      showtime,
      seats,
      total: seats.length * movie.price,
      bookingCode: code
    });

    res.render("confirmation", { booking, movie });

  } catch (error) {
    const msg = error.code === 11000
      ? "Seat conflict: someone booked one of these seats. Please try different seats."
      : error.message;

    res.status(400).send(
      `${msg} <a href="javascript:history.back()">Go back</a>`
    );
  }
});

// ================= MY BOOKINGS =================

app.get("/my-bookings", requireLogin, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.session.user.id
    }).populate("movie").sort({ createdAt: -1 });

    res.render("bookings", { bookings });
  } catch (error) {
    res.status(500).send("Unable to load bookings.");
  }
});

// ================= ADMIN =================

app.get("/admin", requireAdmin, async (req, res) => {
  const movies = await Movie.find().sort({ title: 1 });
  res.render("admin", { movies });
});

app.post("/admin/movies", requireAdmin, async (req, res) => {
  const {
    title,
    genre,
    duration,
    language,
    description,
    poster,
    price,
    showtimes
  } = req.body;

  await Movie.create({
    title,
    genre,
    duration,
    language,
    description,
    poster,
    price: Number(price) || 150,
    showtimes: (showtimes || "")
      .split(",")
      .map(time => time.trim())
      .filter(Boolean)
  });

  res.redirect("/admin");
});

app.post("/admin/movies/:id/delete", requireAdmin, async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.redirect("/admin");
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong.");
});

// ================= START SERVER =================

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/imovies";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`IMovies running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
