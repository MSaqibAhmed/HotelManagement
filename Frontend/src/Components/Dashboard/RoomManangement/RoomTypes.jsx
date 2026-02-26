import React from "react";
import { LuPlus, LuPencilLine, LuTrash2 } from "react-icons/lu";

const THEME = "#d6c3b3";

const RoomTypes = () => {
  const roomTypes = [
    {
      id: 1,
      name: "Single Room",
      capacity: 1,
      basePrice: 2500,
      beds: "1 Single Bed",
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 2,
      name: "Standard Room",
      capacity: 2,
      basePrice: 3000,
      beds: "1 Standard Queen",
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 3,
      name: "Family Room",
      capacity: 4,
      basePrice: 4500,
      beds: "2 Queen Beds",
      image:
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 4,
      name: "Deluxe Suite",
      capacity: 3,
      basePrice: 5500,
      beds: "1 Luxury King",
      image:
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Room Types</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage public booking room categories and their visuals.
            </p>
          </div>

          <button
            className="px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm border transition"
            style={{ backgroundColor: THEME, borderColor: `${THEME}66`, color: "#111827" }}
          >
            <LuPlus size={18} />
            Add Type
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {roomTypes.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">{item.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">Capacity: {item.capacity} Guests</p>
                  </div>
                  <div
                    className="px-3 py-1 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: `${THEME}33`, color: "#111827" }}
                  >
                    Type #{item.id}
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold text-gray-800">Base Price:</span> Rs {item.basePrice}</p>
                  <p><span className="font-semibold text-gray-800">Beds:</span> {item.beds}</p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button className="text-gray-400 hover:text-gray-900 transition">
                    <LuPencilLine size={18} />
                  </button>
                  <button className="text-gray-400 hover:text-rose-600 transition">
                    <LuTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomTypes;