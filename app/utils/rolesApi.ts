// app/utils/rolesApi.ts
import { supabase } from './supabase';

// Ambil semua peran
export const getRoles = async () => {
    const { data, error } = await supabase.from('roles').select('*');
    if (error) throw error;
    return data;
};

// Ambil satu peran berdasarkan ID beserta izinnya
export const getRoleById = async (id: number) => {
    const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // <-- Ganti .single() menjadi .maybeSingle()
        
    if (roleError) throw new Error(`Gagal mengambil peran: ${roleError.message}`);
    if (!role) return null; // Jika tidak ditemukan, kembalikan null
    
    const { data: permissions, error: permError } = await supabase.from('role_has_permissions').select('permission_name').eq('role_id', id);
    if (permError) throw permError;
    
    return { ...role, permissions: permissions.map(p => p.permission_name) };
};

// Membuat peran baru dan menetapkan izin
export const createRole = async (name: string, description: string, permissions: string[]) => {
    // 1. Buat peran baru di tabel 'roles'
    const { data: newRole, error: roleError } = await supabase.from('roles').insert({ name, description, guard_name: 'web' }).select().single();
    if (roleError) throw roleError;

    // 2. Siapkan data izin untuk dihubungkan dengan peran baru
    const permissionsToInsert = permissions.map(permissionName => ({
        role_id: newRole.id,
        permission_name: permissionName, // Sesuaikan dengan nama kolom Anda
    }));
    
    // 3. Masukkan data ke tabel penghubung 'role_has_permissions'
    if (permissionsToInsert.length > 0) {
        const { error: permError } = await supabase.from('role_has_permissions').insert(permissionsToInsert);
        if (permError) throw permError;
    }
    
    return newRole;
};