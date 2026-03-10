var express = require('express');
var router = express.Router();
const axios = require('axios');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post('/upload', (req, res) => {
  if (!req.files || !req.files.svgFile) {
    return res.status(400).send('No file uploaded.');
  }
  
  var svgFile=`<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Rectangle -->
  <rect width="400" height="200" fill="#f0f0f0" />

  <!-- Editable Text -->
  <text x="50" y="50" font-size="24" fill="blue" id="title">Sample Title</text>
  <text x="50" y="100" font-size="16" fill="black" id="subtitle">Sample Subtitle</text>

  <!-- Editable Image -->
  <image x="250" y="50" width="100" height="100" href="https://via.placeholder.com/100" id="image"/>

  <!-- Border -->
  <rect x="10" y="10" width="380" height="180" fill="none" stroke="black" stroke-width="2" />
</svg>`
  
  // Move the file to the uploads directory
  res.render('svgtemp', { svgFile });

});


const FINNHUB_API_KEY = "d142nkhr01qrqearmu7gd142nkhr01qrqearmu80";

// Example top 20 NSE stock symbols (add/modify as needed)


const topStocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]; // Example stock symbols

router.get("/api/top-stocks", async (req, res) => {
  // Validate API key presence
  if (!FINNHUB_API_KEY) {
    console.error("Finnhub API key is not configured.");
    return res.status(500).json({ error: "Server configuration error: Missing API key" });
  }

  try {
    const stockData = await Promise.all(
      topStocks.map(async (symbol, index) => {
        try {
          // Add delay to avoid rate limiting (e.g., 60 requests per minute for Finnhub free tier)
          await new Promise((resolve) => setTimeout(resolve, index * 200)); // 200ms delay per request

          const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
          const response = await axios.get(quoteUrl);

          // Validate response data
          if (!response.data || response.data.error) {
            throw new Error(`Invalid response for ${symbol}: ${response.data.error || "No data"}`);
          }

          const { c: currentPrice, pc: previousClose } = response.data;

          // Ensure valid price data
          if (typeof currentPrice !== "number" || typeof previousClose !== "number") {
            throw new Error(`Invalid price data for ${symbol}`);
          }

          const change = currentPrice - previousClose;
          const percentChange = ((change / previousClose) * 100).toFixed(2);

          return {
            symbol,
            currentPrice: currentPrice.toFixed(2),
            previousClose: previousClose.toFixed(2),
            change: change.toFixed(2),
            percentChange: `${percentChange}%`,
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error.message);
          return { symbol, error: "Failed to fetch data" }; // Return partial error to continue processing
        }
      })
    );

    // Filter out any failed requests if needed
    const successfulData = stockData.filter((data) => !data.error);

    if (successfulData.length === 0) {
      return res.status(500).json({ error: "No stock data could be retrieved" });
    }

    res.json(stockData);
  } catch (error) {
    console.error("Error fetching stock data:", error.message);
    res.status(500).json({ error: "Failed to fetch stock data", details: error.message });
  }
});



module.exports = router;
