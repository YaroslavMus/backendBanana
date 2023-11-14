import axios from 'axios';
import fs from 'fs';
import config from '../../config.js';
import { updateDataByIdPortobello } from '../function/updateDataByIdPortobello.js';

const apiUrlPortobelloStocks = `https://php-backend.portobello.ru/api/catalog-stocks-json/?apiKey=${config.PORTOBELLO_API_KEY}`;
const apiUrlPortobelloPrice = `https://php-backend.portobello.ru/api/catalog-prices-json/?apiKey=${config.PORTOBELLO_API_KEY}`;
const apiUrlPortobelloItem = `https://php-backend.portobello.ru/api/catalog-json/?apiKey=${config.PORTOBELLO_API_KEY}`;

function processColors(product) {
  const colors = [];

  for (let i = 1; i <= 4; i++) {
    const colorKey = `color${i}`;
    const colorValue = product[colorKey];

    if (colorValue !== null && colorValue !== '') {
      colors.push(colorValue);
    }
  }
  return colors;
}
function processImg(product) {
  const img = [];

  product.map((item) => {
    img.push(item);
  });
  return img;
}
function processMaterial(product) {
  const material = [];

  for (let i = 1; i <= 4; i++) {
    const materialKey = `material${i}`;
    const materialValue = product[materialKey];

    if (materialValue !== null && materialValue !== '') {
      material.push(materialValue);
    }
  }
  return material;
}
async function getData() {
  try {
    const response = await axios.get(apiUrlPortobelloItem);

    if (response.status === 200) {
      const jsonDataArray = response.data.products; // Это массив данных

      // Преобразование каждого элемента массива
      const transformedDataArray = jsonDataArray.map((jsonData) => {
        return {
          product_id: jsonData.id,
          article: jsonData.article,
          name: jsonData.name,
          brand: jsonData.brand,
          content: jsonData.description,
          group: jsonData.model,
          attributes: {
            format: jsonData.format ? jsonData.format : null,
            weight_one_item: jsonData.weight ? jsonData.weight : null,
            amount: null,
            weight: null,
            volume: null,
            size: {
              sizex: jsonData.size.width ? jsonData.size.width : null,
              sizey: jsonData.size.length ? jsonData.size.length : null,
              sizez: jsonData.size.height ? jsonData.size.height : null,
              size_full: null,
            },
            size_code: null,
            minpackamount: jsonData.quantityInPackage ? jsonData.quantityInPackage : null,
            material: processMaterial(jsonData),
            cover: jsonData.cover ? jsonData.cover : null,
            number_of_pages: jsonData.numberOfPages ? jsonData.numberOfPages : null,
            capacity: jsonData.capacity ? jsonData.capacity : null,
          },
          color: processColors(jsonData),
          images: processImg(jsonData.images),
          price: {
            product_id: jsonData.id,
            price: null,
            discount_price: null,
          },
          stocks: {
            product_id: jsonData.id,
            quantity: {
              mos: null,
              remote: null,
              basic: null,
            },
            available_quantity: null,
          },
          layout: {
            pdf: jsonData.layoutPdf ? jsonData.layoutPdf : null, // Первая ссылка (PDF) или null, если нет
            crd: null,
            zip: jsonData.layout ? jsonData.layout : null,
          },
        };
      });
      // const mainContainer =
      const outputFileName = './bd/portobello.json';
      fs.writeFileSync(outputFileName, JSON.stringify(transformedDataArray, null, 2));
      console.log(`Данные сохранены в файле: ${outputFileName}`);
    }
  } catch (error) {
    console.error('Произошла ошибка при запросе данных:', error);
  }
}
async function fetchDataPortobello() {
  try {
    await getData();

    const responseStocks = await axios.get(apiUrlPortobelloStocks);
    const responsePrices = await axios.get(apiUrlPortobelloPrice);

    if (responseStocks.status === 200 || responsePrices.status === 200) {
      console.log('Данные из API apiUrlPortobello.ru успешно загружены.');
      fs.readFile('./bd/portobello.json', 'utf8', (err, data) => {
        if (err) {
          console.error('Ошибка при чтении файла:', err);
          return;
        }
        try {
          const jsonObject = JSON.parse(data);
          updateDataByIdPortobello(
            jsonObject,
            responseStocks.data.stocks,
            responsePrices.data.prices,
          );
          fs.writeFileSync('./bd/portobello_updated.json', JSON.stringify(jsonObject, null, 2));
          console.log('Обновленные данные сохранены в файле: ./bd/portobello_updated.json');
        } catch (error) {
          console.error('Ошибка при парсинге JSON:', error);
        }
      });
    } else {
      console.error('Произошла ошибка при запросе данных:', response.status);
    }
  } catch (error) {
    console.error('Произошла ошибка при запросе данных:', error);
  }
}

// Добавьте экспорт функции fetchDataPortobello
export { fetchDataPortobello };
