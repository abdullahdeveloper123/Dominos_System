const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
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

// Seller registration route
app.post('/seller_account/register', async (req, res) => {
  try {
    const { name, email, phone, address, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, email, phone, address, password'
      });
    }
    
    // Check if seller already exists
    const existingSeller = await db.collection('sellers').findOne({ email });
    if (existingSeller) {
      return res.status(409).json({
        success: false,
        error: 'Seller with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create seller document
    const seller = {
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    const result = await db.collection('sellers').insertOne(seller);
    
    res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      sellerId: result.insertedId
    });
  } catch (err) {
    console.error('Error registering seller:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to register seller'
    });
  }
});

// Seller login route
app.post('/seller_account/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Find seller by email
    const seller = await db.collection('sellers').findOne({ email });
    if (!seller) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, seller.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        address: seller.address
      }
    });
  } catch (err) {
    console.error('Error logging in seller:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// Make shop route - add hotel to city
app.post('/make_shop', async (req, res) => {
  try {
    const { city_name, hotel_name, seller_id } = req.body;
    
    // Validate required fields
    if (!city_name || !hotel_name || !seller_id) {
      return res.status(400).json({
        success: false,
        error: 'city_name, hotel_name, and seller_id are required'
      });
    }
    
    // Convert string to ObjectId if needed
    const { ObjectId } = require('mongodb');
    let sellerId;
    try {
      sellerId = new ObjectId(seller_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid seller_id format'
      });
    }
    
    // Get seller information
    const seller = await db.collection('sellers').findOne({ _id: sellerId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    // Check if city exists
    const existingCity = await db.collection('locations').findOne({ city_name });
    
    let newHotel;
    
    if (existingCity) {
      // City exists, check if hotel already exists in the array
      const hotelExists = existingCity.hotels && existingCity.hotels.some(
        hotel => hotel.hotel_name === hotel_name
      );
      
      if (hotelExists) {
        return res.status(409).json({
          success: false,
          error: 'Hotel already exists in this city'
        });
      }
      
      // Generate new hotel_id (get max hotel_id and increment)
      const maxHotelId = existingCity.hotels && existingCity.hotels.length > 0
        ? Math.max(...existingCity.hotels.map(h => h.hotel_id || 0))
        : 0;
      
      newHotel = {
        hotel_id: maxHotelId + 1,
        hotel_name
      };
      
      // Add hotel to existing city
      await db.collection('locations').updateOne(
        { city_name },
        { $push: { hotels: newHotel } }
      );
    } else {
      // City doesn't exist, create new document
      // Generate new city_id (get max city_id and increment)
      const allCities = await db.collection('locations').find({}).toArray();
      const maxCityId = allCities.length > 0
        ? Math.max(...allCities.map(c => c.city_id || 0))
        : 0;
      
      newHotel = {
        hotel_id: 1,
        hotel_name
      };
      
      const newLocation = {
        city_id: maxCityId + 1,
        city_name,
        hotels: [newHotel]
      };
      
      await db.collection('locations').insertOne(newLocation);
    }
    
    // Add hotel to hotels collection
    const hotelDocument = {
      hotel_name,
      city_name,
      seller_name: seller.name,
      seller_id: seller._id,
      createdAt: new Date()
    };
    
    const hotelResult = await db.collection('hotels').insertOne(hotelDocument);
    
    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      hotel: {
        ...newHotel,
        city_name,
        seller_name: seller.name
      },
      hotelDocumentId: hotelResult.insertedId
    });
  } catch (err) {
    console.error('Error creating shop:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create shop'
    });
  }
});

// Check if seller has a hotel
app.post('/check_seller_hotel', async (req, res) => {
  try {
    const { seller_id } = req.body;
    
    // Validate required field
    if (!seller_id) {
      return res.status(400).json({
        success: false,
        error: 'seller_id is required'
      });
    }
    
    // Convert string to ObjectId if needed
    const { ObjectId } = require('mongodb');
    let sellerId;
    try {
      sellerId = new ObjectId(seller_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid seller_id format'
      });
    }
    
    // Find hotel by seller_id
    const hotel = await db.collection('hotels').findOne({ seller_id: sellerId });
    
    if (!hotel) {
      return res.json({
        success: true,
        hasHotel: false
      });
    }
    
    res.json({
      success: true,
      hasHotel: true,
      hotel_name: hotel.hotel_name,
      city_name: hotel.city_name
    });
  } catch (err) {
    console.error('Error checking seller hotel:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to check seller hotel'
    });
  }
});

