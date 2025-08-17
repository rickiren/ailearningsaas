import { NextRequest, NextResponse } from 'next/server';
import { DrillService } from '@/lib/drill-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const skillAtomId = searchParams.get('skillAtomId');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const skillName = searchParams.get('skillName');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let drills;
    
    if (projectId) {
      drills = await DrillService.getDrillsByProject(projectId);
    } else if (skillAtomId) {
      drills = await DrillService.getDrillsBySkillAtom(skillAtomId);
    } else if (type) {
      drills = await DrillService.getDrillsByType(type);
    } else if (difficulty) {
      drills = await DrillService.getDrillsByDifficulty(difficulty);
    } else if (skillName) {
      // Search by skill name
      const searchResults = await DrillService.searchDrills(skillName);
      drills = searchResults.filter(drill => 
        drill.skill_name.toLowerCase().includes(skillName.toLowerCase())
      );
    } else {
      // Get paginated drills
      const result = await DrillService.getDrillsPaginated(page, limit, {
        type: type || undefined,
        difficulty: difficulty || undefined,
        skillName: skillName || undefined,
        projectId: projectId || undefined,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ drills });
  } catch (error) {
    console.error('Error fetching drills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const drill = await DrillService.createDrill(body);
    return NextResponse.json(drill, { status: 201 });
  } catch (error) {
    console.error('Error creating drill:', error);
    return NextResponse.json(
      { error: 'Failed to create drill' },
      { status: 500 }
    );
  }
}
