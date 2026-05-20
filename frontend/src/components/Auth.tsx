import { useState } from 'react';
import API from '../services/api';
import { LogIn, UserPlus, Lock, Mail, User } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (username: string) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin ? { email, password } : { username, email, password };

    try {
      const response = await API.post(endpoint, payload);
      
      if (response.data.token) {
        // Зберігаємо токен та ім'я користувача в браузері
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.user?.username || username);
        
        // Сповіщаємо головний додаток про успіх
        onAuthSuccess(response.data.user?.username || username);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Щось пішло не так. Спробуйте знову.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '4rem auto',
      background: '#1e293b',
      padding: '2.5rem',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      border: '1px solid #334155'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {isLogin ? 'Ласкаво просимо' : 'Створити акаунт'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          {isLogin ? 'Увійдіть, щоб зберігати свої лабіринти' : 'Зареєструйтеся для доступу до хмари'}
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '500' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {!isLogin && (
          <div style={{ position: 'relative' }}>
            <User size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Ім'я користувача"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', outline: 'none' }}
            />
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="email"
            placeholder="Електронна пошта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', outline: 'none' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', outline: 'none' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '0.75rem',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '600',
            marginTop: '0.5rem'
          }}
        >
          {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
          {loading ? 'Обробка...' : isLogin ? 'Увійти' : 'Зареєструватися'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          style={{ background: 'transparent', border: 'none', color: '#a5b4fc', fontSize: '0.9rem', textDecoration: 'underline' }}
        >
          {isLogin ? 'Немає акаунту? Створіть новий' : 'Вже маю акаунт. Увійти'}
        </button>
      </div>
    </div>
  );
}