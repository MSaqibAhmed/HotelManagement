import React from "react";
import { useTheme } from "../../context/ThemeContext";
import CheckAvailability from "../../Components/PublicWebsite/CheckAvailability";
import RoomsGrid from "../../Components/PublicWebsite/RoomsGrid";

import AnimatedSection from "../../Components/AnimatedSection";

const RoomsPage = () => {
  const { dark } = useTheme();

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 ${dark ? "bg-[#111111]" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <AnimatedSection animation="fade-up">
          <div className="mb-10">
            <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-1">Our Rooms</p>
            <h1 className={`text-4xl font-serif ${dark ? "text-white" : "text-gray-900"}`}>
              Find Your Perfect Room
            </h1>
          </div>
        </AnimatedSection>

        {/* Check Availability */}
        <AnimatedSection animation="fade-up" delay={0.2}>
          <div className="mb-10">
            <CheckAvailability />
          </div>
        </AnimatedSection>

        {/* Rooms grid + filters */}
        <AnimatedSection animation="fade-up" delay={0.4}>
          <RoomsGrid />
        </AnimatedSection>

      </div>
    </div>
  );
};

export default RoomsPage;
