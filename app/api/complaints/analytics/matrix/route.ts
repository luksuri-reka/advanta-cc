import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

const parseQty = (val: string | null | undefined): number => {
  if (!val) return 0;
  // Try to match digits, periods, and commas
  const matched = val.match(/[\d.,]+/);
  if (matched) {
    const numStr = matched[0].replace(/,/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Maps territory codes. Expand logic based on regions if needed.
const getTerritory = (province: string | null): string => {
  if (!province) return 'T8';
  const p = province.toLowerCase();
  
  if (p.includes('north sumatera') || p.includes('sumatera utara') || p.includes('west sumatera') || p.includes('sumatera barat') || p.includes('aceh')) return 'T1';
  if (p.includes('lampung') || p.includes('south sumatera') || p.includes('sumatera selatan') || p.includes('jambi') || p.includes('riau') || p.includes('bengkulu') || p.includes('bangka')) return 'T2';
  if (p.includes('central java') || p.includes('jawa tengah') || p.includes('west java') || p.includes('jawa barat') || p.includes('banten') || p.includes('jakarta') || p.includes('yogyakarta')) return 'T3';
  if (p.includes('east java') || p.includes('jawa timur')) return 'T4';
  if (p.includes('south sulawesi') || p.includes('sulawesi selatan') || p.includes('sulawesi barat') || p.includes('sulawesi tenggara')) return 'T5';
  if (p.includes('gorontalo') || p.includes('central sulawesi') || p.includes('sulawesi tengah') || p.includes('sulawesi utara')) return 'T6';
  if (p.includes('ntb') || p.includes('ntt') || p.includes('nusa tenggara') || p.includes('bali') || p.includes('papua') || p.includes('maluku')) return 'T7';
  if (p.includes('kalimantan')) return 'T8';
  
  return 'T8'; // Catch-all default
};

// Simple heuristic to determine the crop from hybrid name
const getCropFamily = (hybrid: string | null): string => {
  if (!hybrid) return 'Unknown';
  const h = hybrid.toLowerCase();
  const fieldCorns = ['jago', 'joss', 'montok', 'ganesh', 'jalu', 'bejo', 'ruby'];
  const freshCorns = ['madu', 'anara', 'renjana', 'fancy'];
  const veggies = ['nona', 'deby', 'beijing', 'tomato', 'cabbage'];
  
  if (fieldCorns.some(k => h.includes(k))) return 'Field Corn';
  if (freshCorns.some(k => h.includes(k))) return 'Fresh Corn';
  if (veggies.some(k => h.includes(k))) return 'Vegetables';
  return 'Other';
};

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch complaints and their investigations
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select(`
        id,
        status,
        customer_province,
        related_product_name,
        problematic_quantity,
        complaint_category_name,
        complaint_case_type_names,
        complaint_type,
        created_at,
        complaint_investigations (
          is_valid,
          investigation_result,
          investigation_conclusion,
          root_cause_category,
          problematic_quantity_kg
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Initialize accumulators
    const hybridMap: Record<string, any> = {};      // Crop -> { hybrids: Map<Hybrid, Metrics> }
    const conclusionMap: Record<string, any> = {};  // Conclusion -> { types: Map<Type, Metrics> }
    const locationMap: Record<string, any> = {};    // Crop -> { T1...T8 }

    const initMetrics = () => ({
      count: { total: 0, confirmed: 0, observasi: 0, investigation: 0, labTest: 0, waitingDecision: 0, closedTotal: 0, validMfg: 0, validNonMfg: 0, nonValid: 0, notComplaint: 0 },
      qty: { total: 0, confirmed: 0, observasi: 0, investigation: 0, labTest: 0, waitingDecision: 0, closedTotal: 0, validMfg: 0, validNonMfg: 0, nonValid: 0, notComplaint: 0 }
    });

    const categoriesList = ['Germination & Vigor', 'Seed damage', 'Packaging', 'Small Plant', 'Delivery *)'];

    complaints?.forEach(c => {
      // 1. Parse quantity
      let qtyNum = parseQty(c.problematic_quantity);
      const invs = Array.isArray(c.complaint_investigations) ? c.complaint_investigations[0] : c.complaint_investigations;
      if (invs?.problematic_quantity_kg) {
        let invQty = parseQty(invs.problematic_quantity_kg);
        if (invQty > 0) qtyNum = invQty; // investigation quantity is usually more accurate
      }

      // 2. Identify Status logic
      const status = (c.status || '').toLowerCase();
      const metricsUpdate = { count: {} as any, qty: {} as any };
      
      const addMetric = (key: string) => {
        metricsUpdate.count[key] = 1;
        metricsUpdate.qty[key] = qtyNum;
      };

      addMetric('total');

      if (['submitted', 'assigned'].includes(status)) addMetric('confirmed');
      else if (status === 'observasi') addMetric('observasi');
      else if (status === 'investigation') addMetric('investigation');
      else if (status === 'lab_test') addMetric('labTest');
      else if (status === 'waiting_decision') addMetric('waitingDecision');
      else if (['resolved', 'closed'].includes(status)) {
        addMetric('closedTotal');

        // Logic for Close conclusions
        let isValid = !!invs?.is_valid;
        let rootCause = (invs?.root_cause_category || c.complaint_type || '').toLowerCase();
        let closeSubCategory = 'nonValid';

        if (status === 'rejected' || rootCause === 'not_a_complaint') closeSubCategory = 'notComplaint';
        else if (isValid) {
          if (rootCause.includes('non') || rootCause.includes('farmer') || rootCause.includes('environment')) {
            closeSubCategory = 'validNonMfg';
          } else {
            closeSubCategory = 'validMfg';
          }
        } else {
          closeSubCategory = 'nonValid';
        }

        addMetric(closeSubCategory);
      }

      // 3. Process Hybrid Matrix (Crop -> Hybrid)
      const hybridName = c.related_product_name?.trim() || 'Unknown Hybrid';
      const cropName = getCropFamily(hybridName);

      if (!hybridMap[cropName]) hybridMap[cropName] = {};
      if (!hybridMap[cropName][hybridName]) hybridMap[cropName][hybridName] = initMetrics();
      
      Object.keys(metricsUpdate.count).forEach(k => {
        hybridMap[cropName][hybridName].count[k] += metricsUpdate.count[k];
        hybridMap[cropName][hybridName].qty[k] += metricsUpdate.qty[k];
      });

      // 4. Process Conclusion Matrix (Conclusion -> Type)
      // For the conclusion matrix we aggregate regardless if it is closed or not (based on current status mapped to Conclusion name)
      // Or we map conclusion by 'Valid Manufacturing', 'Non Valid', etc based on the closeSubCategory calculated above.
      let conclusionLabel = 'Under Investigation';
      if (['resolved', 'closed'].includes(status)) {
        if (metricsUpdate.count.validMfg) conclusionLabel = 'Valid Manufacturing';
        else if (metricsUpdate.count.validNonMfg) conclusionLabel = 'Valid Non Manufacturing';
        else if (metricsUpdate.count.nonValid) conclusionLabel = 'Non Valid';
        else if (metricsUpdate.count.notComplaint) conclusionLabel = 'Not A Complaint';
      }

      // Find the closest complaint category from list
      let cat = 'Packaging';
      const rawCat = (c.complaint_category_name || '').toLowerCase();
      if (rawCat.includes('germination') || rawCat.includes('vigor')) cat = 'Germination & Vigor';
      else if (rawCat.includes('seed') || rawCat.includes('damage')) cat = 'Seed damage';
      else if (rawCat.includes('plant')) cat = 'Small Plant';
      else if (rawCat.includes('deliver')) cat = 'Delivery *)';

      if (!conclusionMap[conclusionLabel]) conclusionMap[conclusionLabel] = {};
      if (!conclusionMap[conclusionLabel][cat]) conclusionMap[conclusionLabel][cat] = { count: 0, qty: 0 };
      
      conclusionMap[conclusionLabel][cat].count += 1;
      conclusionMap[conclusionLabel][cat].qty += qtyNum;

      // 5. Process Location Matrix (Crop -> Territory)
      const territory = getTerritory(c.customer_province);
      if (!locationMap[cropName]) {
        locationMap[cropName] = { 
          region: cropName, 
          locs: {
            'T1': { count: 0, qty: 0 }, 'T2': { count: 0, qty: 0 }, 'T3': { count: 0, qty: 0 }, 'T4': { count: 0, qty: 0 },
            'T5': { count: 0, qty: 0 }, 'T6': { count: 0, qty: 0 }, 'T7': { count: 0, qty: 0 }, 'T8': { count: 0, qty: 0 }
          }
        };
      }
      locationMap[cropName].locs[territory].count += 1;
      locationMap[cropName].locs[territory].qty += qtyNum;
    });

    // Transform dictionaries to arrays for frontend
    const hybridMatrixData = Object.keys(hybridMap).map(crop => ({
      crop,
      hybrids: Object.keys(hybridMap[crop]).map(h => ({
        name: h,
        metrics: hybridMap[crop][h]
      }))
    }));

    const conclusionMatrixData = Object.keys(conclusionMap).map(conc => {
      const payload: any = { conclusion: conc, metrics: { count: {}, qty: {} } };
      categoriesList.forEach(cat => {
        payload.metrics.count[cat] = conclusionMap[conc][cat]?.count || 0;
        payload.metrics.qty[cat] = conclusionMap[conc][cat]?.qty || 0;
      });
      return payload;
    });

    const locationData = Object.values(locationMap);

    return NextResponse.json({
      success: true,
      data: {
        hybridMatrixData,
        conclusionMatrixData,
        locationData,
        totalRecords: complaints?.length || 0
      }
    });

  } catch (error: any) {
    console.error('Matrix Analytics Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
