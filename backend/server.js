const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 8000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../src/assets/uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware to parse JSON bodies
app.use(express.json());

// CORS middleware - must be before session
app.use(cors({
  origin: true, // Allow any origin in development (change to specific URL in production)
  credentials: true // Allow cookies to be sent
}));

// Session middleware
app.use(session({
  secret: 'your-secret-key-change-in-production', // Change this in production
  resave: true, // Changed to true to save session on every request
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax' // Added for better cross-origin handling
  },
  rolling: true // Reset maxAge on every response
}));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}); 

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
    
    // Create session after registration
    req.session.sellerId = result.insertedId;
    req.session.sellerEmail = email;
    req.session.sellerName = name;
    
    res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      seller: {
        id: result.insertedId,
        name: name,
        email: email,
        phone: phone,
        address: address
      }
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
    
    // Create session
    req.session.sellerId = seller._id;
    req.session.sellerEmail = seller.email;
    req.session.sellerName = seller.name;
    
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

// Seller logout route
app.get('/seller_account/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

// Get seller profile for editing
app.get('/seller_account/edit_seller_profile', async (req, res) => {
  try {
    // Check if seller is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in to view profile'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
    // Fetch seller details
    const seller = await db.collection('sellers').findOne({ _id: sellerId });
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    // Return seller details without password
    res.json({
      success: true,
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        address: seller.address
      }
    });
  } catch (err) {
    console.error('Error fetching seller profile:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seller profile'
    });
  }
});

// Update seller profile
app.post('/seller_account/edit_seller_profile', async (req, res) => {
  try {
    const { name, email, phone, address, password } = req.body;
    
    // Check if seller is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in to update profile'
      });
    }
    
    // Validate required fields (password is optional)
    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, email, phone, address'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
    // Check if email is being changed and if it already exists for another seller
    if (email !== req.session.sellerEmail) {
      const existingSeller = await db.collection('sellers').findOne({ 
        email,
        _id: { $ne: sellerId }
      });
      
      if (existingSeller) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists for another seller'
        });
      }
    }
    
    // Prepare update data
    const updateData = {
      name,
      email,
      phone,
      address,
      updatedAt: new Date()
    };
    
    // If password is provided, hash and update it
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }
    
    // Update seller profile
    const result = await db.collection('sellers').updateOne(
      { _id: sellerId },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    // Update session with new email and name
    req.session.sellerEmail = email;
    req.session.sellerName = name;
    
    // Fetch updated seller
    const updatedSeller = await db.collection('sellers').findOne({ _id: sellerId });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      seller: {
        id: updatedSeller._id,
        name: updatedSeller.name,
        email: updatedSeller.email,
        phone: updatedSeller.phone,
        address: updatedSeller.address
      }
    });
  } catch (err) {
    console.error('Error updating seller profile:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update seller profile'
    });
  }
});

// User registration route
app.post('/user/register', async (req, res) => {
  try {
    const { name, address, password } = req.body;
    
    // Validate required fields
    if (!name || !address || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, address, password'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user document
    const user = {
      name,
      address,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(user);
    
    // Create session after registration
    req.session.userId = result.insertedId;
    req.session.userEmail = null; // No email in registration
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: result.insertedId,
        name: name,
        address: address
      }
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// User login route
app.post('/user/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    
    // Validate required fields
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name and password are required'
      });
    }
    
    // Find user by name
    const user = await db.collection('users').findOne({ name });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid name or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid name or password'
      });
    }
    
    // Create session
    req.session.userId = user._id;
    req.session.userEmail = null; // No email field
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        address: user.address
      }
    });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// Make shop route - add hotel to city
app.post('/make_shop', async (req, res) => {
  try {
    const { city_name, hotel_name } = req.body;
    
    // Validate required fields
    if (!city_name || !hotel_name) {
      return res.status(400).json({
        success: false,
        error: 'city_name and hotel_name are required'
      });
    }
    
    // Check if user is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in to create a shop'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    let sellerId;
    try {
      sellerId = new ObjectId(req.session.sellerId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session data'
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
      error: 'Failed to create shop',
      details: err.message
    });
  }
});

