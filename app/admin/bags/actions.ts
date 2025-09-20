// app/admin/bags/actions.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );
};

// Helper untuk mengambil data JSONB production
async function getProductionJsonb(supabase: any, productionId: number) {
  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .eq('id', productionId)
    .single();
  
  if (error) throw error;
  return data;
}

// Create Bag
export async function createBag(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const productionId = Number(formData.get('production_id'));
    const production = await getProductionJsonb(supabase, productionId);
    
    const bagData = {
      qr_code: formData.get('qr_code') as string,
      production_id: productionId,
      production: production, // Store full production data as JSONB
      capacity: Number(formData.get('capacity')),
      quantity: Number(formData.get('quantity')),
      packs: Number(formData.get('packs')),
      type: formData.get('type') as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bags')
      .insert(bagData)
      .select()
      .single();

    if (error) {
      console.error('Error creating bag:', error);
      return { error };
    }

    // Optionally generate bag pieces immediately
    if (data && bagData.quantity > 0) {
      await generateInitialBagPieces(supabase, data.id, bagData.qr_code, bagData.quantity);
    }

    revalidatePath('/admin/bags');
    return { data };
  } catch (error: any) {
    console.error('Error in createBag:', error);
    return { error: { message: error.message } };
  }
}

// Update Bag
export async function updateBag(id: number, formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const productionId = Number(formData.get('production_id'));
    const production = await getProductionJsonb(supabase, productionId);
    
    const updateData = {
      qr_code: formData.get('qr_code') as string,
      production_id: productionId,
      production: production,
      capacity: Number(formData.get('capacity')),
      quantity: Number(formData.get('quantity')),
      packs: Number(formData.get('packs')),
      type: formData.get('type') as string,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bag:', error);
      return { error };
    }

    revalidatePath('/admin/bags');
    return { data };
  } catch (error: any) {
    console.error('Error in updateBag:', error);
    return { error: { message: error.message } };
  }
}

// Delete Bag (will cascade delete bag_pieces)
export async function deleteBag(id: number) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // First delete all bag_pieces
    await supabase
      .from('bag_pieces')
      .delete()
      .eq('bag_id', id);

    // Then delete the bag
    const { error } = await supabase
      .from('bags')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bag:', error);
      return { error };
    }

    revalidatePath('/admin/bags');
    return { data: { success: true } };
  } catch (error: any) {
    console.error('Error in deleteBag:', error);
    return { error: { message: error.message } };
  }
}

// Generate Bag Pieces
async function generateInitialBagPieces(
  supabase: any, 
  bagId: number, 
  bagQrCode: string, 
  quantity: number
) {
  try {
    const pieces = [];
    const baseSerial = bagQrCode.replace('BAG-', '');
    
    for (let i = 0; i < quantity; i++) {
      const serialNumber = `${baseSerial}-${String(i + 1).padStart(4, '0')}`;
      const qrCode = `QR-${serialNumber}`;
      
      pieces.push({
        bag_id: bagId,
        serial_number: serialNumber,
        qr_code: qrCode,
        qr_expired_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    if (pieces.length > 0) {
      const { error } = await supabase
        .from('bag_pieces')
        .insert(pieces);
      
      if (error) {
        console.error('Error generating bag pieces:', error);
      }
    }
  } catch (error) {
    console.error('Error in generateInitialBagPieces:', error);
  }
}

// Generate Bag Pieces (untuk modal generate QR)
export async function generateBagPieces(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const bagId = Number(formData.get('bagId'));
    const prefix = formData.get('prefix') as string;
    const startNumber = Number(formData.get('startNumber'));
    const quantity = Number(formData.get('quantity'));
    const expiryMonths = Number(formData.get('expiryMonths'));
    
    // Get bag info
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('qr_code, quantity')
      .eq('id', bagId)
      .single();
    
    if (bagError || !bag) {
      return { error: { message: 'Bag tidak ditemukan' } };
    }
    
    // Check if already has pieces
    const { count: existingCount } = await supabase
      .from('bag_pieces')
      .select('*', { count: 'exact', head: true })
      .eq('bag_id', bagId);
    
    if ((existingCount || 0) + quantity > bag.quantity) {
      return { error: { message: 'Jumlah QR melebihi kapasitas bag' } };
    }
    
    // Generate pieces
    const pieces = [];
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    
    for (let i = 0; i < quantity; i++) {
      const number = startNumber + i;
      const serialNumber = `${prefix}-${String(number).padStart(6, '0')}`;
      const qrCode = `QR-${serialNumber}`;
      
      pieces.push({
        bag_id: bagId,
        serial_number: serialNumber,
        qr_code: qrCode,
        qr_expired_date: expiryDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    const { error: insertError } = await supabase
      .from('bag_pieces')
      .insert(pieces);
    
    if (insertError) {
      console.error('Error inserting bag pieces:', insertError);
      return { error: insertError };
    }
    
    revalidatePath('/admin/bags');
    return { 
      data: { 
        generated: quantity,
        bagCode: bag.qr_code
      } 
    };
  } catch (error: any) {
    console.error('Error in generateBagPieces:', error);
    return { error: { message: error.message } };
  }
}

// Mark Bag as Downloaded
export async function markBagAsDownloaded(bagId: number) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from('bags')
      .update({ 
        downloaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bagId);
    
    if (error) {
      console.error('Error marking bag as downloaded:', error);
      return { error };
    }
    
    revalidatePath('/admin/bags');
    return { data: { success: true } };
  } catch (error: any) {
    console.error('Error in markBagAsDownloaded:', error);
    return { error: { message: error.message } };
  }
}

// Export Bag QR Codes (for download functionality)
export async function exportBagQRCodes(bagId: number) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get bag with pieces
    const { data: bag, error } = await supabase
      .from('bags')
      .select(`
        *,
        bag_pieces (
          serial_number,
          qr_code,
          qr_expired_date
        )
      `)
      .eq('id', bagId)
      .single();
    
    if (error || !bag) {
      return { error: { message: 'Bag tidak ditemukan' } };
    }
    
    // Mark as downloaded
    await markBagAsDownloaded(bagId);
    
    // Format data for export
    const exportData = {
      bag_info: {
        qr_code: bag.qr_code,
        type: bag.type,
        capacity: bag.capacity,
        production_id: bag.production_id,
        exported_at: new Date().toISOString()
      },
      pieces: bag.bag_pieces
    };
    
    return { data: exportData };
  } catch (error: any) {
    console.error('Error in exportBagQRCodes:', error);
    return { error: { message: error.message } };
  }
}