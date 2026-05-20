import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGO_URI;
    
    if (!connStr) {
      console.error('Помилка: MONGO_URI не знайдено у файлі .env');
      process.exit(1);
    }

    const conn = await mongoose.connect(connStr);
    console.log(`База даних MongoDB успішно підключена: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Помилка підключення до бази даних: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;