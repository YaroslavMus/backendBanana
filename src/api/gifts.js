import axios from 'axios';

import { parseXML } from '../formort/xmlParser.js';
import { processXMLData } from '../formort/xmlProcessor.js';
import { mergePricesWithProductCard } from '../formort/mergePricesWithProductCard.js';
import config from '../../config.js';

export async function fetchApiGiftData() {
  let item = {};
  try {
    const response = await axios.get(
      `https://${config.GIFTS_API_KEY}@api2.gifts.ru/export/v2/catalogue/product.xml`,
    );
    const responseStock = await axios.get(
      `https://${config.GIFTS_API_KEY}@api2.gifts.ru/export/v2/catalogue/stock.xml`,
    );
    const xmlData = response.data;
    const resultData = await parseXML(xmlData);
    const processedData = processXMLData(resultData);

    const xmlStock = responseStock.data;
    const resultStock = await parseXML(xmlStock);
    const processedStock = processXMLData(resultStock);

    const jsonStringData = JSON.stringify(processedData, null, 2);
    const jsonStringStock = JSON.stringify(processedStock, null, 2);

    const jsonData = JSON.parse(jsonStringData);
    const jsonDataStock = JSON.parse(jsonStringStock);

    const mergedProductCard = mergePricesWithProductCard(jsonDataStock, jsonData);

    const mergedJsonString = JSON.stringify(mergedProductCard, null, 2);

    item = JSON.parse(mergedJsonString);
  } catch (error) {
    console.error('Ошибка при получении данных из API Gifts.ru', error);
    throw error;
  }
  return item;
}
