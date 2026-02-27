import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { LuPencilLine, LuSearch, LuX } from "react-icons/lu";
import api from "../../../api";

const THEME = "#d6c3b3";

const PricingControl = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // rooms from DB
  const [rooms, setRooms] = useState([]);

  // modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // { roomType, roomIds, basePrice, weekendPrice, extraBedCharge, seasonalRate, image, count }
  const [form, setForm] = useState({
    basePrice: "",
    weekendPrice: "",
    extraBedCharge: "",
    seasonalRate: "Normal",
  });
  const [errors, setErrors] = useState({});

  // ✅ Fetch rooms from DB
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/room/getroom");
      // backend returns {count, rooms} or maybe {rooms}
      const list = data?.rooms || [];
      setRooms(Array.isArray(list) ? list : []);
    } catch (err) {
      console.log("FETCH ROOMS ERROR:", err?.response || err);
      toast.error(err?.response?.data?.message || "Failed to fetch rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Build pricing rows grouped by roomType
  const pricingRows = useMemo(() => {
    const map = new Map();

    (rooms || []).forEach((r) => {
      const roomType = (r?.roomType || "Unknown").trim();
      if (!map.has(roomType)) {
        map.set(roomType, {
          key: roomType,
          roomType,
          roomIds: [],
          count: 0,

          basePrice: Number(r?.pricing?.basePrice || 0),
          weekendPrice: Number(r?.pricing?.weekendPrice || 0),
          extraBedCharge: Number(r?.pricing?.extraBedCharge || 0),
          seasonalRate: r?.pricing?.seasonalRate || "Normal",

          image:
            r?.coverImage?.url ||
            r?.galleryImages?.[0]?.url ||
            "https://via.placeholder.com/120x120?text=Room",
        });
      }

      const row = map.get(roomType);
      row.roomIds.push(r?._id);
      row.count += 1;

      // (optional) if different prices exist within same type,
      // we keep first one shown. You can change logic later.
      map.set(roomType, row);
    });

    return Array.from(map.values()).sort((a, b) => a.roomType.localeCompare(b.roomType));
  }, [rooms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pricingRows;
    return pricingRows.filter(
      (r) =>
        r.roomType.toLowerCase().includes(q) ||
        String(r.seasonalRate || "").toLowerCase().includes(q)
    );
  }, [query, pricingRows]);

  const avgBase = Math.round(
    pricingRows.reduce((sum, r) => sum + Number(r.basePrice || 0), 0) /
      Math.max(pricingRows.length, 1)
  );
  const maxRate = Math.max(0, ...pricingRows.map((r) => Number(r.weekendPrice || 0)));
  const minRate =
    pricingRows.length > 0
      ? Math.min(...pricingRows.map((r) => Number(r.basePrice || 0)))
      : 0;

  const openModal = (row) => {
    setEditing(row);
    setForm({
      basePrice: String(row.basePrice ?? ""),
      weekendPrice: String(row.weekendPrice ?? ""),
      extraBedCharge: String(row.extraBedCharge ?? ""),
      seasonalRate: row.seasonalRate || "Normal",
    });
    setErrors({});
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setErrors({});
  };

  const validate = () => {
    const e = {};
    const base = Number(form.basePrice);
    const weekend = Number(form.weekendPrice);
    const extra = Number(form.extraBedCharge);

    if (form.basePrice === "" || form.basePrice === null) e.basePrice = "Base price is required";
    else if (!Number.isFinite(base) || base <= 0) e.basePrice = "Base price must be greater than 0";

    if (form.weekendPrice === "" || form.weekendPrice === null)
      e.weekendPrice = "Weekend price is required";
    else if (!Number.isFinite(weekend) || weekend <= 0)
      e.weekendPrice = "Weekend price must be greater than 0";

    if (form.extraBedCharge === "" || form.extraBedCharge === null)
      e.extraBedCharge = "Extra bed charge is required";
    else if (!Number.isFinite(extra) || extra < 0)
      e.extraBedCharge = "Extra bed charge cannot be negative";

    if (Number.isFinite(base) && Number.isFinite(weekend) && weekend < base) {
      e.weekendPrice = "Weekend price should be >= base price";
    }

    if (!form.seasonalRate) e.seasonalRate = "Seasonal rate is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition ${
      errors[field]
        ? "border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:ring-2 focus:ring-[#1e266d]/10"
    }`;

  const errorText = (field) =>
    errors[field] ? (
      <p className="text-xs text-red-500 mt-2 font-semibold">{errors[field]}</p>
    ) : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => {
      const c = { ...p };
      delete c[name];
      return c;
    });
  };

  // ✅ Update pricing for ALL rooms of that roomType
  const savePricing = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields!");
      return;
    }

    if (!editing?.roomIds?.length) {
      toast.error("No rooms found for this type");
      return;
    }

    setLoading(true);
    try {
      // Backend update route uses multer fields middleware,
      // safest is sending FormData (multipart) even without files.
      const makePayload = () => {
        const fd = new FormData();
        fd.append("basePrice", String(Number(form.basePrice)));
        fd.append("weekendPrice", String(Number(form.weekendPrice)));
        fd.append("extraBedCharge", String(Number(form.extraBedCharge)));
        fd.append("seasonalRate", form.seasonalRate);
        // optional: if you want discount too, add a field in UI
        // fd.append("discountPercent", "0");
        return fd;
      };

      // update each room in that type
      await Promise.all(
        editing.roomIds.map((roomId) => api.put(`/room/updateroom/${roomId}`, makePayload()))
      );

      toast.success(`Pricing updated for ${editing.roomType} (${editing.roomIds.length} rooms)`);
      closeModal();
      await fetchRooms();
    } catch (err) {
      console.log("UPDATE PRICING ERROR:", err?.response || err);
      toast.error(err?.response?.data?.message || "Failed to update pricing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Pricing Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update room category pricing (connected to DB).
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Average Base Rate</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Rs {avgBase}</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Highest Weekend Rate</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Rs {maxRate}</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Lowest Base Rate</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Rs {minRate}</h2>
          </div>
          <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ backgroundColor: `${THEME}33`, borderColor: `${THEME}66` }}
          >
            <p className="text-sm text-gray-700">Pricing Rows</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-2">{pricingRows.length}</h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm font-semibold text-gray-500">
            Rows: {pricingRows.length} {loading ? "• Loading..." : ""}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={fetchRooms}
              className="px-4 py-2.5 rounded-xl border font-semibold hover:bg-gray-50 transition"
              style={{ backgroundColor: `${THEME}33`, borderColor: `${THEME}66` }}
              type="button"
              disabled={loading}
            >
              Refresh
            </button>

            <div className="relative w-full md:w-96">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search room type / seasonal..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1e266d]/10"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-gray-50 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Room Type</th>
                  <th className="px-6 py-4">Base Price</th>
                  <th className="px-6 py-4">Weekend Price</th>
                  <th className="px-6 py-4">Extra Bed</th>
                  <th className="px-6 py-4">Seasonal Rate</th>
                  <th className="px-6 py-4">Rooms</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map((item) => (
                  <tr key={item.key} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <img
                        src={item.image}
                        alt={item.roomType}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.roomType}</td>
                    <td className="px-6 py-4 font-mono">Rs {item.basePrice}</td>
                    <td className="px-6 py-4 font-mono">Rs {item.weekendPrice}</td>
                    <td className="px-6 py-4 font-mono">Rs {item.extraBedCharge}</td>
                    <td className="px-6 py-4">{item.seasonalRate}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{item.count}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openModal(item)}
                          className="px-4 py-2 rounded-xl font-semibold border inline-flex items-center gap-2 hover:bg-gray-50 transition"
                          style={{ backgroundColor: `${THEME}33`, borderColor: `${THEME}66` }}
                          type="button"
                        >
                          <LuPencilLine size={16} />
                          Update Pricing
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-400 font-semibold">
                      No results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* UPDATE MODAL */}
        {open && editing && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Update Pricing</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {editing.roomType} • {editing.count} rooms
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  title="Close"
                  type="button"
                >
                  <LuX size={18} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={savePricing} className="space-y-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={editing.image}
                      alt={editing.roomType}
                      className="w-20 h-20 rounded-2xl object-cover border border-gray-200"
                    />
                    <div>
                      <p className="text-sm text-gray-500">Current Base</p>
                      <p className="font-extrabold text-gray-900">Rs {editing.basePrice}</p>
                      <p className="text-sm text-gray-500 mt-2">Current Weekend</p>
                      <p className="font-extrabold text-gray-900">Rs {editing.weekendPrice}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Base Price (Rs) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        name="basePrice"
                        value={form.basePrice}
                        onChange={handleChange}
                        className={inputClass("basePrice")}
                      />
                      {errorText("basePrice")}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Weekend Price (Rs) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        name="weekendPrice"
                        value={form.weekendPrice}
                        onChange={handleChange}
                        className={inputClass("weekendPrice")}
                      />
                      {errorText("weekendPrice")}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Extra Bed Charge (Rs) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="extraBedCharge"
                        value={form.extraBedCharge}
                        onChange={handleChange}
                        className={inputClass("extraBedCharge")}
                      />
                      {errorText("extraBedCharge")}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Seasonal Rate *
                      </label>
                      <select
                        name="seasonalRate"
                        value={form.seasonalRate}
                        onChange={handleChange}
                        className={inputClass("seasonalRate")}
                      >
                        <option value="Normal">Normal</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Premium">Premium</option>
                        <option value="Off-Season">Off-Season</option>
                      </select>
                      {errorText("seasonalRate")}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto min-w-[170px] py-3 px-6 rounded-xl font-bold transition disabled:opacity-60"
                      style={{ backgroundColor: THEME, color: "#111827" }}
                    >
                      {loading ? "Saving..." : "Save Pricing"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingControl;