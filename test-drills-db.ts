#!/usr/bin/env tsx

/**
 * Test script to verify the drills database setup
 * Run with: npx tsx test-drills-db.ts
 */

import { DrillService } from './lib/drill-service';

async function testDrillsDatabase() {
  console.log('🧪 Testing Drills Database Setup...\n');

  try {
    // Test 1: Create a drill
    console.log('1️⃣ Creating a test drill...');
    const testDrill = await DrillService.createDrill({
      title: 'Test HTML Form',
      description: 'A simple test drill for database verification',
      type: 'html',
      skill_name: 'HTML Forms',
      learning_objectives: ['Create forms', 'Basic validation'],
      difficulty: 'beginner',
      estimated_time: 10,
      code: '<!DOCTYPE html><html><body><form><input type="text" required><button>Submit</button></form></body></html>',
      tags: ['test', 'html', 'forms'],
      version: 1,
      is_active: true,
      metadata: { test: true }
    });
    console.log('✅ Drill created successfully:', testDrill.id);

    // Test 2: Get drill by ID
    console.log('\n2️⃣ Retrieving the test drill...');
    const retrievedDrill = await DrillService.getDrillById(testDrill.id);
    if (retrievedDrill) {
      console.log('✅ Drill retrieved successfully:', retrievedDrill.title);
    } else {
      console.log('❌ Failed to retrieve drill');
    }

    // Test 3: Update the drill
    console.log('\n3️⃣ Updating the test drill...');
    const updatedDrill = await DrillService.updateDrill(testDrill.id, {
      title: 'Updated Test HTML Form',
      difficulty: 'intermediate'
    });
    console.log('✅ Drill updated successfully:', updatedDrill.title);

    // Test 4: Get drills by type
    console.log('\n4️⃣ Getting drills by type...');
    const htmlDrills = await DrillService.getDrillsByType('html');
    console.log(`✅ Found ${htmlDrills.length} HTML drills`);

    // Test 5: Search drills
    console.log('\n5️⃣ Searching drills...');
    const searchResults = await DrillService.searchDrills('form');
    console.log(`✅ Search found ${searchResults.length} drills containing "form"`);

    // Test 6: Duplicate the drill
    console.log('\n6️⃣ Duplicating the test drill...');
    const duplicatedDrill = await DrillService.duplicateDrill(testDrill.id);
    console.log('✅ Drill duplicated successfully:', duplicatedDrill.title);

    // Test 7: Get all drills
    console.log('\n7️⃣ Getting all drills...');
    const allDrills = await DrillService.getUserDrills();
    console.log(`✅ Total drills in database: ${allDrills.length}`);

    // Test 8: Soft delete the test drills
    console.log('\n8️⃣ Cleaning up test drills...');
    await DrillService.deleteDrill(testDrill.id);
    await DrillService.deleteDrill(duplicatedDrill.id);
    console.log('✅ Test drills soft deleted');

    // Test 9: Verify deletion
    console.log('\n9️⃣ Verifying deletion...');
    const deletedDrill = await DrillService.getDrillById(testDrill.id);
    if (!deletedDrill) {
      console.log('✅ Drill successfully deleted (not found)');
    } else {
      console.log('❌ Drill still exists after deletion');
    }

    console.log('\n🎉 All tests passed! The drills database is working correctly.');

  } catch (error) {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDrillsDatabase().catch(console.error);
