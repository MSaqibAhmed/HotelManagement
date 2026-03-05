import React, { useEffect, useMemo, useState } from "react";
import { FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const EditTaskModal = ({ task, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    empName: task?.empName || "",
    roomNumber: task?.roomNumber || "",
    date: task?.date ? task.date.split("T")[0] : "",
    status: task?.status || "Under Progress",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        empName: task.empName || "",
        roomNumber: task.roomNumber || "",
        date: task.date ? task.date.split("T")[0] : "",
        status: task.status || "Under Progress",
      });
    }
  }, [task]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put(`/housekeeping/cleaning-tasks/${task._id}`, formData);
      onSave(data.task);
      toast.success(data.message || "Task updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-[#1e266d] mb-6">Edit Cleaning Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Name</label>
            <input type="text" name="empName" value={formData.empName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number</label>
            <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none">
              <option value="Pending">Pending</option>
              <option value="Under Progress">Under Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-semibold hover:bg-black disabled:opacity-60">{loading ? "Updating..." : "Update"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Cleaning = () => {
  const [cleaningTasks, setCleaningTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 10;

  const fetchCleaningTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/housekeeping/cleaning-tasks");
      setCleaningTasks(data.tasks || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch cleaning tasks");
      setCleaningTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaningTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return cleaningTasks.filter(
      (task) =>
        task.empName?.toLowerCase().includes(q) ||
        task.roomNumber?.toLowerCase().includes(q) ||
        task.status?.toLowerCase().includes(q)
    );
  }, [cleaningTasks, searchTerm]);

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
    setCleaningTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleDelete = async (task) => {
    const ok = window.confirm(`Delete cleaning task for room ${task.roomNumber}?`);
    if (!ok) return;

    try {
      await api.delete(`/housekeeping/cleaning-tasks/${task._id}`);
      setCleaningTasks((prev) => prev.filter((t) => t._id !== task._id));
      toast.success("Cleaning task deleted successfully");
      setCurrentPage((prevPage) => {
        const newLength = filteredTasks.length - 1;
        const newTotalPages = Math.max(1, Math.ceil(newLength / itemsPerPage));
        return Math.min(prevPage, newTotalPages);
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "under progress": return "bg-amber-50 text-amber-700 border border-amber-100";
      case "pending": return "bg-gray-50 text-gray-700 border border-gray-100";
      default: return "bg-gray-50 text-gray-700 border border-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Room Cleaning List</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage room cleaning tasks</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by employee name, room number, or status..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
          </div>
          <span className="text-sm text-gray-500 sm:whitespace-nowrap">{filteredTasks.length} task(s)</span>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Employee Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedTasks.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-16"><div className="flex flex-col items-center"><p className="text-gray-500 font-medium">No cleaning tasks found</p><p className="text-sm text-gray-400 mt-1">Try changing search or add a new task</p></div></td></tr>
                  ) : (
                    paginatedTasks.map((task, index) => (
                      <tr key={task._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(task.empName?.charAt(0) || "E").toUpperCase()}</div>
                            <span className="font-medium text-gray-800">{task.empName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{task.roomNumber}</td>
                        <td className="px-6 py-4 text-gray-700">{task.date?.split("T")[0]}</td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(task.status)}`}>{task.status}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEdit(task)} className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg" title="Edit"><FaEdit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(task)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><FaTrash className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {paginatedTasks.length === 0 ? (
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No cleaning tasks found</p><p className="text-sm text-gray-400 mt-1">Try changing search or add a new task</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedTasks.map((task) => (
                    <div key={task._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(task.empName?.charAt(0) || "E").toUpperCase()}</div>
                          <div className="min-w-0"><p className="font-medium text-gray-800 truncate">{task.empName}</p><p className="text-sm text-gray-500 truncate">Room: {task.roomNumber}</p></div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleEdit(task)} className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg" title="Edit"><FaEdit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(task)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><FaTrash className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-gray-400 text-xs mb-1">Date</p><p className="text-gray-700">{task.date?.split("T")[0]}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Status</p><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(task.status)}`}>{task.status}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${currentPage === page ? "bg-[#1e1e1e] text-white" : "border border-gray-200 hover:bg-gray-50"}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && selectedTask && <EditTaskModal task={selectedTask} onClose={() => { setShowModal(false); setSelectedTask(null); }} onSave={handleSave} />}
    </div>
  );
};

export default Cleaning;
