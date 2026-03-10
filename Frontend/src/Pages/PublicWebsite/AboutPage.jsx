import React from "react";
import image1 from "../../assets/about-img1.png";
import image2 from "../../assets/about-img2.png";
import image3 from "../../assets/about-img3.png";
import { Heart, Sparkles, Shield, Award } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const values = [
  { icon: Heart, title: "Warm Hospitality", desc: "Every guest is treated like family. Our staff goes above and beyond to ensure your comfort and happiness." },
  { icon: Sparkles, title: "Immaculate Cleanliness", desc: "We maintain the highest standards of hygiene and cleanliness across all rooms and facilities." },
  { icon: Shield, title: "Safety & Security", desc: "Your safety is our top priority. We implement the latest security measures to ensure your peace of mind." },
  { icon: Award, title: "Award-Winning Service", desc: "Recognized globally for our exceptional service standards and commitment to guest satisfaction." },
];

const team = [
  { name: "Alexandra Reed", role: "General Manager", initial: "A" },
  { name: "Marco Bianchi", role: "Head Chef", initial: "M" },
  { name: "Priya Nair", role: "Guest Relations", initial: "P" },
  { name: "James Chen", role: "Concierge Director", initial: "J" },
];

const AboutPage = () => {
  const { dark } = useTheme();
  const bg = dark ? "bg-[#111111]" : "bg-white";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const text = dark ? "text-white" : "text-gray-900";
  const card = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";

  return (
    <div className={`min-h-screen pt-24 pb-20 ${bg}`}>
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 mb-20">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-3">Our Story</p>
            <h1 className={`text-4xl md:text-5xl font-serif leading-tight ${text}`}>
              A Legacy of <br /> <span className="italic text-[#cbb19d]">Excellence</span>
            </h1>
            <p className={`mt-6 leading-relaxed text-sm ${muted}`}>
              Founded in 1985, LuxuryStay began as a small boutique hotel with a single vision: to create spaces where guests feel truly at home. Over four decades, we've grown into a landmark of hospitality.
            </p>
            <p className={`mt-4 leading-relaxed text-sm ${muted}`}>
              Today, our hotel stands as a testament to unwavering commitment to quality. With over 500 rooms, world-class dining, and personalized concierge services, we continue to redefine what luxury means.
            </p>
            <div className="grid grid-cols-3 gap-6 mt-8">
              {[["40+","Years of Service"],["500+","Rooms"],["98%","Guest Satisfaction"]].map(([n,l]) => (
                <div key={l} className="text-center">
                  <div className="text-[#cbb19d] font-serif text-3xl font-semibold">{n}</div>
                  <div className={`text-xs mt-1 ${muted}`}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src={image2} alt="Hotel Interior" className="w-full h-56 object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg mt-8">
              <img src={image3} alt="Hotel Service" className="w-full h-56 object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className={`py-20 px-6 ${dark ? "bg-[#0f0f0f]" : "bg-[#faf8f6]"}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">What We Stand For</p>
            <h2 className={`text-3xl md:text-4xl font-serif ${text}`}>Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${dark ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-100"}`}>
                <div className="w-12 h-12 rounded-full bg-[#cbb19d]/10 flex items-center justify-center mb-4">
                  <v.icon size={20} className="text-[#cbb19d]" />
                </div>
                <h3 className={`font-semibold mb-2 ${text}`}>{v.title}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Facilities */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">Our Facilities</p>
          <h2 className={`text-3xl md:text-4xl font-serif ${text}`}>World-Class Facilities</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl overflow-hidden shadow-md col-span-2 row-span-1">
            <img src={image1} alt="Pool" className="w-full h-60 object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-md">
            <img src={image2} alt="Room" className="w-full h-60 object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-md">
            <img src={image3} alt="Service" className="w-full h-48 object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-md col-span-2">
            <img src={image1} alt="Lounge" className="w-full h-48 object-cover" />
          </div>
        </div>
      </div>

      {/* Team */}
      <div className={`py-20 px-6 ${dark ? "bg-[#0f0f0f]" : "bg-[#faf8f6]"}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">Behind The Scenes</p>
            <h2 className={`text-3xl md:text-4xl font-serif ${text}`}>Meet Our Team</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div key={i} className={`text-center p-6 rounded-2xl border ${dark ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-100"}`}>
                <div className="w-16 h-16 rounded-full bg-[#cbb19d]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#cbb19d] font-serif text-2xl font-semibold">{member.initial}</span>
                </div>
                <div className={`font-semibold text-sm ${text}`}>{member.name}</div>
                <div className={`text-xs mt-1 ${muted}`}>{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
