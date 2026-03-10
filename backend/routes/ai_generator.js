var express = require('express');
var router = express.Router();
var axios = require('axios');

var GeneratedHtml = require('../models/generatedHtmlModel');
// var ServiceableStates = require("../models/serviceableStatesModel");
// var Serviceabledistricts = require("../models/serviceableDistrictsModel")
// var ServiceableCities = require("../models/serviceableCitiesModel");

var AdminCities= require("../models/adminCities");

// Endpoint for generating text
router.post('/generate_site_categories', async (req, res) => {
    var country_name = req.body.country_name;  // Required field: Country Name
    var service_type = req.body.service_type;  // Required field: Country Name
    if (!country_name) return res.status(400).json({ error: 'Country name is required' });
    if (!service_type) return res.status(400).json({ error: 'service_type  is required' });

    const metaTitlePrompt = req.body.metaTitle || '';  // Optional field: Meta Title
    const metaDescriptionPrompt = req.body.metaDescription || '';  // Optional field: Meta Description

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ensure API Key is stored securely in environment variables
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'API key missing' });

    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const headers = { 'Authorization': `Bearer ${OPENAI_API_KEY}` }; // Use backticks for string interpolation


    try {

        let prompt = `Generate a JSON array of 15 to 20 objects, each with the following structure:  
    1. Each object must include:
    - The name of the subcategory.
    - A 200-word description tailored to the provided country and service type.
    - A fas fa-icon name that matched with name of subcategory.
    - A valid phone number for the specified country.
    2. Ensure the array contains exactly 15-20 objects. 
    3. The subcategories must be relevant to the provided country and service type.

        Input:
        - Country: ${country_name}
        - Service Type: ${service_type}

        Output: [
            {
                "service_title": "Pipe Installation",
                "fas-fa-icon:"fas fa-building",
                "subcategory_description": "Pipe installation services in India focus on installing durable water and drainage systems. These services are critical for new constructions and renovations, ensuring compliance with local standards.",
                "contact_phone": "+91-9876543210"
            },
            {
                "service_title": "Leak Repairs",
                "fas-fa-icon:"fas fa-building",
                "subcategory_description": "Leak repairs in India address issues like dripping taps and burst pipes, using advanced tools to prevent water wastage and structural damage efficiently.",
                "contact_phone": "+91-9123456789"
            }
            // Add at least 13 more objects
        ]
        `


        const { data } = await axios.post(endpoint, {
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 3000,
            temperature: 0.7,
        }, { headers });

        let responseText = data.choices[0].message.content.trim();
        let parsedResponse;


        // Calculate token usage and cost
        const tokensUsed = data.usage.total_tokens;
        const usdCostPer1kTokens = 0.002;  // GPT-3.5 pricing
        const usdCost = (tokensUsed / 1000) * usdCostPer1kTokens;



        const inrCost = (usdCost * 84).toFixed(2);  // Assuming 1 USD = 84 INR

        try {
            parsedResponse = JSON.parse(responseText);
        } catch (error) {
            console.error('Invalid JSON response from API:', error);
            return res.status(500).json({ error: 'Failed to parse API response' });
        }

        const isValidResponse = Array.isArray(parsedResponse) && parsedResponse.every(item => {
            return item.service_title && item.subcategory_description && item.contact_phone;
        });

        if (!isValidResponse) {
            return res.status(500).json({ error: 'Response structure is invalid' });
        }

        // Save or return the validated response


        const newCountry = await GeneratedHtml.create({
            country_name: country_name,
            service_type: service_type,
            user_id: "1",
            product_id: "3",
            generated_categories: parsedResponse,
        });

        return res.json({
            data: newCountry,
            tokensUsed: data.usage.total_tokens,
            inrCost,
        });
    } catch (error) {
        console.error('API call failed:', error);
        res.status(500).json({ error: 'Failed to generate text' });
    }

});


