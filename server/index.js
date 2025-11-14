
const express = require('express');
const cors = require('cors');
const mockData = require('./mockData.json');

const app = express();
const port = 3001;

app.use(cors());

app.get('/api/residents', (req, res) => {
  res.json(mockData.residents);
});

app.get('/api/households', (req, res) => {
  res.json(mockData.households);
});

app.get('/api/blotter', (req, res) => {
  res.json(mockData.blotter);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
