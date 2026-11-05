// app/api/productions/[id]/route.ts
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/app/utils/supabase/service';
import { rejectUnauthorizedProductionRequest } from '../access';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await rejectUnauthorizedProductionRequest('view');
    if (denied) return denied;

    const { id } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('productions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
