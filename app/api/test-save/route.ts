import { NextResponse } from 'next/server';
import { MindmapStore } from '@/lib/mindmap-store';

export async function POST() {
  try {
    // Test data that matches the format the AI generates
    const testMindmapData = {
      id: "root",
      title: "Day Trading Learning Path",
      description: "Complete path for learning day trading",
      level: 0,
      difficulty: "intermediate",
      estimatedHours: 120,
      children: [
        {
          id: "3",
          title: "Risk Management",
          description: "Protecting capital and managing risk",
          difficulty: "intermediate",
          estimatedHours: 30,
          order: 3,
          children: [
            {
              id: "3.1",
              title: "Position Sizing",
              description: "Proper position sizing techniques",
              topics: ["Risk per trade", "Account risk management", "Position calculators"],
              estimatedHours: 15,
              order: 1
            }
          ]
        }
      ]
    };

    console.log('🧪 Testing mindmap save with data:', testMindmapData);

    const result = await MindmapStore.saveMindmap(
      testMindmapData,
      "Test Day Trading Learning Path",
      "Test description"
    );

    console.log('✅ Test mindmap saved successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Test mindmap saved successfully',
      result
    });

  } catch (error) {
    console.error('❌ Test save failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test save failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