// Add product route
app.post('/add_product', async (req, res) => {
  try {
    const { 
      seller_id,
      category, 
      subcategory, 
      product_name, 
      product_img, 
      product_desc, 
      product_prize 
    } = req.body;
    
    // Validate required fields
    if (!seller_id || !category || !subcategory || 
        !product_name || !product_img || !product_desc || !product_prize) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: seller_id, category, subcategory, product_name, product_img, product_desc, product_prize'
      });
    }
    
    // Convert string to ObjectId if needed
    const { ObjectId } = require('mongodb');
    let sellerId;
    try {
      sellerId = new ObjectId(seller_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid seller_id format'
      });
    }
    
    // Fetch hotel information from hotels collection
    const hotel = await db.collection('hotels').findOne({ seller_id: sellerId });
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'No hotel found for this seller. Please create a shop first.'
      });
    }
    
    // Check if category document exists for this city and hotel
    const existingCategory = await db.collection('categories').findOne({
      city_name: hotel.city_name,
      hotel_name: hotel.hotel_name
    });
    
    if (existingCategory) {
      // Category document exists, check if category and subcategory exist
      const categoryExists = existingCategory.categories && existingCategory.categories[category];
      
      if (categoryExists) {
        // Category exists, check if subcategory exists
        if (!existingCategory.categories[category].includes(subcategory)) {
          // Add subcategory to existing category
          await db.collection('categories').updateOne(
            { city_name: hotel.city_name, hotel_name: hotel.hotel_name },
            { $push: { [`categories.${category}`]: subcategory } }
          );
        }
      } else {
        // Category doesn't exist, create new category with subcategory
        await db.collection('categories').updateOne(
          { city_name: hotel.city_name, hotel_name: hotel.hotel_name },
          { $set: { [`categories.${category}`]: [subcategory] } }
        );
      }
    } else {
      // Category document doesn't exist, create new one
      const newCategoryDoc = {
        city_name: hotel.city_name,
        hotel_name: hotel.hotel_name,
        categories: {
          [category]: [subcategory]
        }
      };
      
      await db.collection('categories').insertOne(newCategoryDoc);
    }
    
    // Create product document
    const product = {
      city_name: hotel.city_name,
      hotel_name: hotel.hotel_name,
      category,
      subcategory,
      product_name,
      product_img,
      product_desc,
      product_prize,
      seller_id: sellerId,
      createdAt: new Date()
    };
    
    const result = await db.collection('products').insertOne(product);
    
    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      productId: result.insertedId,
      product: product
    });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to add product'
    });
  }
});

// Check if seller has products
app.post('/check_seller_products', async (req, res) => {
  try {
    const { seller_id } = req.body;
    
    // Validate required field
    if (!seller_id) {
      return res.status(400).json({
        success: false,
        error: 'seller_id is required'
      });
    }
    
    // Convert string to ObjectId if needed
    const { ObjectId } = require('mongodb');
    let sellerId;
    try {
      sellerId = new ObjectId(seller_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid seller_id format'
      });
    }
    
    // Check if seller has any products
    const product = await db.collection('products').findOne({ seller_id: sellerId });
    
    if (!product) {
      return res.json({
        success: true,
        hasProducts: false
      });
    }
    
    res.json({
      success: true,
      hasProducts: true
    });
  } catch (err) {
    console.error('Error checking seller products:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to check seller products'
    });
  }
});

// Get seller products
app.post('/get_seller_products', async (req, res) => {
  try {
    const { seller_id } = req.body;
    
    // Validate required field
    if (!seller_id) {
      return res.status(400).json({
        success: false,
        error: 'seller_id is required'
      });
    }
    
    // Convert string to ObjectId if needed
    const { ObjectId } = require('mongodb');
    let sellerId;
    try {
      sellerId = new ObjectId(seller_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid seller_id format'
      });
    }
    
    // Fetch all products for this seller
    const products = await db.collection('products')
      .find({ seller_id: sellerId })
      .toArray();
    
    res.json({
      success: true,
      products: products
    });
  } catch (err) {
    console.error('Error fetching seller products:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seller products'
    });
  }
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

// Route to get deals carousel
app.get('/deals_carousel', async (req, res) => {
  try {
    const banners = await db.collection('banners')
      .findOne({ deals_carousel: { $exists: true } }, { projection: { deals_carousel: 1, _id: 0 } });
    
    res.json(banners?.deals_carousel || []);
  } catch (err) {
    console.error('Error fetching deals carousel:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deals carousel'
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
