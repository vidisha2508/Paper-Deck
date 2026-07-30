import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PaperData } from '../types/timeline';
import { TimelineNode } from './TimelineNode';
import { Layers, ArrowDown } from 'lucide-react';

export interface TimelineProps {
  papers: PaperData[];
  onSelectPaper: (paper: PaperData) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ papers, onSelectPaper }) => {
  // Ensure papers are sorted chronologically by year ascending
  const sortedPapers = useMemo(() => {
    return [...papers].sort((a, b) => a.year - b.year);
  }, [papers]);

  const startYear = sortedPapers.length > 0 ? sortedPapers[0].year : 2017;
  const endYear = sortedPapers.length > 0 ? sortedPapers[sortedPapers.length - 1].year : 2026;

  return (
    <section className="relative w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Section Title Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7DFFF] border-2 border-[#15121F] shadow-[3px_3px_0px_#15121F] font-mono text-xs font-bold text-[#15121F] mb-3 transform -rotate-1">
          <Layers className="w-4 h-4 text-[#7C5CFC]" />
          <span>Chronological Evolution Track ({startYear} – {endYear})</span>
        </div>

        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#15121F] tracking-tight">
          Research Lineage Timeline
        </h2>
        <p className="text-sm sm:text-base text-[#4A4560] max-w-xl mx-auto mt-2 font-medium">
          Click any milestone node to unveil detailed methodology insights, contribution breakdowns, and key limitations.
        </p>
      </div>

      {/* Main Timeline Wrapper */}
      <div className="relative">
        {/* Animated Central Connecting Line */}
        <div className="absolute left-4 md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 z-0 rounded-full overflow-hidden bg-[#15121F]/15">
          <motion.div
            initial={{ height: '0%' }}
            whileInView={{ height: '100%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="w-full h-full bg-gradient-to-b from-[#7C5CFC] via-[#FF6FB5] to-[#FFD166]"
          />
        </div>

        {/* Chronological List of Nodes */}
        <div className="relative z-10 pt-2">
          {sortedPapers.map((paper, index) => (
            <TimelineNode
              key={paper.id || `paper-${index}`}
              paper={paper}
              index={index}
              isEven={index % 2 === 0}
              onSelect={onSelectPaper}
            />
          ))}
        </div>

        {/* Timeline Endpoint Indicator */}
        <div className="flex flex-col items-center justify-center mt-6">
          <div className="w-9 h-9 rounded-full bg-[#6BDE8F] border-2 border-[#15121F] shadow-[3px_3px_0px_#15121F] flex items-center justify-center text-[#15121F] mb-2 animate-bounce">
            <ArrowDown className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="font-mono text-xs font-bold text-[#15121F] px-3 py-1 rounded-full bg-[#E1FBE4] border border-[#15121F]">
            Present Research Frontier
          </span>
        </div>
      </div>
    </section>
  );
};
