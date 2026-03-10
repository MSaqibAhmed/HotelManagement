import React from "react";
import image1 from "../../assets/about-img1.png";
import image2 from "../../assets/about-img2.png";
import image3 from "../../assets/about-img3.png";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const stats = [
  { num: "25k", label: "Happy Guests" },
  { num: "160", label: "Total Rooms" },
  { num: "28", label: "Awards Won" },
  { num: "100", label: "Staff Members" },
];

const About = () => {
  const { dark } = useTheme();
  const bg = dark ? "bg-[#111111]" : "bg-white";
  const text = dark ? "text-white" : "text-gray-900";
  const muted = dark ? "text-gray-400" : "text-gray-500";

  return (
    <section className={`py-20 px-6 ${bg}`}>
      <div className="max-w-6xl mx-auto">

        {/* Title centered */}
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-serif ${text}`}>
            LuxuryStay: Your Gateway<br />
            <span className="italic">To Serenity</span>
          </h2>
        </div>

        {/* Two column: text left, photos right */}
        <div className="grid md:grid-cols-2 gap-10 items-start mb-10">

          {/* Left: description + read more */}
          <div>
            <p className={`text-sm leading-relaxed ${muted}`}>
              Welcome to LuxuryStay, where comfort meets tranquility. Nestled in
              the heart of a bustling city, our hotel offers a peaceful retreat for
              both business and leisure travelers. With modern amenities and a warm,
              inviting atmosphere, we strive to make your stay unforgettable.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 mt-5 text-[#cbb19d] text-sm font-medium hover:gap-2.5 transition-all"
            >
              Read About Us <ArrowRight size={14} />
            </Link>
          </div>

          {/* Right: 2-photo grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden">
              <img src={image2} alt="Room" className="w-full h-44 object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden mt-6">
              <img src={image3} alt="Service" className="w-full h-44 object-cover" />
            </div>
          </div>
        </div>

        {/* Large bottom image */}
        <div className="rounded-2xl overflow-hidden mb-12">
          <img src={image1} alt="Pool" className="w-full h-52 md:h-64 object-cover" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-[#cbb19d] font-serif text-4xl md:text-5xl font-semibold">
                {s.num}
              </div>
              <div className={`text-xs mt-2 uppercase tracking-wide ${muted}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default About;
