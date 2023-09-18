export function processXMLData(result) {
  const jsonData = result;
  const firstThreeItems = jsonData.doct;
  let processedData;
  if (firstThreeItems.product) {
    processedData = firstThreeItems.product.map((item) => {
      delete item.filters;
      delete item.alerts;
      delete item.status;
      delete item.ondemand;
      delete item.group;
      delete item.print;
      delete item.product;
      delete item.days;
      delete item.moq;
      delete item.price;
      item.product_attachment = item.product_attachment.map((attachment) => {
        delete attachment.meaning;
        delete attachment.name;
        return attachment;
      });
      return item;
    });
  } else if (firstThreeItems.stock) {
    processedData = firstThreeItems.stock.map((item) => {
      delete item.inwayamount;
      delete item.inwayfree;
      delete item.enduserNextprice;
      delete item.nextpricebegindate;
      return item;
    });
  }

  return processedData;
}
