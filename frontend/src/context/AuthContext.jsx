import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Admin emails: set VITE_ADMIN_EMAILS in frontend/.env as comma-separated list
        const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'jansevaaiportal@gmail.com')
            .split(',')
            .map(e => e.trim().toLowerCase());

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser && firebaseUser.emailVerified) {
                const isAdmin = adminEmails.includes(firebaseUser.email.toLowerCase());
                setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
                });
                setRole(isAdmin ? 'admin' : 'citizen');
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signup = async (_name, email, password) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // Send verification email before signing the user out
        await sendEmailVerification(credential.user);
        // Sign out immediately — they must verify first
        await signOut(auth);
        return { email };
    };

    const login = async (email, password) => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        if (!credential.user.emailVerified) {
            // Sign out and surface a clear error for the UI to handle
            await signOut(auth);
            const err = new Error('Please verify your email before signing in.');
            err.code = 'auth/email-not-verified';
            err.email = email;
            throw err;
        }
        return credential.user;
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

