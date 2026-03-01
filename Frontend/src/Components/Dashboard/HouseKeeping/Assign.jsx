import React from "react";

const rooms = [
  { id: "101", status: "Booked" },
  { id: "102", status: "Booked" },
  { id: "103", status: "Ready" },
  { id: "104", status: "Ready" },
  { id: "105", status: "Booked" },
  { id: "106", status: "Booked" },
  { id: "107", status: "Ready" },
  { id: "108", status: "Ready" },
  { id: "B-1201", status: "Ready" },
  { id: "B-1202", status: "Ready" },
  { id: "B-1203", status: "Ready" },
  { id: "D-1201", status: "Ready" },
  { id: "E-1201", status: "Ready" },
  { id: "G-1201", status: "Ready" },
];

function Toggle() {
  return (
    <div className="w-8 h-4 bg-gray-300 rounded-full relative">
      <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 left-0.5" />
    </div>
  );
}

function Card({ id, status }) {
  return (
    <div className="border border-gray-200 rounded-md p-5 bg-gray-50 relative">
      <div className="absolute top-3 right-3">
        <Toggle />
      </div>

      <div className="text-center">
        <div className="text-purple-700 font-semibold text-sm">
          Room No. {id}
        </div>
        <div className="text-gray-700 text-xs mt-1">{status}</div>
      </div>
    </div>
  );
}

export default function RoomStatusPage() {
  return (
    <div className="p-4">
      {/* Box */}
      <div className="border border-gray-200 rounded-md p-4 bg-white">
        {/* Title */}
        <h2 className="font-semibold text-gray-800 mb-4">
          Assign House Keeping
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-xs text-gray-600">House Keeper</label>
            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1">
              <option>Choose...</option>
              <option>...</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">Room Type</label>
            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1">
              <option>Choose...</option>
              <option>Single Room</option>
              <option>Twin Room</option>
              <option>Twin Room</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">Status</label>
            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1">
              <option>Choose...</option>
              <option>Ready</option>
              <option>Booked</option>
              <option>Assign Clean</option>
              <option>Maintenance</option>
            </select>
          </div>
        </div>

        {/* Rooms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((r) => (
            <Card key={r.id} id={r.id} status={r.status} />
          ))}
        </div>

        {/* Button */}
        <div className="flex justify-end mt-5">
          <button className="bg-purple-700 text-white text-sm px-4 py-1.5 rounded">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
