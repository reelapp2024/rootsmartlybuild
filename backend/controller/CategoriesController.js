const mongoose = require('mongoose');

const ProjectCategory = require('../models/ProjectCategory');
const SubCategory = require('../models/SubCategory');
const MicroCategory = require('../models/MicroCategory')





const DEFAULT_DATA = [
  { name: "Restaurants", subNames: [
    "Fine Dining","Casual Dining","Fast Food","Cafes","Bakeries","Bars & Pubs",
    "Food Trucks","Dessert Shops","Vegetarian/Vegan","Ethnic Cuisine"
  ]},
  { name: "Retail", subNames: [
    "Clothing & Accessories","Electronics","Home Decor","Sporting Goods","Books & Stationery",
    "Gifts & Novelties","Jewelry","Pet Supplies","Health & Beauty","Specialty Stores"
  ]},
  { name: "Health & Wellness", subNames: [
    "Gyms & Fitness Centers","Spas & Salons","Yoga Studios","Massage Therapy","Chiropractors",
    "Acupuncture","Nutritionists","Mental Health Services","Dentists","Optometrists"
  ]},
  { name: "Home Services", subNames: [
    "Plumbing","Electricians","HVAC","Landscaping","Cleaning Services","Pest Control",
    "Roofing","Painting","Flooring","Handyman Services"
  ]},
  { name: "Automotive", subNames: [
    "Car Dealerships","Auto Repair Shops","Car Washes","Tire Shops","Auto Parts Stores",
    "Car Rental","Towing Services","Auto Detailing","Motorcycle Shops","Electric Vehicle Charging Stations"
  ]},
  { name: "Travel & Hospitality", subNames: [
    "Hotels","Resorts","Bed & Breakfasts","Vacation Rentals","Travel Agencies","Tour Operators",
    "Airlines","Cruise Lines","Car Rental Agencies","Tourist Attractions"
  ]},
  { name: "Entertainment", subNames: [
    "Movie Theaters","Live Music Venues","Comedy Clubs","Arcades","Bowling Alleys","Escape Rooms",
    "Karaoke Bars","Amusement Parks","Gaming Cafes","Art Galleries"
  ]},
  { name: "Professional Services", subNames: [
    "Lawyers","Accountants","Financial Advisors","Marketing Agencies","IT Services",
    "Architects","Engineers","Consultants","Printing Services","Translation Services"
  ]},
  { name: "Education", subNames: [
    "Tutoring Services","Language Schools","Music Schools","Dance Studios","Art Classes","Cooking Classes",
    "Driving Schools","Vocational Training","Test Preparation","Continuing Education"
  ]},
  { name: "Pet Services", subNames: [
    "Veterinarians","Pet Groomers","Pet Sitters","Dog Walkers","Pet Trainers","Pet Stores",
    "Pet Boarding","Pet Photographers","Pet Taxi Services","Pet Adoption Centers"
  ]},
  { name: "Real Estate", subNames: [
    "Residential Properties","Commercial Properties","Property Management","Real Estate Agents","Home Inspectors",
    "Mortgage Brokers","Title Companies","Appraisers","Home Stagers","Real Estate Photographers"
  ]},
  { name: "Sports & Recreation", subNames: [
    "Fitness Studios","Sports Clubs","Golf Courses","Tennis Courts","Swimming Pools","Skating Rinks",
    "Paintball Fields","Hiking Trails","Camping Grounds","Outdoor Adventure Centers"
  ]},
  { name: "Beauty & Personal Care", subNames: [
    "Hair Salons","Nail Salons","Barber Shops","Makeup Artists","Estheticians","Tanning Salons",
    "Waxing Services","Tattoo Parlors","Piercing Studios","Cosmetic Dentistry"
  ]},
  { name: "Event Services", subNames: [
    "Wedding Planners","Event Venues","Caterers","DJs & Bands","Photographers & Videographers",
    "Florists","Event Rentals","Photo Booth Rentals","Limousine Services","Event Decorators"
  ]},
  { name: "Local Artisans & Crafts", subNames: [
    "Woodworkers","Potters","Glassblowers","Jewelry Makers","Textile Artists","Soap Makers",
    "Candle Makers","Leatherworkers","Blacksmiths","Calligraphers"
  ]},
];




