"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Account {
    id: string;
    currency: string;
    account_type: string;
    balance: string;
}

interface TransferFormData {
    from_account_id: string;
    to_account_id: string;
    amount: string;
    description: string;
}

export default function TransferPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<TransferFormData>();
    const fromAccountId = watch("from_account_id");

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

    useEffect(() => {
        fetchAccounts();
    }, []);

    const onSubmit = async (data: TransferFormData) => {
        setSubmitting(true);
        try {
            await api.post("/api/transactions/transfer", {
                from_account_id: data.from_account_id,
                to_account_id: data.to_account_id,
                amount: parseFloat(data.amount),
                description: data.description,
            });

            toast.success("Transfer completed successfully!");
            // Refresh accounts to show updated balances
            await fetchAccounts();
            // Reset the form
            reset();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Transfer failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Ensure accounts is always an array
    const accountsList = accounts || [];
    const fromAccount = accountsList.find((acc) => acc.id === fromAccountId);
    const availableAccounts = accountsList.filter(
        (acc) =>
            acc.id !== fromAccountId && acc.currency === fromAccount?.currency
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            Transfer Money
                        </h1>
                        <p className="text-gray-600">
                            Send money between your accounts
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="p-6 space-y-6"
                    >
                        <div>
                            <label
                                htmlFor="from_account_id"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                From Account
                            </label>
                            <select
                                {...register("from_account_id", {
                                    required: "Please select a from account",
                                })}
                                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Select account</option>
                                {(accounts || []).map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.currency} -{" "}
                                        {parseFloat(
                                            account.balance || "0"
                                        ).toLocaleString("en-US", {
                                            style: "currency",
                                            currency: account.currency,
                                        })}
                                    </option>
                                ))}
                            </select>
                            {errors.from_account_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.from_account_id.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="to_account_id"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                To Account
                            </label>
                            <select
                                {...register("to_account_id", {
                                    required: "Please select a to account",
                                })}
                                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                disabled={!fromAccountId}
                            >
                                <option value="">Select account</option>
                                {availableAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.currency} -{" "}
                                        {parseFloat(
                                            account.balance || "0"
                                        ).toLocaleString("en-US", {
                                            style: "currency",
                                            currency: account.currency,
                                        })}
                                    </option>
                                ))}
                            </select>
                            {errors.to_account_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.to_account_id.message}
                                </p>
                            )}
                            {fromAccountId &&
                                availableAccounts.length === 0 && (
                                    <p className="text-yellow-600 text-sm mt-1">
                                        No accounts available with the same
                                        currency
                                    </p>
                                )}
                        </div>

                        <div>
                            <label
                                htmlFor="amount"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Amount
                            </label>
                            <input
                                {...register("amount", {
                                    required: "Amount is required",
                                    min: {
                                        value: 0.01,
                                        message:
                                            "Amount must be greater than 0",
                                    },
                                    max: {
                                        value: fromAccount
                                            ? parseFloat(
                                                  fromAccount.balance || "0"
                                              )
                                            : 0,
                                        message:
                                            "Amount exceeds available balance",
                                    },
                                })}
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0.00"
                            />
                            {errors.amount && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.amount.message}
                                </p>
                            )}
                            {fromAccount && (
                                <p className="text-gray-500 text-sm mt-1">
                                    Available:{" "}
                                    {parseFloat(
                                        fromAccount.balance || "0"
                                    ).toLocaleString("en-US", {
                                        style: "currency",
                                        currency: fromAccount.currency,
                                    })}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Description (Optional)
                            </label>
                            <input
                                {...register("description")}
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Transfer description"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                !fromAccountId ||
                                availableAccounts.length === 0
                            }
                            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? "Processing Transfer..."
                                : "Transfer Money"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
