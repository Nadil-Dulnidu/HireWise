import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import { Search, ArrowRight, ShieldCheck, Bot, CalendarCheck2, FileCheck2, Layers, HelpCircle, CheckCircle2, Lock, Zap, ChevronRight } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MobileAppPromoSection } from "@/components/landing/MobileAppPromoSection";

export function LandingPage() {
  const { isSignedIn } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);

  // Top Page Scroll Progress Indicator with spring smoothing
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Hero section parallax depth on scroll
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(heroScroll, [0, 1], [0, 45]);
  const heroImageScale = useTransform(heroScroll, [0, 1], [1, 0.97]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Scroll In-View Variants for Sections and Cards
  const scrollSectionVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const scrollStaggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const scrollCardVariants: Variants = {
    hidden: { opacity: 0, y: 28, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const agents = [
    {
      image: "/agent-job.jpg",
      title: "Job Analysis Agent",
      badge: "Specification Engine",
      icon: FileCheck2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      desc: "Parses complex engineering requirements, decomposes tech stacks, and builds deterministic competency rubrics from job descriptions.",
      capabilities: ["Tech Stack Decomposition", "Seniority Mapping", "Requirement Extraction"],
    },
    {
      image: "/agent-resume.jpg",
      title: "Resume Analysis Agent",
      badge: "Candidate Profiler",
      icon: Bot,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      desc: "Transforms unstructured candidate CVs and portfolios into strictly typed Pydantic models without data loss or parsing artifacts.",
      capabilities: ["Structured Profile Parsing", "Project Verification", "Skill Graph Extraction"],
    },
    {
      image: "/agent-eval.jpg",
      title: "Evaluation & Ranking Agent",
      badge: "Objective Scorer",
      icon: Layers,
      color: "text-purple-600",
      bg: "bg-purple-50",
      desc: "Executes multi-dimensional fit scoring and objective role alignment analysis with fully explainable evidence citations.",
      capabilities: ["Deterministic Scoring", "Evidence Attribution", "Anomaly Detection"],
    },
    {
      image: "/agent-validation.jpg",
      title: "Validation & Governance Agent",
      badge: "Security Shield",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      desc: "Enforces business rules, prevents unauthorized state transitions, and guarantees strict schema compliance across all workflows.",
      capabilities: ["Pydantic Verification", "Policy Enforcement", "Human Gatekeeping"],
    },
    {
      image: "/agent-question.jpg",
      title: "Interview Question Generator",
      badge: "Rubric Synthesizer",
      icon: HelpCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      desc: "Synthesizes targeted technical interview questions, coding scenarios, and behavioral probes tailored to individual candidate profiles.",
      capabilities: ["Dynamic Problem Synthesis", "Gap Analysis Probes", "Standardized Rubrics"],
    },
    {
      image: "/agent-schedule.jpg",
      title: "Autonomous Scheduling Agent",
      badge: "Calendar Orchestrator",
      icon: CalendarCheck2,
      color: "text-amber-600",
      bg: "bg-amber-50",
      desc: "Calculates non-conflicting interview windows across multi-party calendars with automated Google Calendar integration.",
      capabilities: ["Conflict Resolution", "Timezone Normalization", "Automated Invites"],
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 relative">
      {/* Sleek Top Scroll Progress Indicator */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 origin-left z-[60] pointer-events-none" />

      {/* Hero Section - 2 Column Split Layout (Headline & Search on Left, Image on Right) */}
      <section ref={heroRef} className="relative pt-8 sm:pt-16 pb-4 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-1/4 w-[700px] h-[450px] bg-gradient-to-bl from-blue-100/50 via-indigo-50/30 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: High-Impact Enterprise Value Prop & Search */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="lg:col-span-6 space-y-6 sm:space-y-8">
              {/* Main Headline */}
              <motion.h1 variants={itemVariants} className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Autonomous Multi-Agent AI for <span className="text-blue-600">Enterprise Technical</span> Recruitment.
              </motion.h1>

              {/* Professional Subheading */}
              <motion.p variants={itemVariants} className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                HireWise coordinates specialized autonomous agents to decompose job specifications, parse technical competencies, score candidate alignment deterministically, and synchronize
                conflict-free interviews — with strict human authorization at every stage.
              </motion.p>

              {/* Search / Exploration Widget */}
              <motion.div variants={itemVariants} className="max-w-xl pt-2">
                <div className="bg-white p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-2 shadow-lg shadow-slate-200/50 border border-slate-200/90">
                  <div className="relative flex-1 w-full flex items-center pl-3">
                    <Search className="h-5 w-5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search roles (e.g. Distributed Systems, Staff Engineer)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <Link
                    to={`/jobs${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`}
                    className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition flex items-center justify-center gap-2 shadow-sm shrink-0"
                  >
                    Explore Positions <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>

              {/* Enterprise Trust Indicators */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium max-w-xl">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Human-in-the-Loop</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Pydantic Guardrails</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Zero Double-Booking</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: Hero Image Showcase with Parallax & Interactive Floating Badges */}
            <motion.div
              style={{ y: heroImageY, scale: heroImageScale }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 relative"
            >
              <div className="relative rounded-3xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-2xl shadow-slate-200/60 transition-all duration-300 hover:shadow-slate-300/80 group">
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3]">
                  <img
                    src="/hero-enterprise.jpg"
                    alt="HireWise Autonomous Multi-Agent Recruitment Telemetry Platform"
                    className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating Telemetry Chip - Top Right with continuous micro-float */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    y: [0, -6, 0],
                  }}
                  transition={{
                    opacity: { delay: 0.4, duration: 0.5 },
                    y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                  }}
                  className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-lg flex items-center gap-3"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Multi-Agent Grid</div>
                    <div className="text-[10px] text-slate-500 font-medium">6 Coordinated Agents Active</div>
                  </div>
                </motion.div>

                {/* Floating Telemetry Chip - Bottom Left with continuous micro-float */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: [0, 6, 0],
                  }}
                  transition={{
                    opacity: { delay: 0.5, duration: 0.5 },
                    y: {
                      repeat: Infinity,
                      duration: 4.5,
                      delay: 0.6,
                      ease: "easeInOut",
                    },
                  }}
                  className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-lg flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">99%</div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Deterministic Match</div>
                    <div className="text-[10px] text-slate-500 font-medium">Zero Hallucination Scoring</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Scroll In-View Reveal & Stagger */}
      <section id="how-it-works" className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={scrollSectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Architected for Enterprise Rigor and Precision</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Every candidate evaluation stage is strictly governed by typed data contracts, cross-verified by multi-agent consensus, and validated by human hiring managers.
          </p>
        </motion.div>

        <motion.div variants={scrollStaggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Deterministic Specification Ingestion",
              desc: "Technical job descriptions and candidate portfolios are decomposed into strict Pydantic schemas, eliminating unstructured data anomalies.",
            },
            {
              step: "02",
              title: "Multi-Agent Consensus & Scoring",
              desc: "Autonomous agents independently evaluate candidate depth, system design capabilities, and career trajectory against concrete rubric criteria.",
            },
            {
              step: "03",
              title: "Synthesized Rubrics & Scheduling",
              desc: "Custom interview questionnaires are generated to probe specific candidate gaps, while calendars are seamlessly orchestrated with zero manual friction.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={scrollCardVariants}
              whileHover={{
                y: -6,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              className="relative p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <span className="text-4xl font-black text-blue-600/20 block mb-4 font-mono group-hover:text-blue-600/40 transition-colors duration-300">{item.step}</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>Enterprise Verified</span>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Candidate Mobile Companion - Android / Google Play Promotion Showcase */}
      <MobileAppPromoSection />

      {/* AI Agents Architecture Showcase - Scroll In-View Reveal & Stagger */}
      <section id="ai-agents" className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={scrollSectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Six Autonomous Agents Working in Orchestration</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            State-persisted, schema-validated agents executing discrete phases of the recruitment lifecycle under strict human oversight.
          </p>
        </motion.div>

        {/* 6 Agent Cards with Dedicated Visuals - Rectangular Shape (Left Image, Right Details) */}
        <motion.div variants={scrollStaggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent, i) => (
            <motion.div
              key={i}
              variants={scrollCardVariants}
              whileHover={{
                y: -4,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              className="rounded-2xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 shadow-sm transition-all duration-300 overflow-hidden flex flex-col sm:flex-row group"
            >
              {/* Left Side: Reduced Size Image Container */}
              <div className="relative w-full sm:w-44 md:w-48 shrink-0 bg-slate-100 overflow-hidden aspect-[16/10] sm:aspect-auto">
                <img src={agent.image} alt={agent.title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out" />
                <div className="absolute top-2.5 left-2.5 sm:top-2 sm:left-2">
                  <span className="rounded-full bg-white/95 backdrop-blur-sm border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">{agent.badge}</span>
                </div>
              </div>

              {/* Right Side: Agent Details */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg ${agent.bg} ${agent.color} flex items-center justify-center shrink-0`}>
                      <agent.icon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{agent.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-0.5">{agent.desc}</p>
                </div>

                {/* Capabilities Tags */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.map((cap, capIdx) => (
                      <span key={capIdx} className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-600">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* High-Impact Enterprise Call-to-Action - Scroll Entrance & Ambient Pulsing Glow */}
      <motion.section variants={scrollSectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
          {/* Animated Ambient Glowing Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-16 -bottom-16 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.22, 0.1],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              delay: 2,
              ease: "easeInOut",
            }}
            className="absolute -left-16 -top-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
          />

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Modernize Your Technical Hiring Operations</h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Eliminate subjective screening biases, reduce time-to-hire by 65%, and empower recruitment teams with explainable multi-agent intelligence.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={isSignedIn ? "/auth-redirect" : "/sign-up"}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 px-7 py-3 text-sm font-semibold text-white transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                {isSignedIn ? "Go to Dashboard" : "Get Started Free"} <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/recruiter" className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 text-sm font-semibold text-white transition backdrop-blur-sm block">
                Recruiter Console
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
