const express = require('express');
const path = require('path');
const app = express();

const PORT = 9000;

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function (_, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, function() {
    console.log(`Listening on port ${PORT}`)
});