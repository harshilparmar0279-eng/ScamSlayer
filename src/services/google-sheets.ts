
'use server';

import { google } from 'googleapis';

const sheets = google.sheets('v4');

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

export async function appendToSheet(spreadsheetId: string, range: string, values: any[][]): Promise<any> {
  const auth = await getAuth();
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
    auth,
  });
  return res.data;
}
