import axios from 'axios';

/**
 * Функция для загрузки данных из API.
 * @param {string} apiUrl - URL для загрузки данных.
 * @returns {Promise} - Промис, который разрешается данными из API.
 */

export async function loadDataFromAPI(apiUrl) {
  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке данных из API:', error);
    throw new Error('Ошибка при загрузке данных из API');
  }
}
