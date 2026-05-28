import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Award, Clock, Target, Mail, CheckCircle, XCircle, BarChart3, TrendingUp, Calendar } from "lucide-react";
import { testsAPI, getUser, Result } from "../api/api";
import { renderSafeText } from "../utils/escapeHtml";
import { formatDate, formatTime } from "../utils/dateUtils";

interface TestResultWithDetails extends Result {
    testTitle: string;
}

export function UserStatistics() {
    const [results, setResults] = useState<TestResultWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
    const [emailToSend, setEmailToSend] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => { loadUserStatistics(); }, []);

    const loadUserStatistics = async () => {
        try {
            setLoading(true);
            const user = getUser();
            if (!user) { window.location.href = '/login'; return; }
            setCurrentUser(user);

            const userResults = await testsAPI.getUserResults(user.id);
            const resultsArray = Array.isArray(userResults) ? userResults : [];

            const resultsWithTitles: TestResultWithDetails[] = [];
            for (const result of resultsArray) {
                try {
                    const test = await testsAPI.getById(result.testId);
                    resultsWithTitles.push({ ...result, testTitle: renderSafeText(test.title) });
                } catch (err) {
                    resultsWithTitles.push({ ...result, testTitle: 'Тест удален' });
                }
            }
            resultsWithTitles.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
            setResults(resultsWithTitles);
        } catch (err) {
            setError('Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };

    const handleSendToEmail = async (resultId: string) => {
        setSelectedResultId(resultId);
        setShowEmailModal(true);
        setEmailSent(false);
        setEmailToSend('');
    };

    const sendResultEmail = async () => {
        if (!emailToSend || !emailToSend.includes('@')) { setError('Введите корректный email'); return; }
        setSendingEmail(true);
        setError('');
        try {
            await testsAPI.sendResultToEmail(selectedResultId!, emailToSend);
            setEmailSent(true);
            setTimeout(() => { setShowEmailModal(false); setEmailSent(false); setEmailToSend(''); setSelectedResultId(null); }, 2000);
        } catch (err: any) {
            setError(err.message || 'Ошибка при отправке');
        } finally {
            setSendingEmail(false);
        }
    };

    const getStatusBadge = (passed: boolean) => passed ? <span className="px-2 py-1 rounded text-xs bg-success/20 text-success flex items-center gap-1"><CheckCircle size={12} /> Пройден</span> : <span className="px-2 py-1 rounded text-xs bg-danger/20 text-danger flex items-center gap-1"><XCircle size={12} /> Не пройден</span>;
    const getScoreColor = (percentage: number) => { if (percentage >= 70) return 'text-success'; if (percentage >= 50) return 'text-warning'; return 'text-danger'; };

    const totalPoints = results.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
    const totalMaxPoints = results.reduce((sum, r) => sum + (r.pointsTotal || 0), 0);
    const averagePercentage = results.length > 0 ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length : 0;
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;

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

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8"><h1 className="text-foreground text-3xl font-bold mb-2">Моя статистика</h1><p className="text-muted-foreground">Ваши результаты прохождения тестов</p></div>
            {error && <div className="mb-4 p-3 bg-danger/20 border border-danger/50 rounded-lg text-danger text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-primary/20 p-2 rounded-lg"><BarChart3 className="text-primary" size={24} /></div><p className="text-muted-foreground">Пройдено тестов</p></div><p className="text-foreground text-3xl font-bold">{results.length}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-success/20 p-2 rounded-lg"><CheckCircle className="text-success" size={24} /></div><p className="text-muted-foreground">Успешно</p></div><p className="text-foreground text-3xl font-bold">{passedCount}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-danger/20 p-2 rounded-lg"><XCircle className="text-danger" size={24} /></div><p className="text-muted-foreground">Не пройдено</p></div><p className="text-foreground text-3xl font-bold">{failedCount}</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-yellow-500/20 p-2 rounded-lg"><Award className="text-yellow-500" size={24} /></div><p className="text-muted-foreground">Средний балл</p></div><p className={`text-foreground text-3xl font-bold ${getScoreColor(averagePercentage)}`}>{Math.round(averagePercentage)}%</p></div>
                <div className="bg-card border border-border rounded-lg p-6"><div className="flex items-center gap-3 mb-2"><div className="bg-secondary/20 p-2 rounded-lg"><TrendingUp className="text-secondary" size={24} /></div><p className="text-muted-foreground">Всего баллов</p></div><p className="text-foreground text-3xl font-bold">{totalPoints} / {totalMaxPoints}</p></div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted"><tr><th className="text-left py-4 px-6 text-muted-foreground font-medium">Тест</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Дата</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Результат</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Баллы</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Время</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Статус</th><th className="text-left py-4 px-6 text-muted-foreground font-medium">Действия</th></tr></thead>
                        <tbody>
                        {results.map((result) => (
                            <tr key={result.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                                <td className="py-4 px-6"><p className="text-foreground font-medium">{renderSafeText(result.testTitle)}</p></td>
                                <td className="py-4 px-6 text-foreground text-sm"><div className="flex items-center gap-2"><Calendar size={14} className="text-muted-foreground" />{formatDate(result.completedAt)}</div></td>
                                <td className="py-4 px-6"><span className={`text-lg font-bold ${getScoreColor(result.percentage)}`}>{Math.round(result.percentage)}%</span></td>
                                <td className="py-4 px-6"><div className="flex items-center gap-1"><Award size={14} className="text-yellow-500" /><span className="text-foreground">{result.pointsEarned || 0} / {result.pointsTotal || 0}</span></div></td>
                                <td className="py-4 px-6"><div className="flex items-center gap-1"><Clock size={14} className="text-muted-foreground" /><span className="text-foreground">{formatTime(result.timeSpent)}</span></div></td>
                                <td className="py-4 px-6">{getStatusBadge(result.passed)}</td>
                                <td className="py-4 px-6"><div className="flex items-center gap-2"><Link to={`/results/${result.testId}?resultId=${result.id}`} className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors text-sm"><Target size={14} /> Результаты</Link><button onClick={() => handleSendToEmail(result.id)} className="flex items-center gap-1 px-3 py-1.5 bg-secondary/20 text-secondary rounded-md hover:bg-secondary/30 transition-colors text-sm"><Mail size={14} /> На email</button></div></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {results.length === 0 && (<div className="text-center py-12"><p className="text-muted-foreground">Вы еще не прошли ни одного теста</p><Link to="/" className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-md">Перейти к тестам</Link></div>)}

            {showEmailModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-md w-full p-6">
                        <h3 className="text-foreground text-xl font-bold mb-4">Отправить результаты на email</h3>
                        {emailSent ? (<div className="text-center py-6"><CheckCircle size={48} className="text-success mx-auto mb-3" /><p className="text-success font-medium">Результаты отправлены!</p><p className="text-muted-foreground text-sm mt-2">Проверьте указанную почту</p></div>) : (
                            <>
                                <p className="text-muted-foreground mb-4">Введите email, на который будут отправлены детальные результаты теста</p>
                                <input type="email" value={emailToSend} onChange={(e) => setEmailToSend(e.target.value)} placeholder="example@mail.com" className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4" />
                                {error && <p className="text-danger text-sm mb-4">{error}</p>}
                                <div className="flex gap-3"><button onClick={sendResultEmail} disabled={sendingEmail} className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50">{sendingEmail ? 'Отправка...' : 'Отправить'}</button><button onClick={() => { setShowEmailModal(false); setError(''); setEmailToSend(''); }} className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80">Отмена</button></div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}