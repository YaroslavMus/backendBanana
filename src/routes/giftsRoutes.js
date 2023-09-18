import express from 'express';
import axios from 'axios';
import { parseXML } from '../formort/xmlParser.js';
import { processXMLData } from '../formort/xmlProcessor.js';
import { mergePricesWithProductCard } from '../formort/mergePricesWithProductCard.js';

const router = express.Router();

// Маршрут для получения данных из API Gifts.ru
router.get('/gifts', async (req, res) => {
  try {
    const response = await axios.get(
      'https://82648_xmlexport:mir111@api2.gifts.ru/export/v2/catalogue/product.xml',
    );
    const responseStock = await axios.get(
      'https://82648_xmlexport:mir111@api2.gifts.ru/export/v2/catalogue/stock.xml',
    );

    const xmlData = response.data;
    const xmlStock = responseStock.data;
    const result = await parseXML(xmlData);
    const resultStock = await parseXML(xmlStock);
    const processedStock = processXMLData(resultStock);
    const processedData = processXMLData(result);

    // Преобразование JSON-строк в объекты JavaScript
    const jsonString = JSON.stringify(processedData, null, 2);
    const jsonStringStock = JSON.stringify(processedStock, null, 2);

    const jsonData = JSON.parse(jsonString);
    const jsonDataStock = JSON.parse(jsonStringStock);

    // Вызов функции для объединения
    const mergedProductCard = mergePricesWithProductCard(jsonDataStock, jsonData);

    // Преобразование объединенного объекта обратно в JSON
    const mergedJsonString = JSON.stringify(mergedProductCard, null, 2);

    res.json(mergedJsonString);
  } catch (error) {
    res.status(500).send('Ошибка при получении данных из API Gifts.ru или API Portobello');
  }
});

export default router;
