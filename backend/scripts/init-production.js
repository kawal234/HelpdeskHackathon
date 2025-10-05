#!/usr/bin/env node

/**
 * Production Database Initialization Script
 * Run this after deployment to initialize the database
 */

const db = require('../src/database/connection');
const migrate = require('../src/database/migrate');

async function initProduction() {
    console.log('🚀 Initializing production database...');
    
    try {
        // Connect to database
        await db.connect();
        console.log('✅ Database connected');
        
        // Run migration
        await migrate();
        console.log('✅ Database migration completed');
        
        // Close connection
        await db.close();
        console.log('✅ Production database initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing production database:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initProduction();
}

module.exports = initProduction;
