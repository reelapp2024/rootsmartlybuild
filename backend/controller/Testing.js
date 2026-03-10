const axios = require('axios');
const Redis = require('ioredis'); // Use ioredis for Redis client
const Bull = require('bull');
const GptContent = require("../models/GptContent");
const express = require('express');
const router = express.Router();

// Redis Client - using ioredis now
const client = new Redis({
  host: 'localhost',  // Your Redis connection details
  port: 6379,         // Adjust according to your Redis configuration
});

client.on('error', (err) => {
  console.log('Redis error:', err);
});

// Bull Queue Setup
const queue = new Bull('RedQueueLatest', {
  redis: {
    host: 'localhost',
    port: 6379, // Adjust according to your Redis configuration
  },
});

// Increase the max listeners to avoid MaxListenersExceededWarning
queue.setMaxListeners(100); // Increase the limit as needed

// Track task statuses
let completedTasks = 0;


// Function to get OpenAI response
const getResponseFromOpenAI = async (prompt) => {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    },
    {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    }
  );

  return response.data.choices[0].message.content.trim();
};

// Worker for processing the jobs
queue.process(async (job) => {
  const { title, serialNo, niche,totaltasks } = job.data;

  console.log("Generating content for: ",title)

  const prompt=`Create a 30-second YouTube short on a given topic = ${title} with limited words ( minimum 200 max 250 words ) that are readable in 30 seconds. Please provide me with up-to-date information that is easy to understand with good content that should include interesting facts, Fun facts, real numbers, and real data. Make sure to include a separate title and description. Don't add any links to websites and YouTube channels in the content and don't use emojis. Please don't add steps. And make sure all the content is according to 2025 and content should be in hindi for the Indian audience. Please follow the exact instructions and don't miss any keywords and do the work in sequence for all topics and start from first topic. Please don't add links

   make sure to dont repeat any content


   make sure to dont add any hashtag or note
   
    Example output format:

    Title:
फ्लिपकार्ट: भारत के ई-कॉमर्स का बादशाह बनने की कहानी
Description:
जानिए कैसे फ्लिपकार्ट ने भारत के ई-कॉमर्स बाजार में अपनी बादशाहत कायम की। 2025 तक के आंकड़े, मजेदार तथ्य और रोमांचक जानकारी!
Content:
2007 में सचिन और बिन्नी बंसल ने फ्लिपकार्ट की शुरुआत एक ऑनलाइन बुकस्टोर के रूप में की थी। आज, यह भारत का सबसे बड़ा ई-कॉमर्स प्लेटफॉर्म है। फ्लिपकार्ट के पास 48% बाजार हिस्सेदारी है, जबकि अमेज़न 31% पर है।
रोचक तथ्य:
फ्लिपकार्ट पर 15 करोड़ से ज्यादा प्रोडक्ट्स उपलब्ध हैं।
इसके 40 करोड़ से अधिक रजिस्टर्ड यूजर्स हैं।
2024 में इसका राजस्व ₹17,907 करोड़ था।
मजेदार जानकारी:
2018 में वॉलमार्ट ने फ्लिपकार्ट को $18 बिलियन (₹1.19 लाख करोड़) में खरीदा, जिससे यह डील भारतीय स्टार्टअप इतिहास की सबसे बड़ी डील बनी।
आज, क्विक कॉमर्स जैसे प्लेटफॉर्म्स चुनौती दे रहे हैं, लेकिन फ्लिपकार्ट अपनी मजबूत पकड़ बनाए हुए है।


`

 
  

  const promptriddles=` Create a 30-second Riddle for YouTube short on a given topic = ${title} with limited words ( minimum 200  max 250) that are readable in 30 seconds. Please provide me with up-to-date information that is not easy to understand with unique content that should include funny, thinkable, and fully minded. Make sure to include a separate Answer for the Riddle, title, and description. Don't add any links to websites and YouTube channels in the content and don't use emojis. Please don't add steps. And make sure all the content is according to 2025 and content should be in hindi for the Indian audience. Please follow the exact instructions and don't miss any keywords and do the work in sequence for all topics and start from first topic. Please don't add links.

  
   make sure to dont repeat any content


   make sure to dont add any hashtag or note
   
    Example output format:

      
    Title: चार रानियां और एक राजा - मजेदार पहेली
    Riddle:
    चार रानियां हैं, हर एक का अपना काम।
    राजा के साथ रहती हैं सुबह से शाम।
    राजा बिना इनके अधूरा सा लगे,
    हर रानी का अपना हिस्सा जमे।
    सोचो, कौन हैं ये चार रानियां और राजा?
    Answer:
    चार रानियां: कार के चार पहिये
    राजा: कार का ड्राइवर
    Description:
    इस मजेदार पहेली में सोचिए कि कौन हैं ये चार रानियां और उनका राजा। जवाब सुनकर आप मुस्कुरा उठेंगे! दिमागी कसरत के लिए इसे दोस्तों के साथ शेयर करें।
`
  

  try {
    // Generate content from OpenAI
    const openAiResponse = await getResponseFromOpenAI(prompt);

    // Store the content in Redis temporarily (1 hour)
    client.setex(title, 3600, openAiResponse); // Store the content in Redis for 1 hour

    // Save to MongoDB
    const newContent = new GptContent({
      title,
      serialNo,
      content: openAiResponse,
      niche, // Store the niche as well
    });
    await newContent.save();

    // Update the count for completed tasks
    completedTasks++;

    console.log(`Completed: ${completedTasks}, Pending: ${totaltasks - completedTasks}`);

    return openAiResponse;

  } catch (error) {
    console.error(`Error processing title "${title}":`, error);
    throw new Error(`Error processing title: ${title}`);
  }
});