router.post('/mysite', async (req, res) => {
    try {
        console.log(req.body, "this is body data!!!!!!!!!");
        let id = req.body.id;

        if (!id) {
            throw "id is required"
        }

        let data = await GeneratedHtml.findById(id)

        let states = await ServiceableStates.findOne({ product_id: data.product_id })

        let finalData = {
            data: data,
            states: states
        }



        console.log(data.product_id, "data to send")
        // console.log(data, "here is the data which came form the backend data base!!!!");return
        return res.status(200).send({ message: "Data fetched sucessfully!!", finalData });

    } catch (error) {
        console.log(error, "hey this is error");
        res.status(500).send({ message: "Error is", error: error });
    }

});
router.get('/get-placesx', async (req, res) => {
    try {
        console.log(req.body, "this is body data!!!!!!!!!");
        
    } catch (error) {
        console.log(error, "hey this is error");
        res.status(500).send({ message: "Error is", error: error });
    }

});

router.post('/countryentry', async (req, res) => {
    try {
        const  countries  = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua & Deps", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Rep", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Congo {Democratic Rep}", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland {Republic}", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea North", "Korea South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar, {Burma}", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russian Federation", "Rwanda", "St Kitts & Nevis", "St Lucia", "Saint Vincent & the Grenadines", "Samoa", "San Marino", "Sao Tome & Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad & Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"] // Array of country names
        if (!Array.isArray(countries) || countries.length === 0) {
            return res.status(400).json({ error: 'Countries array is required and must not be empty' });
        }

        // Generate countries with serial numbers
        const countryDocs = countries.map((name, index) => ({
            serialNumber: index + 1,
            name,
        }));

        // Save countries to database
        await Country.insertMany(countryDocs);

        return res.status(201).json({ message: 'Countries added successfully', data: countryDocs });
    } catch (error) {
        console.error('Error adding countries:', error.message);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Duplicate country names or serial numbers found' });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.post('/mysite/districts', async (req, res) => {
    try {
        console.log(req.body, "this is body data!!!!!!!!!");
        let id = req.body.id;
        let state = req.body.state

        if (!id) {
            throw "id is required";
        }

        if (!state) {
            throw "state is required"
        }

        // Fetch the main data by ID
        let data = await GeneratedHtml.findById(id);
        if (!data) {
            throw "No data found for the given ID";
        }

        console.log(state, data.product_id);


        let districts;
        try {
            districts = await Serviceabledistricts.findOne({
                product_id: data.product_id,  // Ensure data.product_id is properly passed and not undefined
                state: state  // Ensure the state is correctly passed
            });

            if (!districts) {
                // If no districts found, throw a custom error message
                throw new Error("No district data found for the given product_id and state");
            }
        } catch (err) {
            // Handle the error, possibly log it and send the error response
            console.error("Error fetching districts:", err.message);
            throw new Error("An error occurred while fetching district data");
        }
        // Structure the final response
        let finalData = {
            data: data,
            districts: districts
        };

        console.log(data.product_id, "data to send");
        return res.status(200).send({ message: "Data fetched successfully!!", finalData });
    } catch (error) {
        console.log(error, "hey this is error");
        res.status(500).send({ message: "Error occurred", error: error });
    }
});

router.post('/mysite/cities', async (req, res) => {
    try {
        console.log(req.body, "this is body data!!!!!!!!!");
        let id = req.body.id;
        let state = req.body.state;
        let district = req.body.district;

        // Validate required fields
        if (!id) {
            throw "id is required";
        }

        if (!state) {
            throw "state is required";
        }

        if (!district) {
            throw "district is required";
        }

        // Fetch the main data by ID
        let data = await GeneratedHtml.findById(id);
        if (!data) {
            throw "No data found for the given ID";
        }

        console.log(state, district, data.product_id);

        let cities;
        try {
            // Fetch serviceable cities based on product_id, state, and district
            cities = await ServiceableCities.findOne({
                product_id: data.product_id, // Ensure product_id is valid
                state: state,               // Filter by state
                district: district          // Filter by district
            });

            if (!cities) {
                // If no cities found, throw a custom error message
                throw new Error("No city data found for the given product_id, state, and district");
            }
        } catch (err) {
            // Handle the error, possibly log it and send the error response
            console.error("Error fetching cities:", err.message);
            throw new Error("An error occurred while fetching city data");
        }

        // Structure the final response
        let finalData = {
            data: data,
            cities: cities
        };

        console.log(data.product_id, "data to send");
        return res.status(200).send({ message: "Data fetched successfully!!", finalData });
    } catch (error) {
        console.log(error, "hey this is error");
        res.status(500).send({ message: "Error occurred", error: error });
    }
});





