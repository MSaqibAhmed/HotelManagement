import React, { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const initialFormData = {
  summary: "",
  linenChanged: false,
  washroomCleaned: false,
  floorCleaned: false,
  amenitiesRestocked: false,
  minibarChecked: false,
  damageFound: false,
  damageNote: "",
  lostAndFound: false,
  lostAndFoundNote: "",
  markIssueReported: false,
  issueType: "",
  issueDescription: "",
};

const CleaningReport = () => {
  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const isHousekeeping = role === "housekeeping";

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(initialFormData);

  const itemsPerPage = 10;

  const fetchReport = async () => {
    try {
      setLoading(true);

      const endpoint = isHousekeeping
        ? "/housekeeping/tasks/my"
        : "/housekeeping/tasks";

      const { data } = await api.get(endpoint);
      const list = data?.tasks || [];

      setTasks(list);

      if (isHousekeeping) {
        const selectedTaskId =
          localStorage.getItem("selectedHousekeepingTaskId") || "";

        if (selectedTaskId) {
          const foundTask = list.find((task) => task._id === selectedTaskId);
          setSelectedTask(foundTask || null);
        } else {
          setSelectedTask(null);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch cleaning report");
      setTasks([]);
      setSelectedTask(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [isHousekeeping]);

  useEffect(() => {
    if (!selectedTask) {
      setFormData(initialFormData);
      return;
    }

    setFormData({
      summary: selectedTask?.report?.summary || "",
      linenChanged: !!selectedTask?.report?.linenChanged,
      washroomCleaned: !!selectedTask?.report?.washroomCleaned,
      floorCleaned: !!selectedTask?.report?.floorCleaned,
      amenitiesRestocked: !!selectedTask?.report?.amenitiesRestocked,
      minibarChecked: !!selectedTask?.report?.minibarChecked,
      damageFound: !!selectedTask?.report?.damageFound,
      damageNote: selectedTask?.report?.damageNote || "",
      lostAndFound: !!selectedTask?.report?.lostAndFound,
      lostAndFoundNote: selectedTask?.report?.lostAndFoundNote || "",
      markIssueReported: selectedTask?.status === "IssueReported",
      issueType: selectedTask?.issue?.issueType || "",
      issueDescription: selectedTask?.issue?.description || "",
    });
  }, [selectedTask]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!selectedTask?._id) {
      toast.error("Please select a task first from cleaning page");
      return;
    }

    try {
      setSubmitting(true);

      const { data } = await api.patch(
        `/housekeeping/tasks/${selectedTask._id}/report`,
        formData
      );

      const updatedTask = data?.task || null;

      setSelectedTask(updatedTask);
      setTasks((prev) =>
        prev.map((task) => (task._id === selectedTask._id ? updatedTask : task))
      );

      toast.success(data?.message || "Cleaning report submitted successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit cleaning report");
    } finally {
      setSubmitting(false);
    }
  };

  const summaryData = useMemo(() => {
    const map = new Map();

    tasks.forEach((task) => {
      const assignedUser = task?.assignedTo;
      if (!assignedUser?._id) return;

      const employeeId = assignedUser._id;
      const empName = assignedUser.name || "Unknown";

      if (!map.has(employeeId)) {
        map.set(employeeId, {
          employeeId,
          empName,
          completed: 0,
          pending: 0,
          underProcess: 0,
        });
      }

      const row = map.get(employeeId);
      const status = String(task?.status || "");

      if (status === "InProgress") {
        row.underProcess += 1;
      } else if (status === "Pending" || status === "Assigned") {
        row.pending += 1;
      } else if (
        status === "Completed" ||
        status === "Verified" ||
        status === "IssueReported"
      ) {
        row.completed += 1;
      }
    });

    return Array.from(map.values());
  }, [tasks]);

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return summaryData.filter(
      (item) =>
        item.empName?.toLowerCase().includes(q) ||
        item.employeeId?.toLowerCase().includes(q)
    );
  }, [summaryData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  if (isHousekeeping) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Cleaning Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit final report for selected cleaning task
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
            </div>
          ) : !selectedTask ? (
            <div className="text-center py-20">
              <p className="text-gray-500 font-medium">No task selected</p>
              <p className="text-sm text-gray-400 mt-1">
                Pehlay Cleaning page se task select karo
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1e266d]">
                  {selectedTask?.taskNumber || "Selected Task"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Room No.{" "}
                  {selectedTask?.room?.roomNumber ||
                    selectedTask?.roomSnapshot?.roomNumber ||
                    "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Write cleaning summary..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ["linenChanged", "Linen Changed"],
                  ["washroomCleaned", "Washroom Cleaned"],
                  ["floorCleaned", "Floor Cleaned"],
                  ["amenitiesRestocked", "Amenities Restocked"],
                  ["minibarChecked", "Minibar Checked"],
                  ["damageFound", "Damage Found"],
                  ["lostAndFound", "Lost & Found"],
                  ["markIssueReported", "Mark Issue Reported"],
                ].map(([name, label]) => (
                  <label
                    key={name}
                    className="flex items-center gap-3 border border-gray-200 rounded-xl p-3"
                  >
                    <input
                      type="checkbox"
                      name={name}
                      checked={formData[name]}
                      onChange={handleChange}
                      className="h-4 w-4 accent-[#1e266d]"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              {formData.damageFound && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Damage Note
                  </label>
                  <input
                    type="text"
                    name="damageNote"
                    value={formData.damageNote}
                    onChange={handleChange}
                    placeholder="Enter damage note..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                  />
                </div>
              )}

              {formData.lostAndFound && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lost & Found Note
                  </label>
                  <input
                    type="text"
                    name="lostAndFoundNote"
                    value={formData.lostAndFoundNote}
                    onChange={handleChange}
                    placeholder="Enter lost and found note..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                  />
                </div>
              )}

              {formData.markIssueReported && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Issue Type
                    </label>
                    <input
                      type="text"
                      name="issueType"
                      value={formData.issueType}
                      onChange={handleChange}
                      placeholder="Enter issue type..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Issue Description
                    </label>
                    <input
                      type="text"
                      name="issueDescription"
                      value={formData.issueDescription}
                      onChange={handleChange}
                      placeholder="Enter issue description..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-semibold hover:bg-black disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Cleaning Report</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of housekeeping task completion
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-4 py-2.5 bg-[#1e266d] text-white text-sm font-semibold rounded-xl hover:bg-[#1a205c] transition disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <span className="text-sm text-gray-500 sm:whitespace-nowrap">
            {filteredData.length} employee(s)
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Employee Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Complete
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Pending
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Under Process
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Completion Rate
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <p className="text-gray-500 font-medium">No report data found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Data will appear once tasks are assigned
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row) => {
                      const total = row.completed + row.pending + row.underProcess;
                      const rate = total > 0 ? Math.round((row.completed / total) * 100) : 0;

                      return (
                        <tr key={row.employeeId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-700">
                            {row.employeeId.slice(-6).toUpperCase()}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                                {(row.empName?.charAt(0) || "E").toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-800">{row.empName}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {row.completed}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
                              {row.pending}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                              {row.underProcess}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {rate}%
                              </span>
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
              {paginatedData.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No report data found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Data will appear once tasks are assigned
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedData.map((row) => {
                    const total = row.completed + row.pending + row.underProcess;
                    const rate = total > 0 ? Math.round((row.completed / total) * 100) : 0;

                    return (
                      <div key={row.employeeId} className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                            {(row.empName?.charAt(0) || "E").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{row.empName}</p>
                            <p className="text-sm text-gray-500">
                              ID: {row.employeeId.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">Complete</p>
                            <p className="text-emerald-600 font-semibold">{row.completed}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">Pending</p>
                            <p className="text-gray-600 font-semibold">{row.pending}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">In Progress</p>
                            <p className="text-amber-600 font-semibold">{row.underProcess}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400 text-xs mb-1">Rate</p>
                            <p className="text-[#1e266d] font-semibold">{rate}%</p>
                          </div>
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
    </div>
  );
};

export default CleaningReport;