import express from 'express';

function transformProduct(product) {
  if (product.prices && product.prices.length > 0 && product.prices[0].price) {
    return {
      id_prod: product.id_prod,
      id: product.id,
      article: product.article,
      name: product.name,
      img: product.img[0] ? product.img[0] : product.img.small_image,
      price: product.prices[0].price,
    };
  } else {
    // Обработка случаев, когда price отсутствует или имеет неверный формат
    // Возвращайте значения по умолчанию или делайте что-то другое по вашему усмотрению
    return {
      id_prod: product.id_prod,
      id: product.id,
      article: product.article,
      name: product.name,
      img: product.img[0],
      price: 0, // Здесь можно указать значение по умолчанию
    };
  }
}

export function loadAllData(giftsProduct, portobelloProduct, currentPage, itemsPerPage) {
  // Объединяем массивы giftsProduct и portobelloProduct
  const combinedProducts = [...giftsProduct, ...portobelloProduct];

  // Применяем преобразование ко всем продуктам
  const transformedProducts = combinedProducts.map(transformProduct);

  // Вычисляем общее количество страниц
  const totalItems = transformedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Определяем начало и конец элементов для текущей страницы
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Получаем элементы для текущей страницы
  const currentPageData = transformedProducts.slice(startIndex, endIndex);

  // Создаем объект для отправки на клиентскую сторону
  const response = {
    currentPage: currentPage,
    totalPages: totalPages,
    data: currentPageData,
  };

  return response;
}
