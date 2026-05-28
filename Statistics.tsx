import { useState, useEffect } from "react";
import { Link } from "react-router";
import { BarChart3, Users, Award, TrendingUp, Eye, XCircle, CheckCircle, Clock, Lock, Trash2, Edit } from "lucide-react";
import { testsAPI, getUser, Test, TestResultWithUser } from "../api/api";
import { renderSafeText } from "../utils/escapeHtml";
import { formatDate, formatTime } from "../utils/dateUtils";
import { getCategoryLabel } from "../utils/categoryUtils";

export function Statistics() {
  const [myTests, setMyTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testResults, setTestResults] = useState<TestResultWithUser[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedResultDetails, setSelectedResultDetails] = useState<any>(null);
  const [showResultDetailsModal, setShowResultDetailsModal] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);

  const currentUser = getUser();

  useEffect(() => { loadMyTests(); }, []);

  const loadMyTests = async () => {
    try {
      setLoading(true);
      const allTests = await testsAPI.getAll(currentUser?.email);
      const testsArray = Array.isArray(allTests) ? allTests : [];
      const myCreatedTests = testsArray.filter(test => test.createdBy === currentUser?.id);
      setMyTests(myCreatedTests);
    } catch (err) {
      setError('Не удалось загрузить ваши тесты');
    } finally {
      setLoading(false);
    }
  };

  const viewTestResults = async (test: Test) => {
    try {
      const results = await testsAPI.getTestResultsWithUsers(test.id);
      setSelectedTest(test);
      setTestResults(results);
      setShowResultsModal(true);
    } catch (err) {
      setError('Не удалось загрузить результаты теста');
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

  const handleDeleteTest = async (testId: string, testTitle: string) => {
    if (!confirm(`Вы уверены, что хотите удалить тест "${testTitle}"? Это действие необратимо.`)) return;
    setDeletingTestId(testId);
    setError('');
    try {
      await testsAPI.delete(testId);
      await loadMyTests();
      alert('Тест успешно удален');
    } catch (err) {
      setError('Не удалось удалить тест');
    } finally {
      setDeletingTestId(null);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-danger';
  };

  if (loading) {
    return (
        <div className="p-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка ваших тестов...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-foreground text-3xl font-bold mb-2">Статистика тестов</h1>
          <p className="text-muted-foreground">Аналитика по созданным вами тестам</p>
          <p className="text-sm text-muted-foreground mt-2">Всего тестов: {myTests.length}</p>
        </div>

        {error && <div className="mb-4 p-3 bg-danger/20 border border-danger/50 rounded-lg text-danger text-sm">{error}</div>}

        {myTests.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <BarChart3 size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">У вас пока нет созданных тестов</p>
              <Link to="/create-test" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md">Создать первый тест</Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTests.map((test) => (
                  <div key={test.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {test.imageUrl ? (
                        <img src={test.imageUrl} alt={renderSafeText(test.title)} className="w-full h-40 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><BarChart3 size={40} className="text-muted-foreground" /></div>
                    )}
                    <div className="p-5">
                      <div className="mb-2">
                        <h3 className="text-foreground font-semibold text-lg">{renderSafeText(test.title)}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">{getCategoryLabel(test.category)}</span>
                          {test.isPrivate && <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center gap-1"><Lock size={12} /> Приватный</span>}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{renderSafeText(test.description || 'Нет описания')}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span>Вопросов: {test.questionsCount || 0}</span>
                        <span>Длительность: {test.duration} мин</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => viewTestResults(test)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"><Eye size={18} /> Статистика</button>
                        <Link to={`/edit-test/${test.id}`} className="flex items-center justify-center gap-1 px-4 py-2 bg-secondary/20 text-secondary rounded-md hover:bg-secondary/30 transition-colors"><Edit size={18} /></Link>
                        <button onClick={() => handleDeleteTest(test.id, test.title)} disabled={deletingTestId === test.id} className="flex items-center justify-center gap-1 px-4 py-2 bg-danger/20 text-danger rounded-md hover:bg-danger/30 transition-colors disabled:opacity-50">{deletingTestId === test.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-danger"></div> : <Trash2 size={18} />}</button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
        )}

        {showResultsModal && selectedTest && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg max-w-5xl w-full max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border p-5 flex justify-between items-center">
                  <div><h3 className="text-foreground text-xl font-bold">Результаты теста</h3><p className="text-muted-foreground">{renderSafeText(selectedTest.title)}</p>{selectedTest.isPrivate && <span className="text-xs text-yellow-500 mt-1 inline-block">Приватный тест</span>}</div>
                  <button onClick={() => setShowResultsModal(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button>
                </div>
                <div className="p-6">
                  {testResults.length === 0 ? (<div className="text-center py-8"><p className="text-muted-foreground">Нет результатов прохождения</p></div>) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted"><tr><th className="text-left py-3 px-4 text-muted-foreground">Пользователь</th><th className="text-left py-3 px-4 text-muted-foreground">Email</th><th className="text-left py-3 px-4 text-muted-foreground">Дата</th><th className="text-left py-3 px-4 text-muted-foreground">Результат</th><th className="text-left py-3 px-4 text-muted-foreground">Баллы</th><th className="text-left py-3 px-4 text-muted-foreground">Время</th><th className="text-left py-3 px-4 text-muted-foreground">Статус</th><th className="text-left py-3 px-4 text-muted-foreground">Действия</th></tr></thead>
                          <tbody>
                          {testResults.map((item) => (
                              <tr key={item.result.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 text-foreground font-medium">{renderSafeText(item.user.name)}</td>
                                <td className="py-3 px-4 text-muted-foreground">{renderSafeText(item.user.email)}</td>
                                <td className="py-3 px-4 text-foreground text-sm">{formatDate(item.result.completedAt)}</td>
                                <td className="py-3 px-4"><span className={`font-bold ${getScoreColor(item.result.percentage)}`}>{Math.round(item.result.percentage)}%</span></td>
                                <td className="py-3 px-4">{item.result.pointsEarned} / {item.result.pointsTotal}</td>
                                <td className="py-3 px-4">{formatTime(item.result.timeSpent)}</td>
                                <td className="py-3 px-4">{item.result.passed ? <span className="text-success text-sm flex items-center gap-1"><CheckCircle size={14} /> Пройден</span> : <span className="text-danger text-sm flex items-center gap-1"><XCircle size={14} /> Не пройден</span>}</td>
                                <td className="py-3 px-4"><button onClick={() => viewResultDetails(item.result)} className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors text-sm"><Eye size={14} /> Детали</button></td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}

        {showResultDetailsModal && selectedResultDetails && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border p-5 flex justify-between items-center"><h3 className="text-foreground text-xl font-bold">Детали прохождения</h3><button onClick={() => setShowResultDetailsModal(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button></div>
                <div className="p-6">
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="bg-muted p-3 rounded-lg text-center"><p className="text-muted-foreground text-sm">Результат</p><p className={`text-2xl font-bold ${getScoreColor(selectedResultDetails.result.percentage)}`}>{Math.round(selectedResultDetails.result.percentage)}%</p></div>
                    <div className="bg-muted p-3 rounded-lg text-center"><p className="text-muted-foreground text-sm">Баллы</p><p className="text-foreground text-2xl font-bold">{selectedResultDetails.result.pointsEarned} / {selectedResultDetails.result.pointsTotal}</p></div>
                    <div className="bg-muted p-3 rounded-lg text-center"><p className="text-muted-foreground text-sm">Время</p><p className="text-foreground text-2xl font-bold">{formatTime(selectedResultDetails.result.timeSpent)}</p></div>
                    <div className="bg-muted p-3 rounded-lg text-center"><p className="text-muted-foreground text-sm">Дата</p><p className="text-foreground text-sm">{formatDate(selectedResultDetails.result.completedAt)}</p></div>
                  </div>
                  <h4 className="text-foreground font-medium mb-3">Ответы на вопросы:</h4>
                  <div className="space-y-3">{selectedResultDetails.answers.map((answer: any, idx: number) => (<div key={idx} className={`p-3 rounded-lg ${answer.isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}><p className="text-foreground text-sm"><span className="font-medium">Вопрос {idx + 1}:</span> {answer.questionId}</p><p className="text-muted-foreground text-sm mt-1"><span className="font-medium">Ответ:</span> {answer.answerId || answer.textAnswer || answer.numberAnswer || 'Не указан'}</p><p className="text-muted-foreground text-sm mt-1"><span className="font-medium">Результат:</span> {answer.isCorrect ? '✅ Правильно' : '❌ Неправильно'}</p><p className="text-muted-foreground text-sm"><span className="font-medium">Баллы:</span> {answer.pointsEarned} / {answer.pointsMax}</p></div>))}</div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}