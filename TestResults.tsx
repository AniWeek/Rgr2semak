import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { CheckCircle, XCircle, Home, Clock, Target, Award, BarChart3, MessageSquare, Mail, UserIcon, Trash2 } from "lucide-react";
import { testsAPI, getUser, UserAnswerDetail, Question, TestComment, Result } from "../api/api";
import { renderSafeText, escapeHtml } from "../utils/escapeHtml";
import { formatDate, formatTime } from "../utils/dateUtils";

interface QuestionResult {
    questionId: string;
    questionText: string;
    questionType: string;
    userAnswerDisplay: string;
    correctAnswerDisplay: string;
    isCorrect: boolean;
    pointsEarned: number;
    pointsMax: number;
}

export function TestResults() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const resultIdFromQuery = searchParams.get('resultId');

    const [result, setResult] = useState<any>(null);
    const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [testTitle, setTestTitle] = useState('');
    const [error, setError] = useState('');
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailToSend, setEmailToSend] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [comments, setComments] = useState<TestComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [commentsError, setCommentsError] = useState('');
    const [testCommentsEnabled, setTestCommentsEnabled] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => { loadResults(); }, [id, resultIdFromQuery]);

    const loadResults = async () => {
        try {
            setLoading(true);
            const user = getUser();
            if (!user) { window.location.href = '/login'; return; }

            let testResult: Result | undefined;
            if (resultIdFromQuery) {
                const allResults = await testsAPI.getUserResults(user.id);
                testResult = allResults.find((r: Result) => r.id === resultIdFromQuery);
            } else {
                const userResults = await testsAPI.getUserResults(user.id);
                testResult = userResults.find((r: Result) => r.testId === id);
            }

            if (!testResult) { setError('Результаты не найдены'); return; }
            setResult(testResult);

            const questions = await testsAPI.getQuestions(id!);
            const test = await testsAPI.getById(id!);
            setTestTitle(renderSafeText(test.title));
            setTestCommentsEnabled(test.commentsEnabled || false);

            const userAnswersDetails = await testsAPI.getResultAnswers(testResult.id);

            const details: QuestionResult[] = questions.map((q: Question) => {
                const userAnswer = userAnswersDetails.find((ua: UserAnswerDetail) => ua.questionId === q.id);
                let userAnswerDisplay = 'Ответ не выбран';
                let correctAnswerDisplay = '';

                switch (q.questionType) {
                    case 'SINGLE_CHOICE':
                        const selectedAnswer = q.answers.find((a: any) => a.id === userAnswer?.answerId);
                        userAnswerDisplay = selectedAnswer?.text ? renderSafeText(selectedAnswer.text) : 'Ответ не выбран';
                        const correctAnswer = q.answers.find((a: any) => a.isCorrect);
                        correctAnswerDisplay = correctAnswer?.text ? renderSafeText(correctAnswer.text) : 'Не указан';
                        break;
                    case 'MULTIPLE_CHOICE':
                        const selectedIds = userAnswer?.selectedAnswerIds?.split(',') || [];
                        const selectedTexts = q.answers.filter((a: any) => selectedIds.includes(a.id)).map((a: any) => renderSafeText(a.text));
                        userAnswerDisplay = selectedTexts.length > 0 ? selectedTexts.join(', ') : 'Ответы не выбраны';
                        const correctTexts = q.answers.filter((a: any) => a.isCorrect).map((a: any) => renderSafeText(a.text));
                        correctAnswerDisplay = correctTexts.join(', ');
                        break;
                    case 'TEXT_INPUT':
                        userAnswerDisplay = userAnswer?.textAnswer ? renderSafeText(userAnswer.textAnswer) : 'Не введен';
                        correctAnswerDisplay = q.correctTextAnswer ? renderSafeText(q.correctTextAnswer) : 'Не указан';
                        break;
                    case 'NUMBER_INPUT':
                        userAnswerDisplay = userAnswer?.numberAnswer !== undefined ? String(userAnswer.numberAnswer) : 'Не введен';
                        correctAnswerDisplay = q.correctNumberAnswer !== undefined ? String(q.correctNumberAnswer) : 'Не указан';
                        break;
                }

                return {
                    questionId: q.id,
                    questionText: renderSafeText(q.text),
                    questionType: q.questionType,
                    userAnswerDisplay,
                    correctAnswerDisplay,
                    isCorrect: userAnswer?.isCorrect || false,
                    pointsEarned: userAnswer?.pointsEarned || 0,
                    pointsMax: userAnswer?.pointsMax || q.points || 1
                };
            });
            setQuestionResults(details);
        } catch (err) {
            setError('Не удалось загрузить результаты');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        if (!testCommentsEnabled) return;
        setLoadingComments(true);
        try {
            const commentsData = await testsAPI.getComments(id!);
            setComments(commentsData);
        } catch (err) {
            console.error('Ошибка загрузки комментариев:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleOpenCommentsModal = () => {
        setShowCommentsModal(true);
        loadComments();
        setNewComment('');
        setCommentsError('');
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) { setCommentsError('Введите текст комментария'); return; }
        const safeComment = escapeHtml(newComment.trim());
        const user = getUser();
        if (!user) return;
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
        const user = getUser();
        if (!user) return;
        if (!confirm('Удалить комментарий?')) return;
        try {
            await testsAPI.deleteComment(commentId, user.id, user.role === 'ADMIN');
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err: any) {
            setCommentsError(err.message || 'Не удалось удалить комментарий');
        }
    };

    const handleSendToEmail = async () => {
        if (!emailToSend || !emailToSend.includes('@')) { setError('Введите корректный email'); return; }
        setSendingEmail(true);
        setError('');
        try {
            await testsAPI.sendResultToEmail(result.id, emailToSend);
            setEmailSent(true);
            setTimeout(() => { setShowEmailModal(false); setEmailSent(false); setEmailToSend(''); }, 2000);
        } catch (err: any) {
            setError(err.message || 'Ошибка при отправке');
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (error || !result) return (
        <div className="min-h-screen bg-background p-8"><div className="max-w-4xl mx-auto text-center"><p className="text-danger mb-4">{error || 'Результаты не найдены'}</p><Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md"><Home size={20} /> На главную</Link></div></div>
    );

    const percentage = result.percentage || 0;
    const passed = percentage >= 70;
    const totalPointsEarned = result.pointsEarned || 0;
    const totalPointsMax = result.pointsTotal || 0;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-card border border-border rounded-lg p-8 mb-8 text-center">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {passed ? <CheckCircle className="text-green-500" size={40} /> : <XCircle className="text-red-500" size={40} />}
                    </div>
                    <h1 className="text-foreground text-2xl font-bold mb-2">{passed ? 'Поздравляем!' : 'Тест не пройден'}</h1>
                    <p className="text-muted-foreground mb-6">{passed ? `Вы успешно прошли тест "${testTitle}"` : 'Для прохождения необходимо набрать минимум 70%'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-muted rounded-lg p-4"><Target size={24} className="text-primary mx-auto mb-2" /><p className="text-muted-foreground text-sm">Результат</p><p className="text-foreground text-3xl font-bold">{Math.round(percentage)}%</p></div>
                        <div className="bg-muted rounded-lg p-4"><Award size={24} className="text-yellow-500 mx-auto mb-2" /><p className="text-muted-foreground text-sm">Набрано баллов</p><p className="text-foreground text-3xl font-bold">{totalPointsEarned} / {totalPointsMax}</p></div>
                        <div className="bg-muted rounded-lg p-4"><CheckCircle size={24} className="text-green-500 mx-auto mb-2" /><p className="text-muted-foreground text-sm">Правильных ответов</p><p className="text-foreground text-3xl font-bold">{result.score} из {questionResults.length}</p></div>
                        <div className="bg-muted rounded-lg p-4"><Clock size={24} className="text-yellow-500 mx-auto mb-2" /><p className="text-muted-foreground text-sm">Время</p><p className="text-foreground text-3xl font-bold">{formatTime(result.timeSpent || 0)}</p></div>
                    </div>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md"><Home size={20} /> На главную</Link>
                        <button onClick={() => setShowEmailModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-md hover:bg-secondary/90"><Mail size={20} /> Отправить результаты на email</button>
                        {testCommentsEnabled && <button onClick={handleOpenCommentsModal} className="inline-flex items-center gap-2 px-6 py-3 bg-primary/80 text-white rounded-md hover:bg-primary/70"><MessageSquare size={20} /> Оставить комментарий</button>}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                    <h2 className="text-foreground text-xl font-bold mb-6 flex items-center gap-2"><BarChart3 size={24} /> Детальные результаты</h2>
                    <div className="space-y-4">
                        {questionResults.map((qr, index) => (
                            <div key={qr.questionId} className={`p-4 rounded-lg border-2 ${qr.isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-start gap-3">{qr.isCorrect ? <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} /> : <XCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />}<p className="text-foreground font-medium">{index + 1}. {qr.questionText}</p></div>
                                    <div className="flex items-center gap-1 bg-primary/20 px-3 py-1 rounded-full"><Award size={14} className="text-yellow-500" /><span className="text-foreground text-sm font-medium">{qr.pointsEarned} / {qr.pointsMax} баллов</span></div>
                                </div>
                                <div className="ml-8 space-y-2">
                                    <div><p className="text-muted-foreground text-sm">Ваш ответ:</p><p className={qr.isCorrect ? 'text-green-500' : 'text-red-500'}>{qr.userAnswerDisplay}</p></div>
                                    {!qr.isCorrect && <div><p className="text-muted-foreground text-sm">Правильный ответ:</p><p className="text-green-500">{qr.correctAnswerDisplay}</p></div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showEmailModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-md w-full p-6">
                        <h3 className="text-foreground text-xl font-bold mb-4">Отправить результаты на email</h3>
                        {emailSent ? (<div className="text-center py-6"><CheckCircle size={48} className="text-success mx-auto mb-3" /><p className="text-success font-medium">Результаты отправлены!</p></div>) : (
                            <>
                                <p className="text-muted-foreground mb-4">Введите email, на который будут отправлены детальные результаты теста</p>
                                <input type="email" value={emailToSend} onChange={(e) => setEmailToSend(e.target.value)} placeholder="example@mail.com" className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4" />
                                {error && <p className="text-danger text-sm mb-4">{error}</p>}
                                <div className="flex gap-3"><button onClick={handleSendToEmail} disabled={sendingEmail} className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50">{sendingEmail ? 'Отправка...' : 'Отправить'}</button><button onClick={() => { setShowEmailModal(false); setError(''); setEmailToSend(''); }} className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80">Отмена</button></div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {showCommentsModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-border"><div className="flex items-center gap-2"><MessageSquare size={20} className="text-primary" /><h2 className="text-foreground text-xl font-bold">Комментарии</h2><span className="text-muted-foreground text-sm">({comments.length})</span></div><button onClick={() => setShowCommentsModal(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={24} /></button></div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {loadingComments ? (<div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>) : (
                                <>
                                    <div className="p-4 bg-muted rounded-lg"><textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Поделитесь своим мнением о тесте..." rows={3} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" /><div className="flex justify-end mt-3"><button onClick={handleAddComment} disabled={sendingComment || !newComment.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"><MessageSquare size={16} />{sendingComment ? 'Отправка...' : 'Отправить'}</button></div></div>
                                    {commentsError && <div className="p-3 bg-danger/20 border border-danger/50 rounded-lg text-danger text-sm">{commentsError}</div>}
                                    {comments.length === 0 ? (<div className="text-center py-8"><MessageSquare size={48} className="text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Пока нет комментариев. Будьте первым!</p></div>) : (comments.map((comment) => { const user = getUser(); return (<div key={comment.id} className="p-4 bg-muted rounded-lg"><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center"><UserIcon size={16} className="text-primary" /></div><div><p className="text-foreground font-medium">{renderSafeText(comment.userName)}</p><p className="text-muted-foreground text-xs">{formatDate(comment.createdAt)}</p></div></div>{(user?.id === comment.userId || user?.role === 'ADMIN') && <button onClick={() => handleDeleteComment(comment.id)} className="text-muted-foreground hover:text-danger transition-colors"><Trash2 size={16} /></button>}</div><p className="text-foreground pl-11">{renderSafeText(comment.content)}</p></div>); }))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}