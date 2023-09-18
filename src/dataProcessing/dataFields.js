import axios from 'axios';
import fs from 'fs';
import fsExtra from 'fs-extra';

export async function filterFields(data) {
  const filteredData = [];

  try {
    await fsExtra.emptyDir('./assets/images');
  } catch (error) {
    console.error(`Ошибка при очистке папки "images": ${error.message}`);
    throw error; // Пробросим ошибку выше, если произошла ошибка
  }

  const downloadPromises = [];

  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    // const imageFileName = `image_${Date.now()}.jpg`; // Создаем уникальное имя файла изображения
    const imageUrl =
      'https://82648_xmlexport:mir111@api2.gifts.ru/export/v2/catalogue/' + item.images;

    console.log(`Скачивание изображения: ${imageUrl}`); // Логируем URL-адрес

    try {
      // const response = await axios.get(imageUrl, { responseType: 'stream' });
      // const imagePath = `./assets/images/${imageFileName}`; // Путь для сохранения изображения

      // // Сохраняем изображение на диск
      // response.data.pipe(fs.createWriteStream(imagePath));

      filteredData.push({
        name: item.id ? item.name : item.name[0],
        price: item.id ? item.prices[0].price : item.price[0].price[0],
        images: imagePath,
      });

      // console.log(`Изображение ${imageFileName} успешно скачано и сохранено.`);

      // if (index < data.length - 1) {
      //   // Добавляем задержку перед следующей загрузкой
      //   await new Promise((resolve) => setTimeout(resolve, 5000)); // 2000 миллисекунд = 2 секунды
      // }
    } catch (error) {
      console.error(`Ошибка при скачивании изображения ${imageFileName}: ${error.message}`);
    }
  }

  return filteredData; // Возвращаем массив данных после завершения всех операций
}
