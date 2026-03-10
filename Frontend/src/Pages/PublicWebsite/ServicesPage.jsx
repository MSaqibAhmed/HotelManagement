import React from "react";
import { Utensils, WashingMachine, AlarmClock, UtensilsCrossed, Wrench, Car, Waves, Dumbbell, Wifi, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const services = [
  { icon: Utensils, title: "Room Service", desc: "24-hour in-room dining with an extensive menu crafted by our executive chef. Enjoy gourmet meals delivered to your door.", color: "from-orange-50 to-amber-50", iconBg: "bg-orange-100", iconColor: "text-orange-500" },
  { icon: WashingMachine, title: "Laundry & Dry Cleaning", desc: "Same-day laundry and professional dry cleaning services available for all guests. Express service available.", color: "from-blue-50 to-cyan-50", iconBg: "bg-blue-100", iconColor: "text-blue-500" },
  { icon: AlarmClock, title: "Wake-up Call", desc: "Never miss an important meeting or flight. Our friendly staff will give you a personalized wake-up call.", color: "from-purple-50 to-violet-50", iconBg: "bg-purple-100", iconColor: "text-purple-500" },
  { icon: UtensilsCrossed, title: "Fine Dining Restaurant", desc: "Experience culinary excellence at our signature restaurant serving international and local cuisine.", color: "from-green-50 to-emerald-50", iconBg: "bg-green-100", iconColor: "text-green-500" },
  { icon: Wrench, title: "Maintenance", desc: "Prompt maintenance support for any in-room issues. Submit requests via our app or front desk.", color: "from-gray-50 to-slate-50", iconBg: "bg-gray-100", iconColor: "text-gray-500" },
  { icon: Car, title: "Airport Transfers", desc: "Comfortable and reliable airport pickup and drop-off with professional drivers and premium vehicles.", color: "from-yellow-50 to-amber-50", iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
  { icon: Waves, title: "Spa & Pool", desc: "Rejuvenate at our world-class spa and temperature-controlled infinity pool with stunning views.", color: "from-teal-50 to-cyan-50", iconBg: "bg-teal-100", iconColor: "text-teal-500" },
  { icon: Dumbbell, title: "Fitness Center", desc: "State-of-the-art gym open 24/7 with modern equipment and personal trainer sessions available.", color: "from-red-50 to-rose-50", iconBg: "bg-red-100", iconColor: "text-red-500" },
  { icon: Phone, title: "Concierge", desc: "Your personal concierge handles reservations, recommendations and arrangements to make your stay seamless.", color: "from-indigo-50 to-blue-50", iconBg: "bg-indigo-100", iconColor: "text-indigo-500" },
];

const ServicesPage = () => {
  const { dark } = useTheme();
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const text = dark ? "text-white" : "text-gray-900";

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 ${dark ? "bg-[#111111]" : "bg-white"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">What We Offer</p>
          <h1 className={`text-4xl md:text-5xl font-serif ${text}`}>Our Premium Services</h1>
          <p className={`mt-4 text-sm max-w-xl mx-auto ${muted}`}>
            From fine dining to wellness retreats, every service at LuxuryStay is crafted to exceed your expectations.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {services.map((s, i) => (
            <div key={i} className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
              dark ? "bg-[#1a1a1a] border-gray-800 hover:border-[#cbb19d]/30" : "bg-white border-gray-100"
            }`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${dark ? "bg-[#cbb19d]/10" : s.iconBg}`}>
                <s.icon size={24} className={dark ? "text-[#cbb19d]" : s.iconColor} />
              </div>
              <h3 className={`font-serif text-lg font-semibold mb-2 ${text}`}>{s.title}</h3>
              <p className={`text-sm leading-relaxed ${muted}`}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className={`rounded-3xl p-10 md:p-14 text-center border ${dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100"}`}>
          <h2 className={`text-2xl md:text-3xl font-serif mb-3 ${text}`}>Ready to Experience Luxury?</h2>
          <p className={`text-sm max-w-md mx-auto mb-8 ${muted}`}>Register or login to request services and book your stay with us.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="bg-[#cbb19d] text-white px-8 py-3 rounded-full font-medium hover:bg-[#b89f8a] transition-all">
              Register Now
            </Link>
            <Link to="/login" className={`px-8 py-3 rounded-full font-medium border transition-all ${dark ? "border-gray-700 text-gray-300 hover:border-[#cbb19d] hover:text-[#cbb19d]" : "border-gray-300 text-gray-700 hover:border-[#cbb19d]"}`}>
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