router.post('/generateimages', async (req, res) => {
    try {
        let query = req.body.query;

        if (!query) {
            return res.status(400).json({ error: "Query parameter is required" });
        }

        const fetchImages = async (prompt) => {
            const apiKey = process.env.UNSPLASH_ACCESS_KEY;
            const url = `https://api.unsplash.com/search/photos`;

            if (!req.body.id) { return res.status(500).json({ error: "id is required!!" }) }

            try {
                const response = await axios.get(url, {
                    params: {
                        query: prompt,
                        per_page: 10, // Number of results per page
                    },
                    headers: {
                        Authorization: `Client-ID ${apiKey}`,
                    },
                });

                const images = response.data.results.map((image) => ({
                    description: image.alt_description,
                    url: image.urls.full,
                }));

                console.log(images);

                await GeneratedHtml.updateOne(
                    { _id: req.body.id },               // Filter to find the document
                    { $set: { generated_images: images } } // Update operation
                )

                res.json({
                    images: images,

                });
            } catch (error) {
                console.error('Error fetching images:', error.response?.data || error.message);
            }
        };


        // Example usage
        fetchImages(query);

    } catch (error) {
        console.log(error, "error is");


    }
});



router.post('/serviceable_states', async (req, res) => {
    try {
        const { user_id, product_id, states } = req.body;

        console.log("here we o")

        // Convert the comma-separated states string into an array
        const statesArray = states.split(",").map(state => state.trim());

        console.log(statesArray, "-------0----");

        // Check if the product_id already exists in the database
        let serviceable_states = await ServiceableStates.findOneAndUpdate(
            { product_id: product_id }, // Find by product_id
            {
                $set: {
                    user_id: user_id,      // Update user_id
                    states: statesArray,    // Update states
                    updatedAt: new Date()   // Optional: Update the timestamp
                }
            },
            {
                new: true,               // Return the updated document
                upsert: true             // Create if the document does not exist
            });

        // Return the response

        console.log(serviceable_states, "---------serviceable_states------------");

        res.json({
            serviceable_states: serviceable_states
        });

    } catch (error) {
        console.log(error, "this is error!!");
        res.status(500).json({ message: "An error occurred" });
    }
});

router.post('/serviceable_districts', async (req, res) => {
    try {
        const { user_id, product_id, state, districts } = req.body;

        // Convert the comma-separated districts string into an array
        const districtsArray = districts.split(",").map(district => district.trim());

        // Check if the state and product_id already exist in the database
        let districtData = await Serviceabledistricts.findOneAndUpdate(
            { product_id: product_id, state: state }, // Find by product_id and state
            {
                $set: {
                    user_id: user_id,          // Update user_id
                    districts: districtsArray, // Update districts array
                    updatedAt: new Date()      // Optional: Update the timestamp
                }
            },
            {
                new: true,                    // Return the updated document
                upsert: true                  // Create if the document does not exist
            });

        // Return the response
        res.json({
            districtData: districtData
        });

    } catch (error) {
        console.error(error, "Error in /districts API");
        res.status(500).json({ message: "An error occurred" });
    }
});


