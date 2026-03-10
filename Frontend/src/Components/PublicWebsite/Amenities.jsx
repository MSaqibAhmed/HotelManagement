import React from "react";
import { Utensils, Wifi, WashingMachine, Waves, Car, Phone, Coffee, Dumbbell } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const amenities = [
  { icon: Utensils, label: "Room Service" },
  { icon: Wifi, label: "Free Wi-Fi" },
  { icon: WashingMachine, label: "Laundry" },
  { icon: Waves, label: "Pool & Spa" },
  { icon: Car, label: "Airport Pickup" },
  { icon: Phone, label: "Concierge" },
  { icon: Coffee, label: "Restaurant" },
  { icon: Dumbbell, label: "Fitness Center" },
];

const Amenities = () => {
  const { dark } = useTheme();
  return (
    <section className={`py-20 px-6 ${dark ? "bg-[#0f0f0f]" : "bg-[#faf8f6]"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">What We Offer</p>
          <h2 className={`text-3xl md:text-4xl font-serif ${dark ? "text-white" : "text-gray-900"}`}>Premium Amenities</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {amenities.map((a, i) => (
            <div key={i} className={`flex flex-col items-center gap-3 p-6 rounded-2xl border text-center transition-all hover:border-[#cbb19d]/50 hover:-translate-y-1 duration-300 ${dark ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-100"}`}>
              <div className="w-14 h-14 rounded-full bg-[#cbb19d]/10 flex items-center justify-center">
                <a.icon size={24} className="text-[#cbb19d]" />
              </div>
              <span className={`text-sm font-medium ${dark ? "text-gray-300" : "text-gray-700"}`}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Amenities;
