const mongoose = require('mongoose');
const dns = require('dns');

// Some networks/routers push a filtering DNS resolver (e.g. whalebone) that
// times out Atlas' SRV lookups → `querySrv ESERVFAIL` → Mongo never connects.
// Force a reliable resolver for THIS process only (no system change needed).
// Override or disable via env `mongoDnsServers` (comma-separated, or "off").
const dnsServers = (process.env.mongoDnsServers || '8.8.8.8,8.8.4.4').trim();
if (dnsServers && dnsServers.toLowerCase() !== 'off') {
  try {
    dns.setServers(dnsServers.split(',').map((s) => s.trim()).filter(Boolean));
    console.log(`[db] DNS resolver forced to: ${dns.getServers().join(', ')}`);
  } catch (e) {
    console.warn('[db] could not set DNS servers:', e?.message || e);
  }
}

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
