import express from 'express';
import { mergeData } from '../dataProcessing/dataMerger.js';
import { loadDataFromAPI } from '../dataProcessing/dataLoader.js';

const router = express.Router();

// Маршрут для получения данных из API Portobello
router.get('/portobello', async (req, res) => {
  try {
    const portobelloData = await loadDataFromAPI(
      'https://php-backend.portobello.ru/api/catalog-json/?apiKey=tsKTQ9cHiANmssx1UFt066KDKTDMOexwX3z4kGQX',
    );

    const portobelloPriceData = await loadDataFromAPI(
      'https://php-backend.portobello.ru/api/catalog-prices-json/?apiKey=tsKTQ9cHiANmssx1UFt066KDKTDMOexwX3z4kGQX',
    );

    const portobelloStocksData = await loadDataFromAPI(
      'https://php-backend.portobello.ru/api/catalog-stocks-json/?apiKey=tsKTQ9cHiANmssx1UFt066KDKTDMOexwX3z4kGQX',
    );

    const mergedData = mergeData(
      portobelloData.products,
      portobelloPriceData.prices,
      portobelloStocksData.stocks,
    );

    res.send(mergedData);
  } catch (error) {
    res.status(500).send('Ошибка при получении данных из API Portobello');
  }
});

export default router;
