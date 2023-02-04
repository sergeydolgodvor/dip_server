require('dotenv').config({
  path: 'src/config/keys.env',
});

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const fileupload = require('express-fileupload');

const connectDB = require('./core/db');
const createRoutes = require('./core/routes');

// App init
const app = express();

// Setup app
if (process.env.NODE_ENV === 'development') {
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
    })
  );

  app.use(morgan('dev'));
}
app.use(express.json());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);
app.use(fileupload());
app.use(express.static('files'));

// Register routes
createRoutes(app);

// Connect to DB
connectDB();

// Setup server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  try {
    console.log(`Server up and running on port: ${PORT}`);
  } catch (error) {
    console.error(error);
  }
});
