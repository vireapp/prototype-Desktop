import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mic, Video, Gamepad2 } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
}

export function AuthLayout({ children, subtitle = "Welcome back" }: AuthLayoutProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-[#050505] text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-500 overflow-hidden relative">
      {/* === LEFT: Brand/Art Panel === */}
      <aside className="relative hidden lg:flex lg:w-[45%] flex-col justify-between overflow-hidden bg-zinc-50 dark:bg-[#0a0a0a] border-r border-zinc-200/50 dark:border-white/5">
        {/* Dynamic Architectural Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.15]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(to right, #8882 1px, transparent 1px), linear-gradient(to bottom, #8882 1px, transparent 1px)`,
              backgroundSize: "4rem 4rem",
              maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            }}
          />
        </div>

        {/* Abstract Ambient Gradient */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 dark:opacity-20">
          <motion.div
            animate={{
              rotate: [0, 90, 180, 270, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-[40vw] h-[40vw] rounded-full blur-[100px]"
            style={{
              background:
                "conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)",
            }}
          />
        </div>

        {/* Frosted Glass Overlay */}
        <div className="absolute inset-0 backdrop-blur-[80px] bg-white/40 dark:bg-black/50" />

        {/* Content Top */}
        <div className="relative z-10 p-12">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="relative w-8 h-8">
              <img
                src="./images/vire_logo.png"
                alt="Vire Logo"
                className="absolute inset-0 w-full h-full object-contain dark:invert"
              />
            </div>
            <span className="font-heading font-semibold text-xl tracking-tight">VIRE</span>
          </Link>
        </div>

        {/* Graphic Composition */}
        <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none perspective-[1000px]">
          <div className="relative w-[340px] h-[340px]">
            {/* Main App Mockup Card */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotateX: 10, rotateY: -10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
              transition={{ delay: 0.3, duration: 1, type: "spring", bounce: 0.2 }}
              className="absolute inset-0 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl shadow-black/5 overflow-hidden flex flex-col"
            >
              <div className="h-10 border-b border-black/5 dark:border-white/5 flex items-center px-4 gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 p-5 space-y-4">
                <div className="w-3/4 h-8 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50" />
                <div className="space-y-2">
                  <div className="w-full h-4 rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                  <div className="w-5/6 h-4 rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                  <div className="w-4/6 h-4 rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
                </div>
                <div className="flex gap-3 mt-auto pt-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Chat Bubble 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
              className="absolute -right-12 top-16 bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tr-none shadow-xl border border-black/5 dark:border-white/5 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400" />
              <div className="space-y-1.5">
                <div className="w-16 h-2 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="w-24 h-2 rounded bg-zinc-100 dark:bg-zinc-700/50" />
              </div>
            </motion.div>

            {/* Floating Chat Bubble 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
              className="absolute -left-12 bottom-20 bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-xl border border-black/5 dark:border-white/5 flex items-center gap-3"
            >
              <div className="space-y-1.5">
                <div className="w-20 h-2 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="w-14 h-2 rounded bg-zinc-100 dark:bg-zinc-700/50" />
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400" />
            </motion.div>
          </div>
        </div>

        {/* Content Bottom */}
        <div className="relative z-10 p-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 leading-tight">
              A new standard for <br />{" "}
              <span className="text-zinc-500 dark:text-zinc-400">digital interaction.</span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-md font-light">
              {subtitle}
            </p>
          </motion.div>
        </div>
      </aside>

      {/* === RIGHT: Form Panel === */}
      <main className="relative flex lg:w-[55%] flex-1">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 overflow-y-auto w-full">
          <div className="relative z-10 w-full max-w-[400px]">
            {/* Mobile brand header */}
            <div className="flex items-center gap-3 mb-12 lg:hidden">
              <div className="relative h-8 w-8">
                <img
                  src="./images/vire_logo.png"
                  alt="Vire Logo"
                  className="absolute inset-0 w-full h-full object-contain dark:invert"
                />
              </div>
              <span className="font-heading font-semibold text-xl tracking-tight">VIRE</span>
            </div>

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
