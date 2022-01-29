const express = require('express');

const pdfRouter = require('./routes/pdfRoutes');

const app = express();

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3- ROUTES *****************************************************
app.use('/api/v1/pdf', pdfRouter);

// app.all('*', (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

module.exports = app;
