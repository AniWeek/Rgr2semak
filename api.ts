const API_BASE_URL = '/api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    testsCompleted?: number;
    avgScore?: number;
    totalPoints?: number;
    registeredAt?: string;
}

export interface Test {
    id: string;
    title: string;
    description: string;
    duration: number;
    deadline: string | null;
    imageUrl: string;
    createdBy: string;
    createdAt?: string;
    questionsCount?: number;
    maxAttempts?: number;
    isPrivate?: boolean;
    commentsEnabled?: boolean;
    randomizeQuestions?: boolean;
    allowNavigationBack?: boolean;
    allowSkipQuestions?: boolean;
    category?: string;
    status?: string;
}

export interface Answer {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface Question {
    id: string;
    text: string;
    imageUrl?: string;
    questionType: string;
    answers: Answer[];
    points: number;
    correctTextAnswer?: string;
    correctNumberAnswer?: number;
}

export interface Result {
    id: string;
    userId: string;
    testId: string;
    score: number;
    pointsEarned: number;
    pointsTotal: number;
    percentage: number;
    passed: boolean;
    timeSpent: number;
    completedAt: string;
}

export interface TestResultWithUser {
    result: Result;
    user: { id: string; name: string; email: string };
}

export interface TestComment {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
}

export interface UserAnswerDetail {
    id: string;
    resultId: string;
    questionId: string;
    answerId?: string;
    textAnswer?: string;
    numberAnswer?: number;
    selectedAnswerIds?: string;
    isCorrect: boolean;
    pointsEarned: number;
    pointsMax: number;
}

export const authAPI = {
    register: (name: string, email: string, password: string) =>
        fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    login: (email: string, password: string) =>
        fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    verifyEmail: (code: string) =>
        fetch(`${API_BASE_URL}/auth/verify?code=${code}`).then(res => res.text()),

    resendVerification: (email: string) =>
        fetch(`${API_BASE_URL}/auth/verify/resend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        }).then(res => res.text()),

    forgotPassword: (email: string) =>
        fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        }).then(res => res.text()),

    resetPassword: (code: string, newPassword: string) =>
        fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, newPassword })
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); }))
};

export const testsAPI = {
    getAll: (userEmail?: string, filters?: { category?: string; dateFrom?: string; dateTo?: string }) => {
        let url = `${API_BASE_URL}/tests`;
        const params = new URLSearchParams();
        if (userEmail) params.append('userEmail', userEmail);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters?.dateTo) params.append('dateTo', filters.dateTo);
        if (params.toString()) url += `?${params.toString()}`;
        return fetch(url).then(res => res.json());
    },

    getById: (id: string) => fetch(`${API_BASE_URL}/tests/${id}`).then(res => res.json()),
    getQuestions: (id: string) => fetch(`${API_BASE_URL}/tests/${id}/questions`).then(res => res.json()),
    getQuestionsForTaking: (id: string) => fetch(`${API_BASE_URL}/tests/${id}/questions-taking`).then(res => res.json()),
    getTestResultsWithUsers: (id: string) => fetch(`${API_BASE_URL}/tests/${id}/results/users`).then(res => res.json()),

    create: (data: any) => fetch(`${API_BASE_URL}/tests/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    update: (id: string, data: any) => fetch(`${API_BASE_URL}/tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    updateTestQuestions: (id: string, questions: any[]) => fetch(`${API_BASE_URL}/tests/${id}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
    }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    submit: (testId: string, userId: string, answers: any, timeSpent: number) =>
        fetch(`${API_BASE_URL}/tests/${testId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, answers, timeSpent })
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    checkAttempts: (testId: string, userId: string) =>
        fetch(`${API_BASE_URL}/tests/${testId}/check-attempts?userId=${userId}`).then(res => res.json()),

    getTestResults: (testId: string) => fetch(`${API_BASE_URL}/tests/${testId}/results`).then(res => res.json()),
    getUserResults: (userId: string) => fetch(`${API_BASE_URL}/tests/user/${userId}/results`).then(res => res.json()),
    getResultAnswers: (resultId: string) => fetch(`${API_BASE_URL}/tests/results/${resultId}/answers`).then(res => res.json()),
    delete: (id: string) => fetch(`${API_BASE_URL}/tests/${id}`, { method: 'DELETE' }),
    deleteQuestion: (questionId: string) => fetch(`${API_BASE_URL}/tests/questions/${questionId}`, { method: 'DELETE' }),
    deleteAnswer: (answerId: string) => fetch(`${API_BASE_URL}/tests/answers/${answerId}`, { method: 'DELETE' }),
    getComments: (testId: string) => fetch(`${API_BASE_URL}/tests/${testId}/comments`).then(res => res.json()),

    addComment: (testId: string, userId: string, content: string, rating: number | null) =>
        fetch(`${API_BASE_URL}/tests/${testId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, content, rating })
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    deleteComment: (commentId: string, userId: string, isAdmin: boolean) =>
        fetch(`${API_BASE_URL}/tests/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, isAdmin })
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    toggleCommentsEnabled: (testId: string, enabled: boolean) =>
        fetch(`${API_BASE_URL}/tests/${testId}/comments-enabled`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
        }).then(res => res.json()),

    sendResultToEmail: (resultId: string, email: string) =>
        fetch(`${API_BASE_URL}/tests/results/${resultId}/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    uploadTestImage: (testId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${API_BASE_URL}/tests/${testId}/upload-image`, {
            method: 'POST',
            body: formData
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); }));
    },

    uploadQuestionImage: (questionId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${API_BASE_URL}/tests/questions/${questionId}/upload-image`, {
            method: 'POST',
            body: formData
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); }));
    },

    inviteUsers: (testId: string, emails: string[], invitedBy: string) =>
        fetch(`${API_BASE_URL}/tests/${testId}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails, invitedBy })
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    getInvitedUsers: (testId: string) => fetch(`${API_BASE_URL}/tests/${testId}/invited-users`).then(res => res.json())
};

export const adminAPI = {
    getUsers: () => fetch(`${API_BASE_URL}/admin/users`).then(res => res.json()),
    getUserById: (id: string) => fetch(`${API_BASE_URL}/admin/users/${id}`).then(res => res.json()),

    updateRole: (userId: string, role: string) =>
        fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    toggleStatus: (userId: string) =>
        fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    banUser: (userId: string) =>
        fetch(`${API_BASE_URL}/admin/users/${userId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    unbanUser: (userId: string) =>
        fetch(`${API_BASE_URL}/admin/users/${userId}/unban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.ok ? res.json() : res.text().then(err => { throw new Error(err); })),

    deleteUser: (userId: string) => fetch(`${API_BASE_URL}/admin/users/${userId}`, { method: 'DELETE' }),

    getRegistrationConfig: () => fetch(`${API_BASE_URL}/admin/config/registration`).then(res => res.json()),

    updateRegistrationConfig: (enabled: boolean) =>
        fetch(`${API_BASE_URL}/admin/config/registration`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
        }).then(res => res.json()),

    getAdminStatistics: () => fetch(`${API_BASE_URL}/admin/statistics`).then(res => res.json())
};

export const getUser = (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const saveUser = (user: User): void => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = (): void => localStorage.removeItem('user');

export const hasRole = (roles: string[]): boolean => {
    const user = getUser();
    return user !== null && roles.includes(user.role);
};