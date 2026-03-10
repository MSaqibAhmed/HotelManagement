import React from "react";
import Logo from "../../assets/logo.png";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const Footer = () => {
  const { dark } = useTheme();

  return (
    <footer className={`pt-16 pb-8 border-t ${dark ? "bg-[#0d0d0d] border-gray-800" : "bg-[#faf8f6] border-gray-200"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src={Logo} alt="LuxuryStay" className="h-12 mb-4" />
            <p className={`text-sm leading-relaxed ${dark ? "text-gray-400" : "text-gray-500"}`}>
              Where refined elegance meets exceptional comfort. Your perfect stay awaits.
            </p>
            <div className="flex gap-3 mt-5">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${dark ? "bg-gray-800 text-gray-400 hover:bg-[#cbb19d] hover:text-white" : "bg-gray-100 text-gray-500 hover:bg-[#cbb19d] hover:text-white"}`}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`font-semibold text-sm uppercase tracking-widest mb-5 ${dark ? "text-gray-300" : "text-gray-800"}`}>Quick Links</h4>
            <ul className="space-y-3">
              {[["Home","/"],["Rooms","/rooms"],["Services","/services"],["About","/about"],["Contact","/contact"]].map(([name,path]) => (
                <li key={path}>
                  <Link to={path} className={`text-sm transition-colors ${dark ? "text-gray-400 hover:text-[#cbb19d]" : "text-gray-500 hover:text-[#9a836c]"}`}>{name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className={`font-semibold text-sm uppercase tracking-widest mb-5 ${dark ? "text-gray-300" : "text-gray-800"}`}>Services</h4>
            <ul className="space-y-3">
              {["Room Service","Restaurant","Laundry","Airport Pickup","Pool & Gym","Wake-up Call"].map((s) => (
                <li key={s} className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className={`font-semibold text-sm uppercase tracking-widest mb-5 ${dark ? "text-gray-300" : "text-gray-800"}`}>Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <MapPin size={16} className="text-[#cbb19d] mt-0.5 flex-shrink-0" />
                <span className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>123 Luxury Lane, Downtown, City 10001</span>
              </li>
              <li className="flex gap-3 items-center">
                <Phone size={16} className="text-[#cbb19d] flex-shrink-0" />
                <span className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>+1 (800) 555-0199</span>
              </li>
              <li className="flex gap-3 items-center">
                <Mail size={16} className="text-[#cbb19d] flex-shrink-0" />
                <span className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>hello@luxurystay.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={`pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-3 ${dark ? "border-gray-800" : "border-gray-200"}`}>
          <p className={`text-xs ${dark ? "text-gray-600" : "text-gray-400"}`}>© 2026 LuxuryStay Hospitality. All rights reserved.</p>
          <div className="flex gap-5">
            {["Privacy Policy","Terms of Service","Cookie Policy"].map((t) => (
              <a key={t} href="#" className={`text-xs transition-colors ${dark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"}`}>{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
