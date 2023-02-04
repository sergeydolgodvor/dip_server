const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB successfully connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(error);
  }
};

module.exports = connectDB;
