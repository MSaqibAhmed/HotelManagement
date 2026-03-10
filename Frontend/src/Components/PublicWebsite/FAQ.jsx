import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const faqs = [
  { q: "What are the check-in and check-out times?", a: "Check-in begins at 3:00 PM and check-out is at 11:00 AM. Early check-in and late check-out can be requested based on availability." },
  { q: "Is breakfast included in the room rate?", a: "Select room packages include complimentary breakfast. Please check the room details or contact us for more information on your specific booking." },
  { q: "What is the cancellation policy?", a: "Most bookings offer free cancellation up to 24 hours before check-in. Specific policies vary by room type and rate. Please review your booking confirmation." },
  { q: "Is parking available at the hotel?", a: "Yes, we offer complimentary valet parking for all guests, as well as a self-parking garage on-site with 24/7 access." },
  { q: "Do you offer airport transfers?", a: "Absolutely. We offer private airport pickup and drop-off services. Please contact our concierge at least 24 hours in advance to arrange." },
  { q: "Are pets allowed?", a: "We welcome furry guests! Pets under 20 lbs are welcome with a small daily fee. Please notify us at time of booking." },
];

const FAQ = () => {
  const [open, setOpen] = useState(null);
  const { dark } = useTheme();

  return (
    <section className={`py-20 px-6 ${dark ? "bg-[#111111]" : "bg-white"}`}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">Got Questions?</p>
          <h2 className={`text-3xl md:text-4xl font-serif ${dark ? "text-white" : "text-gray-900"}`}>Frequently Asked</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className={`border rounded-xl overflow-hidden transition-all ${dark ? "border-gray-800 bg-[#1a1a1a]" : "border-gray-100 bg-[#faf8f6]"}`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className={`w-full flex items-center justify-between px-6 py-4 text-left ${dark ? "text-white" : "text-gray-800"}`}
              >
                <span className="font-medium text-sm md:text-base pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-[#cbb19d] flex-shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className={`px-6 pb-5 text-sm leading-relaxed ${dark ? "text-gray-400" : "text-gray-500"}`}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
