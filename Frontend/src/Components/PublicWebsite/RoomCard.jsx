import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

/**
 * RoomCard — reusable card component
 * Props: id, title, price, img, status (optional), type (optional)
 */
const RoomCard = ({ id, title, price, img, status, type }) => {
  const { dark } = useTheme();

  return (
    <Link to={`/rooms/${id}`} className="group block">

      {/* ── IMAGE ── */}
      <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "3/3.5" }}>
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Hover overlay — subtle dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Status pill — shows only if passed */}
        {status && (
          <span className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm
            ${status === "Available"
              ? "bg-white/85 text-green-600"
              : "bg-white/85 text-red-500"}`}>
            {status}
          </span>
        )}

        {/* Type pill — shows only if passed */}
        {type && (
          <span className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full
                           bg-black/30 text-white backdrop-blur-sm">
            {type}
          </span>
        )}
      </div>

      {/* ── TEXT BELOW IMAGE ── */}
      <div className="mt-3 text-center">
        <h3 className={`font-serif text-base ${dark ? "text-white" : "text-gray-900"}`}>
          {title}
        </h3>
        <p className="mt-1">
          <span className="text-[#cbb19d] font-semibold text-sm">{price}$</span>
          <span className={`text-xs ml-1 ${dark ? "text-gray-500" : "text-gray-400"}`}>/ night</span>
        </p>
      </div>

    </Link>
  );
};

export default RoomCard;
