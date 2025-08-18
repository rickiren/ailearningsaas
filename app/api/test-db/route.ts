import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get projects',
        details: projectsError
      }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No projects found'
      }, { status: 404 });
    }

    // Group projects by title
    const titleGroups = new Map<string, any[]>();
    projects.forEach(project => {
      if (!titleGroups.has(project.title)) {
        titleGroups.set(project.title, []);
      }
      titleGroups.get(project.title)!.push(project);
    });

    // Find duplicates
    const duplicates: { title: string; projects: any[] }[] = [];
    for (const [title, group] of titleGroups) {
      if (group.length > 1) {
        duplicates.push({ title, projects: group });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Projects retrieved successfully',
      totalProjects: projects.length,
      uniqueTitles: titleGroups.size,
      duplicates: duplicates.map(d => ({
        title: d.title,
        count: d.projects.length,
        projects: d.projects.map(p => ({
          id: p.id,
          created_at: p.created_at,
          updated_at: p.updated_at
        }))
      }))
    });

  } catch (error) {
    console.error('❌ Test DB failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test DB failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Clean up duplicate projects - keep the most recent one for each title
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get projects',
        details: projectsError
      }, { status: 500 });
    }

    // Group projects by title
    const titleGroups = new Map<string, any[]>();
    projects.forEach(project => {
      if (!titleGroups.has(project.title)) {
        titleGroups.set(project.title, []);
      }
      titleGroups.get(project.title)!.push(project);
    });

    let cleanedCount = 0;
    const cleanedProjects: string[] = [];

    // For each duplicate group, keep the most recent and delete the rest
    for (const [title, group] of titleGroups) {
      if (group.length > 1) {
        console.log(`🧹 Cleaning up duplicates for title: ${title} (${group.length} projects)`);
        
        // Sort by creation date, newest first
        group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Keep the first (newest) project, delete the rest
        const toDelete = group.slice(1);
        
        for (const duplicate of toDelete) {
          // First delete associated skill atoms
          const { error: skillAtomError } = await supabase
            .from('skill_atoms')
            .delete()
            .eq('project_id', duplicate.id);

          if (skillAtomError) {
            console.error(`❌ Error deleting skill atoms for project ${duplicate.id}:`, skillAtomError);
            continue;
          }

          // Then delete the project
          const { error: projectError } = await supabase
            .from('projects')
            .delete()
            .eq('id', duplicate.id);

          if (projectError) {
            console.error(`❌ Error deleting project ${duplicate.id}:`, projectError);
            continue;
          }

          cleanedProjects.push(duplicate.id);
          cleanedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      cleanedCount,
      cleanedProjects
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
