import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, User } from "lucide-react";
import { authAPI, saveUser } from "../api/api";
import { InfoModal } from "../components/InfoModal";

const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalType, setInfoModalType] = useState<'register' | 'login'>('register');
  const [pendingUser, setPendingUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await authAPI.login(email, password);
        setPendingUser(user);
        setInfoModalType('login');
        setShowInfoModal(true);
      } else if (mode === 'register') {
        const safeName = escapeHtml(name);
        const user = await authAPI.register(safeName, email, password);
        setPendingUser(user);
        setInfoModalType('register');
        setShowInfoModal(true);
      } else if (mode === 'reset') {
        if (resetCode) {
          await authAPI.resetPassword(resetCode, password);
          setSuccess('Пароль успешно изменен! Теперь вы можете войти.');
          setTimeout(() => { setMode('login'); setSuccess(''); }, 3000);
        } else {
          await authAPI.forgotPassword(email);
          setSuccess('Код для сброса пароля отправлен на вашу почту!');
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('заблокирован')) {
        setError('Вы заблокированы. Обращение можете оставить по system_rgr2026@yandex.ru');
      } else {
        setError(err.message || 'Произошла ошибка');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInfoModalClose = () => {
    setShowInfoModal(false);
    if (pendingUser) {
      saveUser(pendingUser);
      navigate('/');
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-foreground text-3xl font-bold mb-2">Система тестирования</h1>
            <p className="text-muted-foreground">
              {mode === 'login' && 'Войдите в свой аккаунт'}
              {mode === 'register' && 'Создайте новый аккаунт'}
              {mode === 'reset' && (resetCode ? 'Введите новый пароль' : 'Восстановите пароль')}
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 border border-border">
            {error && <div className="mb-4 p-3 bg-danger/20 border border-danger/50 rounded-lg text-danger text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-success/20 border border-success/50 rounded-lg text-success text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                  <div>
                    <label className="block text-foreground mb-2">Никнейм</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Введите имя" required />
                    </div>
                  </div>
              )}

              {(!resetCode || mode === 'login' || mode === 'register') && (
                  <div>
                    <label className="block text-foreground mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="example@mail.com" required disabled={mode === 'reset' && !!resetCode} />
                    </div>
                  </div>
              )}

              {mode !== 'reset' && (
                  <div>
                    <label className="block text-foreground mb-2">Пароль</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Введите пароль" required />
                    </div>
                  </div>
              )}

              {mode === 'reset' && resetCode && (
                  <div>
                    <label className="block text-foreground mb-2">Новый пароль</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Введите новый пароль" required />
                    </div>
                  </div>
              )}

              {mode === 'reset' && !resetCode && (
                  <div>
                    <label className="block text-foreground mb-2">Код из письма</label>
                    <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Введите код из письма" />
                    <p className="text-muted-foreground text-sm mt-2">Введите код, который пришел на вашу почту</p>
                  </div>
              )}

              {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setMode('reset'); setResetCode(''); setPassword(''); setError(''); setSuccess(''); }} className="text-primary hover:underline">Забыли пароль?</button>
                  </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-md transition-colors disabled:opacity-50">
                {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти' : mode === 'register' ? 'Зарегистрироваться' : resetCode ? 'Сменить пароль' : 'Отправить код')}
              </button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'login' && (
                  <p className="text-muted-foreground">Нет аккаунта? <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="text-primary hover:underline">Зарегистрироваться</button></p>
              )}
              {(mode === 'register' || (mode === 'reset' && !resetCode)) && (
                  <p className="text-muted-foreground">Уже есть аккаунт? <button onClick={() => { setMode('login'); setResetCode(''); setError(''); setSuccess(''); }} className="text-primary hover:underline">Войти</button></p>
              )}
              {mode === 'reset' && resetCode && (
                  <p className="text-muted-foreground"><button onClick={() => { setMode('reset'); setResetCode(''); setError(''); setSuccess(''); }} className="text-primary hover:underline">← Назад к вводу email</button></p>
              )}
            </div>

            {mode === 'register' && (
                <p className="mt-4 text-muted-foreground text-center text-sm">После регистрации на указанный email будет отправлено письмо с кодом подтверждения</p>
            )}
          </div>
        </div>

        <InfoModal isOpen={showInfoModal} onClose={handleInfoModalClose} type={infoModalType} />
      </div>
  );
}