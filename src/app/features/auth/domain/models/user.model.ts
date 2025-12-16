export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    token: string;
}
