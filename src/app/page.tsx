"use client";

import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  Target,
  TrendingUp,
  Users,
  ShieldCheck,
  MessageCircle,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/home");
    }
  }, [ready, authenticated, router]);

  return (
    <div className="min-h-dvh bg-orbs">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-sm">
              M
            </div>
            <span className="font-semibold tracking-tight">Mundus</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={login}
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Log in
            </button>
            <button
              onClick={login}
              className="rounded-full bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 transition"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Crypto calls with real track records
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Make your call.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Build your track record.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
            Make crypto price calls. Track how they perform. Build a public
            accuracy record. Discover people who actually know their stuff.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={login}
              className="flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-400 transition shadow-lg shadow-indigo-500/25"
            >
              Start building your record
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how"
              className="rounded-full glass px-6 py-3 text-sm font-medium text-zinc-300 hover:text-white transition"
            >
              How it works
            </a>
          </div>
        </motion.div>
      </section>

      {/* Example Call Card */}
      <section className="mx-auto max-w-md px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="glass-strong rounded-2xl p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
              <div>
                <div className="text-sm font-medium">@alpha</div>
                <div className="text-xs text-emerald-400">72% accuracy · 48 calls</div>
              </div>
            </div>
            <span className="badge-active rounded-full px-2 py-0.5 text-xs font-medium">
              ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">SOL</span>
            <span className="text-emerald-400 text-xs font-medium flex items-center gap-0.5">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
            <span className="ml-auto text-xs text-emerald-400 font-medium">
              Bullish
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm mb-3">
            <div>
              <div className="text-zinc-500 text-xs">Called</div>
              <div className="font-medium">$180</div>
            </div>
            <div>
              <div className="text-zinc-500 text-xs">Current</div>
              <div className="font-medium">$189</div>
            </div>
            <div>
              <div className="text-zinc-500 text-xs">Perf</div>
              <div className="font-medium text-emerald-400">+5.00%</div>
            </div>
          </div>
          <p className="text-sm text-zinc-400 line-clamp-2">
            Breakout above $175 resistance with strong volume. Target $210 on
            continued momentum into Q3.
          </p>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-lg bg-white/5 py-2 text-xs font-medium hover:bg-white/10 transition">
              Agree
            </button>
            <button className="flex-1 rounded-lg bg-white/5 py-2 text-xs font-medium hover:bg-white/10 transition">
              Disagree
            </button>
            <button className="rounded-lg bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition">
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">How Mundus works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Target,
              title: "Make a Call",
              desc: "Pick a token, direction, entry, target and write your thesis.",
            },
            {
              icon: TrendingUp,
              title: "Track performance",
              desc: "Live prices from GeckoTerminal. See % move in your direction.",
            },
            {
              icon: BarChart3,
              title: "Build your record",
              desc: "Hits, misses and accuracy are public and permanent.",
            },
            {
              icon: Users,
              title: "Discover alpha",
              desc: "Follow people with real track records, not just loud opinions.",
            },
          ].map((item) => (
            <div key={item.title} className="glass rounded-xl p-5">
              <item.icon className="h-6 w-6 text-indigo-400 mb-3" />
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-4">Built for clarity</h2>
        <p className="text-center text-zinc-400 mb-10 max-w-lg mx-auto">
          No trading terminal. No casino. Just calls, discussion and reputation.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-2">Verified tokens</h3>
            <p className="text-sm text-zinc-400">
              Tokens reviewed by the team get a blue ✓. Unverified tokens still
              work — just show the contract address so you know what you’re
              looking at.
            </p>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-2">Immutable calls</h3>
            <p className="text-sm text-zinc-400">
              Once published, entry, target and thesis cannot be edited. Your
              record stays honest.
            </p>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-2">Fair leaderboards</h3>
            <p className="text-sm text-zinc-400">
              Accuracy + number of resolved calls. One lucky call doesn’t
              dominate.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: "Is verification a safety guarantee?",
              a: "No. Verification means the token/project information was reviewed. It does not guarantee safety or profitability.",
            },
            {
              q: "Can I edit a call after posting?",
              a: "No. Core call data is immutable so track records stay trustworthy.",
            },
            {
              q: "Where do prices come from?",
              a: "Live data is pulled from GeckoTerminal (on-chain DEX prices).",
            },
            {
              q: "When are wallets coming?",
              a: "Wallet and on-chain features (including $WDC) will be added later. The core loop works without them.",
            },
          ].map((item) => (
            <div key={item.q} className="glass rounded-xl p-4">
              <h3 className="font-medium text-sm mb-1">{item.q}</h3>
              <p className="text-sm text-zinc-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
              M
            </div>
            <span>Mundus</span>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-zinc-300">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-zinc-300">
              Privacy
            </Link>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300"
            >
              X
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300"
            >
              Telegram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
