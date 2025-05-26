import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const range = "Total!A:B";

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${runtimeConfig.invoiceSheetId}/values/${range}?key=${runtimeConfig.googleAPIKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (error) {
    return null;
  }
});
