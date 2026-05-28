import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Search, Filter, Clock, Users, Calendar, Lock, Edit, Trash2, Repeat, Award, X } from "lucide-react";
import { testsAPI, Test, getUser, hasRole } from "../api/api";
import { renderSafeText } from "../utils/escapeHtml";
import { getCategoryLabel, getCategoryOptions } from "../utils/categoryUtils";

export function Dashboard() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'AVAILABLE' | 'COMPLETED' | 'EXPIRED' | 'MY'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [attemptsData, setAttemptsData] = useState<Map<string, { remaining: number; canTake: boolean }>>(new Map());
  const [myTests, setMyTests] = useState<Set<string>>(new Set());
  const [totalPointsData, setTotalPointsData] = useState<Map<string, number>>(new Map());
  const user = getUser();
  const isTesterOrAdmin = hasRole(['TESTER', 'ADMIN']);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadTests();
    if (user) {
      loadMyTests();
      loadAttemptsForAllTests();
      loadUserPointsForTests();
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [filterCategory, dateFrom, dateTo]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const filters: { category?: string; dateFrom?: string; dateTo?: string } = {};
      if (filterCategory !== 'all') filters.category = filterCategory;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const data = await testsAPI.getAll(user?.email, filters);
      setTests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки тестов:', error);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyTests = async () => {
    try {
      const allTests = await testsAPI.getAll();
      const testsArray = Array.isArray(allTests) ? allTests : [];
      const myTestIds = new Set(testsArray.filter(t => t.createdBy === user?.id).map(t => t.id));
      setMyTests(myTestIds);
    } catch (error) {
      console.error('Ошибка загрузки моих тестов:', error);
    }
  };

  const loadAttemptsForAllTests = async () => {
    if (!user) return;
    try {
      const allTests = await testsAPI.getAll();
      const testsArray = Array.isArray(allTests) ? allTests : [];
      const attemptsMap = new Map<string, { remaining: number; canTake: boolean }>();

      for (const test of testsArray) {
        try {
          const result = await testsAPI.checkAttempts(test.id, user.id);
          attemptsMap.set(test.id, { remaining: result.attemptsLeft, canTake: result.canTake });
        } catch (error) {
          attemptsMap.set(test.id, { remaining: 999, canTake: true });
        }
      }
      setAttemptsData(attemptsMap);
    } catch (error) {
      console.error('Ошибка загрузки попыток:', error);
    }
  };

  const loadUserPointsForTests = async () => {
    if (!user) return;
    try {
      const userResults = await testsAPI.getUserResults(user.id);
      const pointsMap = new Map<string, number>();
      for (const result of userResults) {
        const currentPoints = pointsMap.get(result.testId) || 0;
        pointsMap.set(result.testId, currentPoints + (result.pointsEarned || 0));
      }
      setTotalPointsData(pointsMap);
    } catch (error) {
      console.error('Ошибка загрузки баллов по тестам:', error);
    }
  };

  const handleDeleteTest = async (testId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    const canDelete = isAdmin || test.createdBy === user?.id;
    if (!canDelete) {
      alert('Вы можете удалять только свои тесты');
      return;
    }

    if (confirm(`Вы уверены, что хотите удалить тест "${test.title}"?`)) {
      try {
        await testsAPI.delete(testId);
        await loadTests();
        await loadMyTests();
        alert('Тест успешно удален');
      } catch (err) {
        console.error('Ошибка удаления:', err);
        alert('Не удалось удалить тест');
      }
    }
  };

  const getTestStatus = (test: Test): 'available' | 'completed' | 'expired' => {
    if (test.status === 'EXPIRED') return 'expired';
    const isCreator = test.createdBy === user?.id;
    const isAdminUser = user?.role === 'ADMIN';
    if (isCreator || isAdminUser) return 'available';
    const attempts = attemptsData.get(test.id);
    if (attempts && !attempts.canTake && test.maxAttempts && test.maxAttempts > 0) return 'completed';
    return 'available';
  };

  const getAttemptsInfo = (test: Test): string | null => {
    if (!test.maxAttempts || test.maxAttempts === 0) return null;
    const isCreator = test.createdBy === user?.id;
    const isAdminUser = user?.role === 'ADMIN';
    if (isCreator || isAdminUser) return `Лимит для других: ${test.maxAttempts} попыток`;
    const attempts = attemptsData.get(test.id);
    if (!attempts) return `${test.maxAttempts} попыток`;
    const used = test.maxAttempts - attempts.remaining;
    return `Использовано попыток: ${used} из ${test.maxAttempts}`;
  };

  const clearFilters = () => {
    setFilterCategory('all');
    setDateFrom('');
    setDateTo('');
  };

  const filteredTests = useMemo(() => {
    if (!Array.isArray(tests)) return [];
    return tests.filter(test => {
      const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const testStatus = getTestStatus(test);

      let matchesFilter = true;
      if (filterStatus === 'MY') {
        matchesFilter = myTests.has(test.id);
      } else if (filterStatus === 'AVAILABLE') {
        matchesFilter = testStatus === 'available';
      } else if (filterStatus === 'COMPLETED') {
        matchesFilter = testStatus === 'completed';
      } else if (filterStatus === 'EXPIRED') {
        matchesFilter = testStatus === 'expired';
      }

      return matchesSearch && matchesFilter;
    });
  }, [tests, searchQuery, filterStatus, myTests, attemptsData]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Доступен';
      case 'completed': return 'Попытки исчерпаны';
      case 'expired': return 'Просрочен';
      default: return 'Доступен';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success/20 text-success';
      case 'completed': return 'bg-warning/20 text-warning';
      case 'expired': return 'bg-danger/20 text-danger';
      default: return 'bg-success/20 text-success';
    }
  };

  if (loading) {
    return (
        <div className="p-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка тестов...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-foreground text-3xl font-bold mb-2">Доступные тесты</h1>
          <p className="text-muted-foreground">Выберите тест для прохождения</p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по названию или описанию..." className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer">
                <option value="all">Все тесты</option>
                <option value="AVAILABLE">Доступные</option>
                <option value="COMPLETED">Пройденные</option>
                <option value="EXPIRED">Просроченные</option>
                {isTesterOrAdmin && <option value="MY">Мои тесты</option>}
              </select>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-3 rounded-md transition-colors flex items-center gap-2 ${showFilters ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-muted/80'}`}>
              <Filter size={20} /> Расширенный поиск
            </button>
          </div>

          {showFilters && (
              <div className="bg-muted rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground font-medium">Фильтры</h3>
                  <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"><X size={14} /> Сбросить</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-muted-foreground text-sm mb-2">Категория</label>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-input border border-border rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="all">Все категории</option>
                      {getCategoryOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted-foreground text-sm mb-2">Дата от (создания)</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-input border border-border rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-muted-foreground text-sm mb-2">Дата до (создания)</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-input border border-border rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>
          )}
        </div>

        {filteredTests.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground">Тесты не найдены</p></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test) => {
                const status = getTestStatus(test);
                const isMyTest = myTests.has(test.id);
                const isCreator = test.createdBy === user?.id;
                const isAdminUser = user?.role === 'ADMIN';
                const canEditDelete = (isMyTest && isTesterOrAdmin) || isAdmin;
                const attemptsInfo = getAttemptsInfo(test);
                const userPoints = totalPointsData.get(test.id) || 0;
                const canTake = status === 'available';
                const buttonText = status === 'available' ? 'Подробнее' : (status === 'completed' ? 'Попытки исчерпаны' : 'Срок истек');
                const buttonClass = canTake || isCreator || isAdminUser ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-muted text-muted-foreground cursor-not-allowed pointer-events-none';

                return (
                    <div key={test.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-40 bg-muted overflow-hidden relative">
                        {test.imageUrl ? (
                            <img src={test.imageUrl} alt={renderSafeText(test.title)} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                        )}
                        {test.category && <div className="absolute top-2 left-2 bg-primary/90 text-white px-2 py-1 rounded-md text-xs">{getCategoryLabel(test.category)}</div>}
                        {test.isPrivate && <div className="absolute top-2 right-2 bg-primary/90 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1"><Lock size={12} /> Приватный</div>}
                        {canEditDelete && (
                            <div className="absolute bottom-2 right-2 flex gap-2">
                              <Link to={`/edit-test/${test.id}`} onClick={(e) => e.stopPropagation()} className="bg-primary text-white p-1.5 rounded-md hover:bg-primary/80"><Edit size={16} /></Link>
                              <button onClick={(e) => handleDeleteTest(test.id, e)} className="bg-danger text-white p-1.5 rounded-md hover:bg-danger/80"><Trash2 size={16} /></button>
                            </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-foreground font-semibold line-clamp-1 flex items-center gap-1">
                            {test.isPrivate && <Lock size={14} className="text-muted-foreground" />}
                            {renderSafeText(test.title)}
                            {(isCreator || isAdminUser) && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{isAdminUser ? 'Администратор' : 'Создатель'}</span>}
                          </h3>
                          {!isCreator && !isAdminUser && <span className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>{getStatusText(status)}</span>}
                          {(isCreator || isAdminUser) && <span className="px-2 py-1 rounded text-xs bg-success/20 text-success">Безлимит</span>}
                        </div>
                        <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{renderSafeText(test.description || 'Нет описания')}</p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-muted-foreground"><Clock size={16} /><span className="text-sm">{test.duration} минут</span></div>
                          <div className="flex items-center gap-2 text-muted-foreground"><Users size={16} /><span className="text-sm">Вопросов: {test.questionsCount || 0}</span></div>
                          {userPoints > 0 && <div className="flex items-center gap-2 text-yellow-500"><Award size={16} /><span className="text-sm">Ваши баллы: {userPoints}</span></div>}
                          {attemptsInfo && <div className="flex items-center gap-2 text-muted-foreground"><Repeat size={16} /><span className="text-sm">{attemptsInfo}</span></div>}
                          {test.deadline && <div className="flex items-center gap-2 text-muted-foreground"><Calendar size={16} /><span className="text-sm">До {new Date(test.deadline).toLocaleDateString('ru-RU')}</span></div>}
                          <div className="flex items-center gap-2 text-muted-foreground"><span className="text-xs px-2 py-0.5 bg-muted rounded-full">{getCategoryLabel(test.category)}</span></div>
                        </div>
                        <Link to={`/test/${test.id}/info`} className={`block text-center py-3 rounded-md transition-colors ${buttonClass}`}>{buttonText}</Link>
                      </div>
                    </div>
                );
              })}
            </div>
        )}
      </div>
  );
}