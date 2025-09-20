// app/api/bags/export/[id]/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bagId = parseInt(id);
    
    if (isNaN(bagId)) {
      return NextResponse.json(
        { error: 'Invalid bag ID' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
        },
      }
    );

    // Get bag with pieces
    const { data: bag, error } = await supabase
      .from('bags')
      .select(`
        *,
        bag_pieces (
          id,
          serial_number,
          qr_code,
          qr_expired_date
        )
      `)
      .eq('id', bagId)
      .single();

    if (error || !bag) {
      return NextResponse.json(
        { error: 'Bag not found' },
        { status: 404 }
      );
    }

    // Mark as downloaded
    await supabase
      .from('bags')
      .update({ 
        downloaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bagId);

    // Create CSV content
    const csvHeaders = [
      'Bag QR Code',
      'Type',
      'Piece Number',
      'Serial Number',
      'QR Code',
      'Expired Date',
      'Production ID',
      'Product Name',
      'Company Name'
    ];

    const csvRows = bag.bag_pieces.map((piece: any, index: number) => [
      bag.qr_code,
      bag.type,
      index + 1,
      piece.serial_number,
      piece.qr_code,
      piece.qr_expired_date ? new Date(piece.qr_expired_date).toLocaleDateString('id-ID') : '-',
      bag.production_id,
      bag.production?.product?.name || '-',
      bag.production?.company?.name || '-'
    ]);

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bag_${bag.qr_code}_pieces.csv"`
      }
    });

  } catch (error: any) {
    console.error('Error exporting bag:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}