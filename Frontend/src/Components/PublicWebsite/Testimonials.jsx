import React from "react";
import { Star } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const testimonials = [
  { name: "Sarah Mitchell", role: "Business Traveler", stars: 5, comment: "An absolutely stunning experience. The staff went above and beyond to make my stay memorable. The room was immaculate and the service was world-class." },
  { name: "James Thornton", role: "Honeymoon Guest", stars: 5, comment: "We chose LuxuryStay for our honeymoon and it was perfect. The attention to detail, the beautiful rooms, and the spectacular views made it unforgettable." },
  { name: "Priya Sharma", role: "Family Vacation", stars: 5, comment: "Traveling with kids can be stressful but the team made everything seamless. The family suite was spacious and the amenities kept everyone happy." },
];

const Testimonials = () => {
  const { dark } = useTheme();
  return (
    <section className={`py-20 px-6 ${dark ? "bg-[#111111]" : "bg-white"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">Guest Stories</p>
          <h2 className={`text-3xl md:text-4xl font-serif ${dark ? "text-white" : "text-gray-900"}`}>What Our Guests Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {testimonials.map((t, i) => (
            <div key={i} className={`p-7 rounded-2xl border ${dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100"}`}>
              <div className="flex gap-1 mb-4">
                {[...Array(t.stars)].map((_,j) => <Star key={j} size={14} className="text-[#cbb19d] fill-[#cbb19d]" />)}
              </div>
              <p className={`text-sm leading-relaxed mb-6 ${dark ? "text-gray-300" : "text-gray-600"}`}>"{t.comment}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#cbb19d]/20 flex items-center justify-center">
                  <span className="text-[#cbb19d] font-semibold text-sm">{t.name[0]}</span>
                </div>
                <div>
                  <div className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{t.name}</div>
                  <div className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
