import mongoose from 'mongoose';

const TheaterSchema = new mongoose.Schema({
  theaterId: { type: String, required: true },
  name: { type: String, required: true },
  imageUrl: { type: String }, // e.g., /Theaters_Image/TH1.png
  screenCount: { type: Number, default: 7 },
  location: {
    geo: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number] } // [lng, lat]
    },
    address: {
      street1: String,
      city: String,
      state: String,
      zipcode: String
    }
  },
  movieCount: { type: Number, default: 0 },
});

const Theater = mongoose.model('Theater', TheaterSchema);
export default Theater;
