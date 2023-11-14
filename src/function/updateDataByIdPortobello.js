export function updateDataByIdPortobello(targetData, newData, prices) {
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