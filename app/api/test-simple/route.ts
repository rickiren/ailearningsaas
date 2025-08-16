import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🧪 Testing simple database connection...');
    
    // Test 1: Basic connection
    try {
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
      
      console.log('Test 1 result:', { data: testData, error: testError });
      
      if (testError) {
        return NextResponse.json({
          success: false,
          error: 'Basic connection failed',
          details: testError,
          message: 'The projects table might not exist. Please run the migration first.'
        }, { status: 500 });
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Exception during connection test',
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'There was an exception during the database connection test.'
      }, { status: 500 });
    }
    
    // Test 2: Try to insert a simple project
    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert({
        title: 'Test Project',
        description: 'Test Description'
      })
      .select()
      .single();
    
    console.log('Test 2 result:', { data: insertData, error: insertError });
    
    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Insert failed',
        details: insertError
      }, { status: 500 });
    }
    
    // Test 3: Try to insert a skill atom
    const { data: skillAtomData, error: skillAtomError } = await supabase
      .from('skill_atoms')
      .insert({
        project_id: insertData.id,
        title: 'Test Skill',
        level: 0,
        order_index: 0
      })
      .select()
      .single();
    
    console.log('Test 3 result:', { data: skillAtomData, error: skillAtomError });
    
    if (skillAtomError) {
      return NextResponse.json({
        success: false,
        error: 'Skill atom insert failed',
        details: skillAtomError
      }, { status: 500 });
    }
    
    // Clean up test data
    await supabase.from('skill_atoms').delete().eq('id', skillAtomData.id);
    await supabase.from('projects').delete().eq('id', insertData.id);
    
    return NextResponse.json({
      success: true,
      message: 'All database tests passed',
      results: {
        connection: 'OK',
        projectInsert: 'OK',
        skillAtomInsert: 'OK'
      }
    });
    
  } catch (error) {
    console.error('❌ Simple test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Simple test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