// Check if seller has a hotel
app.get('/check_seller_hotel', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
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
      category, 
      subcategory, 
      product_name, 
      product_img, 
      product_desc, 
      product_prize 
    } = req.body;
    
    // Check if user is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in to add a product'
      });
    }
    
    // Validate required fields
    if (!category || !subcategory || 
        !product_name || !product_img || !product_desc || !product_prize) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: category, subcategory, product_name, product_img, product_desc, product_prize'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
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
      total_ordered: 0, // Initialize order counter
      last_ordered: null, // Track last order date
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
app.get('/check_seller_products', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
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
app.get('/get_seller_products', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
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

// Get product details for editing
app.get('/product_edit/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;
    
    // Check if user is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    let productId;
    try {
      productId = new ObjectId(product_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product_id format'
      });
    }
    
    const sellerId = new ObjectId(req.session.sellerId);
    
    // Find product by id and verify it belongs to the logged-in seller
    const product = await db.collection('products').findOne({ 
      _id: productId,
      seller_id: sellerId 
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or you do not have permission to edit it'
      });
    }
    
    res.json({
      success: true,
      product: product
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// Update product
app.post('/product_edit/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;
    const { 
      category, 
      subcategory, 
      product_name, 
      product_img, 
      product_desc, 
      product_prize 
    } = req.body;
    
    // Check if user is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in'
      });
    }
    
    // Validate required fields
    if (!category || !subcategory || 
        !product_name || !product_img || !product_desc || !product_prize) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: category, subcategory, product_name, product_img, product_desc, product_prize'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    let productId;
    try {
      productId = new ObjectId(product_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product_id format'
      });
    }
    
    const sellerId = new ObjectId(req.session.sellerId);
    
    // Verify product belongs to the logged-in seller
    const existingProduct = await db.collection('products').findOne({ 
      _id: productId,
      seller_id: sellerId 
    });
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or you do not have permission to edit it'
      });
    }
    
    // Update product
    const updateData = {
      category,
      subcategory,
      product_name,
      product_img,
      product_desc,
      product_prize,
      updatedAt: new Date()
    };
    
    const result = await db.collection('products').updateOne(
      { _id: productId, seller_id: sellerId },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update product'
      });
    }
    
    // Fetch updated product
    const updatedProduct = await db.collection('products').findOne({ _id: productId });
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// Delete product
app.delete('/product_delete/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;
    
    // Check if user is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    let productId;
    try {
      productId = new ObjectId(product_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product_id format'
      });
    }
    
    const sellerId = new ObjectId(req.session.sellerId);
    
    // Verify product belongs to the logged-in seller before deleting
    const existingProduct = await db.collection('products').findOne({ 
      _id: productId,
      seller_id: sellerId 
    });
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or you do not have permission to delete it'
      });
    }
    
    // Delete product
    const result = await db.collection('products').deleteOne({ 
      _id: productId,
      seller_id: sellerId 
    });
    
    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to delete product'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      deletedProductId: product_id
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

// Create new order
app.post('/create_order', async (req, res) => {
  try {
    const { user_id, product_id, product_quantity, total_price, address, store_id } = req.body;
    
    // Validate required fields
    if (!user_id || !product_id || !product_quantity || !total_price || !address || !store_id) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: user_id, product_id, product_quantity, total_price, address, store_id'
      });
    }
    
    // Convert strings to ObjectId
    const { ObjectId } = require('mongodb');
    let userId, productId, storeId;
    try {
      userId = new ObjectId(user_id);
      productId = new ObjectId(product_id);
      storeId = new ObjectId(store_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user_id, product_id, or store_id format',
        details: err.message
      });
    }
    
    // Fetch product details
    const product = await db.collection('products').findOne({ _id: productId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Fetch store details - try by _id first, then by hotel_name and city_name from product
    let store = await db.collection('hotels').findOne({ _id: storeId });
    
    if (!store) {
      // If not found by _id, try finding by hotel_name and city_name from the product
      store = await db.collection('hotels').findOne({ 
        hotel_name: product.hotel_name,
        city_name: product.city_name
      });
    }
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
        debug: {
          store_id: store_id,
          product_hotel: product.hotel_name,
          product_city: product.city_name
        }
      });
    }
    
    // Create order document
    const order = {
      user_id: userId,
      product_id: productId,
      product_name: product.product_name,
      product_img: product.product_img,
      product_quantity: parseInt(product_quantity),
      total_price: total_price,
      delivery_address: address,
      store_id: store._id,
      seller_id: store.seller_id,
      hotel_name: store.hotel_name,
      city_name: store.city_name,
      order_status: 'pending', // pending, confirmed, preparing, out_for_delivery, delivered, cancelled
      createdAt: new Date()
    };
    
    const result = await db.collection('orders').insertOne(order);
    
    // Update product's total_ordered count
    await db.collection('products').updateOne(
      { _id: productId },
      { 
        $inc: { total_ordered: 1 },
        $set: { last_ordered: new Date() }
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: result.insertedId,
      order: order
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: err.message
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
      .find({ city_name, hotel_name })
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

// Upload images endpoint
app.post('/seller_account/upload_images', (req, res) => {
  // Use upload.any() to accept any field name
  upload.any()(req, res, async function (err) {
    try {
      // Check if seller is logged in
      if (!req.session.sellerId) {
        return res.status(401).json({
          success: false,
          error: 'You must be logged in to upload images'
        });
      }
      
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'Error uploading files'
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }
      
      // Limit to 5 files
      if (req.files.length > 5) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 5 images allowed'
        });
      }
      
      // Get uploaded filenames
      const uploadedFiles = req.files.map(file => file.filename);
      
      res.json({
        success: true,
        message: 'Images uploaded successfully',
        uploadedFiles: uploadedFiles
      });
    } catch (err) {
      console.error('Error uploading images:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to upload images',
        details: err.message
      });
    }
  });
});

