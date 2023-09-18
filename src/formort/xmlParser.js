import xml2js from 'xml2js';

const parser = new xml2js.Parser();

export function parseXML(xmlData) {
  return new Promise((resolve, reject) => {
    parser.parseString(xmlData, (err, result) => {
      if (err) {
        console.error('Ошибка парсинга XML:', err);
        reject(new Error('Ошибка парсинга XML'));
      } else {
        resolve(result);
      }
    });
  });
}
