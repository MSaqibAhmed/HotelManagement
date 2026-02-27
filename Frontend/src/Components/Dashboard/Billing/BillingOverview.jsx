import React, { useEffect, useState } from "react";
import { FaFileInvoice, FaClock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const BillingOverview = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    pendingInvoices: 0,
    paidAmount: 0,
    overdueAmount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);

  const fetchOverview = () => {
    setLoading(true);
    setTimeout(() => {
      setOverview({
        totalRevenue: 1545000,
        pendingInvoices: 12,
        paidAmount: 1250000,
        overdueAmount: 45000,
      });
      setRecentInvoices([
        { _id: "inv1", invoiceId: "INV-2026-001", guestName: "John Doe", amount: 15000, dueDate: "2026-03-05", status: "Paid" },
        { _id: "inv2", invoiceId: "INV-2026-002", guestName: "Jane Smith", amount: 8000, dueDate: "2026-03-12", status: "Pending" },
        { _id: "inv3", invoiceId: "INV-2026-003", guestName: "Alice Johnson", amount: 12000, dueDate: "2026-02-28", status: "Overdue" }
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid": return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Pending": return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Overdue": return "bg-red-50 text-red-600 border border-red-200";
      default: return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Billing Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Financial summary and recent invoices</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">Rs {overview.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pending Invoices</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{overview.pendingInvoices}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <FaClock className="text-amber-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Paid Amount</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">Rs {overview.paidAmount.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaFileInvoice className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Overdue Amount</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">Rs {overview.overdueAmount.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FaExclamationCircle className="text-red-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Recent Invoices</h2>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Invoice ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentInvoices.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-16"><p className="text-gray-500 font-medium">No recent invoices</p></td></tr>
                  ) : (
                    recentInvoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">{inv.invoiceId}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{inv.guestName}</p></td>
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">Rs {inv.amount.toLocaleString()}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{inv.dueDate}</p></td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(inv.status)}`}>{inv.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {recentInvoices.length === 0 ? (
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No recent invoices</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentInvoices.map((inv) => (
                    <div key={inv._id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{inv.invoiceId}</p>
                          <p className="text-sm text-gray-500">{inv.guestName}</p>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(inv.status)}`}>{inv.status}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-500">Due: {inv.dueDate}</p>
                        <p className="font-semibold text-gray-800">Rs {inv.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BillingOverview;
