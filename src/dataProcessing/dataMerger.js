export function mergeData(products, prices, stocks) {
  let mergedData = [];
  for (let i = 0; i < products.length; i++) {
    let product = products[i];
    let mergedItem = {
      id_prod: 'port',
      id: product.id,
      article: product.article,
      sectionId: product.sectionId,
      name: product.name,
      brand: product.brand,
      description: product.description,
      img: product.images,
      size: {
        width: product.size.width,
        length: product.size.length,
        height: product.size.height,
      },
      color: {
        color1: product.color1,
        color2: product.color2,
        color3: product.color3,
        color4: product.color4,
        color5: product.color5,
        color6: product.color6,
      },
      weight: product.weight,
      material: {
        material1: product.material1,
        material2: product.material2,
        material3: product.material3,
        material4: product.material4,
      },
      layout: product.layout,
      prices: [],
      stocks: [],
    };

    // Найти соответствующие стоимости и заполнить массив prices
    let matchingPrices = prices.filter(function (price) {
      return price.productId === product.id;
    });

    if (matchingPrices.length > 0) {
      mergedItem.prices = matchingPrices.map(function (price) {
        return {
          price: price.price,
          discountPrice: price.discountPrice,
        };
      });
    }

    // Найти соответствующие запасы и заполнить массив stocks
    let matchingStocks = stocks.filter(function (stock) {
      return stock.productId === product.id;
    });

    if (matchingStocks.length > 0) {
      mergedItem.stocks = matchingStocks.map(function (stock) {
        return {
          quantity: stock.quantity,
          availableQuantity: stock.availableQuantity,
        };
      });
    }

    mergedData.push(mergedItem);
  }

  return mergedData.concat();
}
