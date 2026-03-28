import React, { useRef } from "react";
import image1 from "../../assets/about-img1.png";
import image2 from "../../assets/about-img2.png";
import image3 from "../../assets/about-img3.png";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%", toggleActions: "play none none none" }
    });

    tl.fromTo(".about-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" })
      .fromTo(".about-text", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, "-=0.3")
      .fromTo(".about-img", { opacity: 0, scale: 0.92, clipPath: "inset(10% 0 10% 0)" },
        { opacity: 1, scale: 1, clipPath: "inset(0% 0 0% 0)", duration: 0.8, stagger: 0.15, ease: "power3.out" }, "-=0.4")
      .fromTo(".about-stat", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" }, "-=0.3");
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={`py-20 px-6 ${bg}`}>
      <div className="max-w-6xl mx-auto">

        <div className="about-title text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-serif ${text}`}>
            LuxuryStay: Your Gateway<br />
            <span className="italic">To Serenity</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start mb-10">

          <div className="about-text">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="about-img rounded-2xl overflow-hidden">
              <img src={image2} alt="Room" className="w-full h-44 object-cover" />
            </div>
            <div className="about-img rounded-2xl overflow-hidden mt-6">
              <img src={image3} alt="Service" className="w-full h-44 object-cover" />
            </div>
          </div>
        </div>

        <div className="about-img rounded-2xl overflow-hidden mb-12">
          <img src={image1} alt="Pool" className="w-full h-52 md:h-64 object-cover" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label} className="about-stat">
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
