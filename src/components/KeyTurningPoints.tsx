import React from 'react';
import { motion } from 'framer-motion';
import { KeyTurningPointsData } from '../types/timeline';
import { Award, Flame, GitCommit, Sparkles, Calendar, Quote, ArrowRight } from 'lucide-react';

export interface KeyTurningPointsProps {
  turningPoints: KeyTurningPointsData;
  onSelectPaperById?: (id: string) => void;
}

export const KeyTurningPoints: React.FC<KeyTurningPointsProps> = ({
  turningPoints,
  onSelectPaperById,
}) => {
  const {
    most_influential_paper,
    most_cited_paper,
    biggest_methodology_shift,
    emerging_trend,
  } = turningPoints;

  return (
    <section className="w-full max-w-5xl mx-auto py-10 px-4 sm:px-6">
      {/* Section Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#FFD166] border-2 border-[#15121F] shadow-[3px_3px_0px_#15121F] flex items-center justify-center text-[#15121F] font-bold">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#15121F]">
            Key Turning Points
          </h2>
          <p className="text-xs sm:text-sm text-[#4A4560] font-medium">
            Pivotal papers, citation landmarks, paradigm shifts, and active emerging trends.
          </p>
        </div>
      </div>

      {/* 4 Highlight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Most Influential Paper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4 }}
          onClick={() => most_influential_paper.id && onSelectPaperById?.(most_influential_paper.id)}
          className={`rounded-2xl border-3 border-[#15121F] bg-white p-6 shadow-[6px_6px_0px_#15121F] transition-all duration-200 ${
            most_influential_paper.id ? 'cursor-pointer hover:border-[#7C5CFC]' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7DFFF] border-2 border-[#15121F] text-[#7C5CFC] font-mono text-xs font-extrabold shadow-[2px_2px_0px_#15121F]">
              <Award className="w-4 h-4" />
              Most Influential Paper
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#15121F] bg-[#FFF3C4] px-2 py-0.5 rounded border border-[#15121F]">
              <Calendar className="w-3 h-3 text-[#FF6FB5]" />
              {most_influential_paper.year}
            </span>
          </div>

          <h3 className="font-display font-bold text-xl text-[#15121F] mb-2 leading-snug">
            {most_influential_paper.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#4A4560] leading-relaxed mb-4">
            {most_influential_paper.reason}
          </p>

          {most_influential_paper.id && (
            <div className="flex justify-end pt-2">
              <div className="w-7 h-7 min-w-[28px] min-h-[28px] shrink-0 rounded-full border-2 border-[#15121F] bg-[#E7DFFF] text-[#15121F] flex items-center justify-center shadow-[2px_2px_0px_#15121F] group-hover:bg-[#7C5CFC] group-hover:text-white group-hover:translate-x-1 transition-all duration-200">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </div>
            </div>
          )}
        </motion.div>

        {/* Card 2: Most Cited Paper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
          onClick={() => most_cited_paper.id && onSelectPaperById?.(most_cited_paper.id)}
          className={`rounded-2xl border-3 border-[#15121F] bg-white p-6 shadow-[6px_6px_0px_#15121F] transition-all duration-200 group ${
            most_cited_paper.id ? 'cursor-pointer hover:border-[#FF6FB5]' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE0F0] border-2 border-[#15121F] text-[#FF6FB5] font-mono text-xs font-extrabold shadow-[2px_2px_0px_#15121F]">
              <Flame className="w-4 h-4" />
              Most Cited Paper
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#15121F] bg-[#DCF1FF] px-2 py-0.5 rounded border border-[#15121F]">
              <Quote className="w-3 h-3 text-[#4FA3F7]" />
              {most_cited_paper.citation_count.toLocaleString()} citations
            </span>
          </div>

          <h3 className="font-display font-bold text-xl text-[#15121F] mb-2 leading-snug">
            {most_cited_paper.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#4A4560] leading-relaxed mb-4">
            Benchmark foundational paper driving over {most_cited_paper.citation_count.toLocaleString()} academic derivative research explorations.
          </p>

          {most_cited_paper.id && (
            <div className="flex justify-end pt-2">
              <div className="w-7 h-7 min-w-[28px] min-h-[28px] shrink-0 rounded-full border-2 border-[#15121F] bg-[#FFE0F0] text-[#15121F] flex items-center justify-center shadow-[2px_2px_0px_#15121F] group-hover:bg-[#FF6FB5] group-hover:text-white group-hover:translate-x-1 transition-all duration-200">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </div>
            </div>
          )}
        </motion.div>

        {/* Card 3: Biggest Methodology Shift */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4 }}
          className="rounded-2xl border-3 border-[#15121F] bg-white p-6 shadow-[6px_6px_0px_#15121F] transition-all duration-200"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCF1FF] border-2 border-[#15121F] text-[#4FA3F7] font-mono text-xs font-extrabold shadow-[2px_2px_0px_#15121F]">
              <GitCommit className="w-4 h-4" />
              Biggest Methodology Shift ({biggest_methodology_shift.year})
            </span>
          </div>

          <h3 className="font-display font-bold text-lg text-[#15121F] mb-3 leading-snug">
            {biggest_methodology_shift.title}
          </h3>

          <div className="space-y-2 mb-3 text-xs sm:text-sm">
            <div className="p-2.5 rounded-lg bg-[#FFE0F0]/50 border border-[#15121F]">
              <span className="font-mono text-[11px] font-bold text-[#FF6FB5] uppercase block mb-0.5">From Method:</span>
              <span className="text-[#15121F] font-medium">{biggest_methodology_shift.from_method}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#E1FBE4]/60 border border-[#15121F]">
              <span className="font-mono text-[11px] font-bold text-[#6BDE8F] uppercase block mb-0.5">To Shifted Method:</span>
              <span className="text-[#15121F] font-semibold">{biggest_methodology_shift.to_method}</span>
            </div>
          </div>

          <p className="text-xs text-[#4A4560] italic">
            Impact: {biggest_methodology_shift.impact}
          </p>
        </motion.div>

        {/* Card 4: Emerging Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4 }}
          className="rounded-2xl border-3 border-[#15121F] bg-white p-6 shadow-[6px_6px_0px_#15121F] transition-all duration-200"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E1FBE4] border-2 border-[#15121F] text-[#6BDE8F] font-mono text-xs font-extrabold shadow-[2px_2px_0px_#15121F]">
              <Sparkles className="w-4 h-4 text-[#15121F]" />
              Emerging Frontier Trend
            </span>
          </div>

          <h3 className="font-display font-bold text-xl text-[#15121F] mb-2 leading-snug">
            {emerging_trend.trend}
          </h3>

          <p className="text-xs sm:text-sm text-[#4A4560] leading-relaxed mb-4">
            {emerging_trend.description}
          </p>

          <div className="pt-2 border-t border-dashed border-[#15121F]/15">
            <span className="text-[11px] font-mono font-bold text-[#8A84A0] block mb-1.5 uppercase">Key Representative Papers:</span>
            <div className="flex flex-wrap gap-1.5">
              {emerging_trend.key_papers.map((kp, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-[#FFF3C4] border border-[#15121F] text-xs font-mono font-semibold text-[#15121F]"
                >
                  {kp}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
