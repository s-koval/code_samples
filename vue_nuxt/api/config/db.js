import mongoose from 'mongoose';

const connection = mongoose.connect(
  process.env.MONGO_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })

export default connection
