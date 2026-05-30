/**
 * GOOGLE APPS SCRIPT FOR DEDICATED "SELL OUT" GOOGLE SHEET
 * 
 * Instructions:
 * 1. Open your "Sell Out Kalimantan" Google Sheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code and paste this entire script.
 * 4. Click Save (floppy icon).
 * 5. Click "Deploy" -> "New deployment".
 * 6. Under "Select type", click the gear icon and select "Web app".
 * 7. Set:
 *    - Description: "Sell Out API"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone"
 * 8. Click Deploy, authorize permissions if requested, and copy the "Web app URL".
 * 9. Save this URL to your SELL_OUT_SCRIPT_URL configuration in AI Studio Secrets.
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Default to the first sheet if "SELL_OUT" does not exist
    const sheetName = e && e.parameter && e.parameter.sheet ? e.parameter.sheet : "SELL_OUT"; 
    const sheet = ss.getSheetByName(sheetName) || ss.getSheetByName("SELL_OUT") || ss.getSheets()[0];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        let key = header.toString().toLowerCase().trim().replace(/\s+/g, '_');
        
        // Dynamic mapping of key names to support various formats
        if (key.includes('date') || key.includes('tanggal')) {
          key = 'calendar_date';
        } else if (key.includes('channel') || key.includes('saluran')) {
          key = 'channel';
        } else if (key.includes('brand') || key.includes('merek')) {
          key = 'brand_of';
        } else if (key.includes('region') || key.includes('wilayah')) {
          key = 'region';
        } else if (key.includes('category') || key.includes('kategori')) {
          key = 'category';
        } else if (key.includes('segment') || key.includes('segmen')) {
          key = 'segment';
        } else if (key.includes('sell_through') || key.includes('sellthrough')) {
          key = 'sell_through_value';
        } else if (key.includes('sell_out') || key.includes('sellout')) {
          key = 'sell_out_value';
        } else if (key.includes('ba_store') || key.includes('ba_non_ba') || key.includes('ba_vs_non_ba')) {
          key = 'ba_store_non_ba_store';
        }
        
        let val = row[i];
        
        // Handle date formats safely
        if (val instanceof Date) {
          val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "MM/dd/yyyy");
        } else if (typeof val === 'string' && val.trim() === '') {
          val = '';
        }
        
        obj[key] = val;
      });
      return obj;
    });
    
    // Add CORS headers to plain text response formatted as JSON
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: err.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}
