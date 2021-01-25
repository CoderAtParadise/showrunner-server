const fs = require('fs');
const path = require('path');
let listDir = (dirPath, extension, cb) => {
    fs.readdir(dirPath, function(err, list) {
      if (err) return cb(err);
  
      var filtered = list.map(function(fileName) {
        return path.join(dirPath, fileName);
      }).filter(function(filePath) {
        return path.extname(filePath) === extension;
      })
  
      cb(null, filtered);
    })
  }

const runsheetsDir = 'storage/runsheets';
const templatesDir = 'storage/templates';
let runsheets = new Map();
let templates = new Map();
let filter = (dir,output) => listDir(dir,'.json',(err,files) =>{
    files.forEach((file) => output.set(path.basename(file,'.json'),file));
});
filter(runsheetsDir,runsheets);

fs.watch(runsheetsDir,(eventType,filename) => {
    filter(runsheetsDir,runsheets);
});

fs.watch(templatesDir,(eventType,filename) => {
    filter(templatesDir,templates);
});