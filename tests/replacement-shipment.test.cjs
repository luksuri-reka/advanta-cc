const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const XLSX = require('xlsx');

const root = path.resolve(__dirname, '..');
function loadTs(file, overrides = {}) {
  const filename = path.resolve(root, file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const localRequire = name => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name.startsWith('@/')) return loadTs(`${name.slice(2)}.ts`, overrides);
    if (name.startsWith('.')) return loadTs(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)), overrides);
    return require(name);
  };
  vm.runInNewContext(source, {
    module, exports: module.exports, require: localRequire, Request, Response, process: { env: {} },
    console: { error() {} },
  }, { filename });
  return module.exports;
}

const shipment = loadTs('app/utils/replacementShipment.ts');
const activeProfile = { is_active: true, complaint_permissions: { canViewComplaints: true, canUpdateComplaintStatus: true } };

test('dates require real calendar dates and preserve DD/MM/YYYY across time zones', () => {
  for (const value of ['2026-02-30', '2026-02-29', '2026-13-01', '0000-01-01', '2026-1-01', '', null, 1, {}]) {
    assert.equal(shipment.isShipmentDate(value), false, String(value));
  }
  for (const value of ['2024-02-29', '2026-10-28', '2026-01-01']) assert.equal(shipment.isShipmentDate(value), true);
  assert.equal(shipment.formatShipmentDate('2026-10-28'), '28/10/2026');
  assert.equal(shipment.validateReplacementShipment('shipped', null), 'Tanggal pengiriman wajib diisi dengan tanggal yang valid');
  assert.equal(shipment.validateReplacementShipment('shipped', '2026-10-28'), null);
  assert.equal(shipment.validateReplacementShipment('pending', null), null);
  assert.equal(shipment.validateReplacementShipment('not_required', null), null);
  assert.ok(shipment.validateReplacementShipment('delivered', '2026-10-28'));
});

test('summary Excel preserves all three statuses and leaves legacy complaints unfilled', () => {
  for (const [status, label, date] of [
    ['shipped', 'Sudah', '28/10/2026'],
    ['pending', 'Belum', '-'],
    ['not_required', 'Tidak Ada Penggantian Benih', '-'],
    [null, 'Belum diisi', '-'],
  ]) {
    const fields = shipment.getReplacementShipmentExportFields({ replacement_shipment_status: status, replacement_shipped_date: '2026-10-28' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([fields]), 'Data Keluhan');
    const saved = XLSX.read(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
    const row = XLSX.utils.sheet_to_json(saved.Sheets['Data Keluhan'])[0];
    assert.equal(row['Status Pengiriman Benih Pengganti'], label);
    assert.equal(row['Tanggal Pengiriman Benih Pengganti'], date);
  }
});

test('all individual Excel reports include shipment status and date', () => {
  let workbook;
  const reports = loadTs('app/utils/complaintReportExcel.ts', {
    xlsx: { ...XLSX, writeFile(value) { workbook = value; } },
  });
  for (const reportType of ['observation', 'investigation', 'labTesting', 'approval']) {
    reports.exportComplaintReportToExcel({
      reportType,
      approvalData: {},
      complaint: {
        id: 1, complaint_number: 'TEST-1', status: 'closed',
        complaint_observations: [{}], complaint_investigations: [{}], complaint_lab_testing: [{}],
        replacement_shipment_status: 'shipped', replacement_shipped_date: '2026-10-28',
      },
    });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Info Keluhan']);
    assert.equal(rows.find(row => row.Field === 'Status Pengiriman Benih Pengganti').Nilai, 'Sudah');
    assert.equal(rows.find(row => row.Field === 'Tanggal Pengiriman Benih Pengganti').Nilai, '28/10/2026');
  }
});

function apiHarness(options = {}) {
  const updates = [];
  const user = options.user === undefined ? { id: 'officer', app_metadata: { roles: [] } } : options.user;
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      const query = {
        select() { return this; },
        eq(field, value) { if (table === 'complaints' && field === 'id') assert.equal(value, '1'); return this; },
        update(payload) { updates.push(payload); return this; },
        insert() { return this; },
        async single() { return this.maybeSingle(); },
        async maybeSingle() {
          if (table === 'user_complaint_profiles') return { data: options.profile === undefined ? activeProfile : options.profile };
          if (updates.length === 0) {
            return { data: options.missing ? null : {
              id: 1, customer_province: 'Jawa Timur', status: 'submitted', ...options.complaint,
            } };
          }
          return { data: options.missing ? null : { id: 1, ...updates.at(-1) }, error: options.error || null };
        },
      };
      return query;
    },
  };
  const overrides = {
    './access': {
      getAdminUser: async () => ({ user, supabase: client }),
      getAdminIdentity: async () => ({ user, isSuperAdmin: user?.app_metadata?.roles?.includes('Superadmin') }),
    },
    '@/app/utils/supabase/service': { createServiceClient: () => client },
    'server-only': {},
    react: { cache: fn => fn },
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
  };
  const { PATCH } = loadTs('app/api/complaints/[id]/replacement-shipment/route.ts', overrides);
  return {
    updates,
    async changeStatus(body) {
      const { POST } = loadTs('app/api/complaints/[id]/status/route.ts', overrides);
      return POST(new Request('http://localhost/api/complaints/1/status', {
        method: 'POST', body: JSON.stringify(body),
      }), { params: Promise.resolve({ id: '1' }) });
    },
    async request(body, id = '1', raw = false) {
      return PATCH(new Request('http://localhost/api/complaints/1/replacement-shipment', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: raw ? body : JSON.stringify(body),
      }), { params: Promise.resolve({ id }) });
    },
  };
}

