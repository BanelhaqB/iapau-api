const express = require('express');
const cors = require('cors');
const router = require('./routes');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(cors());
app.options('*', cors());

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3- ROUTES *****************************************************
app.use('/api/v1', router);

module.exports = app;
