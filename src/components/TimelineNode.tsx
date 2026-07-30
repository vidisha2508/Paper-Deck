import React from 'react';
import { motion } from 'framer-motion';
import { PaperData } from '../types/timeline';
import { Calendar, User, Quote, ArrowRight, Sparkles } from 'lucide-react';

export interface TimelineNodeProps {
  paper: PaperData;
  isEven: boolean;
  index: number;
  onSelect: (paper: PaperData) => void;
}

export const TimelineNode: React.FC<TimelineNodeProps> = ({
  paper,
  isEven,
  index,
  onSelect,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col md:flex-row items-center w-full mb-12 last:mb-0 ${
        isEven ? 'md:flex-row-reverse' : ''
      }`}
    >
      {/* Node Content Card Container */}
      <div className="w-full md:w-[calc(50%-40px)] px-2">
        <motion.div
          whileHover={{ y: -5, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelect(paper)}
          tabIndex={0}
          role="button"
          aria-label={`Open details for paper: ${paper.title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(paper);
            }
          }}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border-3 border-[#15121F] bg-white p-6 shadow-[6px_6px_0px_#15121F] transition-all duration-200 hover:shadow-[10px_10px_0px_#15121F] hover:border-[#7C5CFC]"
        >
          {/* Top Accent Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7C5CFC] via-[#FF6FB5] to-[#FFD166] group-hover:h-2 transition-all duration-200" />

          {/* Header Row: Year & Citation Count */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE0F0] border-2 border-[#15121F] text-[#15121F] font-mono text-xs font-bold shadow-[2px_2px_0px_#15121F]">
              <Calendar className="w-3.5 h-3.5 text-[#FF6FB5]" />
              <span>{paper.year}</span>
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCF1FF] border-2 border-[#15121F] text-[#15121F] font-mono text-xs font-semibold">
              <Quote className="w-3 h-3 text-[#4FA3F7]" />
              <span>{paper.citation_count.toLocaleString()} citations</span>
            </div>
          </div>

          {/* Paper Title */}
          <h3 className="font-display font-bold text-lg md:text-xl text-[#15121F] leading-snug mb-2 group-hover:text-[#7C5CFC] transition-colors duration-150">
            {paper.title}
          </h3>

          {/* Authors Snippet */}
          {paper.authors && paper.authors.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[#4A4560] mb-3 line-clamp-1 font-medium">
              <User className="w-3.5 h-3.5 text-[#8A84A0] shrink-0" />
              <span>{paper.authors.join(', ')}</span>
            </div>
          )}

          {/* Contribution Preview */}
          <p className="text-xs md:text-sm text-[#4A4560] line-clamp-2 leading-relaxed mb-4 font-normal">
            {paper.contribution}
          </p>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-end pt-3 border-t-2 border-dashed border-[#15121F]/15">
            <div className="w-8 h-8 min-w-[32px] min-h-[32px] shrink-0 rounded-full border-2 border-[#15121F] bg-[#E7DFFF] text-[#15121F] flex items-center justify-center shadow-[2px_2px_0px_#15121F] group-hover:bg-[#7C5CFC] group-hover:text-white group-hover:translate-x-1 transition-all duration-200">
              <ArrowRight className="w-4 h-4 shrink-0" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Central Timeline Point Marker (Desktop & Mobile) */}
      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-10 my-4 md:my-0">
        <motion.button
          whileHover={{ scale: 1.35, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(paper)}
          title={`Click to view paper: ${paper.title}`}
          aria-label={`Select year ${paper.year} paper node`}
          className="relative w-10 h-10 rounded-full border-3 border-[#15121F] bg-[#FFD166] shadow-[3px_3px_0px_#15121F] flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-[#FF6FB5]"
        >
          {/* Inner Node Core */}
          <div className="w-3.5 h-3.5 rounded-full bg-[#15121F] flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-[#FFF3C4]" />
          </div>

          {/* Pulsing Aura */}
          <span className="absolute -inset-1 rounded-full bg-[#7C5CFC] opacity-25 animate-ping pointer-events-none" />
        </motion.button>
      </div>

      {/* Empty Balancing Spacer for Desktop Grid Alignment */}
      <div className="hidden md:block w-[calc(50%-40px)]" />
    </motion.div>
  );
};
