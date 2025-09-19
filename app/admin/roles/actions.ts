// app/admin/roles/actions.ts
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
                get(name: string) { 
                    return cookieStore.get(name)?.value; 
                },
            },
        }
    );
};

interface RoleData {
    name: string;
    description: string;
}

export async function createRole(roleData: RoleData, permissions: string[]) {
    try {
        const supabase = await createSupabaseServerClient();
        
        // Insert role
        const { data: newRole, error: roleError } = await supabase
            .from('roles')
            .insert({ ...roleData, guard_name: 'web' })
            .select()
            .single();
            
        if (roleError) {
            console.error('Role creation error:', roleError);
            return { error: roleError };
        }

        // Insert permissions if any
        if (permissions.length > 0) {
            const permissionsToInsert = permissions.map(permission_id => ({
                role_id: newRole.id,
                permission_id: parseInt(permission_id, 10), // Convert to integer
            }));
            
            console.log('Inserting permissions:', permissionsToInsert);
            
            const { error: permError } = await supabase
                .from('role_has_permissions')
                .insert(permissionsToInsert);
                
            if (permError) {
                console.error('Permission insertion error:', permError);
                // Rollback: delete the created role
                await supabase.from('roles').delete().eq('id', newRole.id);
                return { error: permError };
            }
        }
        
        revalidatePath('/admin/roles');
        return { data: newRole };
    } catch (error) {
        console.error('Unexpected error in createRole:', error);
        return { error: { message: 'Unexpected error occurred' } };
    }
}

export async function updateRole(id: number, roleData: RoleData, permissions: string[]) {
    try {
        const supabase = await createSupabaseServerClient();
        
        // Validate ID
        if (!id || isNaN(id)) {
            return { error: { message: 'Invalid role ID' } };
        }

        // Update role
        const { error: roleError } = await supabase
            .from('roles')
            .update(roleData)
            .eq('id', id);
            
        if (roleError) {
            console.error('Role update error:', roleError);
            return { error: roleError };
        }

        // Delete existing permissions
        const { error: deleteError } = await supabase
            .from('role_has_permissions')
            .delete()
            .eq('role_id', id);
            
        if (deleteError) {
            console.error('Permission deletion error:', deleteError);
            return { error: deleteError };
        }

        // Insert new permissions if any
        if (permissions.length > 0) {
            const permissionsToInsert = permissions.map(permission_id => ({
                role_id: id,
                permission_id: parseInt(permission_id, 10), // Convert to integer
            }));
            
            console.log('Inserting permissions for update:', permissionsToInsert);
            
            const { error: insertError } = await supabase
                .from('role_has_permissions')
                .insert(permissionsToInsert);
                
            if (insertError) {
                console.error('Permission insertion error:', insertError);
                return { error: insertError };
            }
        }
        
        revalidatePath('/admin/roles');
        return { data: { success: true } };
    } catch (error) {
        console.error('Unexpected error in updateRole:', error);
        return { error: { message: 'Unexpected error occurred' } };
    }
}

export async function deleteRole(id: number) {
    try {
        const supabase = await createSupabaseServerClient();
        
        // Validate ID
        if (!id || isNaN(id)) {
            return { error: { message: 'Invalid role ID' } };
        }

        // Delete permissions first (foreign key constraint)
        const { error: permError } = await supabase
            .from('role_has_permissions')
            .delete()
            .eq('role_id', id);
            
        if (permError) {
            console.error('Permission deletion error:', permError);
            return { error: permError };
        }
        
        // Delete role
        const { error: roleError } = await supabase
            .from('roles')
            .delete()
            .eq('id', id);
            
        if (roleError) {
            console.error('Role deletion error:', roleError);
            return { error: roleError };
        }

        revalidatePath('/admin/roles');
        return { data: { success: true } };
    } catch (error) {
        console.error('Unexpected error in deleteRole:', error);
        return { error: { message: 'Unexpected error occurred' } };
    }
}