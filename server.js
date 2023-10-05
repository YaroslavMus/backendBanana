import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import xml2js from 'xml2js';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import config from './config.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiUrlGifts = 'https://82648_xmlexport:mir111@api2.gifts.ru/export/v2/catalogue/stock.xml';
const apiUrlPortobello =
  'https://php-backend.portobello.ru/api/catalog-stocks-json/?apiKey=tsKTQ9cHiANmssx1UFt066KDKTDMOexwX3z4kGQX';
const apiUrlPortobelloPrice =
  'https://php-backend.portobello.ru/api/catalog-prices-json/?apiKey=tsKTQ9cHiANmssx1UFt066KDKTDMOexwX3z4kGQX';

// Запуск функции каждый день в определенное время (например, в 12:00)
function updateDataByIdPortobello(targetData, newData, prices) {
  for (const newItem of newData) {
    const indexToUpdate = targetData.findIndex((item) => item.product_id === newItem.productId);
    if (indexToUpdate !== -1) {
      targetData[indexToUpdate].stocks.quantity.mos = newItem.quantity;
      targetData[indexToUpdate].stocks.available_quantity = newItem.availableQuantity;
    }
  }
  for (const newItemPrice of prices) {
    const indexToUpdatePrices = targetData.findIndex(
      (item) => item.product_id === newItemPrice.productId,
    );
    if (indexToUpdatePrices !== -1) {
      targetData[indexToUpdatePrices].price.price = newItemPrice.price;
      targetData[indexToUpdatePrices].price.discount_price = newItemPrice.discountPrice;
    }
  }
}
function updateDataById(targetData, newData) {
  for (const newItem of newData) {
    const indexToUpdate = targetData.findIndex((item) => item.product_id === newItem.product_id);
    if (indexToUpdate !== -1) {
      // Обновите нужные поля
      targetData[indexToUpdate].stocks.quantity.mos = newItem.amount;
      targetData[indexToUpdate].stocks.available_quantity = newItem.free;
      targetData[indexToUpdate].price.discount_price = newItem.dealerprice;

      // Проверяем наличие свойства attributes и size_code
      if (
        targetData[indexToUpdate].attributes &&
        targetData[indexToUpdate].attributes.size_code &&
        Array.isArray(targetData[indexToUpdate].attributes.size_code)
      ) {
        for (const itemProdSize of newData) {
          const idProd = targetData[indexToUpdate].attributes.size_code.findIndex(
            (item) => item.product_id === itemProdSize.product_id,
          );
          if (idProd !== -1) {
            // Обновите нужные поля
            targetData[indexToUpdate].attributes.size_code[idProd].amount = itemProdSize.amount;
            targetData[indexToUpdate].attributes.size_code[idProd].free = itemProdSize.free;
          }
        }
      }
    }
  }
}