test('API rejects unauthenticated, inactive and unauthorized users before writing', async () => {
  for (const [options, status] of [
    [{ user: null }, 401],
    [{ profile: null }, 403],
    [{ profile: { ...activeProfile, is_active: false } }, 403],
    [{ profile: { ...activeProfile, complaint_permissions: { ...activeProfile.complaint_permissions, canEditComplaints: false } } }, 403],
    [{ profile: { is_active: true, complaint_permissions: {} }, user: { id: 'x', app_metadata: {}, user_metadata: { complaint_permissions: { canUpdateComplaintStatus: true } } } }, 403],
  ]) {
    const api = apiHarness(options);
    assert.equal((await api.request({ replacement_shipment_status: 'pending' })).status, status);
    assert.equal(api.updates.length, 0);
  }
});

test('API rejects malformed bodies, unknown statuses and missing or invalid shipment dates', async () => {
  const api = apiHarness();
  for (const body of [null, {}, { replacement_shipment_status: {} }, { replacement_shipment_status: 'shipped' },
    { replacement_shipment_status: 'shipped', replacement_shipped_date: '2026-02-30' }]) {
    assert.equal((await api.request(body)).status, 400);
  }
  assert.equal((await api.request('{', '1', true)).status, 400);
  assert.equal((await api.request({}, 'invalid')).status, 400);
  assert.equal(api.updates.length, 0);
});

test('API saves shipment independently of complaint closure and clears obsolete dates', async () => {
  for (const status of ['shipped', 'pending', 'not_required']) {
    const api = apiHarness();
    const response = await api.request({
      replacement_shipment_status: status, replacement_shipped_date: '2026-10-28', status: 'closed',
    });
    assert.equal(response.status, 200);
    assert.equal(api.updates[0].replacement_shipped_date, status === 'shipped' ? '2026-10-28' : null);
    assert.equal(Object.hasOwn(api.updates[0], 'status'), false);
    assert.equal((await response.json()).data.replacement_shipment_status, status);
  }
  const admin = apiHarness({ user: { id: 'admin', app_metadata: { roles: ['Superadmin'] } }, profile: null });
  assert.equal((await admin.request({ replacement_shipment_status: 'pending' })).status, 200);
  const editor = apiHarness({ profile: { is_active: true, complaint_permissions: { canViewComplaints: true, canEditComplaints: true } } });
  assert.equal((await editor.request({ replacement_shipment_status: 'pending' })).status, 200);
});

test('API reports inaccessible records and database failures without reporting success', async () => {
  for (const [options, status] of [[{ missing: true }, 404], [{ error: { code: '42501' } }, 403], [{ error: { code: '23514' } }, 500]]) {
    const response = await apiHarness(options).request({ replacement_shipment_status: 'pending' });
    assert.equal(response.status, status);
    assert.ok((await response.json()).error);
  }
});

test('Complaint Team can confirm an unassigned complaint using the saved Edit Complaints flag', async () => {
  const profile = {
    is_active: true, department: 'admin',
    complaint_permissions: { canViewComplaints: true, canEditComplaints: true },
  };
  const editor = apiHarness({ profile });
  const result = await editor.changeStatus({ status: 'acknowledged' });
  assert.equal(result.status, 200);
  assert.equal(editor.updates[0].status, 'acknowledged');

  const close = apiHarness({ profile });
  assert.equal((await close.changeStatus({ status: 'resolved', complaint_validity: 'non_valid' })).status, 403);
  assert.equal(close.updates.length, 0);

  const outside = apiHarness({ profile: { ...profile, assigned_regions: ['Jawa Barat'] } });
  assert.equal((await outside.changeStatus({ status: 'acknowledged' })).status, 404);
  assert.equal(outside.updates.length, 0);
});

test('assigned legacy staff still work while explicit revocation blocks the same action', async () => {
  const complaint = { assignee_observasi: 'officer' };
  const flags = { canViewComplaints: true, canRespondToComplaints: true };
  const legacy = apiHarness({ complaint, profile: { is_active: true, complaint_permissions: flags } });
  assert.equal((await legacy.changeStatus({ status: 'acknowledged' })).status, 200);
  const blocked = apiHarness({ complaint, profile: {
    is_active: true, complaint_permissions: { ...flags, canEditComplaints: false },
  } });
  assert.equal((await blocked.changeStatus({ status: 'acknowledged' })).status, 403);
  assert.equal(blocked.updates.length, 0);
});
