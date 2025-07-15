import { defineEventHandler } from "h3";

export type InvoicesData = string[] | string[][];

const generateFakeData = (): InvoicesData => {
  const data = [];
  const dataLength = 125 + Math.round(Math.random() * 50);
  for (let i = 0; i < dataLength; i++) {
    data.push((Math.round(Math.random() * 4700) + 300).toString());
  }

  return data;
};

export default defineEventHandler(async (event): Promise<InvoicesData> => {
  const runtimeConfig = useRuntimeConfig();
  const range = "Total!A:B";

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${runtimeConfig.invoiceSheetId}/values/${range}?key=${runtimeConfig.googleAPIKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return data && data.values ? data.values : generateFakeData();
  } catch (error) {
    return generateFakeData();
  }
});
