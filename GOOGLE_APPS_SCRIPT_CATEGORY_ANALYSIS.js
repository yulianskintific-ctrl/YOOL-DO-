/**
 * GOOGLE APPS SCRIPT FOR DEDICATED "CATEGORY ANALYSIS" GOOGLE SHEET
 * 
 * Instructions:
 * 1. Open your "Category Analysis" Google Sheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code and paste this entire script.
 * 4. Click Save (floppy icon).
 * 5. Click "Deploy" -> "New deployment".
 * 6. Under "Select type", click the gear icon and select "Web app".
 * 7. Set:
 *    - Description: "Category Analysis API"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone"
 * 8. Click Deploy, authorize permissions if requested, and copy the "Web app URL".
 * 9. Save this URL to your CATEGORY_ANALYSIS_SCRIPT_URL configuration in AI Studio Secrets.
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Default to the first sheet if "CATEGORY_ANALYSIS" does not exist
    const sheetName = e && e.parameter && e.parameter.sheet ? e.parameter.sheet : "CATEGORY_ANALYSIS"; 
    const sheet = ss.getSheetByName(sheetName) || ss.getSheetByName("Sheet1") || ss.getSheets()[0];
    
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
        let key = header.toString().toLowerCase().trim().replace(/\s+/g, '_');
        let value = row[i];
        
        // Ensure values are formatted clean
        if (value instanceof Date) {
          // Format date to readable month or YYYY-MM-DD
          value = Utilities.formatDate(value, Session.getScriptTimeZone(), "MMM-yy");
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
