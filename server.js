import express from 'express';
import cors from 'cors';
import fs from 'fs';
import nodemailer from 'nodemailer';
import portobelloRoutes from './src/routes/portobelloRoutes.js';
import giftsRoutes from './src/routes/giftsRoutes.js';
import config from './config.js';
import { loadAllData } from './src/routes/commonRoutes.js';
import { fetchApiGiftData } from './src/api/gifts.js';
import { fetchApiPortobelloData } from './src/api/portobello.js';
// murprecracenklybnuka
// dxsmvvzuzedoenhm
const app = express();

let portobelloData;
let giftData;

async function cacheGiftData() {
  try {
    giftData = await fetchApiGiftData();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
}
// Асинхронная функция для кеширования portobelloData
async function cachePortobelloData() {
  try {
    portobelloData = await fetchApiPortobelloData();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
}

// Вызывайте функции для инициализации кешей при запуске приложения
cacheGiftData();
cachePortobelloData();

let lastUpdateTimestamp = Date.now();

app.use((req, res, next) => {
  const currentTime = Date.now();
  if (currentTime - lastUpdateTimestamp > 30 * 60 * 1000) {
    cacheGiftData();
    cachePortobelloData();
    lastUpdateTimestamp = currentTime;
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(portobelloRoutes);
app.use(giftsRoutes);

app.get('/portobelloData', (req, res) => {
  res.send(portobelloData);
});
app.get('/giftData', (req, res) => {
  res.send(giftData);
});
app.get('/mainProduct', (req, res) => {
  const currentPage = parseInt(req.query.currentPage);
  const itemsPerPage = parseInt(req.query.itemsPerPage);

  res.send(loadAllData(portobelloData, giftData, currentPage, itemsPerPage));
});
app.get('/itemProduct', (req, res) => {
  const itemProduct = req.query.itemID;
  const idProd = req.query.idProd;
  let foundElement;
  if (idProd === 'gifts') {
    foundElement = giftData.find((element) => element.article[0] === itemProduct);
  } else if (idProd === 'port') {
    foundElement = portobelloData.find((element) => element.article === itemProduct);
  }
  res.send(foundElement);
});
app.get('/itemCategories', async (req, res) => {
  const clientAttribute = req.query.clientAttribute; // Получаем значение "uri" из запроса
  let foundElement;
  const data = await fs.promises.readFile('tree.json', 'utf8');
  const jsonData = JSON.parse(data);

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
  function findProductsInJSONFiles(file1Data, gifts, portobello) {
    try {
      const data1 = file1Data;

      const data2 = [...gifts, ...portobello];
      // Извлекаем массив "product" из первого JSON файла
      const products = data1.product || [];

      // Создаем пустой массив для хранения результатов поиска
      const foundProducts = [];

      // Проходим по каждому элементу массива "product"
      for (const product of products) {
        const productId = product.product;

        // Выполняем поиск во втором JSON файле по атрибуту "id"
        const foundProduct = data2.find((item) => item.id === String(productId));
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
  res.json(findProductsInJSONFiles(foundElement, giftData, portobelloData));
});
app.get('/categories', (req, res) => {
  try {
    // Прочитайте JSON-файл
    fs.readFile('tree.json', 'utf8', (err, data) => {
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

app.listen(config.PORT, (error) => {
  if (error) {
    console.error('Ошибка при запуске сервера:', error);
  } else {
    console.log(`Сервер запущен на порту ${config.PORT}`);
  }
});
