const mongoose = require('mongoose');

// MongoDB connection URI
const dbURI = process.env.uri;  // or hardcode the connection string if needed

const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB
    // Note: useNewUrlParser and useUnifiedTopology are deprecated in MongoDB Driver v4.0.0+
    // They are removed here to eliminate deprecation warnings
    await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    });

    // Log connection success
    console.log('Successfully connected to MongoDB!');
    console.log(`State: ${mongoose.connection.readyState}`);  // State: 1 means connected

    // Optional: Log the state whenever the connection status changes
    mongoose.connection.on('connected', () => {
      console.log('Mongoose default connection is open');
    });
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose default connection is disconnected');
    });
  } catch (err) {
    // Log connection error
    console.error('Error connecting to MongoDB:', err);
    console.log(`State: ${mongoose.connection.readyState}`); // State: 0 means disconnected
  }
};

// Export the connection function
module.exports = connectDB;
