import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Plus, Trash2, Save, X, Check, Mail, Lock, MessageSquare, Shuffle, ArrowLeftRight, SkipForward, ImagePlus } from "lucide-react";
import { getUser, testsAPI, Question } from "../api/api";
import { escapeHtml } from "../utils/escapeHtml";
import { getCategoryOptions } from "../utils/categoryUtils";

interface Answer {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface QuestionForm {
    id: string;
    text: string;
    imageUrl?: string;
    imageFile?: File;
    questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT_INPUT' | 'NUMBER_INPUT';
    answers: Answer[];
    correctTextAnswer?: string;
    correctNumberAnswer?: number;
    points: number;
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export function CreateTest() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [duration, setDuration] = useState(30);
    const [deadline, setDeadline] = useState('');
    const [maxAttempts, setMaxAttempts] = useState<number | null>(null);
    const [hasAttemptsLimit, setHasAttemptsLimit] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [commentsEnabled, setCommentsEnabled] = useState(false);
    const [randomizeQuestions, setRandomizeQuestions] = useState(false);
    const [allowNavigationBack, setAllowNavigationBack] = useState(true);
    const [allowSkipQuestions, setAllowSkipQuestions] = useState(true);
    const [category, setCategory] = useState('GENERAL');
    const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
    const [newInviteEmail, setNewInviteEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingQuestionImage, setUploadingQuestionImage] = useState<number | null>(null);
    const [questions, setQuestions] = useState<QuestionForm[]>([
        { id: '1', text: '', questionType: 'SINGLE_CHOICE', answers: [{ id: 'a1', text: '', isCorrect: false }, { id: 'a2', text: '', isCorrect: false }], points: 1 }
    ]);

    const currentUser = getUser();

    useEffect(() => { if (isEditMode) loadTestForEdit(); }, [id]);

    const loadTestForEdit = async () => {
        try {
            setLoading(true);
            const test = await testsAPI.getById(id!);
            if (test.createdBy !== currentUser?.id && currentUser?.role !== 'ADMIN') {
                setError('У вас нет прав для редактирования этого теста');
                setTimeout(() => navigate('/'), 2000);
                return;
            }
            setTitle(escapeHtml(test.title));
            setDescription(test.description ? escapeHtml(test.description) : '');
            setImageUrl(test.imageUrl || '');
            setDuration(test.duration);
            setDeadline(test.deadline ? test.deadline.split('T')[0] : '');
            const hasLimit = test.maxAttempts !== null && test.maxAttempts !== undefined && test.maxAttempts > 0;
            setHasAttemptsLimit(hasLimit);
            setMaxAttempts(hasLimit ? test.maxAttempts : null);
            setIsPrivate(test.isPrivate || false);
            setCommentsEnabled(test.commentsEnabled || false);
            setRandomizeQuestions(test.randomizeQuestions || false);
            setAllowNavigationBack(test.allowNavigationBack !== undefined ? test.allowNavigationBack : true);
            setAllowSkipQuestions(test.allowSkipQuestions !== undefined ? test.allowSkipQuestions : true);
            setCategory(test.category || 'GENERAL');

            const loadedQuestions = await testsAPI.getQuestions(id!);
            const formattedQuestions: QuestionForm[] = loadedQuestions.map((q: Question) => ({
                id: q.id,
                text: escapeHtml(q.text),
                imageUrl: q.imageUrl,
                questionType: q.questionType,
                answers: q.answers?.map(a => ({ id: a.id, text: escapeHtml(a.text), isCorrect: a.isCorrect })) || [],
                correctTextAnswer: q.correctTextAnswer ? escapeHtml(q.correctTextAnswer) : undefined,
                correctNumberAnswer: q.correctNumberAnswer,
                points: q.points || 1
            }));
            if (formattedQuestions.length > 0) setQuestions(formattedQuestions);
            if (test.isPrivate) {
                const invited = await testsAPI.getInvitedUsers(id!);
                setInvitedEmails(invited.map((email: string) => email.toLowerCase()));
            }
        } catch (err) {
            setError('Не удалось загрузить тест для редактирования');
        } finally {
            setLoading(false);
        }
    };

