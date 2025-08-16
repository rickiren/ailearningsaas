import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jsonString } = body;

    if (!jsonString) {
      return NextResponse.json(
        { error: 'JSON string is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing JSON cleaning with:', jsonString.substring(0, 200) + '...');

    // Apply the same cleaning logic from the chat API
    let cleanedJsonStr = jsonString
      .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/,\s*,/g, ',')  // Remove double commas
      .replace(/\n\s*/g, ' ') // Remove newlines and extra spaces
      .replace(/\r/g, '')     // Remove carriage returns
      .trim();

    console.log('🧹 Cleaned JSON:', cleanedJsonStr.substring(0, 200) + '...');

    // Try to parse the cleaned JSON
    try {
      const parsed = JSON.parse(cleanedJsonStr);
      return NextResponse.json({
        success: true,
        message: 'JSON cleaned and parsed successfully',
        originalLength: jsonString.length,
        cleanedLength: cleanedJsonStr.length,
        parsed: parsed
      });
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse cleaned JSON',
        details: parseError instanceof Error ? parseError.message : 'Unknown error',
        original: jsonString,
        cleaned: cleanedJsonStr
      }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
