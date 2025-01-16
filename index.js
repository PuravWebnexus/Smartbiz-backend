require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Sequelize
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log, 
    dialectOptions: dbConfig.dialectOptions || {},
  }
);

sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Error connecting to the database:', err));

// Import and initialize the User model
const user = require('./models/user');
const User = user(sequelize, Sequelize.DataTypes);

// Sync the model with the database
sequelize.sync()
  .then(() => {
    console.log('Database synced');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

// Multer configuration for file uploads
// const storage = multer.memoryStorage();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// API to check if a phone number exists
app.post('/check-phone-number', async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const user = await User.findOne({ where: { phoneNumber } });

    if (user) {
      res.status(200).json({ success: true, exists: true, user });
    } else {
      res.status(200).json({ success: true, exists: false });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API to create or update user profile
app.post('/create-profile', upload.single('image'), async (req, res) => {
  const { phoneNumber, name, age, organizationName, organizationDescription } = req.body;
  const imagePath = req.file ? req.file.path : null;

  console.log('Request Body:', req.body);
  console.log('Image Path:', imagePath);

  try {
    // Upsert user with image path
    const [createdUser, created] = await User.upsert(
      { phoneNumber, name, age, organizationName, organizationDescription, imagePath },
      { returning: true }
    );

    res.status(200).json({ success: true, user: createdUser });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));