    const handleTestImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        setError('');
        try {
            if (isEditMode && id) {
                const updatedTest = await testsAPI.uploadTestImage(id, file);
                setImageUrl(updatedTest.imageUrl || '');
            } else {
                setImageUrl(URL.createObjectURL(file));
                setImageFile(file);
            }
        } catch (err: any) {
            setError(err.message || 'Не удалось загрузить изображение');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleQuestionImageSelect = (qIndex: number, file: File) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].imageUrl = URL.createObjectURL(file);
        newQuestions[qIndex].imageFile = file;
        setQuestions(newQuestions);
    };

    const removeQuestionImage = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].imageUrl = undefined;
        delete newQuestions[qIndex].imageFile;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { id: Date.now().toString(), text: '', questionType: 'SINGLE_CHOICE', answers: [{ id: Date.now() + '-a1', text: '', isCorrect: false }, { id: Date.now() + '-a2', text: '', isCorrect: false }], points: 1 }]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length === 1) { setError('Должен быть хотя бы один вопрос'); return; }
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, text: string) => {
        const newQuestions = [...questions];
        newQuestions[index].text = escapeHtml(text);
        setQuestions(newQuestions);
    };

    const updateQuestionPoints = (index: number, points: number) => {
        const newQuestions = [...questions];
        newQuestions[index].points = Math.max(1, points);
        setQuestions(newQuestions);
    };

    const updateQuestionType = (index: number, type: QuestionForm['questionType']) => {
        const newQuestions = [...questions];
        newQuestions[index].questionType = type;
        if (type === 'TEXT_INPUT' || type === 'NUMBER_INPUT') {
            newQuestions[index].answers = [];
        } else if (newQuestions[index].answers.length === 0) {
            newQuestions[index].answers = [{ id: Date.now() + '-a1', text: '', isCorrect: false }, { id: Date.now() + '-a2', text: '', isCorrect: false }];
        }
        setQuestions(newQuestions);
    };

    const addAnswer = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers.push({ id: Date.now().toString(), text: '', isCorrect: false });
        setQuestions(newQuestions);
    };

    const removeAnswer = (qIndex: number, aIndex: number) => {
        if (questions[qIndex].answers.length <= 2) { setError('У вопроса должно быть минимум 2 варианта ответа'); return; }
        const newQuestions = [...questions];
        newQuestions[qIndex].answers = newQuestions[qIndex].answers.filter((_, i) => i !== aIndex);
        setQuestions(newQuestions);
    };

    const updateAnswer = (qIndex: number, aIndex: number, text: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers[aIndex].text = escapeHtml(text);
        setQuestions(newQuestions);
    };

    const toggleCorrect = (qIndex: number, aIndex: number) => {
        const newQuestions = [...questions];
        const question = newQuestions[qIndex];
        if (question.questionType === 'SINGLE_CHOICE') {
            question.answers.forEach((_, i) => { question.answers[i].isCorrect = false; });
        }
        question.answers[aIndex].isCorrect = !question.answers[aIndex].isCorrect;
        setQuestions(newQuestions);
    };

    const updateCorrectTextAnswer = (qIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correctTextAnswer = escapeHtml(value);
        setQuestions(newQuestions);
    };

    const updateCorrectNumberAnswer = (qIndex: number, value: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correctNumberAnswer = value;
        setQuestions(newQuestions);
    };

    const addInvitedEmail = () => {
        if (!newInviteEmail.trim()) return;
        const normalizedEmail = normalizeEmail(newInviteEmail);
        if (!normalizedEmail.includes('@')) { setError('Введите корректный email'); return; }
        if (invitedEmails.includes(normalizedEmail)) { setError('Этот email уже добавлен'); return; }
        setInvitedEmails([...invitedEmails, normalizedEmail]);
        setNewInviteEmail('');
    };

    const removeInvitedEmail = (email: string) => setInvitedEmails(invitedEmails.filter(e => e !== email));

    const validate = () => {
        if (!title.trim()) { setError('Введите название теста'); return false; }
        if (duration < 1) { setError('Длительность должна быть больше 0'); return false; }
        if (deadline && new Date(deadline) < new Date()) { setError('Дедлайн не может быть в прошлом'); return false; }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) { setError(`Заполните текст вопроса ${i + 1}`); return false; }
            if (q.points < 1) { setError(`Баллы за вопрос ${i + 1} должны быть не менее 1`); return false; }
            if (q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') {
                if (!q.answers.some(a => a.isCorrect)) { setError(`Отметьте правильный ответ для вопроса ${i + 1}`); return false; }
                for (let j = 0; j < q.answers.length; j++) {
                    if (!q.answers[j].text.trim()) { setError(`Заполните ответ ${j + 1} для вопроса ${i + 1}`); return false; }
                }
            } else if (q.questionType === 'TEXT_INPUT') {
                if (!q.correctTextAnswer?.trim()) { setError(`Укажите правильный текстовый ответ для вопроса ${i + 1}`); return false; }
            } else if (q.questionType === 'NUMBER_INPUT') {
                if (q.correctNumberAnswer === undefined || q.correctNumberAnswer === null) { setError(`Укажите правильный числовой ответ для вопроса ${i + 1}`); return false; }
            }
        }
        return true;
    };

    const postJson = async (url: string, data: any) => {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    };

    const saveTest = async () => {
        if (!validate()) return;
        setLoading(true);
        setError('');
        try {
            const user = getUser();
            if (!user) { navigate('/login'); return; }

            if (isEditMode) {
                await testsAPI.update(id!, { title: title.trim(), description: description.trim() || '', duration, deadline: deadline || null, maxAttempts: hasAttemptsLimit ? (maxAttempts || 1) : null, commentsEnabled, randomizeQuestions, allowNavigationBack, allowSkipQuestions, category });
                if (imageFile) { await testsAPI.uploadTestImage(id!, imageFile); setImageFile(null); }
                const existingQuestions = await testsAPI.getQuestions(id!);
                for (const q of existingQuestions) {
                    for (const answer of q.answers) await testsAPI.deleteAnswer(answer.id);
                    await testsAPI.deleteQuestion(q.id);
                }
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    const newQuestion = await postJson(`/api/tests/${id!}/questions`, { text: q.text.trim(), sortOrder: i, questionType: q.questionType, correctTextAnswer: q.correctTextAnswer, correctNumberAnswer: q.correctNumberAnswer, points: q.points });
                    if (q.imageFile) await testsAPI.uploadQuestionImage(newQuestion.id, q.imageFile);
                    if (q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') {
                        for (let j = 0; j < q.answers.length; j++) {
                            await postJson(`/api/tests/questions/${newQuestion.id}/answers`, { text: q.answers[j].text.trim(), isCorrect: q.answers[j].isCorrect, sortOrder: j });
                        }
                    }
                }
                if (isPrivate) await testsAPI.inviteUsers(id!, invitedEmails, user.id);
                alert('Тест успешно обновлен!');
            } else {
                const test = await testsAPI.create({ title: title.trim(), description: description.trim() || '', duration, deadline: deadline || null, createdBy: user.id, maxAttempts: hasAttemptsLimit ? (maxAttempts || 1) : null, isPrivate, commentsEnabled, randomizeQuestions, allowNavigationBack, allowSkipQuestions, category });
                if (imageFile) await testsAPI.uploadTestImage(test.id, imageFile);
                if (isPrivate && invitedEmails.length > 0) await testsAPI.inviteUsers(test.id, invitedEmails, user.id);
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    const newQuestion = await postJson(`/api/tests/${test.id}/questions`, { text: q.text.trim(), sortOrder: i, questionType: q.questionType, correctTextAnswer: q.correctTextAnswer, correctNumberAnswer: q.correctNumberAnswer, points: q.points });
                    if (q.imageFile) await testsAPI.uploadQuestionImage(newQuestion.id, q.imageFile);
                    if (q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') {
                        for (let j = 0; j < q.answers.length; j++) {
                            await postJson(`/api/tests/questions/${newQuestion.id}/answers`, { text: q.answers[j].text.trim(), isCorrect: q.answers[j].isCorrect, sortOrder: j });
                        }
                    }
                }
                alert('Тест успешно создан!');
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Ошибка при сохранении теста');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-foreground text-3xl font-bold mb-6">{isEditMode ? 'Редактировать тест' : 'Создать новый тест'}</h1>
                {error && <div className="bg-danger/20 border border-danger/50 rounded-lg p-4 mb-6 text-danger"><strong>Ошибка:</strong> {error}</div>}

                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h2 className="text-foreground text-xl mb-4">Основная информация</h2>
                    <div className="mb-4">
                        <label className="block text-foreground mb-2">Обложка теста</label>
                        <div className="flex items-center gap-4">
                            {imageUrl ? (
                                <div className="relative">
                                    <img src={imageUrl} alt="Обложка" className="w-32 h-32 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    <button type="button" onClick={() => { setImageUrl(''); setImageFile(null); }} className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 hover:bg-danger/80"><X size={14} /></button>
                                </div>
                            ) : (
                                <label className="cursor-pointer">
                                    <input type="file" accept="image/*" onChange={handleTestImageUpload} className="hidden" disabled={uploadingImage} />
                                    <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary transition-colors cursor-pointer">
                                        {uploadingImage ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div> : <><ImagePlus size={24} className="text-muted-foreground" /><span className="text-xs text-muted-foreground mt-1">Загрузить</span></>}
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="mb-4"><label className="block text-foreground mb-2">Название теста *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Введите название теста" /></div>
                    <div className="mb-4"><label className="block text-foreground mb-2">Описание</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Опишите содержание теста" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-foreground mb-2">Длительность (минуты) *</label><input type="number" min="1" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                        <div><label className="block text-foreground mb-2">Дедлайн (необязательно)</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                    </div>
                    <div className="mb-4"><label className="block text-foreground mb-2">Категория теста *</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">{getCategoryOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                    <div className="mb-4"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={hasAttemptsLimit} onChange={(e) => { setHasAttemptsLimit(e.target.checked); if (!e.target.checked) setMaxAttempts(null); else setMaxAttempts(1); }} className="w-5 h-5 rounded border-border bg-input text-primary focus:ring-primary" /><span className="text-foreground">Ограничить количество попыток</span></label>{hasAttemptsLimit && <input type="number" min="1" value={maxAttempts || 1} onChange={(e) => setMaxAttempts(Number(e.target.value))} className="mt-2 w-full md:w-1/3 bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Количество попыток" />}</div>
                    <div className="mb-4"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="w-5 h-5 rounded border-border bg-input text-primary focus:ring-primary" /><Lock size={18} className="text-muted-foreground" /><span className="text-foreground">Приватный тест (только по приглашениям)</span></label></div>
                    <div className="mb-4"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={commentsEnabled} onChange={(e) => setCommentsEnabled(e.target.checked)} className="w-5 h-5 rounded border-border bg-input text-primary focus:ring-primary" /><MessageSquare size={18} className="text-muted-foreground" /><span className="text-foreground">Включить комментарии к тесту</span></label></div>

                    <div className="border-t border-border pt-4 mt-4">
                        <h3 className="text-foreground text-lg mb-3">Настройки прохождения</h3>
                        <div className="mb-3"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} className="w-5 h-5 rounded border-border bg-input text-primary focus:ring-primary" /><Shuffle size={18} className="text-muted-foreground" /><span className="text-foreground">Случайный порядок вопросов</span></label></div>
                        <div className="mb-3"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={allowNavigationBack} onChange={(e) => setAllowNavigationBack(e.target.checked)} className="w-5 h-5 rounded border-border bg-input text-primary focus:ring-primary" /><ArrowLeftRight size={18} className="text-muted-foreground" /><span className="text-foreground">Разрешить возврат к предыдущим вопросам</span></label></div>
                        <div className="mb-3"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={allowSkipQuestions} onChange={(e) => setAllowSkipQuestions(e.target.checked)} className="w-5 h-5 rounded border-border bg-input text-primary focus:ring-primary" /><SkipForward size={18} className="text-muted-foreground" /><span className="text-foreground">Разрешить пропуск вопросов</span></label></div>
                    </div>

                    {isPrivate && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <label className="block text-foreground mb-2 flex items-center gap-2"><Mail size={18} />Пригласить пользователей по email</label>
                            <div className="flex gap-2 mb-3"><input type="email" value={newInviteEmail} onChange={(e) => setNewInviteEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addInvitedEmail()} placeholder="user@example.com" className="flex-1 bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" /><button type="button" onClick={addInvitedEmail} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Добавить</button></div>
                            {invitedEmails.length > 0 && <div className="flex flex-wrap gap-2">{invitedEmails.map(email => (<span key={email} className="flex items-center gap-2 bg-input px-3 py-1 rounded-full text-sm">{email}<button onClick={() => removeInvitedEmail(email)} className="text-muted-foreground hover:text-danger"><X size={14} /></button></span>))}</div>}
                        </div>
                    )}
                </div>

                <h2 className="text-foreground text-xl mb-4">Вопросы</h2>
                {questions.map((question, qIndex) => (
                    <div key={question.id} className="bg-card border border-border rounded-lg p-6 mb-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-foreground text-lg">Вопрос {qIndex + 1}</h3><button onClick={() => removeQuestion(qIndex)} className="text-danger hover:text-danger/80"><Trash2 size={20} /></button></div>
                        <div className="mb-4">
                            <label className="block text-foreground mb-2">Изображение к вопросу (необязательно)</label>
                            <div className="flex items-center gap-4">
                                {question.imageUrl ? (
                                    <div className="relative"><img src={question.imageUrl} alt="Изображение вопроса" className="w-32 h-32 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /><button type="button" onClick={() => removeQuestionImage(qIndex)} className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 hover:bg-danger/80"><X size={14} /></button></div>
                                ) : (
                                    <label className="cursor-pointer">
                                        <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) handleQuestionImageSelect(qIndex, file); }} className="hidden" disabled={uploadingQuestionImage === qIndex} />
                                        <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary transition-colors cursor-pointer">
                                            {uploadingQuestionImage === qIndex ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div> : <><ImagePlus size={24} className="text-muted-foreground" /><span className="text-xs text-muted-foreground mt-1">Загрузить</span></>}
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="mb-4"><label className="block text-foreground mb-2">Тип вопроса</label><select value={question.questionType} onChange={(e) => updateQuestionType(qIndex, e.target.value as any)} className="bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"><option value="SINGLE_CHOICE">Одиночный выбор</option><option value="MULTIPLE_CHOICE">Множественный выбор</option><option value="TEXT_INPUT">Текстовый ответ</option><option value="NUMBER_INPUT">Числовой ответ</option></select></div>
                        <div className="mb-4"><label className="block text-foreground mb-2">Текст вопроса *</label><textarea value={question.text} onChange={(e) => updateQuestion(qIndex, e.target.value)} rows={2} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Введите текст вопроса" /></div>
                        <div className="mb-4"><label className="block text-foreground mb-2">Баллы за вопрос *</label><input type="number" min="1" value={question.points} onChange={(e) => updateQuestionPoints(qIndex, Number(e.target.value))} className="w-full md:w-1/3 bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                        {(question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE') && (
                            <div>
                                <label className="block text-foreground mb-2">Варианты ответов *</label>
                                {question.answers.map((answer, aIndex) => (
                                    <div key={answer.id} className="flex items-center gap-3 mb-3">
                                        <button onClick={() => toggleCorrect(qIndex, aIndex)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${answer.isCorrect ? 'bg-success border-success' : 'border-muted-foreground hover:border-primary'}`}>{answer.isCorrect && <Check size={14} className="text-white" />}</button>
                                        <input type="text" placeholder={`Вариант ${aIndex + 1}`} value={answer.text} onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)} className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                                        {question.answers.length > 2 && <button onClick={() => removeAnswer(qIndex, aIndex)} className="text-danger hover:text-danger/80"><X size={20} /></button>}
                                    </div>
                                ))}
                                <button onClick={() => addAnswer(qIndex)} className="flex items-center gap-2 text-primary hover:text-primary/80 mt-3"><Plus size={18} /> Добавить вариант ответа</button>
                            </div>
                        )}
                        {question.questionType === 'TEXT_INPUT' && (<div><label className="block text-foreground mb-2">Правильный текстовый ответ *</label><input type="text" value={question.correctTextAnswer || ''} onChange={(e) => updateCorrectTextAnswer(qIndex, e.target.value)} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Введите правильный ответ" /></div>)}
                        {question.questionType === 'NUMBER_INPUT' && (<div><label className="block text-foreground mb-2">Правильный числовой ответ *</label><input type="number" value={question.correctNumberAnswer || ''} onChange={(e) => updateCorrectNumberAnswer(qIndex, parseFloat(e.target.value))} className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Введите правильное число" /></div>)}
                    </div>
                ))}

                <div className="flex flex-wrap gap-4 mb-8"><button onClick={addQuestion} className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80"><Plus size={20} /> Добавить вопрос</button></div>
                <div className="flex gap-4"><button onClick={saveTest} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"><Save size={20} /> {loading ? 'Сохранение...' : (isEditMode ? 'Обновить тест' : 'Создать тест')}</button><button onClick={() => navigate('/')} className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80">Отмена</button></div>
                {loading && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-card rounded-lg p-6 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div><p className="text-foreground">Сохранение теста...</p></div></div>}
            </div>
        </div>
    );
}