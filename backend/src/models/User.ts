import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. Оголошуємо інтерфейс для документа користувача з нашими полями та кастомним методом
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

// 2. Створюємо схему, вказуючи generic-тип <IUser>
const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

// 3. Хешування пароля перед збереженням (без використання застарілого next)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 4. Оголошуємо метод для порівняння паролів
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 5. Експортуємо модель з прив'язаним інтерфейсом IUser
export default model<IUser>('User', userSchema);