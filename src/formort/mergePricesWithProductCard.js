function extractFileName(fullPath) {
  const regex = /\/([^\/]+)$/;
  const match = fullPath.match(regex);
  if (match && match.length >= 2) {
    return match[1];
  } else {
    return fullPath; // Возвращаем исходную строку, если не удалось найти имя файла
  }
}

export function mergePricesWithProductCard(prices, productCard) {
  let mergedData = [];
  for (let i = 0; i < productCard.length; i++) {
    let product = productCard[i];
    let mergedItem = {
      id_prod: 'gifts',
      id: product.product_id[0],
      article: product.code,
      name: product.name,
      brand: product.brand,
      description: product.content,
      img: {
        small_image: extractFileName(product.small_image[0].$.src),
        super_big_image: extractFileName(product.super_big_image[0].$.src),
      },
      productSize: product.product_size,
      weight: product.weight,
      material: product.matherial,
      prices: [],
      stocks: [],
    };

    // Найти соответствующие стоимости и заполнить массив prices
    let matchingPrices = prices.filter(function (price) {
      return price.product_id[0] === product.product_id[0];
    });
    if (matchingPrices.length > 0) {
      mergedItem.prices = matchingPrices.map(function (price) {
        return {
          price: price.enduserprice[0],
          discountPrice: price.dealerprice[0],
        };
      });
      mergedItem.stocks = matchingPrices.map(function (price) {
        return {
          quantity: price.amount[0],
          availableQuantity: price.free[0],
        };
      });
    }

    mergedData.push(mergedItem);
  }

  return mergedData.concat();
}
