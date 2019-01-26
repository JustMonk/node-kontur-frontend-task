const fs = require('fs');
const path = require('path');

// TODO PE; 2018-08-20; переименовать?
// UPD
function getFilesName(dirPath, ext) {
   // TODO Anonymous Developer; 2016-03-17; Необходимо переписать этот код и использовать асинхронные версии функций для чтения из файла
   // UPD
   return new Promise(resolve => {
      fs.readdir(dirPath, (err, files) => {
         let currentDirFiles = [];
         files.forEach(val => {
            if (val.endsWith(`.${ext}`)) {
               currentDirFiles.push(val);
            }
         })
         resolve(currentDirFiles);
      });
   });
}

// TODO Veronika; 2018-08-16; сделать кодировку настраиваемой
//UPD
function readFile(fileName, encoding = 'utf8') {
   return new Promise(resolve => {
      fs.readFile(fileName, encoding, (err, data) => {
         resolve(data);
      });
   });
}


// TODO Digi; 2018-09-21; Добавить функцию getFileName, которая по пути файла будет возвращать его имя. Воспользоваться модулем path из Node.js
// UPD: add but no use (async readdir returns filenames)
function getFileName(fullPath) {
   return path.basename(fullPath);
}

module.exports = {
   getFilesName,
   readFile,
   getFileName,
};
