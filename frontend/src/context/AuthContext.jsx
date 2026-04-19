import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
       //Check if user is logged in
       const token = localStorage.getItem('token');
       const savedUser = localStorage.getItem('user');

       if (token && savedUser) {
           setUser(JSON.parse(savedUser));
       }
       setLoading(false);
    }, []);

    const login = async (email, password) => {
       try{
        const response = await api.post('/auth/login', { email, password });
        const { user, token } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
       } catch (error) {
           return { success: false, message: error.response?.data?.message || 'Login failed' };

       }
    };

    const register = async (name, email, password) => {
        try {
            const response = await api.post('/auth/signup', { name, email, password });
            const { user, token } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }

    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
