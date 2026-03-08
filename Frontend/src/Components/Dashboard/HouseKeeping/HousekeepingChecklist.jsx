import React, { useEffect, useMemo, useState } from "react";
import { FaSearch, FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const STATUS_OPTIONS = [
  "Pending",
  "Assigned",
  "InProgress",
  "Completed",
  "Verified",
  "IssueReported",
  "Cancelled",
];

const EditChecklistModal = ({ task, onClose, onSave }) => {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setChecklist(Array.isArray(task?.checklist) ? task.checklist : []);
  }, [task]);

  const handleToggle = (index) => {
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, isDone: !item.isDone } : item
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const cleanedChecklist = checklist.map((item) => ({
        label: String(item?.label || "").trim(),
        isDone: !!item?.isDone,
      }));

      const { data } = await api.patch(
        `/housekeeping/tasks/${task._id}/checklist`,
        { checklist: cleanedChecklist }
      );

      onSave(data?.task);
      toast.success(data?.message || "Checklist updated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update checklist");
    } finally {
      setLoading(false);
    }
  };

  const completedCount = checklist.filter((item) => item?.isDone).length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-[#1e266d] mb-2">Edit Checklist</h2>
        <p className="text-sm text-gray-500 mb-6">
          Room No. {task?.room?.roomNumber || task?.roomSnapshot?.roomNumber || "N/A"} •{" "}
          {task?.taskNumber || "Task"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {checklist.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-300 rounded-xl text-gray-500">
                No checklist items found
              </div>
            ) : (
              checklist.map((item, index) => (
                <label
                  key={`${item?.label || "item"}-${index}`}
                  className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!item?.isDone}
                      onChange={() => handleToggle(index)}
                      className="h-4 w-4 accent-[#1e266d]"
                    />
                    <span
                      className={`text-sm ${
                        item?.isDone ? "line-through text-gray-400" : "text-gray-700"
                      }`}
                    >
                      {item?.label || "Checklist Item"}
                    </span>
                  </div>

                  <span className="text-xs font-medium text-gray-500">
                    {item?.isDone ? "Done" : "Pending"}
                  </span>
                </label>
              ))
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Completed:{" "}
              <span className="font-semibold text-[#1e266d]">
                {completedCount}/{checklist.length}
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-semibold hover:bg-black disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const HousekeepingChecklist = () => {
  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const isHousekeeping = role === "housekeeping";

  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 10;

  const fetchChecklist = async () => {
    try {
      setLoading(true);

      const endpoint = isHousekeeping
        ? "/housekeeping/tasks/my"
        : "/housekeeping/tasks";

      const { data } = await api.get(endpoint);
      const taskList = data?.tasks || [];

      setTasks(taskList);

      if (isHousekeeping) {
        const selectedTaskId =
          localStorage.getItem("selectedHousekeepingTaskId") || "";

        if (selectedTaskId) {
          const foundTask = taskList.find((task) => task._id === selectedTaskId);
          setSelectedTask(foundTask || null);
        } else {
          setSelectedTask(null);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch checklist");
      setTasks([]);
      setSelectedTask(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, [isHousekeeping]);

  const mappedTasks = useMemo(() => {
    return tasks.map((task) => {
      const checklist = Array.isArray(task?.checklist) ? task.checklist : [];
      const completedItems = checklist.filter((item) => item?.isDone).length;
      const totalItems = checklist.length;
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        ...task,
        roomNumber: task?.room?.roomNumber || task?.roomSnapshot?.roomNumber || "N/A",
        assignedName: task?.assignedTo?.name || "Not Assigned",
        completedItems,
        totalItems,
        pendingItems: totalItems - completedItems,
        progress,
      };
    });
  }, [tasks]);

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return mappedTasks.filter((item) => {
      const checklistText = Array.isArray(item?.checklist)
        ? item.checklist.map((check) => String(check?.label || "").toLowerCase()).join(" ")
        : "";

      const matchesSearch =
        !q ||
        String(item?.taskNumber || "").toLowerCase().includes(q) ||
        String(item?.roomNumber || "").toLowerCase().includes(q) ||
        String(item?.assignedName || "").toLowerCase().includes(q) ||
        String(item?.status || "").toLowerCase().includes(q) ||
        checklistText.includes(q);

      const matchesStatus = statusFilter
        ? String(item?.status || "").toLowerCase() === statusFilter.toLowerCase()
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [mappedTasks, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const handleEdit = (task) => {
    localStorage.setItem("selectedHousekeepingTaskId", task._id);
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleSave = (updatedTask) => {
    setTasks((prev) =>
      prev.map((item) => (item._id === updatedTask._id ? updatedTask : item))
    );
    setSelectedTask(updatedTask);
    setShowModal(false);
  };

  const getStatusClasses = (status) => {
    switch (String(status || "")) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "InProgress":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "Assigned":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      case "Pending":
        return "bg-gray-50 text-gray-700 border border-gray-100";
      case "Verified":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "IssueReported":
        return "bg-red-50 text-red-700 border border-red-100";
      case "Cancelled":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Housekeeping Checklist</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isHousekeeping
              ? "Manage checklist of your selected cleaning task"
              : "View and manage task-wise cleaning checklist"}
          </p>
        </div>

        <button
          onClick={fetchChecklist}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto disabled:opacity-60"
        >
          Refresh Checklist
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "InProgress" ? "In Progress" : status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search task no, room no, staff or checklist point..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
              />
            </div>
          </div>

          <span className="text-sm text-gray-500 sm:whitespace-nowrap self-end">
            {filteredData.length} task(s)
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Task No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    {!isHousekeeping && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        House Keeper
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Completed</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Pending</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={isHousekeeping ? 8 : 9} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <p className="text-gray-500 font-medium">No checklist data found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Select or assign tasks first
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, index) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        <td className="px-6 py-4 font-medium text-[#1e266d]">
                          {item.taskNumber || "N/A"}
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-800">
                          {item.roomNumber}
                        </td>

                        {!isHousekeeping && (
                          <td className="px-6 py-4 text-gray-700">{item.assignedName}</td>
                        )}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-emerald-600 font-semibold">
                          {item.completedItems}
                        </td>

                        <td className="px-6 py-4 text-amber-600 font-semibold">
                          {item.pendingItems}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {item.progress}%
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {paginatedData.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No checklist data found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Select or assign tasks first
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedData.map((item) => (
                    <div key={item._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 truncate">
                            {item.taskNumber || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            Room: {item.roomNumber}
                          </p>
                          {!isHousekeeping && (
                            <p className="text-sm text-gray-500 truncate">
                              {item.assignedName}
                            </p>
                          )}
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <p className="text-gray-400 text-xs mb-1">Complete</p>
                          <p className="text-emerald-600 font-semibold">{item.completedItems}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs mb-1">Pending</p>
                          <p className="text-amber-600 font-semibold">{item.pendingItems}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs mb-1">Progress</p>
                          <p className="text-[#1e266d] font-semibold">{item.progress}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                  {filteredData.length}
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                        currentPage === page
                          ? "bg-[#1e1e1e] text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && selectedTask && (
        <EditChecklistModal
          task={selectedTask}
          onClose={() => {
            setShowModal(false);
            setSelectedTask(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default HousekeepingChecklist;