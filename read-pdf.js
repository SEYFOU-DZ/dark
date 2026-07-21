const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('c:/Users/DOCTECH/Dark/document.pdf');

pdf(dataBuffer).then(function(data) {
    console.log('PDF Content:');
    console.log(data.text);
    console.log('\n---');
    console.log('Number of pages:', data.numpages);
    console.log('PDF Info:', data.info);
}).catch(function(err) {
    console.error('Error reading PDF:', err);
});
