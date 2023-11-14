import axios from 'axios';
import { promises as fs } from 'fs';
import xml2js from 'xml2js';
import path from 'path';
import config from '../../config.js';

const apiUrlGifts = `https://${config.GIFTS_API_KEY}@api2.gifts.ru/export/v2/catalogue/product.xml`;

const parser = new xml2js.Parser({
  explicitArray: false,
});
const urlFile= "./bd/gifts2.json"


async function fetchAndSaveXML() {
  try {
    const response = await axios.get(apiUrlGifts);
    if (response.status === 200) {
      const jsonDataArray = await parser.parseStringPromise(response.data);
      const outputFileName = urlFile;
      await fs.writeFile(outputFileName, JSON.stringify(jsonDataArray, null, 2));
      console.log(`Данные сохранены в файле: ${outputFileName}`);
    }
  } catch (error) {
    console.error('Произошла ошибка:', error);
  }
}

async function processFilePart1() {
  try {
    const data = await fs.readFile(urlFile, 'utf8');
    const jsonObject = JSON.parse(data);

    const updatedProducts = jsonObject.doct.product.map((item) => {
      if (Array.isArray(item.product)) {
        const prodMain = {
          name: item.product_size,
          stok: null,
        };
        const productSizes = item.product.map((productItem) => ({
          product_id: productItem.product_id,
          name: productItem.size_code,
          amount: null,
          free: null,
        }));

        let macPus = [prodMain, ...productSizes];

        item.product_size = macPus;
        delete item.product;

        return item;
      } else if (item.product && !Array.isArray(item.product)) {
        // Если item.product существует и не является массивом
        const prodMain = {
          name: item.product_size,
          stok: null,
        };
        const productSizes = {
          product_id: item.product_id,
          name: item.size_code,
          amount: null,
          free: null,
        };
        let macPus = [prodMain, productSizes];
        item.product_size = macPus;
        delete item.product;
        return item;
      } else {
        return item;
      }
    });

    jsonObject.doct.product = updatedProducts;

    await fs.writeFile(urlFile, JSON.stringify(jsonObject, null, 2));
    console.log('JSON-файл обновлен на основе обработанных данных из первой части.');
  } catch (error) {
    console.error('Ошибка при обработке первой части:', error);
  }
}

async function processFilePart2() {
  try {
    const data = await fs.readFile(urlFile, 'utf8');
    const jsonObject = JSON.parse(data);

    const updatedProducts = jsonObject.doct.product.map((item) => {
      if (item.super_big_image && item.super_big_image.$ && item.super_big_image.$.src) {
        let imgMain = item.super_big_image.$.src;
        if (Array.isArray(item.product_attachment)) {
          let imgCard = item.product_attachment.map((val) => {
            return val.image;
          });
          let container = [imgMain, ...imgCard];
          item.image = container;
        }
      }
      // Удалить ненужные свойства
      delete item.super_big_image;
      delete item.small_image;
      delete item.big_image;
      delete item.product_attachment;
      delete item.status;
      return item;
    });

    await fs.writeFile(urlFile, JSON.stringify(updatedProducts, null, 2));
    console.log('JSON-файл обновлен на основе обработанных данных из второй части.');
  } catch (error) {
    console.error('Ошибка при обработке второй части:', error);
  }
}

async function processFilePart3() {
  try {
    const data = await fs.readFile('./bd/gifts2.json', 'utf8');
    const jsonObject = JSON.parse(data);
    let mergedData = [];
    jsonObject.map((item) => {
      let mergedItem = {
        product_id: item.product_id,
        article: item.code,
        group: item.group,
        categories: null,
        name: item.name,
        brand: item.brand,
        content: item.content,
        attributes: {
          format: null,
          weight_one_item: item.weight,
          amount: item.amount,
          weight: item.weight,
          volume: item.volume,
          size: {
            sizex: item.sizex,
            sizey: item.sizey,
            sizez: item.sizez,
            size_full: null,
          },
          size_code: item.product_size,
          minpackamount: item.minpackamount,
          material: item.matherial,
          cover: null,
          number_of_pages: null,
          capacity: null,
        },
        color: null,
        images: item.image,
        price: {
          product_id: item.product_id,
          price: item.price.price,
          discount_price: null,
        },
        stocks: {
          product_id: item.product_id,
          quantity: {
            mos: null,
            remote: null,
            basic: null,
          },
          available_quantity: null,
        },
        layout_pdf: {
          pdf: null,
          crd: null,
          zip: null,
        },
      };
      mergedData.push(mergedItem);
    });
    await fs.writeFile('./bd/gifts2.json', JSON.stringify(mergedData, null, 2));
    console.log('JSON-файл обновлен на основе обработанных данных из третьей части.');
  } catch (error) {
    console.error('Ошибка при обработке третьей части:', error);
  }
}

export async function getDataGltf() {
  await fetchAndSaveXML();

  await processFilePart1();

  await processFilePart2();

  await processFilePart3();
}
  
