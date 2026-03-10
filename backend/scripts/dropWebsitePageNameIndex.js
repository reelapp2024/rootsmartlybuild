/**
 * Script to drop the old name_1 index from WebsitePage collection
 * This index makes name globally unique, but we need name to be unique per project only
 * Run this script once to fix the database index issue
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function dropNameIndex() {
    try {
        // Connect to MongoDB - try multiple env var names
        const mongoUri = process.env.MONGODB_URI || 
                        process.env.MONGO_URI || 
                        process.env.MONGODB_URL ||
                        process.env.uri;
        
        if (!mongoUri) {
            console.error('MongoDB URI not found in environment variables. Please set MONGODB_URI or MONGO_URI.');
            process.exit(1);
        }
        
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        // Get the WebsitePage collection (Mongoose uses lowercase pluralized collection names)
        const db = mongoose.connection.db;
        // Try both possible collection names
        let collection = db.collection('websitepages');
        
        // Check if collection exists, if not try alternative name
        try {
            await collection.findOne({});
        } catch (err) {
            // Try alternative collection name
            collection = db.collection('websitePages');
            try {
                await collection.findOne({});
            } catch (err2) {
                console.error('Could not find WebsitePage collection. Please check the collection name in your database.');
                throw err2;
            }
        }

        // Get all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        // Check if name_1 index exists
        const nameIndex = indexes.find(idx => idx.name === 'name_1');
        
        if (nameIndex) {
            console.log('Found name_1 index, dropping it...');
            await collection.dropIndex('name_1');
            console.log('✓ Successfully dropped name_1 index');
        } else {
            console.log('name_1 index not found, may have already been dropped');
        }

        // Verify the compound index exists
        const compoundIndex = indexes.find(idx => 
            idx.key && 
            idx.key.projectId === 1 && 
            idx.key.name === 1 &&
            idx.unique === true
        );

        if (!compoundIndex) {
            console.log('Creating compound unique index on projectId + name...');
            await collection.createIndex(
                { projectId: 1, name: 1 },
                { unique: true, name: 'projectId_1_name_1' }
            );
            console.log('✓ Successfully created compound unique index');
        } else {
            console.log('✓ Compound unique index already exists');
        }

        // List final indexes
        const finalIndexes = await collection.indexes();
        console.log('\nFinal indexes:', finalIndexes.map(idx => ({
            name: idx.name,
            key: idx.key,
            unique: idx.unique
        })));

        console.log('\n✓ Index migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error dropping index:', error);
        process.exit(1);
    }
}

dropNameIndex();

