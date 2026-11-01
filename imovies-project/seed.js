require("dotenv").config();
const mongoose = require("mongoose");
const Movie = mongoose.model("Movie", new mongoose.Schema({
  title: String, genre: String, duration: String, language: String, description: String,
  poster: String, price: Number, showtimes: [String]
}));
const movies = [
 { title:"Interstellar", genre:"Sci-Fi", duration:"2h 49m", language:"English", price:180,
   description:"A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.",
   poster:"https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", showtimes:["10:00 AM","1:30 PM","6:00 PM","9:00 PM"] },
 { title:"The Dark Knight", genre:"Action", duration:"2h 32m", language:"English", price:160,
   description:"Batman faces a dangerous criminal mastermind who pushes Gotham into chaos.",
   poster:"https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", showtimes:["11:00 AM","2:00 PM","6:30 PM","9:30 PM"] },
 { title:"Inception", genre:"Sci-Fi / Thriller", duration:"2h 28m", language:"English", price:170,
   description:"A skilled thief enters people's dreams to steal secrets and attempts an almost impossible mission.",
   poster:"https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", showtimes:["10:30 AM","1:45 PM","5:30 PM","8:45 PM"] },
 { title:"Dangal", genre:"Drama / Sports", duration:"2h 41m", language:"Hindi", price:140,
   description:"A former wrestler trains his daughters to become world-class wrestlers.",
   poster:"https://image.tmdb.org/t/p/w500/cJRPOLETTi7v0X3L2l0s7k3r4s6.jpg", showtimes:["10:00 AM","1:00 PM","5:00 PM","8:00 PM"] }
];
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/imovies")
 .then(async()=>{ await Movie.deleteMany({}); await Movie.insertMany(movies); console.log("Sample movies added."); await mongoose.disconnect(); })
 .catch(e=>{console.error(e);process.exit(1);});