module.exports = {

     addBulkCategoriesWithSubs: async (req, res) => {
    try {
      let { data } = req.body || {};

      // If client sends a JSON string, parse it
      if (typeof data === 'string') {
        try { data = JSON.parse(data); }
        catch { return res.status(400).json({ message: '"data" must be a valid JSON array' }); }
      }

      // Fallback to default dataset if not provided
      if (!Array.isArray(data) || data.length === 0) {
        data = DEFAULT_DATA;
      }

      const created = { categories: 0, subcategories: 0 };
      const results = [];

      for (const entry of data) {
        if (!entry || typeof entry.name !== 'string' || !entry.name.trim()) continue;

        const name = entry.name.trim();
        const subNames = Array.isArray(entry.subNames) ? entry.subNames : [];

        // Ensure Category exists (idempotent)
        let category = await ProjectCategory.findOne({ name });
        if (!category) {
          category = await ProjectCategory.create({ name });
          created.categories += 1;
        }

        const subCreated = [];
        for (const s of subNames) {
          if (typeof s !== 'string' || !s.trim()) continue;
          const subName = s.trim();

          const existingSub = await SubCategory.findOne({ categoryId: category._id, name: subName });
          if (!existingSub) {
            const sub = await SubCategory.create({ categoryId: category._id, name: subName });
            subCreated.push(sub.name);
            created.subcategories += 1;
          }
        }

        results.push({
          category: category.name,
          createdSubNames: subCreated
        });
      }

      return res.status(200).json({
        message: 'Bulk categories & subcategories processed successfully',
        created,
        results
      });

    } catch (err) {
      console.error('Error in addBulkCategoriesWithSubs API:', err);
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  },

     // 1️⃣ Add New Category
    addNewCategory: async (req, res) => {
        try {
            let { names = [] } = req.body;

            // Parse if string
            if (typeof names === 'string') {
                try { names = JSON.parse(names); }
                catch { return res.status(400).json({ message: 'names must be JSON array' }); }
            }

            if (!Array.isArray(names) || names.length === 0) {
                return res.status(400).json({ message: 'Provide non-empty names array' });
            }

            const created = [];
            for (const name of names) {
                if (typeof name !== 'string' || !name.trim()) continue;
                const existing = await ProjectCategory.findOne({ name: name.trim() });
                if (!existing) {
                    const cat = await ProjectCategory.create({ name: name.trim() });
                    created.push(cat);
                }
            }

            res.status(200).json({
                message: 'Categories added successfully',
                createdCount: created.length,
                data: created
            });
        } catch (err) {
            console.error('Error in addNewCategory API:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // 2️⃣ Add New SubCategory
    addNewSubCategory: async (req, res) => {
        try {
            let { categoryId, names = [] } = req.body;

            if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
                return res.status(400).json({ message: 'Valid categoryId is required' });
            }

            if (typeof names === 'string') {
                try { names = JSON.parse(names); }
                catch { return res.status(400).json({ message: 'names must be JSON array' }); }
            }

            if (!Array.isArray(names) || names.length === 0) {
                return res.status(400).json({ message: 'Provide non-empty names array' });
            }

            const created = [];
            for (const name of names) {
                if (typeof name !== 'string' || !name.trim()) continue;
                const existing = await SubCategory.findOne({ categoryId, name: name.trim() });
                if (!existing) {
                    const sub = await SubCategory.create({ categoryId, name: name.trim() });
                    created.push(sub);
                }
            }

            res.status(200).json({
                message: 'SubCategories added successfully',
                createdCount: created.length,
                data: created
            });
        } catch (err) {
            console.error('Error in addNewSubCategory API:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // 3️⃣ Add New MicroCategory (Niche)
    addNewMicroCategory: async (req, res) => {
        try {
            let { categoryId, subCategoryId, names = [] } = req.body;

            if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
                return res.status(400).json({ message: 'Valid categoryId is required' });
            }
            if (!subCategoryId || !mongoose.isValidObjectId(subCategoryId)) {
                return res.status(400).json({ message: 'Valid subCategoryId is required' });
            }

            if (typeof names === 'string') {
                try { names = JSON.parse(names); }
                catch { return res.status(400).json({ message: 'names must be JSON array' }); }
            }

            if (!Array.isArray(names) || names.length === 0) {
                return res.status(400).json({ message: 'Provide non-empty names array' });
            }

            const created = [];
            for (const name of names) {
                if (typeof name !== 'string' || !name.trim()) continue;
                const existing = await MicroCategory.findOne({ subCategoryId, name: name.trim() });
                if (!existing) {
                    const micro = await MicroCategory.create({
                        categoryId,
                        subCategoryId,
                        name: name.trim()
                    });
                    created.push(micro);
                }
            }

            res.status(200).json({
                message: 'MicroCategories (niches) added successfully',
                createdCount: created.length,
                data: created
            });
        } catch (err) {
            console.error('Error in addNewMicroCategory API:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },


       // 1️⃣ Fetch all categories
    fetchCategories: async (req, res) => {
        try {
            const categories = await ProjectCategory.find().sort({ name: 1 }); // alphabetical
            res.status(200).json({
                message: 'Categories fetched successfully',
                data: categories
            });
        } catch (err) {
            console.error('Error fetching categories:', err);
            res.status(500).json({ message: 'Internal server error', error: err.message });
        }
    },

    // 2️⃣ Fetch subcategories for a category
    fetchSubCategories: async (req, res) => {
        try {
            const { categoryId } = req.body;

            console.log(req.body,"<<<<<<<<<<");
            if (!categoryId) return res.status(400).json({ message: 'categoryId is required' });

            const subcategories = await SubCategory.find({ categoryId }).sort({ name: 1 });
            res.status(200).json({
                message: 'Subcategories fetched successfully',
                data: subcategories
            });
        } catch (err) {
            console.log('Error fetching subcategories:', err);
            res.status(500).json({ message: 'Internal server error', error: err.message });
        }
    },

    // 3️⃣ Fetch microcategories (niches) for a subcategory
    fetchMicroCategories: async (req, res) => {
        try {
            const { subCategoryId } = req.body;
            if (!subCategoryId) return res.status(400).json({ message: 'subCategoryId is required' });

            const microcategories = await MicroCategory.find({ subCategoryId }).sort({ name: 1 });
            res.status(200).json({
                message: 'Microcategories fetched successfully',
                data: microcategories
            });
        } catch (err) {
            console.error('Error fetching microcategories:', err);
            res.status(500).json({ message: 'Internal server error', error: err.message });
        }
    },

  
}