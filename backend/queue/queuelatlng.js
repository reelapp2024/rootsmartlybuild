// const mongoose = require('mongoose');
// const Bull     = require('bull');
// const axios    = require('axios');
// const AdminCity = require('../models/adminCities');
// require('dotenv').config();

// // Redis queue setup
// const rediscitylatlngqueueQueue = new Bull('rediscitylatlngqueueQueue', {
//   redis: {
//     host: process.env.redisHost,
//     port: process.env.redisPort,
//   },
// });

// const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

// // Delay between requests to prevent rate limiting
// const RATE_LIMIT_DELAY = 2000;
// const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// rediscitylatlngqueueQueue.process(async (job) => {
//   const { id, cityName, stateName, countryName } = job.data;
//   try {
//     const resp = await axios.get('https://us1.locationiq.com/v1/search.php', {
//       params: {
//         key: LOCATIONIQ_API_KEY,
//         q: `${cityName}, ${stateName}, ${countryName}`,
//         format: 'json',
//         limit: 1,
//       },
//       headers: { 'User-Agent': 'LatLngCityWorker/1.0' },
//     });

//     const location = resp.data[0];
//     if (!location) {
//       // mark as unavailable and skip
//       await AdminCity.updateOne({ id }, { $set: { notavailable: 1 } });
//       console.warn(`⚠️ No geocode result for ${cityName}; marking notavailable.`);
//       return;
//     }

//     // successful – write back lat/lng
//     await AdminCity.updateOne(
//       { id },
//       { $set: { lat: location.lat, lng: location.lon } }
//     );
//     console.log(`✅ Updated lat/lng for city: ${cityName}`);
//     //    const filter = {
//     //                 notavailable: { $ne: 1 },
//     //                 $or: [{ lat: null }, { lng: null }]
//     //             };
    
//     //             // 1) Count how many are still eligible
//     //             const citiesCount = await AdminCity.countDocuments(filter);
//     //             console.log(citiesCount, "cities remaining to queue");

//   } catch (err) {
//     console.error(`❌ Error for city ${cityName}:`, err.message);

//     if (err.response?.status === 429) {
//       // rate-limit: retry
//       console.warn('⚠️ Rate limited. Retrying after delay...');
//       await delay(5000);
//       throw err;
//     } else {
//       // other errors: mark unavailable so we don't loop forever
//       await AdminCity.updateOne({ id }, { $set: { notavailable: 1 } });
//       console.warn(`⚠️ Marked ${cityName} notavailable due to error.`);
//     }
//   } finally {
//     await delay(RATE_LIMIT_DELAY);
//   }
// });

// module.exports = rediscitylatlngqueueQueue;
