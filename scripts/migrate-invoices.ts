/**
 * Migration script to ensure all invoices have proper notes1 and notes2 fields.
 * This helps with backward compatibility when old invoices had mixed data.
 */

import fetch from 'node-fetch';

async function migrateInvoices() {
  console.log('🔄 Starting invoice migration...');

  const token = process.env.API_TOKEN || '';
  if (!token) {
    console.warn('⚠️  No API_TOKEN provided. Migration skipped.');
    return;
  }

  const apiUrl = process.env.BACKEND_URL || 'http://localhost:5000';

  try {
    // Fetch all invoices
    const res = await fetch(`${apiUrl}/api/invoices/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error('❌ Failed to fetch invoices:', res.status);
      return;
    }

    const invoices = await res.json();
    console.log(`📊 Found ${invoices.length} invoices`);

    let updated = 0;
    for (const invoice of invoices) {
      // Check if notes1 or notes2 are empty but notes field has data
      if ((!invoice.notes1 || !invoice.notes2) && invoice.notes) {
        console.log(`⚙️  Updating invoice ${invoice._id}...`);
        // You would need to add a PUT endpoint to update invoices
        // For now, just log what would be updated
        console.log(`   notes1: "${invoice.notes1 || invoice.notes}"`);
        console.log(`   notes2: "${invoice.notes2 || ''}"`);
        updated++;
      }
    }

    console.log(`✅ Migration complete. ${updated} invoices would be updated.`);
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

migrateInvoices();
