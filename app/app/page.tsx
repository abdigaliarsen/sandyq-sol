"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useTranslation, LanguageSwitcher } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  Shield,
  Fingerprint,
  Coins,
  Scale,
  Landmark,
  FileCheck,
  UserCheck,
  Link2,
  Layers,
  Lock,
  Eye,
  ChevronDown,
  ExternalLink,
  Zap,
  Globe,
} from "lucide-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

/* ─── Dot Grid Background ─── */
function DotGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#C8A04A" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>
    </div>
  );
}

/* ─── Floating Particles ─── */
function FloatingParticles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gold/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, -15, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animated Connection Lines (for Architecture) ─── */
function ConnectionLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 400">
      <defs>
        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C8A04A" stopOpacity="0" />
          <stop offset="50%" stopColor="#C8A04A" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C8A04A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[100, 200, 300].map((y, i) => (
        <motion.line
          key={i}
          x1="0" y1={y} x2="800" y2={y}
          stroke="url(#line-grad)"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, repeatType: "loop" }}
        />
      ))}
    </svg>
  );
}

/* ─── Typing Effect Hook ─── */
function useTypingEffect(text: string, speed = 40, delay = 500) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setStarted(false);
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay, text]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const timeout = setTimeout(
        () => setDisplayed(text.slice(0, displayed.length + 1)),
        speed
      );
      return () => clearTimeout(timeout);
    }
  }, [displayed, text, speed, started]);

  return displayed;
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [isInView, value]);

  return (
    <span ref={ref} className="font-mono text-gold tabular-nums">
      {count}{suffix}
    </span>
  );
}

/* ─── Section Wrapper with Scroll Animation ─── */
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

