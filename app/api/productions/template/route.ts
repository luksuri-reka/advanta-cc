// app/api/productions/template/route.ts - Enhanced with Excel support
import { NextResponse, NextRequest } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // Default to CSV

    // Template headers
    const templateHeaders = [
      'product_id', 'product_name', 'group_number', 'code_1', 'code_2', 
      'code_3', 'code_4', 'clearance_number', 'company_id', 'company_name',
      'target_certification_wide', 'target_kelas_benih_id', 'target_kelas_benih_name',
      'target_seed_production', 'seed_source_company_id', 'seed_source_company_name',
      'seed_source_male_varietas_id', 'seed_source_male_varietas_name',
      'seed_source_female_varietas_id', 'seed_source_female_varietas_name',
      'seed_source_kelas_benih_id', 'seed_source_kelas_benih_name',
      'seed_source_serial_number', 'seed_source_male_lot_number', 'seed_source_female_lot_number',
      'cert_realization_wide', 'cert_realization_seed_production', 'cert_realization_tanggal_panen',
      'lot_number', 'lot_kelas_benih_id', 'lot_kelas_benih_name',
      'lot_varietas_id', 'lot_varietas_name', 'lot_volume', 'lot_content', 'lot_total',
      'lab_result_certification_number', 'lab_result_test_result',
      'lab_result_incoming_date', 'lab_result_filing_date', 'lab_result_testing_date',
      'lab_result_tested_date', 'lab_result_serial_number', 'lab_result_expired_date',
      'test_param_kadar_air', 'test_param_benih_murni', 'test_param_campuran_varietas_lain',
      'test_param_benih_tanaman_lain', 'test_param_kotoran_benih', 'test_param_daya_berkecambah'
    ];

    // Sample data
    const sampleData = [
      [
        '1', 'Jagung Manis', 'A-001', 'A', 'B', 'C', 'D', '40',
        '1', 'PT Advanta Seeds', '10.5', '1', 'ES', '1000',
        '1', 'PT Advanta Seeds', '1', 'Varietas Jantan A', '2', 'Varietas Betina B',
        '1', 'ES', 'SN-001', 'LOT-M-001', 'LOT-F-001',
        '10.2', '980', '2024-12-15',
        'LOT-001', '1', 'ES', '1', 'Varietas Hibrida', '950', '50', '1000',
        'CERT-001', '95.5', '2024-11-01', '2024-11-05', '2024-11-10', '2024-11-15', 'SER-001', '2025-11-15',
        '12.5', '98.0', '0.5', '0.3', '1.2', '85.0'
      ]
    ];

    if (format.toLowerCase() === 'excel' || format.toLowerCase() === 'xlsx') {
      // Generate Excel file
      const workbook = XLSX.utils.book_new();
      const worksheetData = [templateHeaders, ...sampleData];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = templateHeaders.map(header => ({ wch: Math.max(header.length, 15) }));
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Produksi');

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="template_import_produksi.xlsx"'
        }
      });

    } else {
      // Generate CSV file (existing logic)
      const csvContent = [
        templateHeaders.join(','),
        ...sampleData.map(row => row.join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="template_import_produksi.csv"'
        }
      });
    }

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Gagal membuat template' },
      { status: 500 }
    );
  }
}