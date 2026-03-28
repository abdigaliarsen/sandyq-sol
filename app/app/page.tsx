"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
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
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

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
      className={`relative rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 ${className}`}
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
      <span className="text-xs text-center text-[#94A3B8] max-w-[100px] leading-tight">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Compliance Flow SVG ─── */
function ComplianceFlowDiagram() {
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
          { cx: 50, label: "Sender" },
          { cx: 200, label: "Transfer Hook" },
          { cx: 350, label: "KYC Check" },
          { cx: 500, label: "Compliance" },
          { cx: 650, label: "Receiver" },
        ].map((node, i) => (
          <g key={i}>
            <motion.circle
              cx={node.cx}
              cy="60"
              r="16"
              fill="#111827"
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
              fill="#94A3B8"
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
  const wallet = useWallet();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

  const tagline = useTypingEffect(
    "Compliance-gated RWA tokenization on Solana",
    35,
    800
  );

  const scrollToContent = useCallback(() => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const steps = [
    {
      icon: FileCheck,
      title: "Create Asset",
      description:
        "Issuer tokenizes a real-world asset using Token-2022 with built-in compliance extensions.",
      step: "01",
    },
    {
      icon: UserCheck,
      title: "Verify Identity",
      description:
        "Investors pass on-chain KYC verification. A soulbound attestation is minted to their wallet.",
      step: "02",
    },
    {
      icon: Shield,
      title: "Compliant Transfers",
      description:
        "Every token transfer is validated by a Transfer Hook program enforcing regulatory rules.",
      step: "03",
    },
    {
      icon: Coins,
      title: "Distribute Yield",
      description:
        "Income is distributed pro-rata to verified holders automatically through the protocol.",
      step: "04",
    },
  ];

  const features = [
    {
      icon: Link2,
      title: "Transfer Hook Compliance",
      description:
        "Every transfer is checked by Solana at the protocol level. Non-compliant transfers are rejected before settlement.",
    },
    {
      icon: Fingerprint,
      title: "On-chain KYC",
      description:
        "Soulbound verification tokens prove investor eligibility without exposing personal data on-chain.",
    },
    {
      icon: Coins,
      title: "Yield Distribution",
      description:
        "Automatic pro-rata income distribution to all verified token holders through a single instruction.",
    },
    {
      icon: Scale,
      title: "Regulatory Controls",
      description:
        "Freeze, recall, and attestation audit trail. Full lifecycle compliance from issuance to redemption.",
    },
    {
      icon: Landmark,
      title: "AIFC Ready",
      description:
        "Designed for Kazakhstan's Astana International Financial Centre regulatory framework and beyond.",
    },
  ];

  const extensions = [
    { name: "TransferHook", description: "Compliance validation on every transfer", icon: Shield },
    { name: "PermanentDelegate", description: "Regulatory recall and freeze capability", icon: Lock },
    { name: "DefaultAccountState", description: "Accounts frozen until KYC completion", icon: Eye },
    { name: "MetadataPointer", description: "On-chain asset metadata and attestations", icon: Layers },
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0E14] overflow-x-hidden">
      {/* ═══════════ HERO ═══════════ */}
      <motion.section
        className="relative min-h-screen flex flex-col items-center justify-center px-6"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <DotGrid />
        <FloatingParticles />

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
              <span className="text-3xl font-bold text-[#0B0E14]">S</span>
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
            className="text-sm tracking-[0.3em] uppercase text-[#94A3B8]/60 -mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            сандық — the vault
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
            className="text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Tokenize real-world assets with institutional-grade compliance
            baked into every transfer. Built on Solana&apos;s Token-2022 with
            transfer hooks, on-chain KYC, and automated yield distribution.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            {!wallet.publicKey ? (
              <WalletMultiButton />
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-8 py-3.5 text-base font-semibold text-[#0B0E14] hover:shadow-lg hover:shadow-gold/25 transition-all duration-300"
              >
                Go to Dashboard <ArrowRight className="h-5 w-5" />
              </Link>
            )}
            <button
              onClick={scrollToContent}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base text-[#94A3B8] hover:border-gold/30 hover:text-gold transition-all duration-300"
            >
              Learn More <ChevronDown className="h-4 w-4" />
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
                  className="px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-[#94A3B8] font-mono"
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
          <ChevronDown className="h-6 w-6 text-[#94A3B8]/40" />
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
              Process
            </motion.span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9] mt-3">
              How It Works
            </h2>
            <p className="text-[#94A3B8] mt-4 max-w-lg mx-auto">
              From asset creation to yield distribution, every step is
              enforced on-chain.
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
                  <span className="absolute -top-2 -right-1 text-6xl font-bold text-white/[0.03] group-hover:text-gold/[0.06] transition-colors duration-500 select-none">
                    {step.step}
                  </span>
                  <div className="relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                      <step.icon className="h-5 w-5 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Compliance flow visualization */}
          <div className="mt-16">
            <p className="text-center text-xs text-[#94A3B8] mb-4 font-mono tracking-wide">
              TRANSFER COMPLIANCE FLOW
            </p>
            <ComplianceFlowDiagram />
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
              Capabilities
            </motion.span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9] mt-3">
              Key Features
            </h2>
            <p className="text-[#94A3B8] mt-4 max-w-lg mx-auto">
              Institutional-grade compliance primitives, native to Solana.
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
                  <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2 group-hover:text-gold transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
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
              Architecture
            </motion.span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9] mt-3">
              Built on Token-2022
            </h2>
            <p className="text-[#94A3B8] mt-4 max-w-lg mx-auto">
              Leveraging Solana&apos;s Token Extensions for native compliance
              — no wrappers, no bridges, no workarounds.
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
                  <p className="text-xs text-[#94A3B8]">{ext.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Architecture Visualization */}
          <motion.div
            className="relative rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-sm p-8 sm:p-12 overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <ConnectionLines />
            <div className="relative z-10">
              <p className="text-center text-xs font-mono text-[#94A3B8] mb-10 tracking-wide">
                PROTOCOL ARCHITECTURE
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
                    Solana Runtime
                  </span>
                </motion.div>
              </div>

              {/* Middle row */}
              <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-8">
                <ArchNode label="Token-2022 Program" icon={Layers} delay={0.2} />
                <ArchNode label="Transfer Hook" icon={Shield} delay={0.4} />
                <ArchNode label="RWA Core" icon={Landmark} delay={0.6} />
              </div>

              {/* Bottom row */}
              <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
                <ArchNode label="KYC Registry" icon={Fingerprint} delay={0.8} />
                <ArchNode label="Asset Config" icon={FileCheck} delay={1.0} />
                <ArchNode label="Yield Vault" icon={Coins} delay={1.2} />
                <ArchNode label="Audit Trail" icon={Eye} delay={1.4} />
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-white/[0.06]">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    <AnimatedCounter value={4} />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Token-2022 Extensions
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    <AnimatedCounter value={3} />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    On-chain Programs
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    <AnimatedCounter value={100} suffix="%" />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    On-chain Compliance
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
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9]">
              Ready to tokenize?
            </h2>
            <p className="text-[#94A3B8] max-w-lg mx-auto">
              Connect your wallet to explore the protocol, or visit the
              dashboard to manage assets and verify investors.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!wallet.publicKey ? (
                <WalletMultiButton />
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark px-8 py-3.5 text-base font-semibold text-[#0B0E14] hover:shadow-lg hover:shadow-gold/25 transition-all duration-300"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-[#94A3B8]">
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
        <div className="max-w-6xl mx-auto mt-24 pt-8 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#475569]">
            <p>Sandyq Protocol — Compliance-gated RWA tokenization</p>
            <p className="font-mono">Built on Solana Token-2022</p>
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
