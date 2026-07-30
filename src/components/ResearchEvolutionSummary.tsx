import React from 'react';
import { motion } from 'framer-motion';
import { EvolutionSummaryData } from '../types/timeline';
import { Zap, GitMerge, Compass, CheckCircle2, TrendingUp } from 'lucide-react';

export interface ResearchEvolutionSummaryProps {
  summary: EvolutionSummaryData;
}

export const ResearchEvolutionSummary: React.FC<ResearchEvolutionSummaryProps> = ({
  summary,
}) => {
  return (
    <section className="w-full max-w-5xl mx-auto py-10 px-4 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#7C5CFC] border-2 border-[#15121F] shadow-[3px_3px_0px_#15121F] flex items-center justify-center text-white font-bold">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#15121F]">
            Research Evolution Summary
          </h2>
          <p className="text-xs sm:text-sm text-[#4A4560] font-medium">
            Synthesized insights on breakthroughs, methodology shifts, and the current research horizon.
          </p>
        </div>
      </div>

      {/* Grid Layout of Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Major Breakthroughs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -4 }}
          className="rounded-2xl border-3 border-[#15121F] bg-[#E7DFFF]/40 p-6 shadow-[6px_6px_0px_#15121F] transition-all duration-200"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-dashed border-[#15121F]/20">
            <span className="p-2 rounded-lg bg-[#7C5CFC] border border-[#15121F] text-white">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-lg text-[#15121F]">
              Major Breakthroughs
            </h3>
          </div>

          <ul className="space-y-3">
            {summary.major_breakthroughs.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#15121F] leading-snug">
                <CheckCircle2 className="w-4 h-4 text-[#7C5CFC] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Card 2: How Methodologies Evolved */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -4 }}
          className="rounded-2xl border-3 border-[#15121F] bg-[#DCF1FF]/40 p-6 shadow-[6px_6px_0px_#15121F] transition-all duration-200"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-dashed border-[#15121F]/20">
            <span className="p-2 rounded-lg bg-[#4FA3F7] border border-[#15121F] text-white">
              <GitMerge className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-lg text-[#15121F]">
              Methodology Evolution
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-[#15121F] font-medium leading-relaxed">
            {summary.methodology_evolution}
          </p>
        </motion.div>

        {/* Card 3: Current State of Research */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -4 }}
          className="rounded-2xl border-3 border-[#15121F] bg-[#E1FBE4]/50 p-6 shadow-[6px_6px_0px_#15121F] transition-all duration-200"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-dashed border-[#15121F]/20">
            <span className="p-2 rounded-lg bg-[#6BDE8F] border border-[#15121F] text-[#15121F]">
              <Compass className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-lg text-[#15121F]">
              Current State of Research
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-[#15121F] font-medium leading-relaxed">
            {summary.current_state}
          </p>
        </motion.div>
      </div>
    </section>
  );
};
