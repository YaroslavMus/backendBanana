function transformJSON(jsonArray) {
  let resultArray = [];

  jsonArray.forEach(function (input) {
    let transformedObject = {
      id: input.id,
      article: input.article,
      sectionId: input.sectionId,
      name: input.name,
      brand: input.brand,
      description: input.description,
      img: input.images,
      size: {
        width: input.size.width,
        length: input.size.length,
        height: input.size.height,
      },
      color: {
        color1: input.color1,
        color2: input.color2,
        color3: input.color3,
        color4: input.color4,
        color5: input.color5,
        color6: input.color6,
      },
      weight: input.weight,
      material: {
        material1: input.material1,
        material2: input.material2,
        material3: input.material3,
        material4: input.material4,
      },
      stocks: [
        {
          productId: stocks.productId,
          warehouseId: stocks.warehouseId,
          quantity: stocks.quantity,
          availableQuantity: stocks.availableQuantity,
        },
      ],
      prices: [
        {
          productId: prices.productId,
          price: prices.price,
          discountPrice: prices.discountPrice,
        },
      ],
    };

    resultArray.push(transformedObject);
  });
  return resultArray;
}
export default transformJSON;
