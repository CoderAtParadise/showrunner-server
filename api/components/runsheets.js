const fs = require('fs');
const path = require('path');
const {LoadDir} = require('./file_helper');

const runsheetsDir = 'storage/runsheets';
const templatesDir = 'storage/templates';
let runsheets = new Map();
let templates = new Map();
let filter = (dir,output) => LoadDir(dir,'.json',(err,files) =>{
    files.forEach((file) => output.set(path.basename(file,'.json'),file));
});
filter(runsheetsDir,runsheets);
filter(templatesDir,templates);

fs.watch(runsheetsDir,(eventType,filename) => {
    filter(runsheetsDir,runsheets);
});

fs.watch(templatesDir,(eventType,filename) => {
    filter(templatesDir,templates);
});