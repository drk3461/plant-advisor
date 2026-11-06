"use client";

import { ArrowRight, BrainCircuit, Droplets, Leaf, LockKeyhole, Sprout } from "lucide-react";
import { useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [signedIn, setSignedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  if (signedIn) return <Dashboard onSignOut={() => setSignedIn(false)} />;

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (username === "user1" && password === "1234") {
      setSignedIn(true);
      setLoginError("");
    } else {
      setLoginError("Use the prototype credentials shown below.");
    }
  }

  return (
    <main className="min-h-dvh overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moss text-paper"><Leaf className="h-5 w-5" /></span>
          MonsteraOSI
        </div>
        <Button variant="outline" onClick={() => setShowLogin(true)}>Sign in <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-32 lg:pt-20">
        <div className="absolute -left-32 top-20 -z-10 h-96 w-96 rounded-full bg-fern/10 blur-3xl" />
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-ok" /> Autonomous plant intelligence
          </div>
          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[.98] tracking-tight sm:text-7xl">
            Your plants have a <span className="text-fern">caretaker</span> now.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
            MonsteraOSI — Organic Systems Intelligence is a prototype AI plant management system that reads environmental conditions, learns from history, and recommends the next best intervention.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setShowLogin(true)}>Explore the prototype <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <span className="flex items-center px-2 text-sm text-muted">Preset data · No hardware required</span>
          </div>
        </div>
        <div className="relative rounded-[2rem] border border-line bg-surface p-4 shadow-xl shadow-moss/10 sm:p-6">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-moss to-fern p-6 text-paper sm:p-8">
            <div className="flex items-center justify-between text-sm text-paper/75"><span>MONSTERAOSI / LIVE DEMO</span><span className="rounded-full bg-paper/15 px-2 py-1">3 plants</span></div>
            <div className="mt-16 flex items-end justify-between">
              <div><p className="text-sm text-paper/70">Mona · Monstera deliciosa</p><p className="mt-2 font-display text-4xl font-semibold">Healthy</p></div>
              <Sprout className="h-20 w-20 opacity-80" strokeWidth={1} />
            </div>
            <div className="mt-8 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-paper/10 p-3"><p className="text-xs text-paper/65">Moisture</p><p className="mt-1 text-xl font-semibold">38%</p></div>
              <div className="rounded-xl bg-paper/10 p-3"><p className="text-xs text-paper/65">Humidity</p><p className="mt-1 text-xl font-semibold">52%</p></div>
              <div className="rounded-xl bg-paper/10 p-3"><p className="text-xs text-paper/65">Temp</p><p className="mt-1 text-xl font-semibold">24°C</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-12 sm:grid-cols-3 sm:px-8">
          {[
            [BrainCircuit, "AI that remembers", "Ask about current conditions, trends, or previous actions and get answers grounded in the plant's data."],
            [Droplets, "Controlled interventions", "The prototype agent can simulate watering, nutrients, humidity, light, pH, and soil flushing."],
            [Leaf, "A living dashboard", "Switch between three distinct plants with their own readings, histories, and care context."],
          ].map(([Icon, title, copy]) => {
            const FeatureIcon = Icon as typeof BrainCircuit;
            return <div key={title as string} className="rounded-2xl border border-line bg-paper p-5"><FeatureIcon className="h-5 w-5 text-fern" /><h2 className="mt-5 font-display text-xl font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{copy as string}</p></div>;
          })}
        </div>
      </section>

      {showLogin && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && setShowLogin(false)}>
          <form onSubmit={signIn} className="w-full max-w-md rounded-3xl border border-line bg-surface p-7 shadow-2xl">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fern/15 text-fern"><LockKeyhole className="h-5 w-5" /></span><div><h2 className="font-display text-2xl font-semibold">Welcome back</h2><p className="text-sm text-muted">Prototype access</p></div></div>
            <label className="mt-7 block text-sm font-medium">Username<input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-fern" placeholder="user1" /></label>
            <label className="mt-4 block text-sm font-medium">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:ring-2 focus:ring-fern" placeholder="1234" /></label>
            {loginError && <p className="mt-3 text-sm text-bad">{loginError}</p>}
            <p className="mt-4 rounded-xl bg-paper p-3 text-xs text-muted">Demo credentials: <strong className="text-ink">user1</strong> / <strong className="text-ink">1234</strong></p>
            <Button type="submit" className="mt-5 w-full">Enter MonsteraOSI</Button>
          </form>
        </div>
      )}
    </main>
  );
}
