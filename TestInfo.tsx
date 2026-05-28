import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Clock, Award, Repeat, Calendar, Lock, MessageSquare, Send, Trash2, User, AlertCircle, ArrowRight } from "lucide-react";
import { testsAPI, getUser, Test, TestComment } from "../api/api";
import { renderSafeText, escapeHtml } from "../utils/escapeHtml";
import { formatDate } from "../utils/dateUtils";

export function TestInfo() {
    const { id } = useParams();
    const [test, setTest] = useState<Test | null>(null);
    const [comments, setComments] = useState<TestComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [commentsError, setCommentsError] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [canTake, setCanTake] = useState(true);
    const [commentsLoaded, setCommentsLoaded] = useState(false);

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            window.location.href = '/login';
            return;
        }
        setUser(currentUser);
    }, []);

    useEffect(() => {
        if (user && id) loadTestInfo();
    }, [user, id]);

    const loadTestInfo = async () => {
        try {
            setLoading(true);
            const testData = await testsAPI.getById(id!);
            setTest(testData);

            const isCreator = testData.createdBy === user?.id;
            const isAdmin = user?.role === 'ADMIN';

            if (isCreator || isAdmin) {
                setCanTake(true);
                setAttemptsLeft(null);
            } else {
                const attemptsResult = await testsAPI.checkAttempts(id!, user!.id);
                setCanTake(attemptsResult.canTake);
                setAttemptsLeft(attemptsResult.attemptsLeft);
            }

            if (testData.commentsEnabled) await loadComments();
        } catch (err) {
            console.error('Ошибка загрузки:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            setCommentsLoaded(false);
            const commentsData = await testsAPI.getComments(id!);
            setComments(commentsData);
        } catch (err) {
            console.error('Ошибка загрузки комментариев:', err);
        } finally {
            setCommentsLoaded(true);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            setCommentsError('Введите текст комментария');
            return;
        }

        const safeComment = escapeHtml(newComment.trim());
        setSendingComment(true);
        setCommentsError('');

        try {
            const comment = await testsAPI.addComment(id!, user.id, safeComment, null);
            setComments([comment, ...comments]);
            setNewComment('');
        } catch (err: any) {
            setCommentsError(err.message || 'Не удалось добавить комментарий');
        } finally {
            setSendingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Удалить комментарий?')) return;
        try {
            await testsAPI.deleteComment(commentId, user.id, user.role === 'ADMIN');
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err: any) {
            setCommentsError(err.message || 'Не удалось удалить комментарий');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-danger">Тест не найден</p>
                    <Link to="/" className="text-primary hover:underline mt-4 inline-block">Вернуться на главную</Link>
                </div>
            </div>
        );
    }

    const isCreator = test.createdBy === user?.id;
    const isAdmin = user?.role === 'ADMIN';
    const hasUnlimited = isCreator || isAdmin;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-card border border-border rounded-lg p-8 mb-8">
                    {test.imageUrl ? (
                        <img src={test.imageUrl} alt={renderSafeText(test.title)} className="w-full max-h-64 object-cover rounded-lg mb-6" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-6 flex items-center justify-center">
                            <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    )}
                    <h1 className="text-foreground text-3xl font-bold mb-4">{renderSafeText(test.title)}</h1>
                    <p className="text-muted-foreground text-lg mb-6">{renderSafeText(test.description) || 'Нет описания'}</p>

                    <div className="bg-muted rounded-lg p-6 mb-6">
                        <h2 className="text-foreground text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertCircle size={20} className="text-primary" /> Условия прохождения
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3"><Clock size={18} className="text-primary" /><div><p className="text-muted-foreground text-sm">Время на прохождение</p><p className="text-foreground font-medium">{test.duration} минут</p></div></div>
                            <div className="flex items-center gap-3"><Award size={18} className="text-primary" /><div><p className="text-muted-foreground text-sm">Количество вопросов</p><p className="text-foreground font-medium">{test.questionsCount || 0} вопросов</p></div></div>
                            <div className="flex items-center gap-3"><Repeat size={18} className="text-primary" /><div><p className="text-muted-foreground text-sm">Доступные попытки</p>{hasUnlimited ? <p className="text-foreground font-medium text-success">Безлимитно (администратор/создатель)</p> : test.maxAttempts && test.maxAttempts > 0 ? <p className="text-foreground font-medium">{attemptsLeft !== null ? `${attemptsLeft} из ${test.maxAttempts}` : `${test.maxAttempts} попыток`}</p> : <p className="text-foreground font-medium">Не ограничено</p>}</div></div>
                            <div className="flex items-center gap-3"><Calendar size={18} className="text-primary" /><div><p className="text-muted-foreground text-sm">Дедлайн</p><p className="text-foreground font-medium">{test.deadline ? new Date(test.deadline).toLocaleDateString('ru-RU') : 'Не установлен'}</p></div></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {test.randomizeQuestions && <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowRight size={16} className="text-success" /><span>Вопросы показываются в случайном порядке</span></div>}
                        {test.allowNavigationBack === false && <div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertCircle size={16} className="text-warning" /><span>Возврат к предыдущим вопросам запрещен</span></div>}
                        {test.allowSkipQuestions === false && <div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertCircle size={16} className="text-warning" /><span>Необходимо ответить на все вопросы</span></div>}
                        {test.isPrivate && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Lock size={16} className="text-primary" /><span>Приватный тест (только по приглашениям)</span></div>}
                    </div>

                    {(canTake || hasUnlimited) ? (
                        <Link to={`/test/${id}/take`} className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold">Начать тест <ArrowRight size={20} /></Link>
                    ) : (
                        <div className="text-center p-4 bg-danger/20 border border-danger/50 rounded-lg"><p className="text-danger font-medium">Вы исчерпали лимит попыток для этого теста</p></div>
                    )}
                </div>

                {test.commentsEnabled ? (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-6"><MessageSquare size={20} className="text-primary" /><h2 className="text-foreground text-xl font-bold">Отзывы и комментарии</h2><span className="text-muted-foreground text-sm">({comments.length})</span></div>
                        <div className="mb-6 p-4 bg-muted rounded-lg">
                            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Поделитесь своим мнением о тесте..." rows={3} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                            <div className="flex justify-end mt-3"><button onClick={handleAddComment} disabled={sendingComment || !newComment.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"><Send size={16} />{sendingComment ? 'Отправка...' : 'Оставить отзыв'}</button></div>
                        </div>
                        {commentsError && <div className="mb-4 p-3 bg-danger/20 border border-danger/50 rounded-lg text-danger text-sm">{commentsError}</div>}
                        {!commentsLoaded ? (
                            <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-8"><MessageSquare size={48} className="text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Пока нет отзывов. Будьте первым!</p></div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="p-4 bg-muted rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center"><User size={16} className="text-primary" /></div><div><p className="text-foreground font-medium">{renderSafeText(comment.userName)}</p><p className="text-muted-foreground text-xs">{formatDate(comment.createdAt)}</p></div></div>
                                            {(user?.id === comment.userId || user?.role === 'ADMIN') && <button onClick={() => handleDeleteComment(comment.id)} className="text-muted-foreground hover:text-danger transition-colors"><Trash2 size={16} /></button>}
                                        </div>
                                        <p className="text-foreground pl-11">{renderSafeText(comment.content)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-lg p-6 text-center"><MessageSquare size={48} className="text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Комментарии к этому тесту отключены</p></div>
                )}
            </div>
        </div>
    );
}