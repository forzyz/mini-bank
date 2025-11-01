"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    ArrowRightLeft,
    CreditCard,
    History,
    Plus,
    TrendingUp,
} from "lucide-react";

interface Account {
    id: string;
    currency: string;
    account_type: string;
    balance: string;
}

export default function Dashboard() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect to login if not authenticated (only after auth check completes)
        if (!authLoading && !user) {
            router.push("/");
            return;
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!authLoading && user) {
            const fetchAccounts = async () => {
                try {
                    const response = await api.get("/api/accounts");
                    // Ensure accounts is always an array, even if API returns null/undefined
                    setAccounts(
                        Array.isArray(response.data?.accounts)
                            ? response.data.accounts
                            : []
                    );
                } catch (error) {
                    console.error("Failed to fetch accounts:", error);
                    setAccounts([]); // Set to empty array on error
                } finally {
                    setLoading(false);
                }
            };

            fetchAccounts();
        }
    }, [authLoading, user]);

    // Show loading spinner while checking auth or fetching data
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Mini Bank
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">
                                Welcome, {user?.first_name}
                            </span>
                            <button
                                onClick={logout}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Link
                        href="/transfer"
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center">
                            <ArrowRightLeft className="h-8 w-8 text-primary-600" />
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Transfer
                                </h3>
                                <p className="text-gray-500">Send money</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/exchange"
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Exchange
                                </h3>
                                <p className="text-gray-500">
                                    Convert currency
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/history"
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center">
                            <History className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    History
                                </h3>
                                <p className="text-gray-500">
                                    View transactions
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/accounts"
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center">
                            <CreditCard className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Accounts
                                </h3>
                                <p className="text-gray-500">Manage accounts</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Accounts Overview */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Your Accounts
                        </h2>
                    </div>
                    <div className="p-6">
                        {!accounts || accounts.length === 0 ? (
                            <div className="text-center py-8">
                                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No accounts yet
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Create your first account to get started
                                </p>
                                <Link
                                    href="/accounts"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Account
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {accounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className="border rounded-lg p-4"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {account.currency} Account
                                            </h3>
                                            <span className="text-sm text-gray-500 capitalize">
                                                {account.account_type}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {parseFloat(
                                                account.balance || "0"
                                            ).toLocaleString("en-US", {
                                                style: "currency",
                                                currency: account.currency,
                                            })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