router.post('/serviceable_cities', async (req, res) => {
    try {
        const { user_id, product_id, state, district, cities } = req.body;

        // Convert the comma-separated cities string into an array
        const citiesArray = cities.split(",").map(city => city.trim());

        // Check if the state, district, and product_id already exist in the database
        let cityData = await ServiceableCities.findOneAndUpdate(
            { product_id: product_id, state: state, district: district }, // Find by product_id, state, and district
            {
                $set: {
                    user_id: user_id,          // Update user_id
                    cities: citiesArray,       // Update cities array
                    updatedAt: new Date()      // Optional: Update the timestamp
                }
            },
            {
                new: true,                    // Return the updated document
                upsert: true                  // Create if the document does not exist
            });

        // Return the response
        res.json({
            cityData: cityData
        });

    } catch (error) {
        console.error(error, "Error in /serviceable_cities API");
        res.status(500).json({ message: "An error occurred" });
    }
});


router.post('/get_places', async (req, res) => {
    try {
        console.log("Fetching detailed place information...",req.body);
        const { radius, lat, lng, keyword = 'salon', type = 'beauty_salon', maxResults = 10 } = req.body;
    
        if (!lat || !lng || !radius) {
            return res.status(400).json({ error: 'lat, lng, and radius are required' });
        }
    
        const location = `${lat},${lng}`;
        const maxPlaces = Math.min(Math.max(parseInt(maxResults), 1), 60); // Cap at 60 (Google limit)
    
        const GOOGLE_API_KEY = process.env.GooglePlacesApiKey;
        const BASE_URL = 'https://maps.googleapis.com/maps/api/place/';
    
        const NEARBY_SEARCH_COST_PER_REQUEST = 0.032;
        const PLACE_DETAILS_COST_PER_REQUEST = 0.034;
        let totalRequests = 0;
    
        async function getHighlyRatedPlaces(location, radius, maxResults) {
            let places = [];
            let nextPageToken = null;
    
            do {
                const searchUrl = `${BASE_URL}nearbysearch/json`;
                const searchParams = {
                    location,
                    radius: parseInt(radius),
                    keyword,
                    type,
                    key: GOOGLE_API_KEY,
                    pagetoken: nextPageToken || undefined,
                };
    
                totalRequests++;
                const response = await axios.get(searchUrl, { params: searchParams });
                places.push(...response.data.results);
                nextPageToken = response.data.next_page_token || null;
    
                if (nextPageToken) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Google delay
                }
            } while (nextPageToken && places.length < maxResults);
    
            const highlyRated = places
                .filter(place => place.rating >= 4.0)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, maxResults);
    
            return highlyRated.map(place => ({
                name: place.name,
                address: place.vicinity,
                rating: place.rating,
                totalRatings: place.user_ratings_total,
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                place_id: place.place_id,
                photos: place.photos || [],
                openingHours: place.opening_hours || null,
            }));
        }
    
        async function getPlaceDetails(placeId) {
            const detailsUrl = `${BASE_URL}details/json`;
            const detailsParams = {
                place_id: placeId,
                key: GOOGLE_API_KEY,
            };
    
            totalRequests++;
            const response = await axios.get(detailsUrl, { params: detailsParams });
            const result = response.data.result;
    
            return {
                name: result.name,
                address: result.formatted_address,
                phone: result.formatted_phone_number || 'N/A',
                international_phone_number: result.international_phone_number || 'N/A',
                website: result.website || 'N/A',
                rating: result.rating || 'N/A',
                totalRatings: result.user_ratings_total || 'N/A',
                reviews: result.reviews || [],
                photos: result.photos
                    ? result.photos.map(photo => `${BASE_URL}photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`)
                    : [],
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                types: result.types || [],
                businessStatus: result.business_status || 'N/A',
                openingHours: result.opening_hours || 'N/A',
                age: result.utc_offset_minutes !== undefined ? `${Math.abs(result.utc_offset_minutes / 60)} hours` : 'Unknown',
            };
        }
    
        const places = await getHighlyRatedPlaces(location, radius, maxPlaces);
        const detailedPlaces = await Promise.all(
            places.map(async place => {
                const details = await getPlaceDetails(place.place_id);
                return { ...place, ...details };
            })
        );
    
        const totalCost = 
            (Math.ceil(places.length / 20) * NEARBY_SEARCH_COST_PER_REQUEST) + // Adjust for pagination
            (places.length * PLACE_DETAILS_COST_PER_REQUEST);
    
        console.log(`Total API Requests: ${totalRequests}`);
        console.log(`Approximate Cost: ${totalCost.toFixed(3)} USD`);
    
        res.json({ 
            topPlaces: detailedPlaces, 
            totalRequests, 
            approximateCostUSD: totalCost.toFixed(3),
            approximateCostINR: (totalCost * 82).toFixed(2),
        });
    } catch (error) {
        console.error('Error fetching places:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/get_places_basic', async (req, res) => {
    try {
        const { radius, lat, lng, keyword = 'salon', maxResults = 10 } = req.body;
        const GOOGLE_API_KEY = process.env.GooglePlacesApiKey;
        const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

        // 1. Get List of Places
        const searchRes = await axios.get(`${BASE_URL}/nearbysearch/json`, {
            params: {
                location: `${lat},${lng}`,
                radius: parseInt(radius),
                keyword,
                key: GOOGLE_API_KEY
            }
        });

        const limitedResults = searchRes.data.results.slice(0, maxResults);

        // 2. Get Contact Info for each place
        const detailedPlaces = await Promise.all(limitedResults.map(async (place) => {
            const details = await axios.get(`${BASE_URL}/details/json`, {
                params: {
                    place_id: place.place_id,
                    fields: 'name,formatted_phone_number,website,vicinity,geometry', // Specify fields to save money
                    key: GOOGLE_API_KEY
                }
            });
            
            const d = details.data.result;
            return {
                name: d.name,
                phone: d.formatted_phone_number || 'N/A',
                website: d.website || 'N/A',
                address: d.vicinity,
                location: d.geometry.location
            };
        }));

        res.json(detailedPlaces);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get("/get_trending_kewords", async (req, res) => {
    try {

        const googleTrends = require('google-trends-api');

        googleTrends.dailyTrends({
            geo: 'IN', // Replace 'US' with your desired region (e.g., 'IN' for India, 'GB' for UK)
        })
            .then((results) => {
                let data = JSON.parse(results)
                res.json({ data: data.default.trendingSearchesDays });

                console.log('Daily Trends:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });


    } catch (error) {
        console.log(error, "HEY THIS IS ERROR IN THIS API")

    }
})


router.get("/latest_googleTrends", async (req, res) => {
    const googleTrends = require('google-trends-api');

    try {
        const dailyTrends = googleTrends.dailyTrends({ geo: 'IN' });
        const realTimeTrends = googleTrends.realTimeTrends({ geo: 'IN', category: 'all' });

        const [dailyResults, realTimeResults] = await Promise.all([dailyTrends, realTimeTrends]);

        // console.log(dailyResults,realTimeResults)
        // return

        const dailyData = JSON.parse(dailyResults).default.trendingSearchesDays;
        const realTimeData = JSON.parse(realTimeResults).storySummaries.trendingStories;

        // res.send(dailyData[0].trendingSearches)

        let keywordBox=[]

        for(let i in dailyData){
            let underData=dailyData[i].trendingSearches
            
            // console.log(underData,"underdata1");return
            for(let j in underData){
                let nowDataToPush=underData[j].title.query

                keywordBox.push(nowDataToPush)

             

            }
        }

        console.log(keywordBox,"keywordBox")

        return
        let data=dailyData[0].trendingSearches

        console.log(data[0].title.query)

        res.render('news',{data})

       
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).send('Error fetching trends');
    }
});

router.post("/cities_under_state",async(req,res)=>{
    try {
        

        let cities= await AdminCities.find({
            state_id:req.body.state_id
        });

        res.json({
            cityData: cities
        });
        
    } catch (error) {
        console.log(error,"error")
    }
});

// API Route





module.exports = router;









