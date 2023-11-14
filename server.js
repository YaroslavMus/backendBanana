import express from 'express';
import cors from 'cors';
import fs from 'fs';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import config from './config.js';
import { fetchDataPortobello } from './src/API/ApiPortobello.js';
import { fetchDataGifts } from './src/API/ApiGifts.js';
import { getDataGltf } from './src/API/ApiUpdataGifts.js';
import { findProductsInJSONFiles } from './src/function/findProductsInJSONFiles.js';
import { findElementByAttribute } from './src/function/findElementByAttribute.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function myDailyFunction() {
  await fetchDataPortobello();
  await getDataGltf();
  await fetchDataGifts();
}

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

// Поиск элемента по ID
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
// Запрос на элементы по Url или поиск элемента по name
app.get('/items', async (req, res) => {
  const searchItem = (req.query.searchItem || '').toLowerCase();
  const productCategories = req.query.productCategories || '';
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 12;

  try {
    const [portobelloData, giftData, categoriesData] = await Promise.all([
      fs.promises.readFile('./bd/portobello_updated.json', 'utf8'),
      fs.promises.readFile('./bd/gifts_updated.json', 'utf8'),
      fs.promises.readFile('./bd/catalogue.json', 'utf8'),
    ]);

    const jsonDataPortobello = JSON.parse(portobelloData);
    const jsonDataGift = JSON.parse(giftData);
    const jsonCategories = JSON.parse(categoriesData);

    let filteredProducts = [...jsonDataPortobello, ...jsonDataGift];

    // Функция для поиска по названию
    function searchByName(items) {
      return items.filter((item) => item.name.toLowerCase().includes(searchItem));
    }
    if (searchItem) {
      filteredProducts = searchByName(filteredProducts);
    }

    // Поиск по категориям URL
    if (productCategories) {
      const itemPrice = findElementByAttribute(jsonCategories, 'url', productCategories);
      if (itemPrice.page) {
        filteredProducts = findProductsInJSONFiles(
          extractAllProducts(itemPrice.page),
          jsonDataGift,
          jsonDataPortobello,
        );
      } else if (itemPrice.product) {
        filteredProducts = findProductsInJSONFiles(
          itemPrice.product,
          jsonDataGift,
          jsonDataPortobello,
        );
      } else {
        return console.log("Такой категории нет !")
      }
    }

    function filterProducts(products) {
      // Используем метод filter для создания нового массива,
      // в котором останутся только товары, у которых mos и available_quantity не равны 0 или null
      return products.filter((product) => {
        const mos = product.stocks.quantity.mos;
        const availableQuantity = product.stocks.available_quantity;
    
        return (
          (mos !== 0 && mos !== null) && 
          (availableQuantity !== 0 && availableQuantity !== null)
        );
      });
    }

    filteredProducts = filterProducts(filteredProducts);
    const totalProducts = filteredProducts.length;
    const totalPageCount = Math.ceil(totalProducts / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const productsOnPage = filteredProducts.slice(startIndex, endIndex);

    res.json({
      currentPage: page,
      perPage: perPage,
      totalProducts: totalProducts,
      totalPageCount: totalPageCount,
      data: productsOnPage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка на сервере');
  }
});
// Запрос на группу элементов
app.get('/groupItem', async (req, res) => {
  const group = req.query.group || '';

  try {
    const [portobelloData, giftData] = await Promise.all([
      fs.promises.readFile('./bd/portobello_updated.json', 'utf8'),
      fs.promises.readFile('./bd/gifts_updated.json', 'utf8'),
    ]);

    const jsonDataPortobello = JSON.parse(portobelloData);
    const jsonDataGift = JSON.parse(giftData);

    function searchByGroup(items, groupName) {
      // Строгий поиск по атрибуту group (без чувствительности к регистру)
      return items.filter((item) => item.group && item.group.toLowerCase() === groupName.toLowerCase());
    }
    
    if (group) {
      const filteredProducts = searchByGroup([...jsonDataPortobello, ...jsonDataGift], group);
    
      if (filteredProducts.length > 0) {
        res.json(filteredProducts);
      } else {
        res.status(404).json({ error: 'Элементы с указанным брендом не найдены.' });
      }
    } else {
      res.status(400).json({ error: 'Не указан бренд для поиска.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка на сервере');
  }
});
// Категории
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
            <th style="border: 1px solid #000; border-radius: 10px;">Артикул</th>
            <th style="border: 1px solid #000; border-radius: 10px;">Количество</th>
            <th style="border: 1px solid #000; border-radius: 10px;">Стоимость за 1 шт.</th>
            <th style="border: 1px solid #000; border-radius: 10px;">Стоимость</th>
          </tr>
        </thead>
        <tbody>
          ${cartItems
            .map(
              (item) => `
              <tr>
                <td style="border: 1px solid #000;">${item.title}</td>
                <td style="border: 1px solid #000;text-align: center;">${item.id}</td>
                <td style="border: 1px solid #000;text-align: center;">${item.numder}</td>
                <td style="border: 1px solid #000;text-align: center;">${item.price} руб.</td>
                <td style="border: 1px solid #000;text-align: center;">${item.priceSum} руб.</td>
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

cron.schedule('0 0 23 * * * *', myDailyFunction);

app.listen(config.PORT, (error) => {
  if (error) {
    console.error('Ошибка при запуске сервера:', error);
  } else {
    console.log(`Сервер запущен на порту ${config.PORT}`);
  }
});
