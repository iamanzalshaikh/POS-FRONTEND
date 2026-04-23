import * as XLSX from 'xlsx';

/**
 * Utility to export data to an Excel (XLSX) file
 * 
 * @param data Array of objects or arrays to export
 * @param fileName Name of the file to be downloaded (without extension)
 * @param sheetName Name of the sheet within the Excel file
 * @param headers Optional custom headers for the sheet
 */
export const exportToExcel = (
  data: any[],
  fileName: string,
  sheetName: string = 'Report',
  headers?: string[]
) => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    // If it's an array of arrays, use aoa_to_sheet. If it's an array of objects, use json_to_sheet.
    let ws;
    if (data.length > 0 && Array.isArray(data[0])) {
      // If we have custom headers, prepend them to the data
      const finalData = headers ? [headers, ...data] : data;
      ws = XLSX.utils.aoa_to_sheet(finalData);
    } else {
      ws = XLSX.utils.json_to_sheet(data, { header: headers });
    }
    
    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate and download the file
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    
    console.log(`📊 [Excel Utility] Successfully exported ${fileName}.xlsx`);
  } catch (error) {
    console.error('❌ [Excel Utility] Export failed:', error);
    throw new Error('Failed to generate Excel file');
  }
};
