import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  BellRing,
  CalendarCheck,
  Sparkles,
  Smartphone,
  QrCode,
} from "lucide-react";

export function MobileAppPromoSection() {
  const [showQrModal, setShowQrModal] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const featureItems = [
    {
      icon: BellRing,
      title: "Real-Time Pipeline Telemetry",
      description:
        "Receive instant push notifications when HireWise agents evaluate your CV or stage updates occur.",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: CalendarCheck,
      title: "One-Tap Interview RSVPs",
      description:
        "Instantly accept, decline, or reschedule interviews directly synced to your Google Calendar.",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: Sparkles,
      title: "AI-Curated Opportunity Stream",
      description:
        "Deterministic skill matching surfaces high-alignment tech roles tailored to your verified competency graph.",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <section id="mobile-app" className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Spotlight Promo Showcase Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-slate-800/90 shadow-2xl shadow-indigo-950/40 overflow-hidden"
      >
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />

        {/* Diagonal Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center p-8 sm:p-12 lg:p-16">
          {/* Left Column: Promotion Narrative & Store CTAs */}
          <div className="lg:col-span-7 space-y-8">
            {/* Headline & Description */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white leading-[1.15]">
                Never Miss a Career Milestone.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">
                  HireWise on Android.
                </span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Stay continuously connected to your interview pipeline. Track
                agent scoring updates, synchronize interviews in one tap, and
                review role recommendations directly from your pocket.
              </p>
            </div>

            {/* Feature Highlights List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {featureItems.map((feature, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 backdrop-blur-sm hover:border-slate-700 transition duration-300 group"
                >
                  <div
                    className={`h-9 w-9 rounded-xl border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300 ${feature.bg}`}
                  >
                    <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTAs: Google Play Store Button & Scan QR Card */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Google Play Store Badge Button */}
              <motion.a
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-black border border-slate-700/80 hover:border-slate-500 hover:bg-slate-950 transition-all duration-300 shadow-xl shadow-black/50"
              >
                {/* Official Google Play Store Vector Icon */}
                <div className="shrink-0 w-8 h-8 flex items-center justify-center">
                  <svg
                    viewBox="0 0 512 512"
                    className="w-7 h-7 drop-shadow-sm"
                    aria-hidden="true"
                  >
                    <path
                      d="M48 26.9L285.1 264 48 501.1c-4.4-4.8-7-11.2-7-18.4V45.3c0-7.2 2.6-13.6 7-18.4z"
                      fill="#00E676"
                    />
                    <path
                      d="M374.3 174.7L285.1 264l89.2 89.3 1.2-0.7 105.7-60.1c11.7-6.6 18.8-18.5 18.8-31.5 0-13-7.1-24.9-18.8-31.5L375.5 174l-1.2 0.7z"
                      fill="#FFD600"
                    />
                    <path
                      d="M48 26.9c5.2-5.7 13-8.9 21.6-8.9 6.8 0 13.7 2 20.3 5.7l284.4 151-89.2 89.3L48 26.9z"
                      fill="#00B0FF"
                    />
                    <path
                      d="M285.1 264l89.2 89.3-284.4 151c-6.6 3.7-13.5 5.7-20.3 5.7-8.6 0-16.4-3.2-21.6-8.9L285.1 264z"
                      fill="#FF3D00"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
                    Get it on
                  </div>
                  <div className="text-lg font-bold text-white tracking-tight leading-none group-hover:text-sky-300 transition-colors">
                    Google Play
                  </div>
                </div>
              </motion.a>

              {/* QR Code Quick Scan Pill Button */}
              <button
                type="button"
                onClick={() => setShowQrModal(!showQrModal)}
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 transition duration-200 text-slate-200 text-sm font-semibold backdrop-blur-sm group"
              >
                <QrCode className="h-5 w-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>Scan QR to Install</span>
              </button>
            </div>

            {/* Interactive QR Display Drawer / Modal */}
            {showQrModal && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl bg-slate-900/90 border border-slate-700/80 p-4 max-w-sm flex items-center gap-4 shadow-xl backdrop-blur-md"
              >
                {/* Visual SVG QR Code Graphic */}
                <div className="bg-white p-2 rounded-xl shrink-0">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-20 h-20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Top Left Finder */}
                    <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                    <rect x="11" y="11" width="16" height="16" rx="2" fill="white" />
                    <rect x="15" y="15" width="8" height="8" rx="1" fill="#0284c7" />

                    {/* Top Right Finder */}
                    <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                    <rect x="73" y="11" width="16" height="16" rx="2" fill="white" />
                    <rect x="77" y="15" width="8" height="8" rx="1" fill="#0284c7" />

                    {/* Bottom Left Finder */}
                    <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f172a" />
                    <rect x="11" y="73" width="16" height="16" rx="2" fill="white" />
                    <rect x="15" y="77" width="8" height="8" rx="1" fill="#0284c7" />

                    {/* Data Points */}
                    <rect x="38" y="8" width="6" height="6" rx="1" fill="#0f172a" />
                    <rect x="48" y="14" width="6" height="6" rx="1" fill="#0f172a" />
                    <rect x="40" y="24" width="6" height="6" rx="1" fill="#0284c7" />
                    <rect x="54" y="22" width="6" height="6" rx="1" fill="#0f172a" />

                    <rect x="8" y="38" width="6" height="6" rx="1" fill="#0f172a" />
                    <rect x="22" y="44" width="6" height="6" rx="1" fill="#0f172a" />
                    <rect x="38" y="38" width="10" height="10" rx="2" fill="#0284c7" />
                    <rect x="52" y="38" width="6" height="6" rx="1" fill="#0f172a" />
                    <rect x="68" y="38" width="8" height="8" rx="1" fill="#0f172a" />
                    <rect x="82" y="42" width="6" height="6" rx="1" fill="#0284c7" />

                    <rect x="38" y="54" width="6" height="6" rx="1" fill="#0f172a" />
                    <rect x="48" y="50" width="8" height="8" rx="1" fill="#0284c7" />
                    <rect x="62" y="52" width="6" height="6" rx="1" fill="#0f172a" />
                    <rect x="76" y="54" width="6" height="6" rx="1" fill="#0f172a" />

                    <rect x="38" y="68" width="6" height="6" rx="1" fill="#0284c7" />
                    <rect x="48" y="74" width="6" height="6" rx="1" fill="#0f172a" />
                    <rect x="60" y="68" width="8" height="8" rx="1" fill="#0f172a" />
                    <rect x="74" y="72" width="6" height="6" rx="1" fill="#0284c7" />
                    <rect x="84" y="80" width="8" height="8" rx="1" fill="#0f172a" />
                    <rect x="42" y="86" width="6" height="6" rx="1" fill="#0f172a" />
                    <rect x="60" y="84" width="6" height="6" rx="1" fill="#0f172a" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-sky-400" />
                    Scan with Android Camera
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    Point your device's camera to jump directly to the Google Play Store installation page.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Clean Phone Mockup Showcase without overlay badges */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
            {/* Glowing Backdrop Spotlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-88 h-72 sm:h-88 bg-gradient-to-tr from-blue-500/25 to-indigo-500/25 rounded-full blur-[70px] pointer-events-none" />

            {/* Central Phone Mockup Container */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] group flex justify-center"
            >
              <div className="relative drop-shadow-[0_25px_45px_rgba(0,0,0,0.7)] transition-all duration-500">
                <img
                  src="/app_image.png"
                  alt="HireWise Android Candidate Companion Mobile App Mockup"
                  className="w-full h-auto object-contain block select-none pointer-events-none"
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
