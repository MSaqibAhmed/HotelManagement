import React from "react";
import HeroImage from "../../assets/HeroSection.png";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";

const Hero = () => {
  return (
    <section className="w-full min-h-screen bg-white dark:bg-[#111111] flex justify-center items-center pt-16">
      <div className="relative w-full md:w-[90%] h-screen md:h-[88vh] md:mt-6 md:rounded-3xl overflow-hidden shadow-2xl">

        <img
          src={HeroImage}
          alt="Luxury Hotel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

        <div className="relative z-10 h-full flex items-center px-8 md:px-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_,i) => <Star key={i} size={12} className="text-[#cbb19d] fill-[#cbb19d]" />)}
              </div>
              <span className="text-white text-xs font-medium tracking-wide">5-Star Luxury Experience</span>
            </div>

            <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif leading-tight">
              Discover True <br />
              <span className="italic text-[#d6c3b3]">Hospitality</span> <br />
              & Luxury
            </h1>

            <p className="mt-6 text-white/80 text-base md:text-lg max-w-md leading-relaxed">
              A sanctuary of elegance where every detail is crafted for your comfort and delight.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/rooms"
                className="inline-flex items-center gap-2 bg-[#cbb19d] text-white px-8 py-3.5 rounded-full font-medium hover:bg-[#b89f8a] transition-all duration-300 shadow-lg shadow-[#cbb19d]/30"
              >
                Explore Rooms <ArrowRight size={18} />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 border border-white/50 text-white px-8 py-3.5 rounded-full font-medium hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                Register as Guest
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10">
          <div className="max-w-4xl mx-auto px-8 py-5 grid grid-cols-3 gap-4 text-center">
            {[["500+","Luxury Rooms"],["98%","Guest Satisfaction"],["24/7","Concierge Service"]].map(([num,label]) => (
              <div key={label}>
                <div className="text-white font-serif text-2xl font-semibold">{num}</div>
                <div className="text-white/60 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
