import { API_BASE_URL } from '../config';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async register(userData) {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return response;
    }

    async verify(email, code) {
        const response = await fetch(`${this.baseURL}/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code }),
        });
        return response;
    }

    async login(credentials) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        return response;
    }

    async getTests(token) {
        const response = await fetch(`${this.baseURL}/tests`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return response;
    }
}

export default new ApiService();