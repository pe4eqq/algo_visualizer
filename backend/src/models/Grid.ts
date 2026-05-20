import { Schema, model, Document } from 'mongoose';

export interface IGrid extends Document {
  user: Schema.Types.ObjectId; // Посилання на ID юзера
  name: string;
  grid: number[][];
  start: [number, number];
  end: [number, number];
  createdAt: Date;
}

const GridSchema = new Schema<IGrid>({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Вказуємо зв'язок з моделлю User
  },
  name: { type: String, required: [true, 'Будь ласка, вкажіть назву для карти'], trim: true },
  grid: { type: [[Number]], required: [true, 'Матриця карти обовʼзовкова'] },
  start: { type: [Number], required: [true, 'Початкова точка обовʼязкова'] },
  end: { type: [Number], required: [true, 'Кінцева точка обовʼязкова'] },
  createdAt: { type: Date, default: Date.now }
});

export default model<IGrid>('Grid', GridSchema);