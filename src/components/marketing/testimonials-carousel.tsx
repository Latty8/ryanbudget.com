"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote: "Finally replaced our messy Google Sheet. Bi-weekly pay just makes sense now.",
    name: "Jordan M.",
    role: "Software engineer",
  },
  {
    quote: "The calm UI is what sold me — it doesn't feel like a bank yelling at me.",
    name: "Alex R.",
    role: "Teacher, dual income",
  },
  {
    quote: "Reports and goals in one place. Our household actually sticks to the plan.",
    name: "Sam & Taylor",
    role: "Premium household",
  },
  {
    quote: "Duplicated the paycheck template and was budgeting in five minutes.",
    name: "Priya K.",
    role: "Nurse, bi-weekly pay",
  },
];

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  const t = testimonials[index];

  return (
    <div className="mx-auto max-w-2xl">
      <AnimatePresence mode="wait">
        <motion.blockquote
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-slate-700/80 bg-neutral-900/60 p-8 text-center"
        >
          <div className="mb-3 flex justify-center gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4" fill="currentColor" aria-hidden />
            ))}
          </div>
          <p className="text-lg text-slate-200">&ldquo;{t.quote}&rdquo;</p>
          <footer className="mt-4 text-sm text-slate-500">
            — {t.name}
            <span className="block text-slate-600">{t.role}</span>
          </footer>
        </motion.blockquote>
      </AnimatePresence>
      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Testimonials">
        {testimonials.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Testimonial ${i + 1}`}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-sky-500" : "w-2 bg-slate-600 hover:bg-slate-500"
            )}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
