// app/admin/roles/actions.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const createSupabaseServerClient = () => {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                async get(name: string) { return (await cookieStore).get(name)?.value; },
            },
        }
    );
};

interface RoleData {
    name: string;
    description: string;
}

export async function createRole(roleData: RoleData, permissions: string[]) {
    const supabase = createSupabaseServerClient();
    const { data: newRole, error: roleError } = await supabase.from('roles').insert({ ...roleData, guard_name: 'web' }).select().single();
    if (roleError) return { error: roleError };

    if (permissions.length > 0) {
        const permissionsToInsert = permissions.map(permission_id => ({
            role_id: newRole.id,
            permission_id: permission_id, // Pastikan nama kolom ini benar
        }));
        const { error: permError } = await supabase.from('role_has_permissions').insert(permissionsToInsert);
        if (permError) return { error: permError };
    }
    revalidatePath('/admin/roles');
    return { data: newRole };
}

export async function updateRole(id: number, roleData: RoleData, permissions: string[]) {
    const supabase = createSupabaseServerClient();
    const { error: roleError } = await supabase.from('roles').update(roleData).eq('id', id);
    if (roleError) return { error: roleError };

    const { error: deleteError } = await supabase.from('role_has_permissions').delete().eq('role_id', id);
    if (deleteError) return { error: deleteError };

    if (permissions.length > 0) {
        const permissionsToInsert = permissions.map(permission_id => ({
            role_id: id,
            permission_id: permission_id,
        }));
        const { error: insertError } = await supabase.from('role_has_permissions').insert(permissionsToInsert);
        if (insertError) return { error: insertError };
    }
    revalidatePath('/admin/roles');
    return { data: { success: true } };
}

export async function deleteRole(id: number) {
    const supabase = createSupabaseServerClient();
    const { error: permError } = await supabase.from('role_has_permissions').delete().eq('role_id', id);
    if (permError) return { error: permError };
    
    const { error: roleError } = await supabase.from('roles').delete().eq('id', id);
    if (roleError) return { error: roleError };

    revalidatePath('/admin/roles');
    return { data: { success: true } };
}