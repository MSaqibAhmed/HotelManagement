import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ContactPage = () => {
  const { dark } = useTheme();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1500);
  };

  const bg = dark ? "bg-[#111111]" : "bg-white";
  const card = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";
  const input = dark ? "bg-[#111111] border-gray-700 text-white placeholder-gray-500 focus:border-[#cbb19d]" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#cbb19d]";
  const text = dark ? "text-white" : "text-gray-900";
  const muted = dark ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 ${bg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">Get In Touch</p>
          <h1 className={`text-4xl md:text-5xl font-serif ${text}`}>Contact Us</h1>
          <p className={`mt-4 text-sm max-w-md mx-auto ${muted}`}>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className={`p-8 rounded-3xl border ${card}`}>
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <CheckCircle size={56} className="text-green-500 mb-4" />
                <h3 className={`text-xl font-serif font-semibold mb-2 ${text}`}>Message Sent!</h3>
                <p className={`text-sm ${muted}`}>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-6 text-sm text-[#cbb19d] hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className={`font-serif text-xl mb-6 ${text}`}>Send a Message</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${muted}`}>Your Name</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="John Smith"
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${input}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${muted}`}>Email Address</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="john@example.com"
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${input}`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${muted}`}>Subject</label>
                  <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                    placeholder="How can we help?"
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${input}`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${muted}`}>Message</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                    placeholder="Tell us about your inquiry..."
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none ${input}`} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#cbb19d] text-white py-3.5 rounded-full font-medium hover:bg-[#b89f8a] transition-all disabled:opacity-70">
                  {loading ? "Sending..." : <><Send size={16} /> Send Message</>}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {[
              { icon: MapPin, title: "Our Location", info: ["123 Luxury Lane", "Downtown District, City 10001"] },
              { icon: Phone, title: "Phone", info: ["+1 (800) 555-0199", "+1 (800) 555-0200"] },
              { icon: Mail, title: "Email", info: ["hello@luxurystay.com", "reservations@luxurystay.com"] },
              { icon: Clock, title: "Hours", info: ["Reservations: 24/7", "Front Desk: Always Open"] },
            ].map((item, i) => (
              <div key={i} className={`flex gap-5 p-6 rounded-2xl border ${card}`}>
                <div className="w-12 h-12 rounded-xl bg-[#cbb19d]/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={20} className="text-[#cbb19d]" />
                </div>
                <div>
                  <h4 className={`font-semibold text-sm mb-1 ${text}`}>{item.title}</h4>
                  {item.info.map((line, j) => <p key={j} className={`text-sm ${muted}`}>{line}</p>)}
                </div>
              </div>
            ))}

            {/* Map placeholder */}
            <div className={`rounded-2xl border overflow-hidden h-52 flex items-center justify-center ${card}`}>
              <div className="text-center">
                <MapPin size={32} className="text-[#cbb19d] mx-auto mb-2" />
                <p className={`text-sm ${muted}`}>Map coming soon</p>
                <a href="https://maps.google.com" target="_blank" rel="noreferrer"
                  className="text-xs text-[#cbb19d] hover:underline mt-1 block">View on Google Maps</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
