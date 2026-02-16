const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const PORT = 8000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(cors()); 

// MongoDB connection URL
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'dominos_system';

let db;

// Connect to MongoDB
MongoClient.connect(MONGO_URL)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Route to get all city names and hotels from locations collection
app.get('/get_locations', async (req, res) => {
  try {
    const locations = await db.collection('locations')
      .find({}, { projection: { city_name: 1, hotels: 1, _id: 0 } })
      .toArray();
    
    res.json({
      success: true,
      locations: locations
    });
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations'
    });
  }
});

// Route to get home page banners
app.get('/home_banner', async (req, res) => {
  try {
    const banners = await db.collection('banners')
      .findOne({}, { projection: { home_banner: 1, _id: 0 } });
    
    res.json(banners?.home_banner || {});
  } catch (err) {
    console.error('Error fetching home banners:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch home banners'
    });
  }
});

// Route to get categories filtered by city and hotel
app.post('/get_categories', async (req, res) => {
  try {
    const { city_name, hotel_name } = req.body;
    
    if (!city_name || !hotel_name) {
      return res.status(400).json({
        success: false,
        error: 'city_name and hotel_name are required'
      });
    }
    
    const categories = await db.collection('categories')
      .find({ city_name, hotel_name }, { projection: { _id: 0 } })
      .toArray();
    
    res.json({
      success: true,
      categories: categories
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Route to get products filtered by city and hotel
app.post('/get_products', async (req, res) => {
  try {
    const { city_name, hotel_name } = req.body;
    
    if (!city_name || !hotel_name) {
      return res.status(400).json({
        success: false,
        error: 'city_name and hotel_name are required'
      });
    }
    
    const products = await db.collection('products')
      .find({ city_name, hotel_name }, { projection: { _id: 0 } })
      .toArray();
    
    res.json({
      success: true,
      products: products
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
