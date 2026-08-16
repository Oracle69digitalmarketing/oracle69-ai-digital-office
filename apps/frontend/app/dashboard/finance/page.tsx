"use client";

import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button, EmptyState, LoadingSkeleton } from "@oracle69/ui";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await apiClient<Transaction[]>("/finance/transactions");
        setTransactions(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setError("Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500">Monitor revenue, expenses, and financial health.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton className="h-64" />
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <EmptyState
              title="Failed to load transactions"
              description={error}
              action={<Button onClick={() => window.location.reload()}>Retry</Button>}
            />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title="Finance module not connected"
              description="Connect your accounting software or data source to view your financial metrics."
              action={<Button>Connect Data Source</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{tx.description}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td
                      className={cn(
                        "px-6 py-4 text-right font-medium",
                        tx.type === "income" ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