/* ─── Glassmorphism Card ─── */
function GlassCard({
  children,
  className = "",
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      className={`relative rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] backdrop-blur-xl p-6 ${className}`}
      whileHover={
        hover
          ? {
              scale: 1.02,
              borderColor: "rgba(200, 160, 74, 0.3)",
              boxShadow: "0 0 30px rgba(200, 160, 74, 0.08)",
            }
          : {}
      }
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Architecture Node ─── */
function ArchNode({ label, icon: Icon, delay }: { label: string; icon: any; delay: number }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <motion.div
        className="h-14 w-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center"
        whileHover={{ scale: 1.1, borderColor: "rgba(200, 160, 74, 0.5)" }}
        animate={{
          boxShadow: [
            "0 0 0px rgba(200, 160, 74, 0)",
            "0 0 15px rgba(200, 160, 74, 0.15)",
            "0 0 0px rgba(200, 160, 74, 0)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, delay: delay * 2 }}
      >
        <Icon className="h-6 w-6 text-gold" />
      </motion.div>
      <span className="text-xs text-center text-muted-foreground max-w-[100px] leading-tight">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Compliance Flow SVG ─── */
function ComplianceFlowDiagram({ labels }: { labels: string[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="relative w-full max-w-3xl mx-auto py-8">
      <svg viewBox="0 0 700 120" className="w-full" fill="none">
        {/* Flow line */}
        <motion.path
          d="M 50 60 L 650 60"
          stroke="url(#flow-gradient)"
          strokeWidth="2"
          strokeDasharray="6 4"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C8A04A" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#C8A04A" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Nodes */}
        {[
          { cx: 50, label: labels[0] },
          { cx: 200, label: labels[1] },
          { cx: 350, label: labels[2] },
          { cx: 500, label: labels[3] },
          { cx: 650, label: labels[4] },
        ].map((node, i) => (
          <g key={i}>
            <motion.circle
              cx={node.cx}
              cy="60"
              r="16"
              fill="var(--card)"
              stroke="#C8A04A"
              strokeWidth="1.5"
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.2 }}
            />
            <motion.circle
              cx={node.cx}
              cy="60"
              r="5"
              fill={i === 4 ? "#10B981" : "#C8A04A"}
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.2 }}
            />
            <motion.text
              x={node.cx}
              y="95"
              textAnchor="middle"
              fill="var(--muted-foreground)"
              fontSize="11"
              fontFamily="inherit"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.2 }}
            >
              {node.label}
            </motion.text>
          </g>
        ))}

        {/* Animated pulse traveling along the line */}
        {isInView && (
          <motion.circle
            cx="50"
            cy="60"
            r="4"
            fill="#C8A04A"
            opacity="0.8"
            animate={{ cx: [50, 650] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1,
            }}
          />
        )}
      </svg>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const wallet = useWallet();
  const { t } = useTranslation();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

  const tagline = useTypingEffect(
    t("landing.tagline"),
    35,
    800
  );

  const scrollToContent = useCallback(() => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const steps = [
    {
      icon: FileCheck,
      title: t("landing.step01.title"),
      description: t("landing.step01.description"),
      step: "01",
    },
    {
      icon: UserCheck,
      title: t("landing.step02.title"),
      description: t("landing.step02.description"),
      step: "02",
    },
    {
      icon: Shield,
      title: t("landing.step03.title"),
      description: t("landing.step03.description"),
      step: "03",
    },
    {
      icon: Coins,
      title: t("landing.step04.title"),
      description: t("landing.step04.description"),
      step: "04",
    },
  ];

  const features = [
    {
      icon: Link2,
      title: t("landing.feature.transferHook.title"),
      description: t("landing.feature.transferHook.description"),
    },
    {
      icon: Fingerprint,
      title: t("landing.feature.kyc.title"),
      description: t("landing.feature.kyc.description"),
    },
    {
      icon: Coins,
      title: t("landing.feature.yield.title"),
      description: t("landing.feature.yield.description"),
    },
    {
      icon: Scale,
      title: t("landing.feature.regulatory.title"),
      description: t("landing.feature.regulatory.description"),
    },
    {
      icon: Landmark,
      title: t("landing.feature.aifc.title"),
      description: t("landing.feature.aifc.description"),
    },
  ];

  const extensions = [
    { name: "TransferHook", description: t("landing.ext.transferHook"), icon: Shield },
    { name: "PermanentDelegate", description: t("landing.ext.permanentDelegate"), icon: Lock },
    { name: "DefaultAccountState", description: t("landing.ext.defaultAccountState"), icon: Eye },
    { name: "MetadataPointer", description: t("landing.ext.metadataPointer"), icon: Layers },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* ═══════════ HERO ═══════════ */}
      <motion.section
        className="relative min-h-screen flex flex-col items-center justify-center px-6"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <DotGrid />
        <FloatingParticles />

        {/* Controls */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-gold/[0.03] rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          {/* Logo mark */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/20"
              animate={{
                boxShadow: [
                  "0 10px 25px rgba(200, 160, 74, 0.15)",
                  "0 10px 40px rgba(200, 160, 74, 0.3)",
                  "0 10px 25px rgba(200, 160, 74, 0.15)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <span className="text-3xl font-bold text-primary-foreground">S</span>
            </motion.div>
          </motion.div>

          {/* Title with shimmer */}
          <motion.h1
            className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #C8A04A 0%, #F1E4B3 25%, #C8A04A 50%, #F1E4B3 75%, #C8A04A 100%)",
                backgroundSize: "200% auto",
                animation: "shimmer 4s linear infinite",
              }}
            >
              Sandyq
            </span>
          </motion.h1>

          {/* Kazakh meaning */}
          <motion.p
            className="text-sm tracking-[0.3em] uppercase text-muted-foreground/60 -mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {"сандық — "}{t("landing.meaning")}
          </motion.p>

          {/* Typing tagline */}
          <motion.div
            className="h-8 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-xl sm:text-2xl text-gold font-light tracking-wide">
              {tagline}
              <motion.span
                className="inline-block w-[2px] h-6 bg-gold ml-1 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </p>
          </motion.div>

          {/* Sub text */}
          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            {t("landing.description")}
          </motion.p>

          {/* CTA */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            {!wallet.publicKey ? (
              mounted ? <WalletMultiButton /> : null
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-8 py-3.5 text-base font-semibold text-primary-foreground hover:shadow-lg hover:shadow-gold/25 transition-all duration-300"
              >
                {t("landing.goToDashboard")} <ArrowRight className="h-5 w-5" />
              </Link>
            )}
            <button
              onClick={scrollToContent}
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 px-8 py-3.5 text-base text-muted-foreground hover:border-gold/30 hover:text-gold transition-all duration-300"
            >
              {t("landing.learnMore")} <ChevronDown className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Protocol badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 pt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            {["Solana", "Token-2022", "Transfer Hook", "On-chain KYC"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full border border-foreground/[0.06] bg-foreground/[0.02] text-xs text-muted-foreground font-mono"
                >
                  {tag}
                </span>
              )
            )}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-6 w-6 text-muted-foreground/40" />
        </motion.div>
      </motion.section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <Section
        id="how-it-works"
        className="relative py-32 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.span
              className="text-xs tracking-[0.2em] uppercase text-gold font-mono"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {t("landing.processLabel")}
            </motion.span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
              {t("landing.howItWorks")}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              {t("landing.howItWorksDesc")}
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <GlassCard className="h-full relative overflow-hidden group">
                  {/* Step number watermark */}
                  <span className="absolute -top-2 -right-1 text-6xl font-bold text-foreground/[0.03] group-hover:text-gold/[0.06] transition-colors duration-500 select-none">
                    {step.step}
                  </span>
                  <div className="relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                      <step.icon className="h-5 w-5 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Compliance flow visualization */}
          <div className="mt-16">
            <p className="text-center text-xs text-muted-foreground mb-4 font-mono tracking-wide">
              {t("landing.transferComplianceFlow")}
            </p>
            <ComplianceFlowDiagram labels={[t("landing.flow.sender"), t("landing.flow.transferHook"), t("landing.flow.kycCheck"), t("landing.flow.compliance"), t("landing.flow.receiver")]} />
          </div>
        </div>
      </Section>

      {/* ═══════════ FEATURES ═══════════ */}
      <Section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.015] to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <motion.span
              className="text-xs tracking-[0.2em] uppercase text-gold font-mono"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {t("landing.capabilitiesLabel")}
            </motion.span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
              {t("landing.keyFeatures")}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              {t("landing.keyFeaturesDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <GlassCard className="h-full group">
                  <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/20 group-hover:border-gold/40 transition-all duration-300">
                    <feature.icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-gold transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ TECHNOLOGY STACK ═══════════ */}
      <Section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.span
              className="text-xs tracking-[0.2em] uppercase text-gold font-mono"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {t("landing.architectureLabel")}
            </motion.span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
              {t("landing.builtOnToken2022")}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              {t("landing.builtOnToken2022Desc")}
            </p>
          </div>

          {/* Extensions grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {extensions.map((ext, i) => (
              <motion.div
                key={ext.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <GlassCard className="text-center h-full">
                  <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center mb-3">
                    <ext.icon className="h-6 w-6 text-gold" />
                  </div>
                  <p className="font-mono text-sm text-gold mb-1">
                    {ext.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{ext.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Architecture Visualization */}
          <motion.div
            className="relative rounded-2xl border border-foreground/[0.06] bg-foreground/[0.01] backdrop-blur-sm p-8 sm:p-12 overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <ConnectionLines />
            <div className="relative z-10">
              <p className="text-center text-xs font-mono text-muted-foreground mb-10 tracking-wide">
                {t("landing.protocolArchitecture")}
              </p>

              {/* Top: Solana Runtime */}
              <div className="flex justify-center mb-8">
                <motion.div
                  className="px-6 py-3 rounded-xl bg-gold/10 border border-gold/30 flex items-center gap-3"
                  animate={{
                    borderColor: [
                      "rgba(200, 160, 74, 0.3)",
                      "rgba(200, 160, 74, 0.6)",
                      "rgba(200, 160, 74, 0.3)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Zap className="h-5 w-5 text-gold" />
                  <span className="font-mono text-sm text-gold">
                    {t("landing.arch.solanaRuntime")}
                  </span>
                </motion.div>
              </div>

              {/* Middle row */}
              <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-8">
                <ArchNode label={t("landing.arch.token2022")} icon={Layers} delay={0.2} />
                <ArchNode label={t("landing.arch.transferHook")} icon={Shield} delay={0.4} />
                <ArchNode label={t("landing.arch.rwaCore")} icon={Landmark} delay={0.6} />
              </div>

              {/* Bottom row */}
              <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
                <ArchNode label={t("landing.arch.kycRegistry")} icon={Fingerprint} delay={0.8} />
                <ArchNode label={t("landing.arch.assetConfig")} icon={FileCheck} delay={1.0} />
                <ArchNode label={t("landing.arch.yieldVault")} icon={Coins} delay={1.2} />
                <ArchNode label={t("landing.arch.auditTrail")} icon={Eye} delay={1.4} />
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-foreground/[0.06]">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    <AnimatedCounter value={4} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("landing.stats.extensions")}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    <AnimatedCounter value={3} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("landing.stats.programs")}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    <AnimatedCounter value={100} suffix="%" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("landing.stats.compliance")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════ FOOTER CTA ═══════════ */}
      <Section className="relative py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Glow behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gold/[0.04] rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            className="relative z-10 space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              {t("landing.readyToTokenize")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t("landing.footerDesc")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!wallet.publicKey ? (
                mounted ? <WalletMultiButton /> : null
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-8 py-3.5 text-base font-semibold text-primary-foreground hover:shadow-lg hover:shadow-gold/25 transition-all duration-300"
                >
                  {t("landing.goToDashboard")} <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-gold transition-colors"
              >
                <Globe className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://explorer.solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-gold transition-colors"
              >
                <Layers className="h-4 w-4" />
                Solana Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Bottom border */}
        <div className="max-w-6xl mx-auto mt-24 pt-8 border-t border-foreground/[0.06]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
            <p>{t("landing.footerTagline")}</p>
            <p className="font-mono">{t("landing.footerBuiltOn")}</p>
          </div>
        </div>
      </Section>

      {/* ═══════════ Global Styles ═══════════ */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }
      `}</style>
    </div>
  );
}
