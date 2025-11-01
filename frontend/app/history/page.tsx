"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, ArrowRightLeft, TrendingUp } from "lucide-react";

interface Transaction {
    id: string;
    transaction_type: string;
    amount: string;
    currency: string;
    from_account_id?: string;
    to_account_id?: string;
    exchange_rate?: string;
    description: string;
    created_at: string;
}

export default function HistoryPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await api.get(
                    `/api/transactions?limit=20&offset=${(page - 1) * 20}`
                );
                // Ensure transactions is always an array
                const transactionsList = Array.isArray(
                    response.data?.transactions
                )
                    ? response.data.transactions
                    : [];

                if (page === 1) {
                    setTransactions(transactionsList);
                } else {
                    setTransactions((prev) => [
                        ...(prev || []),
                        ...transactionsList,
                    ]);
                }
                setHasMore(transactionsList.length === 20);
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
                if (page === 1) {
                    setTransactions([]); // Set to empty array on error
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [page]);

    const loadMore = () => {
        setPage((prev) => prev + 1);
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case "transfer":
                return <ArrowRightLeft className="h-5 w-5 text-blue-600" />;
            case "exchange":
                return <TrendingUp className="h-5 w-5 text-green-600" />;
            default:
                return <ArrowRightLeft className="h-5 w-5 text-gray-600" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case "transfer":
                return "bg-blue-50 border-blue-200";
            case "exchange":
                return "bg-green-50 border-green-200";
            default:
                return "bg-gray-50 border-gray-200";
        }
    };

    if (loading && (!transactions || transactions.length === 0)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center text-primary-600 hover:text-primary-700"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Transaction History
                        </h1>
                        <p className="text-gray-600">
                            View all your transactions
                        </p>
                    </div>

                    <div className="p-6">
                        {!transactions || transactions.length === 0 ? (
                            <div className="text-center py-8">
                                <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No transactions yet
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Your transaction history will appear here
                                </p>
                                <Link
                                    href="/transfer"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                >
                                    Make a Transfer
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className={`border rounded-lg p-4 ${getTransactionColor(
                                            transaction.transaction_type
                                        )}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {getTransactionIcon(
                                                    transaction.transaction_type
                                                )}
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900 capitalize">
                                                        {
                                                            transaction.transaction_type
                                                        }
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(
                                                            transaction.created_at
                                                        ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                year: "numeric",
                                                                month: "short",
                                                                day: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </p>
                                                    {transaction.description && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {
                                                                transaction.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {parseFloat(
                                                        transaction.amount
                                                    ).toLocaleString("en-US", {
                                                        style: "currency",
                                                        currency:
                                                            transaction.currency,
                                                    })}
                                                </p>
                                                {transaction.exchange_rate && (
                                                    <p className="text-sm text-gray-500">
                                                        Rate:{" "}
                                                        {parseFloat(
                                                            transaction.exchange_rate
                                                        ).toFixed(4)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {hasMore && (
                                    <div className="text-center pt-4">
                                        <button
                                            onClick={loadMore}
                                            disabled={loading}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {loading
                                                ? "Loading..."
                                                : "Load More"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
