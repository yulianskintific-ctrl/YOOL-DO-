/**
 * GOOGLE APPS SCRIPT FOR DEDICATED "STOCK ANALYSIS" GOOGLE SHEET
 * 
 * Instructions:
 * 1. Open your "Stock Analysis" Google Sheet (In Transit Stock - Kalimantan, etc.).
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code and paste this entire script.
 * 4. Click Save (floppy icon).
 * 5. Click "Deploy" -> "New deployment".
 * 6. Under "Select type", click the gear icon and select "Web app".
 * 7. Set:
 *    - Description: "Stock Analysis API"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone"
 * 8. Click Deploy, authorize permissions if requested, and copy the "Web app URL".
 * 9. Save this URL to your STOCK_ANALYSIS_SCRIPT_URL configuration in AI Studio Secrets or VITE_STOCK_ANALYSIS_SCRIPT_URL in .env.example.
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Use specified sheet in parameter, or look for sheets like "In Transit Stock", "Stock Analysis", "Sheet1", etc.
    const sheetName = e && e.parameter && e.parameter.sheet ? e.parameter.sheet : ""; 
    let sheet;
    if (sheetName) {
      sheet = ss.getSheetByName(sheetName);
    }
    if (!sheet) {
      // Find first sheet that isn't empty or first sheet overall
      sheet = ss.getSheets()[0];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        if (!header) return;
        let key = header.toString().toLowerCase().trim().replace(/[\s\-\.\/]+/g, '_');
        let value = row[i];
        
        // Ensure values are formatted clean
        if (value instanceof Date) {
          value = Utilities.formatDate(value, Session.getScriptTimeZone(), "MM/dd/yyyy");
        }
        
        obj[key] = value;
      });
      return obj;
    });
    
    const responsePayload = {
      success: true,
      data: result
    };
    
    return ContentService.createTextOutput(JSON.stringify(responsePayload))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errorPayload = {
      success: false,
      error: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorPayload))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
