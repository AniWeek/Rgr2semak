import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Clock, ChevronLeft, ChevronRight, CheckSquare, Square } from "lucide-react";
import { testsAPI, getUser, Question } from "../api/api";
import { renderSafeText } from "../utils/escapeHtml";

export function TestTaking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [testTitle, setTestTitle] = useState('');
    const [testDuration, setTestDuration] = useState(0);
    const [error, setError] = useState('');
    const [canTake, setCanTake] = useState(true);
    const [checkingAttempts, setCheckingAttempts] = useState(true);
    const [isCreatorOrAdmin, setIsCreatorOrAdmin] = useState(false);
    const [allowNavigationBack, setAllowNavigationBack] = useState(true);
    const [allowSkipQuestions, setAllowSkipQuestions] = useState(true);

    useEffect(() => { checkAttemptsAndLoad(); }, [id]);

    const checkAttemptsAndLoad = async () => {
        const user = getUser();
        if (!user) { navigate('/login'); return; }
        setCheckingAttempts(true);

        try {
            const test = await testsAPI.getById(id!);
            const isCreator = test.createdBy === user.id;
            const isAdmin = user.role === 'ADMIN';
            const hasUnlimited = isCreator || isAdmin;

            setIsCreatorOrAdmin(hasUnlimited);
            setAllowNavigationBack(test.allowNavigationBack !== false);
            setAllowSkipQuestions(test.allowSkipQuestions !== false);
            setTestTitle(test.title);
            setTestDuration(test.duration);
            setTimeLeft(test.duration * 60);

            if (hasUnlimited) {
                setCanTake(true);
                await loadQuestions();
                setCheckingAttempts(false);
                return;
            }

            const result = await testsAPI.checkAttempts(id!, user.id);
            setCanTake(result.canTake);
            if (!result.canTake) {
                setError(result.message || 'Вы не можете пройти этот тест');
                setCheckingAttempts(false);
                return;
            }
            await loadQuestions();
        } catch (err) {
            setError('Не удалось проверить доступность теста');
            setCheckingAttempts(false);
        }
    };

    const loadQuestions = async () => {
        try {
            const loadedQuestions = await testsAPI.getQuestionsForTaking(id!);
            setQuestions(loadedQuestions);
        } catch (err) {
            setError('Не удалось загрузить тест');
        } finally {
            setLoading(false);
            setCheckingAttempts(false);
        }
    };

    useEffect(() => {
        if (timeLeft <= 0 || loading || !canTake || checkingAttempts) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(timer); handleFinish(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, loading, canTake, checkingAttempts]);

    const handleFinish = async () => {
        const user = getUser();
        if (!user) { navigate('/login'); return; }

        if (!allowSkipQuestions) {
            const unansweredQuestions = questions.filter(q => !answers[q.id]);
            if (unansweredQuestions.length > 0) {
                setError(`Вы не ответили на ${unansweredQuestions.length} вопрос(ов). Пожалуйста, ответьте на все вопросы.`);
                const firstUnansweredIndex = questions.findIndex(q => !answers[q.id]);
                if (firstUnansweredIndex !== -1) setCurrentQuestion(firstUnansweredIndex);
                return;
            }
        }

        const totalTime = (testDuration * 60) - timeLeft;
        try {
            await testsAPI.submit(id!, user.id, answers, totalTime);
            navigate(`/results/${id}`);
        } catch (err: any) {
            setError(err.message || 'Ошибка при сохранении результатов');
        }
    };

    const handleAnswerChange = (questionId: string, value: any) => setAnswers({ ...answers, [questionId]: value });
    const handleMultipleChoiceChange = (questionId: string, answerId: string, checked: boolean) => {
        const current = answers[questionId] || [];
        const newAnswers = checked ? [...current, answerId] : current.filter((id: string) => id !== answerId);
        setAnswers({ ...answers, [questionId]: newAnswers });
    };
    const goToQuestion = (index: number) => {
        if (index < currentQuestion && !allowNavigationBack) {
            setError('Возврат к предыдущим вопросам отключен для этого теста');
            return;
        }
        setCurrentQuestion(index);
        setError('');
    };
    const goToNextQuestion = () => {
        if (allowSkipQuestions) {
            if (currentQuestion < questions.length - 1) goToQuestion(currentQuestion + 1);
            else handleFinish();
        } else {
            const currentQuestionId = questions[currentQuestion]?.id;
            const hasAnswer = answers[currentQuestionId] !== undefined;
            if (!hasAnswer) { setError('Пожалуйста, выберите ответ перед переходом к следующему вопросу'); return; }
            if (currentQuestion < questions.length - 1) goToQuestion(currentQuestion + 1);
            else handleFinish();
        }
    };

    if (checkingAttempts || loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    if (error && !canTake) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-lg p-8 max-w-md text-center">
                    <p className="text-danger mb-4 text-lg">{error}</p>
                    {isCreatorOrAdmin && <p className="text-muted-foreground mb-4">Как администратор/создатель, вы можете проходить тест без ограничений</p>}
                    <button onClick={() => navigate(`/test/${id}/info`)} className="px-6 py-3 bg-primary text-white rounded-md">Вернуться к информации о тесте</button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">В тесте нет вопросов</p></div>;

    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const question = questions[currentQuestion];
    const currentAnswer = answers[question.id];
    const answeredCount = Object.keys(answers).length;

    const renderQuestionInput = () => {
        switch (question.questionType) {
            case 'SINGLE_CHOICE':
                return <div className="space-y-3">{question.answers.map((answer) => (<button key={answer.id} onClick={() => handleAnswerChange(question.id, answer.id)} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${currentAnswer === answer.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-input text-foreground hover:border-primary/50'}`}>{renderSafeText(answer.text)}</button>))}</div>;
            case 'MULTIPLE_CHOICE':
                return <div className="space-y-3">{question.answers.map((answer) => { const isChecked = (currentAnswer || []).includes(answer.id); return (<label key={answer.id} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isChecked ? 'border-primary bg-primary/10' : 'border-border bg-input hover:border-primary/50'}`}><button type="button" onClick={() => handleMultipleChoiceChange(question.id, answer.id, !isChecked)} className="flex-shrink-0">{isChecked ? <CheckSquare size={24} className="text-primary" /> : <Square size={24} className="text-muted-foreground" />}</button><span className="flex-1 text-foreground">{renderSafeText(answer.text)}</span></label>); })}</div>;
            case 'TEXT_INPUT':
                return <input type="text" value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Введите ваш ответ..." />;
            case 'NUMBER_INPUT':
                return <input type="number" value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value))} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Введите число..." />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-foreground font-semibold">{testTitle}</h2>
                            {isCreatorOrAdmin && <span className="text-xs text-success mt-1 inline-block">✓ Неограниченный доступ (администратор/создатель)</span>}
                            {!allowNavigationBack && <span className="text-xs text-warning mt-1 inline-block ml-2">⚠ Возврат к предыдущим вопросам запрещен</span>}
                            {allowSkipQuestions && <span className="text-xs text-info mt-1 inline-block ml-2">ℹ Можно пропускать вопросы</span>}
                            {!allowSkipQuestions && <span className="text-xs text-warning mt-1 inline-block ml-2">⚠ На все вопросы нужно ответить</span>}
                        </div>
                        <div className="flex items-center gap-4"><div className="text-muted-foreground text-sm">Отвечено: {answeredCount}/{questions.length}</div><div className="flex items-center gap-2 text-warning"><Clock size={20} /><span className="font-mono text-lg">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span></div></div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                    <p className="text-muted-foreground mt-2 text-sm">Вопрос {currentQuestion + 1} из {questions.length}</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {error && <div className="bg-danger/20 border border-danger/50 rounded-lg p-3 mb-4 text-danger text-sm">{error}</div>}
                <div className="bg-card border border-border rounded-lg p-8">
                    {question.imageUrl && <img src={question.imageUrl} alt="Изображение к вопросу" className="max-w-full max-h-64 object-contain rounded-lg mb-4 mx-auto" />}
                    <h3 className="text-foreground text-xl mb-6">{renderSafeText(question.text)}</h3>
                    {renderQuestionInput()}
                </div>
                <div className="flex items-center justify-between mt-6">
                    <button onClick={() => goToQuestion(currentQuestion - 1)} disabled={currentQuestion === 0 || !allowNavigationBack} className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${currentQuestion === 0 || !allowNavigationBack ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' : 'bg-muted text-foreground hover:bg-muted/80'}`}><ChevronLeft size={20} /> Назад</button>
                    <button onClick={goToNextQuestion} disabled={!allowSkipQuestions && answers[questions[currentQuestion]?.id] === undefined} className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${(!allowSkipQuestions && answers[questions[currentQuestion]?.id] === undefined) ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' : currentQuestion < questions.length - 1 ? 'bg-primary text-white hover:bg-primary/90' : 'bg-success text-white hover:bg-success/90'}`}>{currentQuestion < questions.length - 1 ? <>Далее <ChevronRight size={20} /></> : 'Завершить тест'}</button>
                </div>
                <div className="flex gap-2 overflow-x-auto mt-6 justify-center">
                    {questions.map((_, index) => {
                        const isAnswered = answers[questions[index].id] !== undefined;
                        const isCurrent = index === currentQuestion;
                        let bgColor = 'bg-muted text-muted-foreground';
                        if (isCurrent) bgColor = 'bg-primary text-white';
                        else if (isAnswered) bgColor = 'bg-success/50 text-white';
                        return <button key={index} onClick={() => goToQuestion(index)} className={`w-10 h-10 rounded-md transition-colors flex-shrink-0 ${bgColor}`}>{index + 1}</button>;
                    })}
                </div>
            </div>
        </div>
    );
}