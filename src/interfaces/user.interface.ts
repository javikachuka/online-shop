export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified?: Date | null;
    password: string;
    role: string;
}