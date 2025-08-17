import { NextRequest, NextResponse } from 'next/server';
import { DrillService } from '@/lib/drill-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drill = await DrillService.getDrillById(params.id);
    
    if (!drill) {
      return NextResponse.json(
        { error: 'Drill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(drill);
  } catch (error) {
    console.error('Error fetching drill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drill' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updatedDrill = await DrillService.updateDrill(params.id, body);
    return NextResponse.json(updatedDrill);
  } catch (error) {
    console.error('Error updating drill:', error);
    return NextResponse.json(
      { error: 'Failed to update drill' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await DrillService.deleteDrill(params.id);
    return NextResponse.json({ message: 'Drill deleted successfully' });
  } catch (error) {
    console.error('Error deleting drill:', error);
    return NextResponse.json(
      { error: 'Failed to delete drill' },
      { status: 500 }
    );
  }
}
