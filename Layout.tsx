import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { LayoutDashboard, FileText, BarChart3, Users, LogOut, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { getUser, removeUser, User } from "../api/api";
import { escapeHtml } from "../utils/escapeHtml";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    removeUser();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  const userRole = user.role.toLowerCase();

  return (
      <div className="min-h-screen flex">
        <aside className="w-64 bg-muted border-r border-border flex flex-col">
          <div className="p-6 border-b border-border">
            <h1 className="text-foreground text-xl font-bold">BrainTest</h1>
            <p className="text-muted-foreground text-sm mt-2">{escapeHtml(user.name)}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/') ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-input hover:text-foreground'}`}>
              <LayoutDashboard size={20} /><span>Главная</span>
            </Link>
            <Link to="/my-statistics" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/my-statistics') ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-input hover:text-foreground'}`}>
              <TrendingUp size={20} /><span>Моя статистика</span>
            </Link>
            {(userRole === 'tester' || userRole === 'admin') && (
                <>
                  <Link to="/create-test" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/create-test') ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-input hover:text-foreground'}`}>
                    <FileText size={20} /><span>Создать тест</span>
                  </Link>
                  <Link to="/statistics" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/statistics') ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-input hover:text-foreground'}`}>
                    <BarChart3 size={20} /><span>Статистика</span>
                  </Link>
                </>
            )}
            {userRole === 'admin' && (
                <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive('/admin') ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-input hover:text-foreground'}`}>
                  <Users size={20} /><span>Админ-панель</span>
                </Link>
            )}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="mb-3 px-4 py-2 bg-input/50 rounded-md">
              <p className="text-muted-foreground text-xs">Роль:</p>
              <p className="text-foreground text-sm font-medium">
                {userRole === 'admin' && 'Администратор'}
                {userRole === 'tester' && 'Тестировщик'}
                {userRole === 'user' && 'Пользователь'}
              </p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:bg-input hover:text-foreground w-full transition-colors">
              <LogOut size={20} /><span>Выйти</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto"><Outlet /></main>
      </div>
  );
}