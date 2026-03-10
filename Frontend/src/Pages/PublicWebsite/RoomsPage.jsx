import React from "react";
import { useTheme } from "../../context/ThemeContext";
import CheckAvailability from "../../Components/PublicWebsite/CheckAvailability";
import RoomsGrid from "../../Components/PublicWebsite/RoomsGrid";

const RoomsPage = () => {
  const { dark } = useTheme();

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 ${dark ? "bg-[#111111]" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-1">Our Rooms</p>
          <h1 className={`text-4xl font-serif ${dark ? "text-white" : "text-gray-900"}`}>
            Find Your Perfect Room
          </h1>
        </div>

        {/* Check Availability */}
        <div className="mb-10">
          <CheckAvailability />
        </div>

        {/* Rooms grid + filters */}
        <RoomsGrid />

      </div>
    </div>
  );
};

export default RoomsPage;
