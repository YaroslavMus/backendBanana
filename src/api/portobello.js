import config from '../../config.js';
import { mergeData } from '../dataProcessing/dataMerger.js';
import { loadDataFromAPI } from '../dataProcessing/dataLoader.js';

export async function fetchApiPortobelloData() {
  let item = {};
  try {
    const portobelloData = await loadDataFromAPI(
      `https://php-backend.portobello.ru/api/catalog-json/?apiKey=${config.PORTOBELLO_API_KEY}`,
    );

    const portobelloPriceData = await loadDataFromAPI(
      `https://php-backend.portobello.ru/api/catalog-prices-json/?apiKey=${config.PORTOBELLO_API_KEY}`,
    );

    const portobelloStocksData = await loadDataFromAPI(
      `https://php-backend.portobello.ru/api/catalog-stocks-json/?apiKey=${config.PORTOBELLO_API_KEY}`,
    );

    const mergedData = mergeData(
      portobelloData.products,
      portobelloPriceData.prices,
      portobelloStocksData.stocks,
    );

    item = mergedData;
  } catch (error) {
    console.error('Ошибка при получении данных из API Portobello', error);
    throw error;
  }
  return item;
}