// Update seller banners
app.post('/seller_account/update_banner', async (req, res) => {
  try {
    const { images_quantity, images_name } = req.body;
    
    // Check if seller is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in to update banners'
      });
    }
    
    // Validate required fields
    if (!images_quantity || !images_name || !Array.isArray(images_name)) {
      return res.status(400).json({
        success: false,
        error: 'images_quantity and images_name (array) are required'
      });
    }
    
    // Validate images_quantity matches array length
    if (parseInt(images_quantity) !== images_name.length) {
      return res.status(400).json({
        success: false,
        error: 'images_quantity must match the number of images in images_name array'
      });
    }
    
    // Validate max 5 images
    if (images_name.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 images allowed'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
    // Get seller's hotel information
    const hotel = await db.collection('hotels').findOne({ seller_id: sellerId });
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'No hotel found for this seller'
      });
    }
    
    // Update or create banner document
    const bannerData = {
      seller_id: sellerId,
      hotel_name: hotel.hotel_name,
      city_name: hotel.city_name,
      images_quantity: parseInt(images_quantity),
      images_name: images_name,
      updatedAt: new Date()
    };
    
    const result = await db.collection('seller_banners').updateOne(
      { seller_id: sellerId },
      { 
        $set: bannerData,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    
    res.json({
      success: true,
      message: 'Banners updated successfully',
      banner: bannerData
    });
  } catch (err) {
    console.error('Error updating banners:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update banners',
      details: err.message
    });
  }
});

// Get seller banners
app.get('/seller_account/get_banners', async (req, res) => {
  try {
    // Check if seller is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in to view banners'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
    // Fetch seller's banners
    const banners = await db.collection('seller_banners').findOne({ seller_id: sellerId });
    
    if (!banners) {
      return res.json({
        success: true,
        banners: null,
        message: 'No banners found'
      });
    }
    
    res.json({
      success: true,
      banners: banners
    });
  } catch (err) {
    console.error('Error fetching banners:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banners'
    });
  }
});

