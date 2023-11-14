export  function findElementByAttribute(obj, attributeName, attributeValue) {
  // Проверяем, является ли переданный объект массивом
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = findElementByAttribute(obj[i], attributeName, attributeValue);
      if (result) {
        return result; // Найден элемент, возвращаем его
      }
    }
  } else if (typeof obj === 'object') {
    // Проверяем атрибут текущего объекта
    if (obj[attributeName] === attributeValue) {
      return obj; // Найден элемент, возвращаем его
    } else {
      // Рекурсивно ищем вложенные объекты
      for (const key in obj) {
        const result = findElementByAttribute(obj[key], attributeName, attributeValue);
        if (result) {
          return result; // Найден элемент, возвращаем его
        }
      }
    }
  }
  return null; // Элемент с указанным атрибутом не найден
}
