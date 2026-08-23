const SHEET_NAME = 'Nilai';

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Apps Script harus dibuat dari Google Sheet tujuan melalui Extensions > Apps Script.');
  }
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function doGet() {
  return ContentService
    .createTextOutput('Web App aktif. Gunakan POST untuk menyimpan nilai.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const sheet = getSheet();
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Data POST tidak ditemukan.');
  }
  const data = JSON.parse(e.postData.contents);

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
