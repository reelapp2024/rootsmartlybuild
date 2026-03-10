const Theme = require('../models/Theme');

/**
 * Seed default themes if they don't exist
 * This runs automatically when the server starts
 */
const seedThemes = async () => {
  try {
    console.log('\n🔄 Checking for default themes...');

    // Default themes to seed
    const defaultThemes = [
      {
        themeName: 'cleaning',
        supportThemeSubColor: true,
        supportSecondaryColor: false,
        themeDemoUrl: 'http://localhost:8081/?theme=cleaning',
        themeImageUrl: 'https://via.placeholder.com/400x300/00FFFF/FFFFFF?text=Cleaning+Theme',
        isActive: true
      },
      {
        themeName: 'multicolor',
        supportThemeSubColor: true,
        supportSecondaryColor: true,
        themeDemoUrl: 'http://localhost:8081/?theme=multicolor',
        themeImageUrl: 'https://via.placeholder.com/400x300/E11D48/FFFFFF?text=Multicolor+Theme',
        isActive: true
      },
      {
        themeName: 'modern',
        supportThemeSubColor: true,
        supportSecondaryColor: true,
        themeDemoUrl: 'http://localhost:8081/?theme=modern',
        themeImageUrl: 'https://via.placeholder.com/400x300/6366F1/FFFFFF?text=Modern+Theme',
        isActive: true
      }
    ];

    let seededCount = 0;
    let existingCount = 0;

    for (const themeData of defaultThemes) {
      try {
        let existingTheme = await Theme.findOne({ themeName: themeData.themeName });
        
        if (!existingTheme) {
          // Theme doesn't exist, create it
          const newTheme = new Theme(themeData);
          await newTheme.save();
          console.log(`  ✅ Seeded new theme: ${themeData.themeName}`);
          seededCount++;
        } else {
          // Theme exists, ensure all fields are correct
          let updated = false;
          if (existingTheme.themeDemoUrl !== themeData.themeDemoUrl) {
            existingTheme.themeDemoUrl = themeData.themeDemoUrl;
            updated = true;
          }
          if (existingTheme.themeImageUrl !== themeData.themeImageUrl) {
            existingTheme.themeImageUrl = themeData.themeImageUrl;
            updated = true;
          }
          if (existingTheme.supportThemeSubColor !== themeData.supportThemeSubColor) {
            existingTheme.supportThemeSubColor = themeData.supportThemeSubColor;
            updated = true;
          }
          if (existingTheme.supportSecondaryColor !== themeData.supportSecondaryColor) {
            existingTheme.supportSecondaryColor = themeData.supportSecondaryColor;
            updated = true;
          }
          if (updated) {
            await existingTheme.save();
            console.log(`  🔄 Updated existing theme: ${themeData.themeName}`);
          } else {
            console.log(`  ℹ️  Theme already exists: ${themeData.themeName}`);
          }
          existingCount++;
        }
      } catch (themeError) {
        console.error(`  ❌ Error seeding theme ${themeData.themeName}:`, themeError.message);
        console.error(`  Stack:`, themeError.stack);
      }
    }

    // Ensure modern theme exists (force check)
    try {
      const modernTheme = await Theme.findOne({ themeName: 'modern' });
      if (!modernTheme) {
        console.log('  ⚠️  Modern theme missing, creating now...');
        const newModernTheme = new Theme({
          themeName: 'modern',
          supportThemeSubColor: true,
          supportSecondaryColor: true,
          themeDemoUrl: 'http://localhost:8081/?theme=modern',
          themeImageUrl: 'https://via.placeholder.com/400x300/6366F1/FFFFFF?text=Modern+Theme',
          isActive: true
        });
        await newModernTheme.save();
        console.log('  ✅ Modern theme created successfully!');
        seededCount++;
      } else {
        console.log('  ✓ Modern theme already exists');
      }
    } catch (modernError) {
      console.error('  ❌ Error ensuring modern theme:', modernError.message);
    }

    if (seededCount > 0) {
      console.log(`\n✨ Theme seeding completed! Added ${seededCount} new theme(s), ${existingCount} already existed.`);
      console.log('   Themes are now available in admin panel at /admin/themes\n');
    } else {
      console.log(`\n✓ All themes already exist. No new themes added.\n`);
    }
  } catch (error) {
    console.error('❌ Error in theme seeding process:', error);
    console.error('   Stack:', error.stack);
  }
};

module.exports = seedThemes;

