const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(compression());

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found',
      code: 404
    }
  });
});

app.use(errorHandler);

module.exports = app;