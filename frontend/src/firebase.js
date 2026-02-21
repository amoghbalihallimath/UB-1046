import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: 'AIzaSyC-AezH6DChuHn4SuGIpX8iH0hZO6ZvmIU',
    authDomain: 'samadhanam-ai-portal.firebaseapp.com',
    projectId: 'samadhanam-ai-portal',
    storageBucket: 'samadhanam-ai-portal.firebasestorage.app',
    messagingSenderId: '45401823312',
    appId: '1:45401823312:web:d1c00d00bf821a10ce5955',
    measurementId: 'G-1ZZD43MD58'
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
