import { useState, useEffect, useMemo } from "react";
import { Search, Edit, Trash2, UserPlus, Shield, User as UserIcon, Ban, Unlock, FileText, Settings, Lock as LockIcon, Unlock as UnlockIcon, BarChart3, Eye, TrendingUp, XCircle } from "lucide-react";
import { adminAPI, testsAPI, User } from "../api/api";
import { Link } from "react-router";
import { renderSafeText } from "../utils/escapeHtml";
import { formatDate, formatTime } from "../utils/dateUtils";
import { getCategoryLabel } from "../utils/categoryUtils";

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [testsWithStats, setTestsWithStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'USER' | 'TESTER' | 'ADMIN'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'tests' | 'settings'>('users');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [adminStats, setAdminStats] = useState({ totalTests: 0, completedTests: 0, totalUsers: 0 });
  const [selectedTestDetails, setSelectedTestDetails] = useState<any>(null);
  const [showTestDetailsModal, setShowTestDetailsModal] = useState(false);
  const [selectedResultDetails, setSelectedResultDetails] = useState<any>(null);
  const [showResultDetailsModal, setShowResultDetailsModal] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const init = async () => {
      await loadUsers();
      await loadRegistrationConfig();
      await loadAdminStatistics();
    };
    init();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrationConfig = async () => {
    try {
      const config = await adminAPI.getRegistrationConfig();
      setRegistrationEnabled(config.enabled);
    } catch (err) {}
  };

  const loadAdminStatistics = async () => {
    try {
      const stats = await adminAPI.getAdminStatistics();
      setAdminStats(stats);
    } catch (err) {}
  };

  const loadAllTestsWithStats = async () => {
    try {
      const tests = await testsAPI.getAll();
      const testsArray = Array.isArray(tests) ? tests : [];
      setAllTests(testsArray);
      const testsWithStatsArray: any[] = [];
      for (const test of testsArray) {
        const results = await testsAPI.getTestResults(test.id);
        const resultsArray = Array.isArray(results) ? results : [];
        const attemptsCount = resultsArray.length;
        const passedCount = resultsArray.filter((r: any) => r.passed).length;
        const avgScore = attemptsCount > 0 ? Math.round(resultsArray.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / attemptsCount) : 0;
        testsWithStatsArray.push({ ...test, attemptsCount, passedCount, avgScore, passRate: attemptsCount > 0 ? Math.round((passedCount / attemptsCount) * 100) : 0 });
      }
      setTestsWithStats(testsWithStatsArray);
    } catch (error) {}
  };

  const handleToggleRegistration = async () => {
    setSavingConfig(true);
    try {
      const newState = !registrationEnabled;
      await adminAPI.updateRegistrationConfig(newState);
      setRegistrationEnabled(newState);
      setSuccess(`Регистрация ${newState ? 'включена' : 'отключена'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Не удалось изменить настройку');
    } finally {
      setSavingConfig(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      await adminAPI.updateRole(userId, newRole);
      await loadUsers();
      setEditingUser(null);
      setSuccess('Роль пользователя обновлена');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить роль');
    }
  };

  const toggleBan = async (userId: string, isBanned: boolean) => {
    if (userId === currentUser.id) {
      setError('Нельзя изменить статус своего аккаунта');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      if (isBanned) await adminAPI.unbanUser(userId);
      else await adminAPI.banUser(userId);
      await loadUsers();
      setSuccess(isBanned ? 'Пользователь разблокирован' : 'Пользователь заблокирован');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Не удалось изменить статус');
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      setError('Нельзя удалить свой аккаунт');
      return;
    }
    if (confirm('Вы уверены, что хотите удалить пользователя?')) {
      try {
        await adminAPI.deleteUser(userId);
        await loadUsers();
        setSuccess('Пользователь удален');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.message || 'Не удалось удалить пользователя');
      }
    }
  };

  const deleteTest = async (testId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот тест?')) {
      try {
        await testsAPI.delete(testId);
        await loadAllTestsWithStats();
        await loadAdminStatistics();
        setSuccess('Тест удален');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Не удалось удалить тест');
      }
    }
  };

  const viewTestStatistics = async (testId: string) => {
    try {
      const test = allTests.find(t => t.id === testId);
      const results = await testsAPI.getTestResultsWithUsers(testId);
      setSelectedTestDetails({ test, results });
      setShowTestDetailsModal(true);
    } catch (err) {
      setError('Не удалось загрузить статистику теста');
    }
  };

  const viewResultDetails = async (result: any) => {
    try {
      const answers = await testsAPI.getResultAnswers(result.id);
      setSelectedResultDetails({ result, answers });
      setShowResultDetailsModal(true);
    } catch (err) {
      setError('Не удалось загрузить детали результата');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = { ADMIN: 'bg-danger/20 text-danger', TESTER: 'bg-secondary/20 text-secondary', USER: 'bg-primary/20 text-primary' };
    const labels: Record<string, string> = { ADMIN: 'Администратор', TESTER: 'Тестировщик', USER: 'Пользователь' };
    return { style: styles[role] || styles.USER, label: labels[role] || 'Пользователь' };
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(user => {
      const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesFilter;
    });
  }, [users, searchQuery, filterRole]);

  const userStats = useMemo(() => {
    if (!Array.isArray(users)) return { total: 0, testers: 0, admins: 0, active: 0, blocked: 0 };
    return {
      total: users.length,
      testers: users.filter(u => u.role === 'TESTER').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      active: users.filter(u => u.status === 'ACTIVE').length,
      blocked: users.filter(u => u.status === 'BLOCKED').length
    };
  }, [users]);

  if (loading && activeTab === 'users') {
    return (
        <div className="p-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка пользователей...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-foreground text-2xl font-bold mb-2">Панель администратора</h1>
          <p className="text-muted-foreground">Управление пользователями, тестами и настройками системы</p>
        </div>

        {error && <div className="mb-4 p-3 bg-danger/20 border border-danger/50 rounded-lg text-danger text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-success/20 border border-success/50 rounded-lg text-success text-sm">{success}</div>}

        <div className="flex gap-4 mb-6 border-b border-border">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 flex items-center gap-2 transition-colors ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <UserIcon size={18} /> Пользователи
          </button>
          <button onClick={() => { setActiveTab('tests'); loadAllTestsWithStats(); }} className={`px-4 py-2 flex items-center gap-2 transition-colors ${activeTab === 'tests' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <FileText size={18} /> Все тесты
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 flex items-center gap-2 transition-colors ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Settings size={18} /> Настройки
          </button>
        </div>

        {activeTab === 'users' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-primary/20 p-2 rounded-lg"><UserIcon className="text-primary" size={24} /></div><p className="text-muted-foreground">Всего</p></div><p className="text-foreground text-2xl font-bold">{userStats.total}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-secondary/20 p-2 rounded-lg"><Shield className="text-secondary" size={24} /></div><p className="text-muted-foreground">Тестировщиков</p></div><p className="text-foreground text-2xl font-bold">{userStats.testers}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-danger/20 p-2 rounded-lg"><Shield className="text-danger" size={24} /></div><p className="text-muted-foreground">Администраторов</p></div><p className="text-foreground text-2xl font-bold">{userStats.admins}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-success/20 p-2 rounded-lg"><UserPlus className="text-success" size={24} /></div><p className="text-muted-foreground">Активных</p></div><p className="text-foreground text-2xl font-bold">{userStats.active}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-danger/20 p-2 rounded-lg"><Ban className="text-danger" size={24} /></div><p className="text-muted-foreground">Заблокированных</p></div><p className="text-foreground text-2xl font-bold">{userStats.blocked}</p></div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по имени или email..." className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as any)} className="bg-input border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="all">Все роли</option>
                  <option value="USER">Пользователи</option>
                  <option value="TESTER">Тестировщики</option>
                  <option value="ADMIN">Администраторы</option>
                </select>
              </div>

              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Пользователь</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Роль</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Тестов</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Средний балл</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Всего баллов</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Дата регистрации</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Статус</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredUsers.map((user) => {
                      const roleBadge = getRoleBadge(user.role);
                      const isBlocked = user.status === 'BLOCKED';
                      const isCurrentUser = user.id === currentUser.id;
                      return (
                          <tr key={user.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-6"><div><p className="text-foreground font-medium">{renderSafeText(user.name)}{isCurrentUser && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Вы</span>}</p><p className="text-muted-foreground text-sm">{renderSafeText(user.email)}</p></div></td>
                            <td className="py-4 px-6">{editingUser === user.id ? (<select value={user.role} onChange={(e) => changeUserRole(user.id, e.target.value)} className="bg-input border border-border rounded px-3 py-1 text-foreground"><option value="USER">Пользователь</option><option value="TESTER">Тестировщик</option><option value="ADMIN" disabled>Администратор (недоступно)</option></select>) : (<span className={`px-3 py-1 rounded text-sm ${roleBadge.style}`}>{roleBadge.label}</span>)}</td>
                            <td className="py-4 px-6 text-foreground">{user.testsCompleted ?? 0}</td>
                            <td className="py-4 px-6"><span className={`px-2 py-1 rounded text-sm ${(user.avgScore ?? 0) >= 70 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>{Math.round(user.avgScore ?? 0)}%</span></td>
                            <td className="py-4 px-6 text-foreground font-medium">{user.totalPoints ?? 0}</td>
                            <td className="py-4 px-6 text-foreground text-sm">{formatDate(user.registeredAt || new Date().toISOString())}</td>
                            <td className="py-4 px-6"><span className={`px-3 py-1 rounded text-sm ${isBlocked ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>{isBlocked ? 'Заблокирован' : 'Активен'}</span></td>
                            <td className="py-4 px-6"><div className="flex items-center gap-2"><button onClick={() => setEditingUser(editingUser === user.id ? null : user.id)} className={`p-2 text-primary hover:bg-primary/10 rounded transition-colors ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isCurrentUser}><Edit size={18} /></button><button onClick={() => toggleBan(user.id, isBlocked)} className={`p-2 rounded transition-colors ${isBlocked ? 'text-success hover:bg-success/10' : 'text-danger hover:bg-danger/10'} ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isCurrentUser}>{isBlocked ? <Unlock size={18} /> : <Ban size={18} />}</button><button onClick={() => deleteUser(user.id)} className={`p-2 text-danger hover:bg-danger/10 rounded transition-colors ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isCurrentUser}><Trash2 size={18} /></button></div></td>
                          </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
              {filteredUsers.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">Пользователи не найдены</p></div>}
            </>
        )}

        {activeTab === 'tests' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-primary/20 p-2 rounded-lg"><FileText className="text-primary" size={24} /></div><p className="text-muted-foreground">Всего создано тестов</p></div><p className="text-foreground text-3xl font-bold">{adminStats.totalTests}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-success/20 p-2 rounded-lg"><TrendingUp className="text-success" size={24} /></div><p className="text-muted-foreground">Пройденных тестов</p></div><p className="text-foreground text-3xl font-bold">{adminStats.completedTests}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-secondary/20 p-2 rounded-lg"><UserIcon className="text-secondary" size={24} /></div><p className="text-muted-foreground">Всего пользователей</p></div><p className="text-foreground text-3xl font-bold">{adminStats.totalUsers}</p></div>
              </div>

              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Название</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Категория</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Тип</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Дата создания</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Вопросов</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Попыток</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Ср. балл</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Проход</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {testsWithStats.map((test) => (
                        <tr key={test.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-6"><div><p className="text-foreground font-medium">{renderSafeText(test.title)}</p></div></td>
                          <td className="py-4 px-6"><span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">{getCategoryLabel(test.category)}</span></td>
                          <td className="py-4 px-6">{test.isPrivate ? <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full flex items-center gap-1 w-fit"><LockIcon size={12} /> Приватный</span> : <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">Публичный</span>}</td>
                          <td className="py-4 px-6 text-foreground text-sm">{formatDate(test.createdAt)}</td>
                          <td className="py-4 px-6 text-foreground">{test.questionsCount || 0}</td>
                          <td className="py-4 px-6 text-foreground">{test.attemptsCount || 0}</td>
                          <td className="py-4 px-6"><span className={`px-2 py-1 rounded text-sm ${(test.avgScore || 0) >= 70 ? 'bg-success/20 text-success' : (test.avgScore || 0) >= 50 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}`}>{test.avgScore || 0}%</span></td>
                          <td className="py-4 px-6"><span className={`px-2 py-1 rounded text-sm ${(test.passRate || 0) >= 70 ? 'bg-success/20 text-success' : (test.passRate || 0) >= 50 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}`}>{test.passRate || 0}%</span></td>
                          <td className="py-4 px-6"><div className="flex items-center gap-2"><button onClick={() => viewTestStatistics(test.id)} className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"><BarChart3 size={18} /></button><Link to={`/edit-test/${test.id}`} className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"><Edit size={18} /></Link><button onClick={() => deleteTest(test.id)} className="p-2 text-danger hover:bg-danger/10 rounded transition-colors"><Trash2 size={18} /></button><Link to={`/test-statistics/${test.id}`} className="p-2 text-secondary hover:bg-secondary/10 rounded transition-colors"><Eye size={18} /></Link></div></td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {testsWithStats.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">Тесты не найдены</p></div>}
            </>
        )}

        {activeTab === 'settings' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-foreground text-xl font-bold mb-6 flex items-center gap-2"><Settings size={24} /> Настройки системы</h3>
              <div className="space-y-6">
                <div className="border-b border-border pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground text-lg font-medium flex items-center gap-2">{registrationEnabled ? <UnlockIcon size={20} className="text-success" /> : <LockIcon size={20} className="text-danger" />}Регистрация новых пользователей</h4>
                      <p className="text-muted-foreground text-sm mt-1">{registrationEnabled ? 'Новые пользователи могут самостоятельно регистрироваться' : 'Регистрация новых пользователей отключена'}</p>
                    </div>
                    <button onClick={handleToggleRegistration} disabled={savingConfig} className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${registrationEnabled ? 'bg-danger/20 text-danger hover:bg-danger/30' : 'bg-success/20 text-success hover:bg-success/30'} ${savingConfig ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {savingConfig ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : registrationEnabled ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
                      {registrationEnabled ? 'Отключить регистрацию' : 'Включить регистрацию'}
                    </button>
                  </div>
                </div>
                <div className="pt-4">
                  <h4 className="text-foreground text-lg font-medium mb-4">Информация о системе</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4"><p className="text-muted-foreground text-sm">Всего пользователей</p><p className="text-foreground text-2xl font-bold">{userStats.total}</p></div>
                    <div className="bg-muted/50 rounded-lg p-4"><p className="text-muted-foreground text-sm">Всего тестов</p><p className="text-foreground text-2xl font-bold">{testsWithStats.length}</p></div>
                    <div className="bg-muted/50 rounded-lg p-4"><p className="text-muted-foreground text-sm">Активных пользователей</p><p className="text-foreground text-2xl font-bold">{userStats.active}</p></div>
                    <div className="bg-muted/50 rounded-lg p-4"><p className="text-muted-foreground text-sm">Заблокированных</p><p className="text-foreground text-2xl font-bold">{userStats.blocked}</p></div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}