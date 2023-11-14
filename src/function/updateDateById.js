export default function updateDataById(targetData, newData) {
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