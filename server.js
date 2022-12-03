const app = require('./app');

//console.log(process.env);

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log(1, err.name);
  console.log(2, err.message);
  console.log('UNHANDLER REJECTION! 🔒 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
