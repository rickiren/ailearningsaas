import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);

    if (projectsError) {
      throw projectsError;
    }

    // Test skill atoms table
    const { data: skillAtoms, error: skillAtomsError } = await supabase
      .from('skill_atoms')
      .select('*')
      .limit(5);

    if (skillAtomsError) {
      throw skillAtomsError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Database connection successful',
      projects: {
        count: projects?.length || 0,
        sample: projects?.slice(0, 2) || []
      },
      skillAtoms: {
        count: skillAtoms?.length || 0,
        sample: skillAtoms?.slice(0, 2) || []
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Database test error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
