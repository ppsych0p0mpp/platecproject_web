import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: classData, error } = await supabase
      .from('classes')
      .select(`
        *,
        admins (id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Get enrollment count
    const { count } = await supabase
      .from('class_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', id);

    return NextResponse.json({
      success: true,
      class: {
        ...classData,
        studentCount: count || 0,
        createdBy: classData.admins,
      },
    });
  } catch (error) {
    console.error('Get class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, description, subject, schedule, is_active } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: classData, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating class:', error);
      return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
    }

    return NextResponse.json({ success: true, class: classData });
  } catch (error) {
    console.error('Update class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase.from('classes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting class:', error);
      return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
