export  function findProductsInJSONFiles(file1Data, gifts, portobello) {
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
