import { NextResponse } from 'next/server';
import { getProductionAccess } from '@/app/admin/access';

export async function rejectUnauthorizedProductionRequest(permission: 'view' | 'manage' | 'download') {
  const access = await getProductionAccess();
  if (!access.authenticated) {
    return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
  }
  if (!access[permission]) {
    return NextResponse.json({ error: 'Anda tidak memiliki izin untuk aksi ini.' }, { status: 403 });
  }
}