// Get seller dashboard statistics
app.get('/seller_account/stats', async (req, res) => {
  try {
    // Check if seller is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in to view stats'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
    // Get seller information
    const seller = await db.collection('sellers').findOne({ _id: sellerId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    // Get hotel information
    const hotel = await db.collection('hotels').findOne({ seller_id: sellerId });
    
    // Get all orders for this seller
    const orders = await db.collection('orders')
      .find({ seller_id: sellerId })
      .toArray();
    
    // Calculate total earnings
    let totalEarnings = 0;
    orders.forEach(order => {
      // Remove $ sign and convert to number
      const price = parseFloat(order.total_price.toString().replace('$', ''));
      if (!isNaN(price)) {
        totalEarnings += price;
      }
    });
    
    // Count orders by status
    const ordersByStatus = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      if (ordersByStatus.hasOwnProperty(order.order_status)) {
        ordersByStatus[order.order_status]++;
      }
    });
    
    // Get top 4 products by total_ordered
    const topProducts = await db.collection('products')
      .find({ seller_id: sellerId })
      .sort({ total_ordered: -1 })
      .limit(4)
      .toArray();
    
    // Get total number of products
    const totalProducts = await db.collection('products')
      .countDocuments({ seller_id: sellerId });
    
    // Calculate today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    }).length;
    
    // Calculate this week's orders
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekAgo;
    }).length;
    
    // Calculate this month's orders
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= monthAgo;
    }).length;
    
    // Calculate average order value
    const averageOrderValue = orders.length > 0 ? (totalEarnings / orders.length).toFixed(2) : 0;
    
    // Get recent orders (last 5)
    const recentOrders = await db.collection('orders')
      .find({ seller_id: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    res.json({
      success: true,
      stats: {
        seller_info: {
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          address: seller.address
        },
        hotel_info: hotel ? {
          hotel_name: hotel.hotel_name,
          city_name: hotel.city_name
        } : null,
        earnings: {
          total: `$${totalEarnings.toFixed(2)}`,
          average_order_value: `$${averageOrderValue}`
        },
        orders: {
          total: orders.length,
          today: todayOrders,
          this_week: weekOrders,
          this_month: monthOrders,
          by_status: ordersByStatus
        },
        products: {
          total: totalProducts,
          top_selling: topProducts.map(product => ({
            id: product._id,
            name: product.product_name,
            image: product.product_img,
            price: product.product_prize,
            times_ordered: product.total_ordered || 0,
            last_ordered: product.last_ordered,
            category: product.category,
            subcategory: product.subcategory
          }))
        },
        recent_orders: recentOrders.map(order => ({
          id: order._id,
          product_name: order.product_name,
          quantity: order.product_quantity,
          total_price: order.total_price,
          status: order.order_status,
          created_at: order.createdAt
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching seller stats:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seller stats',
      details: err.message
    });
  }
});

// Get banners by city and hotel name
app.post('/get_banners_by_location', async (req, res) => {
  try {
    const { city_name, hotel_name } = req.body;
    
    // Validate required fields
    if (!city_name || !hotel_name) {
      return res.status(400).json({
        success: false,
        error: 'city_name and hotel_name are required'
      });
    }
    
    // Fetch banners by city and hotel name
    const banners = await db.collection('seller_banners').findOne({ 
      city_name: city_name,
      hotel_name: hotel_name
    });
    
    if (!banners) {
      return res.json({
        success: true,
        images_name: [],
        images_quantity: 0,
        message: 'No banners found for this location'
      });
    }
    
    res.json({
      success: true,
      images_name: banners.images_name,
      images_quantity: banners.images_quantity
    });
  } catch (err) {
    console.error('Error fetching banners by location:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banners'
    });
  }
});

// Get all orders for the logged-in seller
app.get('/all_orders', async (req, res) => {
  try {
    // Check if seller is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in as a seller to view orders'
      });
    }
    
    // Convert string to ObjectId
    const { ObjectId } = require('mongodb');
    const sellerId = new ObjectId(req.session.sellerId);
    
    // Fetch all orders for this seller
    const orders = await db.collection('orders')
      .find({ seller_id: sellerId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .toArray();
    
    res.json({
      success: true,
      orders: orders,
      totalOrders: orders.length
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Update order status
app.post('/update_order_status', async (req, res) => {
  try {
    const { order_id, order_status } = req.body;
    
    // Check if seller is logged in
    if (!req.session.sellerId) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in as a seller to update order status'
      });
    }
    
    // Validate required fields
    if (!order_id || !order_status) {
      return res.status(400).json({
        success: false,
        error: 'order_id and order_status are required'
      });
    }
    
    // Validate order_status value
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid order_status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Convert strings to ObjectId
    const { ObjectId } = require('mongodb');
    let orderId, sellerId;
    try {
      orderId = new ObjectId(order_id);
      sellerId = new ObjectId(req.session.sellerId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order_id format'
      });
    }
    
    // Verify order belongs to the logged-in seller
    const existingOrder = await db.collection('orders').findOne({ 
      _id: orderId,
      seller_id: sellerId 
    });
    
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or you do not have permission to update it'
      });
    }
    
    // Update order status
    const result = await db.collection('orders').updateOne(
      { _id: orderId, seller_id: sellerId },
      { 
        $set: { 
          order_status: order_status,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update order status'
      });
    }
    
    // Fetch updated order
    const updatedOrder = await db.collection('orders').findOne({ _id: orderId });
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
