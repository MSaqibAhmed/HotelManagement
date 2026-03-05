import React, { useEffect, useMemo, useState } from "react";
import { FaSearch, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const RoomQRList = () => {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [floorFilter, setFloorFilter] = useState("");

  const itemsPerPage = 12;

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/room/getroom");
      setRooms(data.rooms || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const floors = useMemo(() => {
    const uniqueFloors = [...new Set(rooms.map((r) => r.floor).filter(Boolean))];
    return uniqueFloors.sort((a, b) => a - b);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return rooms.filter((room) => {
      const matchesSearch = room.roomNumber?.toLowerCase().includes(q) || room.roomType?.toLowerCase().includes(q);
      const matchesFloor = floorFilter ? String(room.floor) === String(floorFilter) : true;
      return matchesSearch && matchesFloor;
    });
  }, [rooms, searchTerm, floorFilter]);

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRooms.slice(start, start + itemsPerPage);
  }, [filteredRooms, currentPage]);

  const getQRCodeUrl = (roomNumber) => {
    const data = encodeURIComponent(JSON.stringify({ roomNumber }));
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}`;
  };

  const handleDownload = (room) => {
    toast.success(`QR code for Room ${room.roomNumber} downloaded`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Room QR List</h1>
        <p className="text-sm text-gray-500 mt-1">View and download QR codes for room identification</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Filter by Floor</label>
            <select value={floorFilter} onChange={(e) => { setFloorFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10">
              <option value="">All Floors</option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>Floor {floor}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search room number or type..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
            </div>
          </div>
          <span className="text-sm text-gray-500 sm:whitespace-nowrap self-end">{filteredRooms.length} room(s)</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">No rooms found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedRooms.map((room) => (
                <div key={room._id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center shadow-sm hover:shadow-lg transition-shadow group">
                  <div className="w-full aspect-square bg-gray-50 flex items-center justify-center border border-gray-100 rounded-xl mb-4 p-4 group-hover:border-[#1e266d]/20 transition-colors">
                    <img src={getQRCodeUrl(room.roomNumber)} alt={`QR Code for Room ${room.roomNumber}`} className="w-full h-full object-contain mix-blend-multiply" loading="lazy" />
                  </div>
                  <div className="text-center w-full">
                    <div className="text-[#1e266d] font-bold text-sm mb-1">Room No. {room.roomNumber}</div>
                    {room.roomType && <div className="text-xs text-gray-500 mb-3">{room.roomType}</div>}
                    {room.floor && <div className="text-xs text-gray-400 mb-3">Floor {room.floor}</div>}
                    <button onClick={() => handleDownload(room)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1e266d] text-white text-xs font-semibold rounded-lg hover:bg-[#1a205c] transition">
                      <FaDownload className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRooms.length)} of {filteredRooms.length}</p>
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
    </div>
  );
};

export default RoomQRList;
