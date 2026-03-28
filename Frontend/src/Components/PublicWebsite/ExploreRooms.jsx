import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import RoomCard from "./RoomCard";
import api from "../../api";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const ExploreRooms = () => {
  const { dark } = useTheme();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get("/room/public/getrooms");
        const sorted = (data.rooms || []).sort((a, b) =>
          a.status === "Available" ? -1 : b.status === "Available" ? 1 : 0
        );
        setFeatured(sorted.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch rooms for ExploreRooms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  useGSAP(() => {
    gsap.fromTo(
      ".explore-header",
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".explore-header", start: "top 85%", toggleActions: "play none none none" }
      }
    );

    if (featured.length > 0) {
      gsap.fromTo(
        ".explore-card",
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.15, ease: "power3.out",
          scrollTrigger: { trigger: ".explore-card", start: "top 85%", toggleActions: "play none none none" }
        }
      );
    }
  }, { scope: sectionRef, dependencies: [featured] });

  return (
    <section ref={sectionRef} className={`py-20 px-6 ${dark ? "bg-[#0f0f0f]" : "bg-[#faf8f6]"}`}>
      <div className="max-w-6xl mx-auto">

        <div className="explore-header flex items-center justify-between mb-10">
          <h2 className={`text-2xl md:text-3xl font-serif ${dark ? "text-white" : "text-gray-900"}`}>
            Explore Our Rooms
          </h2>
          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 text-sm text-[#cbb19d] font-medium
                       border border-[#cbb19d] px-4 py-2 rounded-full
                       hover:bg-[#cbb19d] hover:text-white transition-all duration-200"
          >
            Explore Rooms <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading rooms...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((room) => (
              <div key={room._id} className="explore-card">
                <RoomCard
                  id={room._id}
                  title={room.roomName || room.roomNumber}
                  price={room.pricing?.basePrice}
                  img={room.coverImage?.url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80"}
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default ExploreRooms;
