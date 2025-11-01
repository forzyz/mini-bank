"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Plus, DollarSign } from "lucide-react";

interface Account {
    id: string;
    currency: string;
    account_type: string;
    balance: string;
}

interface CreateAccountFormData {
    currency: string;
    account_type: string;
}

interface DepositFormData {
    amount: string;
    description: string;
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [depositAccountId, setDepositAccountId] = useState<string | null>(
        null
    );
    const [depositing, setDepositing] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateAccountFormData>();

    const {
        register: registerDeposit,
        handleSubmit: handleDepositSubmit,
        formState: { errors: depositErrors },
        reset: resetDeposit,
    } = useForm<DepositFormData>();

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await api.get("/api/accounts");
                // Ensure accounts is always an array
                setAccounts(
                    Array.isArray(response.data?.accounts)
                        ? response.data.accounts
                        : []
                );
            } catch (error) {
                console.error("Failed to fetch accounts:", error);
                toast.error("Failed to load accounts");
                setAccounts([]); // Set to empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    const onSubmit = async (data: CreateAccountFormData) => {
        setSubmitting(true);
        try {
            const response = await api.post("/api/accounts", data);
            // Ensure balance field exists, default to "0" if missing
            const newAccount = {
                ...response.data,
                balance: response.data.balance || "0",
            };
            setAccounts((prev) => [...(prev || []), newAccount]);
            setShowCreateForm(false);
            toast.success("Account created successfully!");
            // Refetch accounts to get the complete data with balance
            const refreshResponse = await api.get("/api/accounts");
            setAccounts(
                Array.isArray(refreshResponse.data?.accounts)
                    ? refreshResponse.data.accounts
                    : []
            );
        } catch (error: any) {
            toast.error(
                error.response?.data?.error || "Failed to create account"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const onDeposit = async (data: DepositFormData) => {
        if (!depositAccountId) return;

        setDepositing(true);
        try {
            await api.post("/api/transactions/deposit", {
                account_id: depositAccountId,
                amount: parseFloat(data.amount),
                description: data.description || "Deposit",
            });
            toast.success("Money added successfully!");
            setDepositAccountId(null);
            resetDeposit();
            // Refetch accounts to get updated balances
            const refreshResponse = await api.get("/api/accounts");
            setAccounts(
                Array.isArray(refreshResponse.data?.accounts)
                    ? refreshResponse.data.accounts
                    : []
            );
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to add money");
        } finally {
            setDepositing(false);
        }
    };

    if (loading) {
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
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Your Accounts
                            </h1>
                            <p className="text-gray-600">
                                Manage your bank accounts
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Account
                        </button>
                    </div>

                    <div className="p-6">
                        {showCreateForm && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Create New Account
                                </h3>
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                htmlFor="currency"
                                                className="block text-sm font-medium text-gray-700 mb-2"
                                            >
                                                Currency
                                            </label>
                                            <select
                                                {...register("currency", {
                                                    required:
                                                        "Currency is required",
                                                })}
                                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            >
                                                <option value="">
                                                    Select currency
                                                </option>
                                                <option value="USD">
                                                    USD - US Dollar
                                                </option>
                                                <option value="EUR">
                                                    EUR - Euro
                                                </option>
                                                <option value="GBP">
                                                    GBP - British Pound
                                                </option>
                                                <option value="JPY">
                                                    JPY - Japanese Yen
                                                </option>
                                            </select>
                                            {errors.currency && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {errors.currency.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="account_type"
                                                className="block text-sm font-medium text-gray-700 mb-2"
                                            >
                                                Account Type
                                            </label>
                                            <select
                                                {...register("account_type", {
                                                    required:
                                                        "Account type is required",
                                                })}
                                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            >
                                                <option value="">
                                                    Select type
                                                </option>
                                                <option value="checking">
                                                    Checking
                                                </option>
                                                <option value="savings">
                                                    Savings
                                                </option>
                                            </select>
                                            {errors.account_type && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {
                                                        errors.account_type
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                                        >
                                            {submitting
                                                ? "Creating..."
                                                : "Create Account"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCreateForm(false)
                                            }
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {accounts.length === 0 ? (
                            <div className="text-center py-8">
                                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No accounts yet
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Create your first account to get started
                                </p>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Account
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(accounts || []).map((account) => (
                                    <div
                                        key={account.id}
                                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {account.currency} Account
                                            </h3>
                                            <span className="text-sm text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                                                {account.account_type}
                                            </span>
                                        </div>
                                        <p className="text-3xl font-bold text-gray-900 mb-2">
                                            {parseFloat(
                                                account.balance || "0"
                                            ).toLocaleString("en-US", {
                                                style: "currency",
                                                currency: account.currency,
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Account ID: {account.id.slice(0, 8)}
                                            ...
                                        </p>
                                        <button
                                            onClick={() =>
                                                setDepositAccountId(account.id)
                                            }
                                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <DollarSign className="h-4 w-4 mr-2" />
                                            Add Money
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Deposit Modal */}
            {depositAccountId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                Add Money
                            </h2>
                            <button
                                onClick={() => {
                                    setDepositAccountId(null);
                                    resetDeposit();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <form
                            onSubmit={handleDepositSubmit(onDeposit)}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount
                                </label>
                                <input
                                    {...registerDeposit("amount", {
                                        required: "Amount is required",
                                        min: {
                                            value: 0.01,
                                            message:
                                                "Amount must be greater than 0",
                                        },
                                    })}
                                    type="number"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="0.00"
                                />
                                {depositErrors.amount && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {depositErrors.amount.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <input
                                    {...registerDeposit("description")}
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Deposit description"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    disabled={depositing}
                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    {depositing ? "Adding..." : "Add Money"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDepositAccountId(null);
                                        resetDeposit();
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
