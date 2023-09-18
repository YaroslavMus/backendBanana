import axios from 'axios';

import { parseXML } from '../formort/xmlParser.js';
import { processXMLData } from '../formort/xmlProcessor.js';
import { mergePricesWithProductCard } from '../formort/mergePricesWithProductCard.js';
import config from '../../config.js';

// Создаем функцию для выполнения HTTP-запросов
async function fetchData(url) {
  const response = await axios.get(url);
  const xmlData = response.data;
  const resultData = await parseXML(xmlData);
  const processedData = processXMLData(resultData);
  return processedData;
}

// Главная функция для получения данных из API
export async function fetchApiGiftData() {
  try {
    // Параллельно получаем данные из двух источников
    const [jsonData, jsonDataStock] = await Promise.all([
      fetchData(`https://${config.GIFTS_API_KEY}@api2.gifts.ru/export/v2/catalogue/product.xml`),
      fetchData(`https://${config.GIFTS_API_KEY}@api2.gifts.ru/export/v2/catalogue/stock.xml`),
    ]);

    // Мерджим данные
    const mergedProductCard = mergePricesWithProductCard(jsonDataStock, jsonData);

    return mergedProductCard;
  } catch (error) {
    console.error('Ошибка при получении данных из API Gifts.ru', error);
    throw error;
  }
}
