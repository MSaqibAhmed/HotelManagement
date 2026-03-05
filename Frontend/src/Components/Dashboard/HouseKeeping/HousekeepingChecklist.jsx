import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const EditChecklistModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    checkPoint: item?.checkPoint || "",
    type: item?.type || "House Keeper",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        checkPoint: item.checkPoint || "",
        type: item.type || "House Keeper",
      });
    }
  }, [item]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put(`/housekeeping/checklist/${item._id}`, formData);
      onSave(data.item);
      toast.success(data.message || "Checklist item updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update checklist item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-[#1e266d] mb-6">Edit Checklist Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check Point</label>
            <input type="text" name="checkPoint" value={formData.checkPoint} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none">
              <option value="House Keeper">House Keeper</option>
              <option value="Laundry">Laundry</option>
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

const HousekeepingChecklist = () => {
  const [checklist, setChecklist] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 10;

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/housekeeping/checklist");
      setChecklist(data.checklist || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch checklist");
      setChecklist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, []);

  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return checklist.filter((item) => {
      const matchesSearch = item.checkPoint?.toLowerCase().includes(q) || item.type?.toLowerCase().includes(q);
      const matchesType = typeFilter ? item.type === typeFilter : true;
      return matchesSearch && matchesType;
    });
  }, [checklist, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleSave = (updatedItem) => {
    setChecklist((prev) => prev.map((i) => (i._id === updatedItem._id ? updatedItem : i)));
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`Delete "${item.checkPoint}" from checklist?`);
    if (!ok) return;

    try {
      await api.delete(`/housekeeping/checklist/${item._id}`);
      setChecklist((prev) => prev.filter((i) => i._id !== item._id));
      toast.success("Checklist item deleted successfully");
      setCurrentPage((prevPage) => {
        const newLength = filteredData.length - 1;
        const newTotalPages = Math.max(1, Math.ceil(newLength / itemsPerPage));
        return Math.min(prevPage, newTotalPages);
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const getTypeClasses = (type) => {
    switch (type?.toLowerCase()) {
      case "laundry": return "bg-blue-50 text-blue-700 border border-blue-100";
      case "house keeper": return "bg-purple-50 text-purple-700 border border-purple-100";
      default: return "bg-gray-50 text-gray-700 border border-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Housekeeping Checklist</h1>
          <p className="text-sm text-gray-500 mt-1">Manage cleaning and maintenance check points</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto">
          <FaPlus className="w-4 h-4" />
          Add Checklist
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Filter by Type</label>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10">
              <option value="">All Types</option>
              <option value="Laundry">Laundry</option>
              <option value="House Keeper">House Keeper</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search check points..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
            </div>
          </div>
          <span className="text-sm text-gray-500 sm:whitespace-nowrap self-end">{filteredData.length} item(s)</span>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Check Point</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-16"><div className="flex flex-col items-center"><p className="text-gray-500 font-medium">No checklist items found</p><p className="text-sm text-gray-400 mt-1">Try changing filters or add a new checklist item</p></div></td></tr>
                  ) : (
                    paginatedData.map((item, index) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{item.checkPoint}</td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getTypeClasses(item.type)}`}>{item.type}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEdit(item)} className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg" title="Edit"><FaEdit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(item)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><FaTrash className="w-4 h-4" /></button>
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
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No checklist items found</p><p className="text-sm text-gray-400 mt-1">Try changing filters or add a new checklist item</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedData.map((item) => (
                    <div key={item._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 truncate">{item.checkPoint}</p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-2 ${getTypeClasses(item.type)}`}>{item.type}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleEdit(item)} className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg" title="Edit"><FaEdit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(item)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><FaTrash className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}</p>
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

      {showModal && selectedItem && <EditChecklistModal item={selectedItem} onClose={() => { setShowModal(false); setSelectedItem(null); }} onSave={handleSave} />}
    </div>
  );
};

export default HousekeepingChecklist;
