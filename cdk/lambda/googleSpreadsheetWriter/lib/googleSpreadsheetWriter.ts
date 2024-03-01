import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
type Credentials = {
  client_email: string;
  private_key: string;
};

type RowCellData = string | number | boolean | Date;

export const getJWT = ({ credentials }: { credentials: Credentials }) => {
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ];
  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes,
  });
};

export const getDoc = async ({
  sheetId,
  credentials,
}: {
  sheetId: string;
  credentials: Credentials;
}) => {
  const jwt = getJWT({ credentials });
  const doc = new GoogleSpreadsheet(sheetId, jwt);

  await doc.loadInfo(); // loads document properties and worksheets
  return doc;
};

export const getSheet = async ({
  doc,
  sheetName,
}: {
  doc: GoogleSpreadsheet;
  sheetName: string;
}) => {
  return doc.sheetsByTitle[sheetName];
};

export const getHeadersOfSheet = async ({
  sheet,
  headerRowIndex,
}: {
  sheet: GoogleSpreadsheetWorksheet;
  headerRowIndex?: number;
}) => {
  await sheet.loadHeaderRow(headerRowIndex);
  return sheet.headerValues;
};

export const generateHeaders = ({
  headers,
  data,
}: {
  headers: string[];
  data: Record<string, RowCellData>;
}) => {
  const headerSet = new Set(headers);
  const objectKeys = Object.keys(data);
  const uniqueObjectKeys = objectKeys.filter((key) => !headerSet.has(key));
  return [...headers, ...uniqueObjectKeys];
};

export const setHeaders = async ({
  sheet,
  headers,
  headerRowIndex,
}: {
  sheet: GoogleSpreadsheetWorksheet;
  headers: string[];
  headerRowIndex?: number;
}) => {
  await sheet.setHeaderRow(headers, headerRowIndex);
};

export const addRow = async ({
  sheet,
  data,
}: {
  sheet: GoogleSpreadsheetWorksheet;
  data: Record<string, RowCellData>;
}) => {
  await sheet.addRow(data);
};

export const insertDataToSheet = async ({
  sheetId,
  credentials,
  sheetName,
  data,
  headerRowIndex,
}: {
  sheetId: string;
  credentials: Credentials;
  sheetName: string;
  data: Record<string, RowCellData>;
  headerRowIndex?: number;
}) => {
  const doc = await getDoc({ sheetId, credentials });
  const sheet = await getSheet({ doc, sheetName });
  const headers = await getHeadersOfSheet({ sheet, headerRowIndex });
  const newHeaders = generateHeaders({ headers, data });
  await setHeaders({ sheet, headers: newHeaders, headerRowIndex });
  await addRow({ sheet, data });
};
