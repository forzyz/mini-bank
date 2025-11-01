"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "./api";

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        email: string,
        password: string,
        firstName: string,
        lastName: string
    ) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = Cookies.get("token");
        if (token) {
            // Set default authorization header
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            // Verify token by making a request to get user info
            // For now, we'll just set the user from token (in a real app, you'd verify with backend)
            setUser({
                id: "1",
                email: "user@example.com",
                first_name: "User",
                last_name: "Name",
                created_at: new Date().toISOString(),
            });
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post("/auth/login", { email, password });
            const { user: userData, token } = response.data;

            Cookies.set("token", token, { expires: 7 });
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            setUser(userData);
            router.push("/dashboard");
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Login failed");
        }
    };

    const register = async (
        email: string,
        password: string,
        firstName: string,
        lastName: string
    ) => {
        try {
            const response = await api.post("/auth/register", {
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            });
            const { user: userData, token } = response.data;

            Cookies.set("token", token, { expires: 7 });
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            setUser(userData);
            router.push("/dashboard");
        } catch (error: any) {
            throw new Error(
                error.response?.data?.error || "Registration failed"
            );
        }
    };

    const logout = () => {
        Cookies.remove("token");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
        router.push("/");
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
