const SHEET_NAME = 'Nilai';
const CONFIG_SHEET_NAME = 'Config';

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Apps Script harus dibuat dari Google Sheet tujuan melalui Extensions > Apps Script.');
  }
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function getConfigSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Apps Script harus dibuat dari Google Sheet tujuan melalui Extensions > Apps Script.');
  }
  const sheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME) || spreadsheet.insertSheet(CONFIG_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(['Kunci', 'Nilai']);
  return sheet;
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'config') {
    const sheet = getConfigSheet();
    const values = sheet.getDataRange().getValues();
    const data = {};
    values.slice(1).forEach(row => {
      if (!row[0]) return;
      try {
        data[row[0]] = JSON.parse(row[1]);
      } catch (error) {
        data[row[0]] = row[1];
      }
    });
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput('Web App aktif. Gunakan POST untuk menyimpan nilai.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Data POST tidak ditemukan.');
  }
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'saveConfig') {
    const sheet = getConfigSheet();
    const rows = sheet.getDataRange().getValues();
    const rowIndex = rows.findIndex(row => row[0] === data.key);
    const value = JSON.stringify(data.value);
    if (rowIndex >= 0) sheet.getRange(rowIndex + 1, 2).setValue(value);
    else sheet.appendRow([data.key, value]);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Waktu', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Skor', 'Total Soal']);
  } else {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (!headers.includes('Kelas')) {
      sheet.insertColumnAfter(2);
      sheet.getRange(1, 3).setValue('Kelas');
    }
  }

  sheet.appendRow([
    new Date(data.waktu || Date.now()),
    data.nama || 'Tanpa nama',
    data.kelas || '-',
    data.mapel || '-',
    Number(data.skor) || 0,
    Number(data.totalSoal) || 0
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