async function fetchDataPortobello() {
  try {
    const response = await axios.get(apiUrlPortobello);
    const responsePrices = await axios.get(apiUrlPortobelloPrice);

    if (response.status === 200) {
      response.data.stocks;
      console.log('Данные из API apiUrlPortobello.ru успешно загружены.');
      fs.readFile('./bd/portobello.json', 'utf8', (err, data) => {
        if (err) {
          console.error('Ошибка при чтении файла:', err);
          return;
        }
        try {
          const jsonObject = JSON.parse(data);
          updateDataByIdPortobello(jsonObject, response.data.stocks, responsePrices.data.prices);
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
async function fetchData() {
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
      open = result.doct.stock;
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

function myDailyFunction() {
  fetchDataPortobello();
  fetchData();
}
function findProductsInJSONFiles(file1Data, gifts, portobello) {
  try {
    const data1 = file1Data;
    const data2 = [...gifts, ...portobello];
    // Извлекаем массив "product" из первого JSON файла
    const products = data1.product !== undefined ? data1.product : data1;

    // Создаем пустой массив для хранения результатов поиска
    const foundProducts = [];

    // Проходим по каждому элементу массива "product"
    for (const product of products) {
      const productId = product.product;

      // Выполняем поиск во втором JSON файле по атрибуту "id"
      const foundProduct = data2.find((item) => item.product_id === String(productId));
      if (foundProduct) {
        foundProducts.push(foundProduct);
      }
    }

    return foundProducts;
  } catch (error) {
    console.error('Произошла ошибка:', error);
    return [];
  }
}

app.get('/itemProduct', async (req, res) => {
  const itemProduct = String(req.query.itemID);
  let foundElement;

  const dataPortobello = await fs.promises.readFile('./bd/portobello_updated.json', 'utf8');
  const dataGift = await fs.promises.readFile('./bd/gifts_updated.json', 'utf8');

  const jsonDataPortobello = JSON.parse(dataPortobello);
  const jsonDataGift = JSON.parse(dataGift);

  // Объявляем переменную dataBig и объединяем массивы
  const dataBig = [...jsonDataPortobello, ...jsonDataGift];

  foundElement = dataBig.find((element) => element.product_id === itemProduct);

  // Проверка на foundElement перед отправкой ответа
  if (foundElement) {
    res.send(foundElement);
  } else {
    res.status(404).send('Элемент не найден'); // Отправляем код 404, если элемент не найден
  }
});
app.get('/itemCategories', async (req, res) => {
  const clientAttribute = req.query.clientAttribute; // Получаем значение "uri" из запроса
  const page = req.query.page ? parseInt(req.query.page) : 1; // Получаем номер страницы из запроса, по умолчанию 1
  const perPage = req.query.perPage ? parseInt(req.query.perPage) : 10; // Количество элементов на странице, по умолчанию 10

  let foundElement;
  const data = await fs.promises.readFile('./bd/catalogue.json', 'utf8');
  const dataPortobello = await fs.promises.readFile('./bd/portobello_updated.json', 'utf8');
  const dataGift = await fs.promises.readFile('./bd/gifts_updated.json', 'utf8');

  const jsonData = JSON.parse(data);
  const jsonDataPortobello = JSON.parse(dataPortobello);
  const jsonDataGift = JSON.parse(dataGift);

  function findElement(obj) {
    if (obj.uri === clientAttribute) {
      return obj;
    }
    if (obj.page && Array.isArray(obj.page)) {
      for (const pageObj of obj.page) {
        const result = findElement(pageObj);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }
  foundElement = findElement(jsonData);
  // Фильтруем элементы, чтобы получить только те, которые находятся на текущей странице
  const filteredProducts = findProductsInJSONFiles(foundElement, jsonDataGift, jsonDataPortobello);

  // Вычисляем общее количество страниц
  const totalPageCount = Math.ceil(filteredProducts.length / perPage);

  // Вычисляем начало и конец элементов для текущей страницы
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;

  // Фильтруем элементы, чтобы получить только те, которые находятся на текущей странице
  const productsOnPage = filteredProducts.slice(startIndex, endIndex);

  res.json({
    currentPage: page,
    perPage: perPage,
    totalProducts: filteredProducts.length,
    totalPageCount: totalPageCount, // Общее количество страниц
    data: productsOnPage,
  });
});
app.get('/productCategories', async (req, res) => {
  const categoriesProduct = req.query.product;
  const page = req.query.page ? parseInt(req.query.page) : 1; // Получаем номер страницы из запроса, по умолчанию 1
  const perPage = req.query.perPage ? parseInt(req.query.perPage) : 10;

  const data = await fs.promises.readFile('./bd/catalogue.json', 'utf8');
  const dataPortobello = await fs.promises.readFile('./bd/portobello_updated.json', 'utf8');
  const dataGift = await fs.promises.readFile('./bd/gifts_updated.json', 'utf8');

  const jsonCategories = JSON.parse(data);
  const jsonDataPortobello = JSON.parse(dataPortobello);
  const jsonDataGift = JSON.parse(dataGift);

  let itemProduct = jsonCategories.page.filter((item) => {
    return item.uri === categoriesProduct;
  });

  function extractProducts(page) {
    const products = page.product.map((product) => {
      return {
        page: page.page_id,
        product: product.product,
      };
    });
    return products;
  }

  function extractAllProducts(pages) {
    const allProducts = pages.reduce((accumulator, page) => {
      const products = extractProducts(page);
      return accumulator.concat(products);
    }, []);
    return allProducts;
  }

  // Извлеките все продукты из всех страниц
  const allProducts = extractAllProducts(itemProduct[0].page);

  const filteredProducts = findProductsInJSONFiles(allProducts, jsonDataGift, jsonDataPortobello);

  const totalPageCount = Math.ceil(filteredProducts.length / perPage);

  // Вычисляем начало и конец элементов для текущей страницы
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;

  // Фильтруем элементы, чтобы получить только те, которые находятся на текущей странице
  const productsOnPage = filteredProducts.slice(startIndex, endIndex);

  res.json({
    currentPage: page,
    perPage: perPage,
    totalProducts: filteredProducts.length,
    totalPageCount: totalPageCount, // Общее количество страниц
    data: productsOnPage,
  });
});
app.get('/itemCategoriesSearch', async (req, res) => {
  const clientAttribute = req.query.searchItem;
  const page = req.query.page ? parseInt(req.query.page) : 1; // Получаем номер страницы из запроса, по умолчанию 1
  const perPage = req.query.perPage ? parseInt(req.query.perPage) : 10;

  const dataPortobello = await fs.promises.readFile('./bd/portobello_updated.json', 'utf8');
  const dataGift = await fs.promises.readFile('./bd/gifts_updated.json', 'utf8');

  const jsonDataPortobello = JSON.parse(dataPortobello);
  const jsonDataGift = JSON.parse(dataGift);

  function search(itemPortobello, itemGift) {
    const allItems = [...itemPortobello, ...itemGift];
    return allItems.filter((item) =>
      item.name.toLowerCase().includes(clientAttribute.toLowerCase()),
    );
  }
  const filteredProducts = search(jsonDataPortobello, jsonDataGift);

  // Вычисляем общее количество страниц
  const totalPageCount = Math.ceil(filteredProducts.length / perPage);

  // Вычисляем начало и конец элементов для текущей страницы
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;

  // Фильтруем элементы, чтобы получить только те, которые находятся на текущей странице
  const productsOnPage = filteredProducts.slice(startIndex, endIndex);

  res.json({
    currentPage: page,
    perPage: perPage,
    totalProducts: filteredProducts.length,
    totalPageCount: totalPageCount, // Общее количество страниц
    data: productsOnPage,
  });
});
app.get('/categories', (req, res) => {
  try {
    // Прочитайте JSON-файл
    fs.readFile('./bd/catalogue.json', 'utf8', (err, data) => {
      if (err) {
        // Обработка ошибки чтения файла
        res.status(500).json({ error: 'Ошибка при чтении файла' });
        return;
      }
      const jsonData = JSON.parse(data);

      // Рекурсивно удалите атрибут "product" из JSON-структуры
      function removeProductAttribute(obj) {
        if (typeof obj === 'object' && obj !== null) {
          // Проверяем, является ли obj объектом и не является ли null
          if (Array.isArray(obj)) {
            // Если obj является массивом, рекурсивно вызываем функцию для каждого элемента массива
            for (let i = 0; i < obj.length; i++) {
              removeProductAttribute(obj[i]);
            }
          } else {
            // Если obj является объектом, удаляем атрибут "product", если он существует
            if (obj.hasOwnProperty('product')) {
              delete obj.product;
            }
            // Рекурсивно вызываем функцию для всех свойств объекта
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                removeProductAttribute(obj[key]);
              }
            }
          }
        }
      }

      // Вызываем функцию для удаления атрибута "product" из вашей JSON-структуры
      removeProductAttribute(jsonData);

      // Отправить обновленный JSON в ответе
      res.json(jsonData);
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении атрибута "product"' });
  }
});
//________________________________________________________________________//

const transporter = nodemailer.createTransport({
  host: 'smtp.yandex.ru',
  port: 465, // Используйте 'Yandex' как сервис для отправки
  secure: true,
  auth: {
    user: 'BananaProduct@yandex.ru', // Замените на свой адрес электронной почты
    pass: 'dxsmvvzuzedoenhm', // Замените на пароль от вашей почты
  },
});
app.post('/postEmail', (req, res) => {
  // Проверяем, что req.body существует и содержит необходимые поля
  const { cartItems, formData } = req.body;
  if (
    !cartItems ||
    !formData ||
    !formData.firstName ||
    !formData.lastName ||
    !formData.phone ||
    !formData.email ||
    !formData.comment
  ) {
    return res.status(400).json({ message: 'Неправильный формат данных.' });
  }

  // Генерируем HTML для письма
  const formDataHTML = `
      <h2>Данные о заказчике:</h2>
      <div>
        <div>Имя: ${formData.firstName}</div>
        <div>Фамилия: ${formData.lastName}</div>
        <div>Телефон: ${formData.phone}</div>
        <div>Почта: ${formData.email}</div>
        <div>Комментарий: ${formData.comment}</div>
      </div>
    `;

  const cartItemsHTML = `
      <h2>Данные о товарах:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; border-radius: 10px;">Наименование</th>
            <th style="border: 1px solid #000; border-radius: 10px;">Поставщик</th>
            <th style="border: 1px solid #000; border-radius: 10px;">Артикул</th>
            <th style="border: 1px solid #000; border-radius: 10px;">Количество</th>
            <th style="border: 1px solid #000; border-radius: 10px;">Стоимость</th>
            <th style="border: 1px solid #000; border-radius: 10px;">Стоимость за 1 шт.</th>
          </tr>
        </thead>
        <tbody>
          ${cartItems
            .map(
              (item) => `
              <tr>
                <td style="border: 1px solid #000;">${item.title}</td>
                <td style="border: 1px solid #000;text-align: center;">${item.id_prod}</td>
                <td style="border: 1px solid #000;text-align: center;">${item.id}</td>
                <td style="border: 1px solid #000;text-align: center;">${item.col}</td>
                <td style="border: 1px solid #000;text-align: center;">${
                  item.price * item.col
                } руб.</td>
                <td style="border: 1px solid #000;text-align: center;">${item.price} руб.</td>
              </tr>
            `,
            )
            .join('')}
        </tbody>
      </table>
    `;

  // Настройки для отправки письма
  const mailOptions = {
    from: 'BananaProduct@yandex.ru',
    to: 'zakaz@bananaadv.ru',
    subject: `Заказ от ${formData.firstName} ${formData.lastName}`,
    html: `${formDataHTML}<br>${cartItemsHTML}`,
  };

  // Отправка письма
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Ошибка при отправке письма:', error);
      res.status(500).json({ message: 'Произошла ошибка при отправке письма.' });
    } else {
      console.log('Письмо успешно отправлено:', info.response);
      res.status(200).json({ message: 'Данные успешно получены и HTML-письмо отправлено.' });
    }
  });
});

app.post('/question', (req, res) => {
  const { name, email, phone, question, preferredContactMethod } = req.body;

  const formDataHTML = `
    <h2>Данные о заказчике:</h2>
    <div>
      <div>Имя: ${name}</div>
      <div>Почта: ${email}</div>
      <div>Телефон: ${phone}</div>
      <div>Предпочтительный способ связи: ${preferredContactMethod}</div>
      <div>Комментарий: ${question}</div>
    </div>
    `;

  const mailOptions = {
    from: 'BananaProduct@yandex.ru',
    to: 'zakaz@bananaadv.ru',
    subject: `Обратная связь от ${name}`,
    html: `${formDataHTML}`, // Используйте опцию html для вставки HTML-кода
  };

  // Отправьте письмо
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Ошибка при отправке письма:', error);
      res.status(500).json({ message: 'Произошла ошибка при отправке письма.' });
    } else {
      console.log('Письмо успешно отправлено:', info.response);
      res.status(200).json({ message: 'Данные успешно получены и HTML-письмо отправлено.' });
    }
  });
});
cron.schedule('0 22 * * *', myDailyFunction);
app.listen(config.PORT, (error) => {
  if (error) {
    console.error('Ошибка при запуске сервера:', error);
  } else {
    console.log(`Сервер запущен на порту ${config.PORT}`);
  }
});
