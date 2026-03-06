import React, { useEffect, useMemo, useState } from "react";
import {
  FaFileInvoice,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaWallet,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const BillingOverview = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    pendingInvoices: 0,
    paidAmount: 0,
    overdueAmount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);

  const fetchOverview = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/billing/overview");

      setOverview(
        data?.overview || {
          totalRevenue: 0,
          pendingInvoices: 0,
          paidAmount: 0,
          overdueAmount: 0,
        }
      );

      setRecentInvoices(data?.recentInvoices || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch billing overview"
      );
      setOverview({
        totalRevenue: 0,
        pendingInvoices: 0,
        paidAmount: 0,
        overdueAmount: 0,
      });
      setRecentInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Pending":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "PendingVerification":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "PartiallyPaid":
        return "bg-purple-50 text-purple-600 border border-purple-200";
      case "Rejected":
        return "bg-red-50 text-red-600 border border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const stats = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: formatCurrency(overview.totalRevenue),
        icon: <FaCheckCircle className="text-emerald-600 text-xl" />,
        iconBg: "bg-emerald-100",
      },
      {
        title: "Pending Invoices",
        value: overview.pendingInvoices,
        icon: <FaClock className="text-amber-600 text-xl" />,
        iconBg: "bg-amber-100",
      },
      {
        title: "Paid Amount",
        value: formatCurrency(overview.paidAmount),
        icon: <FaWallet className="text-blue-600 text-xl" />,
        iconBg: "bg-blue-100",
      },
      {
        title: "Remaining Amount",
        value: formatCurrency(overview.overdueAmount),
        icon: <FaExclamationCircle className="text-red-600 text-xl" />,
        iconBg: "bg-red-100",
      },
    ],
    [overview]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Billing Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Financial summary, pending invoices, and recent billing activity
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{item.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {item.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${item.iconBg}`}
                  >
                    {item.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Recent Invoices</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Latest invoices with payment progress
                </p>
              </div>
              <div className="w-11 h-11 rounded-full bg-[#1e266d]/10 flex items-center justify-center">
                <FaFileInvoice className="text-[#1e266d] text-lg" />
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Invoice ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Paid
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Remaining
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {recentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-16">
                        <p className="text-gray-500 font-medium">No recent invoices</p>
                      </td>
                    </tr>
                  ) : (
                    recentInvoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">
                            {inv.invoiceId || "—"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-800">
                            {inv.guestName || "Guest"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(inv.amount || 0)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-emerald-700">
                            {formatCurrency(inv.paidAmount || 0)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-red-600">
                            {formatCurrency(inv.remainingAmount || 0)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{inv.dueDate || "—"}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                              inv.status
                            )}`}
                          >
                            {inv.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {recentInvoices.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No recent invoices</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentInvoices.map((inv) => (
                    <div key={inv._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {inv.invoiceId || "—"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {inv.guestName || "Guest"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            inv.status
                          )}`}
                        >
                          {inv.status || "Pending"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Total</p>
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(inv.amount || 0)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Paid</p>
                          <p className="font-semibold text-emerald-700">
                            {formatCurrency(inv.paidAmount || 0)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Remaining</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(inv.remainingAmount || 0)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Date</p>
                          <p className="text-gray-700">{inv.dueDate || "—"}</p>
                        </div>
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