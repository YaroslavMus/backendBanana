// gifts.js
import axios from 'axios';
import fs from 'fs';
import xml2js from 'xml2js';
import updateDataById from "../function/updateDateById.js"
import config from '../../config.js';


const apiUrlGifts = `https://${config.GIFTS_API_KEY}@api2.gifts.ru/export/v2/catalogue/stock.xml`;

async function fetchDataGifts() {
  const parser = new xml2js.Parser({
    explicitArray: false,
  });

  try {
    const response = await axios.get(apiUrlGifts);

    if (response.status === 200) {
      const xmlData = response.data;
      const result = await new Promise((resolve, reject) => {
        parser.parseString(xmlData, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

      console.log('Данные из API Gifts.ru успешно загружены.');
      fs.readFile('./bd/gifts2.json', 'utf8', (err, data) => {
        if (err) {
          console.error('Ошибка при чтении файла:', err);
          return;
        }
        try {
          const jsonObject = JSON.parse(data);
          updateDataById(jsonObject, result.doct.stock);
          fs.writeFileSync('./bd/gifts_updated.json', JSON.stringify(jsonObject, null, 2));
          console.log('Обновленные данные сохранены в файле: ./bd/gifts_updated.json');
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

// Добавьте экспорт функции fetchDataGifts
export { fetchDataGifts };
