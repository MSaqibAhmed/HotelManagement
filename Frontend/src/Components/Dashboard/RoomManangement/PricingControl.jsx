import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { LuPencilLine, LuSearch, LuX } from "react-icons/lu";

const THEME = "#d6c3b3";

const PricingControl = () => {
  const [query, setQuery] = useState("");

  const [pricingRows, setPricingRows] = useState([
    {
      id: 1,
      roomType: "Single Room",
      basePrice: 2500,
      weekendPrice: 2800,
      extraBedCharge: 500,
      seasonalRate: "Normal",
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: 2,
      roomType: "Standard Room",
      basePrice: 3000,
      weekendPrice: 3400,
      extraBedCharge: 700,
      seasonalRate: "Normal",
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: 3,
      roomType: "Family Room",
      basePrice: 4500,
      weekendPrice: 5000,
      extraBedCharge: 1000,
      seasonalRate: "Holiday",
      image:
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: 4,
      roomType: "Deluxe Suite",
      basePrice: 5500,
      weekendPrice: 6200,
      extraBedCharge: 1200,
      seasonalRate: "Premium",
      image:
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=300&q=80",
    },
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pricingRows;
    return pricingRows.filter((r) => r.roomType.toLowerCase().includes(q) || r.seasonalRate.toLowerCase().includes(q));
  }, [query, pricingRows]);

  const avgBase = Math.round(
    pricingRows.reduce((sum, r) => sum + r.basePrice, 0) / Math.max(pricingRows.length, 1)
  );
  const maxRate = Math.max(...pricingRows.map((r) => r.weekendPrice));
  const minRate = Math.min(...pricingRows.map((r) => r.basePrice));

  // Modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // row object
  const [form, setForm] = useState({
    basePrice: "",
    weekendPrice: "",
    extraBedCharge: "",
    seasonalRate: "Normal",
  });
  const [errors, setErrors] = useState({});

  const openModal = (row) => {
    setEditing(row);
    setForm({
      basePrice: String(row.basePrice),
      weekendPrice: String(row.weekendPrice),
      extraBedCharge: String(row.extraBedCharge),
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

    if (form.weekendPrice === "" || form.weekendPrice === null) e.weekendPrice = "Weekend price is required";
    else if (!Number.isFinite(weekend) || weekend <= 0) e.weekendPrice = "Weekend price must be greater than 0";

    if (form.extraBedCharge === "" || form.extraBedCharge === null) e.extraBedCharge = "Extra bed charge is required";
    else if (!Number.isFinite(extra) || extra < 0) e.extraBedCharge = "Extra bed charge cannot be negative";

    if (weekend < base) e.weekendPrice = "Weekend price should be >= base price";

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
    errors[field] ? <p className="text-xs text-red-500 mt-2 font-semibold">{errors[field]}</p> : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => {
      const c = { ...p };
      delete c[name];
      return c;
    });
  };

  const savePricing = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields!");
      return;
    }

    setPricingRows((prev) =>
      prev.map((r) =>
        r.id === editing.id
          ? {
              ...r,
              basePrice: Number(form.basePrice),
              weekendPrice: Number(form.weekendPrice),
              extraBedCharge: Number(form.extraBedCharge),
              seasonalRate: form.seasonalRate,
            }
          : r
      )
    );

    toast.success("Pricing updated (demo)");
    closeModal();
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Pricing Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update room category pricing (static now, backend later).
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
          <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: `${THEME}33`, borderColor: `${THEME}66` }}>
            <p className="text-sm text-gray-700">Pricing Status</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Stable</h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm font-semibold text-gray-500">Rows: {pricingRows.length}</div>
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
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <img src={item.image} alt={item.roomType} className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.roomType}</td>
                    <td className="px-6 py-4 font-mono">Rs {item.basePrice}</td>
                    <td className="px-6 py-4 font-mono">Rs {item.weekendPrice}</td>
                    <td className="px-6 py-4 font-mono">Rs {item.extraBedCharge}</td>
                    <td className="px-6 py-4">{item.seasonalRate}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openModal(item)}
                          className="px-4 py-2 rounded-xl font-semibold border inline-flex items-center gap-2 hover:bg-gray-50 transition"
                          style={{ backgroundColor: `${THEME}33`, borderColor: `${THEME}66` }}
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
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400 font-semibold">
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
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                    Update Pricing
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{editing.roomType}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  title="Close"
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
                      className="w-full sm:w-auto min-w-[170px] py-3 px-6 rounded-xl font-bold transition"
                      style={{ backgroundColor: THEME, color: "#111827" }}
                    >
                      Save Pricing
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