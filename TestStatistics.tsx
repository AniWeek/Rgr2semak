import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Users, Award, Clock, CheckCircle, XCircle, Eye, BarChart3, TrendingUp } from "lucide-react";
import { testsAPI, getUser, TestResultWithUser } from "../api/api";
import { renderSafeText } from "../utils/escapeHtml";
import { formatDate, formatTime } from "../utils/dateUtils";
import { getCategoryLabel } from "../utils/categoryUtils";

export function TestStatistics() {
    const { id } = useParams();
    const [test, setTest] = useState<any>(null);
    const [results, setResults] = useState<TestResultWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedResultDetails, setSelectedResultDetails] = useState<any>(null);
    const [showResultDetailsModal, setShowResultDetailsModal] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) { window.location.href = '/login'; return; }
        setUser(currentUser);
        loadStatistics();
    }, [id]);

    const loadStatistics = async () => {
        try {
            setLoading(true);
            const testData = await testsAPI.getById(id!);
            setTest(testData);

            const isCreator = testData.createdBy === user?.id;
            const isAdmin = user?.role === 'ADMIN';
            if (!isCreator && !isAdmin) {
                setError('У вас нет прав для просмотра статистики этого теста');
                setLoading(false);
                return;
            }

            const resultsWithUsers = await testsAPI.getTestResultsWithUsers(id!);
            setResults(resultsWithUsers);
        } catch (err) {
            setError('Не удалось загрузить статистику теста');
        } finally {
            setLoading(false);
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

    const getScoreColor = (percentage: number) => {
        if (percentage >= 70) return 'text-success';
        if (percentage >= 50) return 'text-warning';
        return 'text-danger';
    };

    const totalAttempts = results.length;
    const passedCount = results.filter(r => r.result.passed).length;
    const failedCount = totalAttempts - passedCount;
    const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
    const averageScore = totalAttempts > 0 ? Math.round(results.reduce((sum, r) => sum + (r.result.percentage || 0), 0) / totalAttempts) : 0;
    const totalPointsEarned = results.reduce((sum, r) => sum + (r.result.pointsEarned || 0), 0);
    const totalPointsMax = results.reduce((sum, r) => sum + (r.result.pointsTotal || 0), 0);

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Загрузка статистики...</p>
                </div>
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="text-center py-12">
                    <p className="text-danger mb-4">{error || 'Тест не найден'}</p>
                    <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md"><ArrowLeft size={20} /> На главную</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link to="/statistics" className="text-muted-foreground hover:text-primary"><ArrowLeft size={24} /></Link>
                    <div>
                        <h1 className="text-foreground text-3xl font-bold mb-2">{renderSafeText(test.title)}</h1>
                        <p className="text-muted-foreground">Детальная статистика прохождения теста</p>
                        {test.category && <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">{getCategoryLabel(test.category)}</span>}
                        {test.isPrivate && <span className="inline-block mt-2 ml-2 text-xs px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full">Приватный тест</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-primary/20 p-2 rounded-lg"><BarChart3 className="text-primary" size={24} /></div><p className="text-muted-foreground">Попыток</p></div><p className="text-foreground text-3xl font-bold">{totalAttempts}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-success/20 p-2 rounded-lg"><CheckCircle className="text-success" size={24} /></div><p className="text-muted-foreground">Пройдено</p></div><p className="text-foreground text-3xl font-bold">{passedCount}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-danger/20 p-2 rounded-lg"><XCircle className="text-danger" size={24} /></div><p className="text-muted-foreground">Не пройдено</p></div><p className="text-foreground text-3xl font-bold">{failedCount}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-yellow-500/20 p-2 rounded-lg"><TrendingUp className="text-yellow-500" size={24} /></div><p className="text-muted-foreground">Проходной %</p></div><p className="text-foreground text-3xl font-bold">{passRate}%</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-secondary/20 p-2 rounded-lg"><Award className="text-secondary" size={24} /></div><p className="text-muted-foreground">Средний балл</p></div><p className={`text-foreground text-3xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}%</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-primary/20 p-2 rounded-lg"><Users className="text-primary" size={24} /></div><p className="text-muted-foreground">Всего баллов</p></div><p className="text-foreground text-3xl font-bold">{totalPointsEarned} / {totalPointsMax}</p></div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-6 border-b border-border"><h2 className="text-foreground text-xl font-bold flex items-center gap-2"><Users size={20} /> Результаты участников</h2></div>
                {results.length === 0 ? (<div className="text-center py-12"><p className="text-muted-foreground">Пока нет результатов прохождения</p></div>) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted"><tr><th className="text-left py-4 px-6 text-muted-foreground font-medium">Участник</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Email</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Дата</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Результат</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Баллы</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Время</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Статус</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Действия</th></tr></thead>
                            <tbody>
                            {results.map((item) => (
                                <tr key={item.result.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                    <td className="py-4 px-6"><p className="text-foreground font-medium">{renderSafeText(item.user.name)}</p></td>
                                    <td className="py-4 px-6 text-muted-foreground">{renderSafeText(item.user.email)}</td>
                                    <td className="py-4 px-6 text-foreground text-sm">{formatDate(item.result.completedAt)}</td>
                                    <td className="py-4 px-6"><span className={`text-lg font-bold ${getScoreColor(item.result.percentage)}`}>{Math.round(item.result.percentage)}%</span></td>
                                    <td className="py-4 px-6"><div className="flex items-center gap-1"><Award size={14} className="text-yellow-500" /><span className="text-foreground">{item.result.pointsEarned || 0} / {item.result.pointsTotal || 0}</span></div></td>
                                    <td className="py-4 px-6"><div className="flex items-center gap-1"><Clock size={14} className="text-muted-foreground" /><span className="text-foreground">{formatTime(item.result.timeSpent)}</span></div></td>
                                    <td className="py-4 px-6">{item.result.passed ? <span className="px-2 py-1 rounded text-xs bg-success/20 text-success flex items-center gap-1 w-fit"><CheckCircle size={12} /> Пройден</span> : <span className="px-2 py-1 rounded text-xs bg-danger/20 text-danger flex items-center gap-1 w-fit"><XCircle size={12} /> Не пройден</span>}</td>
                                    <td className="py-4 px-6"><button onClick={() => viewResultDetails(item.result)} className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors text-sm"><Eye size={14} /> Детали</button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showResultDetailsModal && selectedResultDetails && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-card border-b border-border p-5 flex justify-between items-center"><h3 className="text-foreground text-xl font-bold">Детали прохождения</h3><button onClick={() => setShowResultDetailsModal(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button></div>
                        <div className="p-6">
                            <div className="mb-6 grid grid-cols-2 gap-4">
                                <div className="bg-muted p-3 rounded-lg text-center"><p className="text-muted-foreground text-sm">Результат</p><p className={`text-2xl font-bold ${selectedResultDetails.result.percentage >= 70 ? 'text-success' : 'text-danger'}`}>{Math.round(selectedResultDetails.result.percentage)}%</p></div>
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