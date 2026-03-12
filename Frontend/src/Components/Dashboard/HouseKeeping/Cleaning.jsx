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

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

const EditTaskModal = ({ task, staffList, userRole, onClose, onSave }) => {
  const isHousekeeping = userRole === "housekeeping";

  const [formData, setFormData] = useState({
    assignedTo: task?.assignedTo?._id || "",
    priority: task?.priority || "Medium",
    status: task?.status || "Pending",
    note: task?.note || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!task) return;

    setFormData({
      assignedTo: task?.assignedTo?._id || "",
      priority: task?.priority || "Medium",
      status: task?.status || "Pending",
      note: task?.note || "",
    });
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const assigneeChanged =
      String(formData.assignedTo || "") !== String(task?.assignedTo?._id || "");
    const priorityChanged =
      String(formData.priority || "") !== String(task?.priority || "");
    const statusChanged =
      String(formData.status || "") !== String(task?.status || "");
    const noteChanged =
      String(formData.note || "") !== String(task?.note || "");

    if (!assigneeChanged && !priorityChanged && !statusChanged && !noteChanged) {
      toast.info("No changes detected");
      return;
    }

    try {
      setLoading(true);
      let updatedTask = task;

      if (!isHousekeeping && (assigneeChanged || priorityChanged)) {
        const { data } = await api.patch(`/housekeeping/tasks/${task._id}/assign`, {
          assignedTo: formData.assignedTo,
          priority: formData.priority,
          note: formData.note,
        });

        updatedTask = data?.task || updatedTask;
      }

      if (statusChanged || noteChanged) {
        const { data } = await api.patch(`/housekeeping/tasks/${task._id}/status`, {
          status: formData.status,
          note: formData.note,
        });

        updatedTask = data?.task || updatedTask;
      }

      onSave(updatedTask);
      toast.success("Task updated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const allowedStatusOptions = isHousekeeping
    ? ["Assigned", "InProgress", "Completed", "IssueReported"]
    : STATUS_OPTIONS;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-[#1e266d] mb-6">Edit Cleaning Task</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isHousekeeping && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                House Keeper
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
              >
                <option value="">Not Assigned</option>
                {staffList.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isHousekeeping && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
            >
              {allowedStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={4}
              placeholder="Add task note..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
        </form>
      </div>
    </div>
  );
};

const Cleaning = () => {
  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const isHousekeeping = role === "housekeeping";

  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Active");

  const itemsPerPage = 10;

  const fetchCleaningTasks = async () => {
    try {
      setLoading(true);

      const requests = [
        api.get(isHousekeeping ? "/housekeeping/tasks/my" : "/housekeeping/tasks"),
      ];

      if (!isHousekeeping) {
        requests.push(api.get("/auth/staff"));
      }

      const responses = await Promise.all(requests);
      const taskRes = responses[0];
      const staffRes = responses[1];

      setTasks(taskRes?.data?.tasks || []);

      if (staffRes) {
        setStaffList(
          staffRes?.data?.staff?.filter(
            (item) => String(item.role).toLowerCase() === "housekeeping"
          ) || []
        );
      } else {
        setStaffList([]);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch cleaning tasks");
      setTasks([]);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaningTasks();
  }, [isHousekeeping]);

  const filteredTasks = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return tasks.filter((task) => {
      const assignedName = String(task?.assignedTo?.name || "").toLowerCase();
      const roomNumber = String(
        task?.room?.roomNumber || task?.roomSnapshot?.roomNumber || ""
      ).toLowerCase();
      const taskNumber = String(task?.taskNumber || "").toLowerCase();
      const status = String(task?.status || "");
      const taskType = String(task?.taskType || "").toLowerCase();

      // Tab Filtering
      const isActiveTab = activeTab === "Active";
      const activeStatuses = ["Pending", "Assigned", "InProgress", "IssueReported"];
      const completedStatuses = ["Completed", "Verified", "Cancelled"];

      const matchesTab = isActiveTab
        ? activeStatuses.includes(status)
        : completedStatuses.includes(status);

      const matchesSearch =
        !q ||
        assignedName.includes(q) ||
        roomNumber.includes(q) ||
        taskNumber.includes(q) ||
        status.toLowerCase().includes(q) ||
        taskType.includes(q);

      const matchesStatus = statusFilter
        ? status.toLowerCase() === statusFilter.toLowerCase()
        : true;

      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter, activeTab]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage]);

  const handleEdit = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleSave = (updatedTask) => {
    setTasks((prev) => prev.map((item) => (item._id === updatedTask._id ? updatedTask : item)));
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleCancelTask = async (task) => {
    const roomNumber = task?.room?.roomNumber || task?.roomSnapshot?.roomNumber || "N/A";
    const ok = window.confirm(`Cancel cleaning task for room ${roomNumber}?`);
    if (!ok) return;

    try {
      setActionLoadingId(task._id);

      const { data } = await api.patch(`/housekeeping/tasks/${task._id}/status`, {
        status: "Cancelled",
        note: "Task cancelled from cleaning list",
      });

      setTasks((prev) => prev.map((item) => (item._id === task._id ? data.task : item)));
      toast.success("Cleaning task cancelled successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cancel failed");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleStartTask = async (task) => {
    try {
      setActionLoadingId(task._id);

      const { data } = await api.patch(`/housekeeping/tasks/${task._id}/status`, {
        status: "InProgress",
        note: task?.note || "Task started by housekeeping",
      });

      setTasks((prev) => prev.map((item) => (item._id === task._id ? data.task : item)));
      localStorage.setItem("selectedHousekeepingTaskId", task._id);
      toast.success("Task started successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start task");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSelectTask = (task) => {
    localStorage.setItem("selectedHousekeepingTaskId", task._id);
    toast.success("Task selected for checklist/report");
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

  const canCancelTask = (task) => {
    return !isHousekeeping && !["Cancelled", "Verified", "Completed"].includes(task?.status);
  };

  const canStartTask = (task) => {
    return isHousekeeping && task?.status === "Assigned";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">
          {isHousekeeping ? "Assigned Cleaning Tasks" : "Room Cleaning List"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isHousekeeping
            ? "View and manage your assigned cleaning tasks"
            : "Track and manage room cleaning tasks"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex px-1 space-x-6 border-b border-gray-200">
        {["Active", "Completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`pb-3 text-sm font-semibold transition-colors duration-200 border-b-2 ${
              activeTab === tab
                ? "border-[#1e266d] text-[#1e266d]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab} Tasks
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={
                isHousekeeping
                  ? "Search by room number, task no, type, or status..."
                  : "Search by employee name, room number, task no, or status..."
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <div className="w-full sm:w-52">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchCleaningTasks}
            disabled={loading}
            className="px-4 py-2.5 bg-[#1e266d] text-white text-sm font-semibold rounded-xl hover:bg-[#1a205c] transition disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <span className="text-sm text-gray-500 sm:whitespace-nowrap">
            {filteredTasks.length} task(s)
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
                    {!isHousekeeping && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Employee Name
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Task No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={isHousekeeping ? 6 : 7} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <p className="text-gray-500 font-medium">No cleaning tasks found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Try changing search or assign a task first
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTasks.map((task, index) => {
                      const assignedName = task?.assignedTo?.name || "Not Assigned";
                      const roomNumber =
                        task?.room?.roomNumber || task?.roomSnapshot?.roomNumber || "N/A";
                      const createdDate = task?.createdAt
                        ? task.createdAt.split("T")[0]
                        : "N/A";

                      return (
                        <tr key={task._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>

                          {!isHousekeeping && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                                  {(assignedName?.charAt(0) || "E").toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-800">{assignedName}</span>
                              </div>
                            </td>
                          )}

                          <td className="px-6 py-4 text-gray-700">{roomNumber}</td>
                          <td className="px-6 py-4 text-gray-700 font-medium">
                            {task?.taskNumber || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">{createdDate}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                                task?.status
                              )}`}
                            >
                              {task?.status}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {canStartTask(task) && (
                                <button
                                  onClick={() => handleStartTask(task)}
                                  disabled={actionLoadingId === task._id}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                >
                                  {actionLoadingId === task._id ? "Starting..." : "Start"}
                                </button>
                              )}

                              <button
                                onClick={() => handleSelectTask(task)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-600 hover:bg-emerald-50"
                              >
                                Select
                              </button>

                              <button
                                onClick={() => handleEdit(task)}
                                className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                                title="Edit"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>

                              {canCancelTask(task) && (
                                <button
                                  onClick={() => handleCancelTask(task)}
                                  disabled={actionLoadingId === task._id}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  {actionLoadingId === task._id ? "Cancelling..." : "Cancel"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {paginatedTasks.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No cleaning tasks found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try changing search or assign a task first
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedTasks.map((task) => {
                    const assignedName = task?.assignedTo?.name || "Not Assigned";
                    const roomNumber =
                      task?.room?.roomNumber || task?.roomSnapshot?.roomNumber || "N/A";
                    const createdDate = task?.createdAt
                      ? task.createdAt.split("T")[0]
                      : "N/A";

                    return (
                      <div key={task._id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                              {(assignedName?.charAt(0) || "E").toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              {!isHousekeeping && (
                                <p className="font-medium text-gray-800 truncate">
                                  {assignedName}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 truncate">Room: {roomNumber}</p>
                              <p className="text-xs text-gray-400 truncate">
                                {task?.taskNumber || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSelectTask(task)}
                              className="px-2 py-1 text-xs font-semibold rounded-lg text-emerald-600 hover:bg-emerald-50"
                            >
                              Select
                            </button>

                            <button
                              onClick={() => handleEdit(task)}
                              className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Date</p>
                            <p className="text-gray-700">{createdDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Status</p>
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                                task?.status
                              )}`}
                            >
                              {task?.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {canStartTask(task) && (
                            <button
                              onClick={() => handleStartTask(task)}
                              disabled={actionLoadingId === task._id}
                              className="px-3 py-2 text-xs font-semibold rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                            >
                              {actionLoadingId === task._id ? "Starting..." : "Start"}
                            </button>
                          )}

                          {canCancelTask(task) && (
                            <button
                              onClick={() => handleCancelTask(task)}
                              disabled={actionLoadingId === task._id}
                              className="px-3 py-2 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {actionLoadingId === task._id ? "Cancelling..." : "Cancel Task"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of{" "}
                  {filteredTasks.length}
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
        <EditTaskModal
          task={selectedTask}
          staffList={staffList}
          userRole={role}
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

export default Cleaning;