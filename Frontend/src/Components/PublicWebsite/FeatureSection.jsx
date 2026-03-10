import React from "react";
import { ShieldCheck, BadgeCheck, CalendarCheck, Headphones, Wifi, Car } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const features = [
  { icon: ShieldCheck, title: "Verified Hotel", desc: "Every property is verified for quality, cleanliness & safety standards." },
  { icon: BadgeCheck, title: "Best Price Guarantee", desc: "Found a lower price? We'll match it plus give you 10% off your stay." },
  { icon: CalendarCheck, title: "Flexible Cancellation", desc: "Free cancellation on most bookings up to 24 hours before check-in." },
  { icon: Headphones, title: "24/7 Support", desc: "Round-the-clock concierge assistance for all your needs." },
];

const FeatureSection = () => {
  const { dark } = useTheme();
  return (
    <section className={`py-16 ${dark ? "bg-[#0f0f0f]" : "bg-[#faf8f6]"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, index) => (
            <div
              key={index}
              className={`rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                dark
                  ? "bg-[#1a1a1a] border-gray-800 hover:border-[#cbb19d]/30"
                  : "bg-white border-[#e8dfd7] hover:shadow-[#cbb19d]/10"
              }`}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#cbb19d]/15 text-[#cbb19d] mb-5">
                <item.icon size={22} />
              </div>
              <h3 className={`text-base font-semibold mb-2 ${dark ? "text-white" : "text-gray-800"}`}>{item.title}</h3>
              <p className={`text-sm leading-relaxed ${dark ? "text-gray-400" : "text-gray-500"}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
