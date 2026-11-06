"use client";

import { ArrowLeft, Leaf, Search } from "lucide-react";
import { useState } from "react";
import { PLANT_LIBRARY } from "@/lib/plantConfig";
import { PlantArt } from "@/components/plant-art";
import { ThemeToggle } from "@/components/theme-toggle";

export function Library({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const plants = PLANT_LIBRARY.filter((plant) => `${plant.name} ${plant.scientificName}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="mx-auto min-h-dvh max-w-7xl px-4 pb-10 sm:px-6">
      <header className="flex h-16 items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 font-display text-lg font-semibold"><Leaf className="h-5 w-5 text-fern" /> MonsteraOSI</button>
        <div className="flex items-center gap-3"><button onClick={onBack} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-line/50"><ArrowLeft className="h-4 w-4" /> Dashboard</button><ThemeToggle /></div>
      </header>
      <div className="flex flex-col justify-between gap-5 py-10 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium uppercase tracking-[.2em] text-fern">Plant library</p><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Know what each plant needs.</h1><p className="mt-3 max-w-xl text-muted">Explore ideal growing conditions for twenty popular indoor and kitchen plants.</p></div>
        <label className="flex w-full items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 sm:max-w-xs"><Search className="h-4 w-4 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plants" className="w-full bg-transparent text-sm outline-none" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plants.map((plant) => <article key={plant.id} className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm"><PlantArt emoji={plant.emoji} className="h-36 rounded-none text-6xl" /><div className="p-5"><h2 className="font-display text-xl font-semibold">{plant.name}</h2><p className="mt-1 text-xs italic text-muted">{plant.scientificName}</p><p className="mt-3 text-sm leading-relaxed text-muted">{plant.description}</p><dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Light</dt><dd className="text-right font-medium">{plant.light}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Temperature</dt><dd className="font-medium">{plant.temperature}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Humidity</dt><dd className="font-medium">{plant.humidity}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Watering</dt><dd className="max-w-[9rem] text-right font-medium">{plant.watering}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Soil</dt><dd className="max-w-[9rem] text-right font-medium">{plant.soil}</dd></div></dl></div></article>)}
      </div>
    </div>
  );
}