// Controller to handle multiple titles
module.exports = {
  ytcontent: async (req, res) => {
    const { multititles, niche } = req.body;  // Expecting an array of titles and a niche
    const titles = multititles ? JSON.parse(multititles) : [];
  
    if (!niche || !multititles) {
      return res.status(400).json({ message: "You must provide niche and multititles." });
    }
  
    if (!Array.isArray(titles) || titles.length < 1) {
      return res.status(400).json({ message: "You must provide an array of titles." });
    }
  
    try {
      // Get the highest serial number for the niche
      const lastContent = await GptContent.findOne({ niche }).sort({ serialNo: -1 });
      let serialNoStart = lastContent ? lastContent.serialNo + 1 : 1;
  let totaltasks=titles.length
      // Create an array of jobs
      const jobPromises = titles.map(async (title, index) => {
        const job = await queue.add({ title, serialNo: serialNoStart + index, niche ,totaltasks});
        const content = await job.finished();  // Await the completion of the job
        return { title, content };
      });
  
      // Wait for all jobs to complete
      const results = await Promise.all(jobPromises);
  
      // Send response once all jobs are completed
      return res.status(200).json({
        message: "Content generated and stored successfully for multiple titles.",
        results,
      });
  
    } catch (error) {
      console.error('Error generating content for multiple titles:', error);
      return res.status(500).json({ message: "An error occurred while processing your request." });
    }
  },
  

  allnichecontent: async (req, res) => {
      // await GptContent.deleteMany({ niche: "FinalNiche09", serialNo: { $gt: 349 } });
      
      const { niche } = req.body; // Expecting niche as input

  
      if (!niche) {
          return res.status(400).json({ message: "You must provide a niche." });
      }
  
      try {
          // Fetch all content from the database for the given niche, sorted by serialNo
          const contentItems = await GptContent.find({ niche }).sort({ serialNo: 1 });
  
          if (!contentItems || contentItems.length === 0) {
              return res.status(404).json({ message: `No content found for niche: ${niche}` });
          }
  
          // Prepare the result array where each item will contain serialNo and content
          const resultArray = contentItems.map((item, index) => {
              // Ensure content is treated as a string
              let formattedContent = String(item.content);
  
              // Replace backslashes (\) with new lines (\n)
              formattedContent = formattedContent.replace(/\\/g, '\n');
  
              // Replace all occurrences of '\n' characters encoded as text (in case stored incorrectly)
              formattedContent = formattedContent.replace(/\\n/g, '\n');
  
              // Trim extra spaces
              formattedContent = formattedContent.trim();
  
              return {
                  serialNo: index + 1, // Ensuring serialNo starts from 1 and increments
                  content: formattedContent
              };
          });
  
          // Return the array of objects with serialNo and content
          res.status(200).json({
              message: "Content fetched successfully.",
              content: resultArray, // Return the formatted array
          });
  
      } catch (error) {
          console.error('Error fetching content for niche:', error);
          return res.status(500).json({ message: "An error occurred while fetching content for the niche." });
      }
  },
  
  
  
  
  };
  