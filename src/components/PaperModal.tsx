import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperData } from '../types/timeline';
import {
  X,
  Calendar,
  Users,
  Award,
  Cpu,
  AlertTriangle,
  Compass,
  Quote,
  Sparkles,
} from 'lucide-react';

export interface PaperModalProps {
  paper: PaperData | null;
  onClose: () => void;
}

export const PaperModal: React.FC<PaperModalProps> = ({ paper, onClose }) => {
  // ESC key event listener support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (paper) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [paper, onClose]);

  return (
    <AnimatePresence>
      {paper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur Overlay with Click Outside Handler */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-[#15121F]/60 backdrop-blur-md"
          />

          {/* Glassmorphism Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 rounded-3xl border-3 border-[#15121F] bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-[12px_12px_0px_#15121F]"
          >
            {/* Top Gradient Banner */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#7C5CFC] via-[#FF6FB5] to-[#FFD166] rounded-t-3xl" />

            {/* Header: Title, Year Badge, Close Button */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFE0F0] border-2 border-[#15121F] text-[#15121F] font-mono text-xs font-bold shadow-[2px_2px_0px_#15121F]">
                    <Calendar className="w-3.5 h-3.5 text-[#FF6FB5]" />
                    {paper.year}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#DCF1FF] border-2 border-[#15121F] text-[#15121F] font-mono text-xs font-semibold shadow-[2px_2px_0px_#15121F]">
                    <Quote className="w-3.5 h-3.5 text-[#4FA3F7]" />
                    {paper.citation_count.toLocaleString()} citations
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E7DFFF] border-2 border-[#15121F] text-[#7C5CFC] font-mono text-[11px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    ID: {paper.id}
                  </span>
                </div>

                <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#15121F] leading-tight">
                  {paper.title}
                </h2>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label="Close modal popup"
                className="w-10 h-10 rounded-full border-2 border-[#15121F] bg-[#FFF3C4] text-[#15121F] hover:bg-[#FF6FB5] hover:text-white flex items-center justify-center cursor-pointer shadow-[3px_3px_0px_#15121F] transition-colors shrink-0"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </motion.button>
            </div>

            {/* Authors Section */}
            {paper.authors && paper.authors.length > 0 && (
              <div className="mb-6 pb-4 border-b-2 border-dashed border-[#15121F]/15">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#4A4560] uppercase tracking-wider mb-2">
                  <Users className="w-4 h-4 text-[#7C5CFC]" />
                  <span>Authors</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {paper.authors.map((author, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#FFF4E3] border border-[#15121F] text-xs font-medium text-[#15121F]"
                    >
                      {author}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Body Sections Grid */}
            <div className="space-y-5">
              {/* Main Contribution */}
              <div className="p-4 rounded-xl border-2 border-[#15121F] bg-[#E7DFFF]/40 shadow-[4px_4px_0px_#15121F]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#7C5CFC] uppercase tracking-wider mb-1.5">
                  <Award className="w-4 h-4 text-[#7C5CFC]" />
                  <span>Main Contribution</span>
                </div>
                <p className="text-sm md:text-base text-[#15121F] font-medium leading-relaxed">
                  {paper.contribution}
                </p>
              </div>

              {/* Methodology Used */}
              <div className="p-4 rounded-xl border-2 border-[#15121F] bg-[#DCF1FF]/40 shadow-[4px_4px_0px_#15121F]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#4FA3F7] uppercase tracking-wider mb-1.5">
                  <Cpu className="w-4 h-4 text-[#4FA3F7]" />
                  <span>Methodology Used</span>
                </div>
                <p className="text-sm md:text-base text-[#15121F] font-medium leading-relaxed">
                  {paper.methodology}
                </p>
              </div>

              {/* Key Limitation & Future Scope Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Key Limitation */}
                <div className="p-4 rounded-xl border-2 border-[#15121F] bg-[#FFE0F0]/40 shadow-[4px_4px_0px_#15121F]">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF6FB5] uppercase tracking-wider mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#FF6FB5]" />
                    <span>Key Limitation</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#15121F] font-normal leading-relaxed">
                    {paper.limitation}
                  </p>
                </div>

                {/* Future Scope */}
                <div className="p-4 rounded-xl border-2 border-[#15121F] bg-[#E1FBE4]/40 shadow-[4px_4px_0px_#15121F]">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#6BDE8F] uppercase tracking-wider mb-1.5">
                    <Compass className="w-4 h-4 text-[#6BDE8F]" />
                    <span>Future Scope</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#15121F] font-normal leading-relaxed">
                    {paper.future_scope}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-6 pt-4 border-t-2 border-[#15121F] flex items-center justify-between text-xs text-[#8A84A0] font-mono">
              <span>Press ESC or click backdrop to close</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl border-2 border-[#15121F] bg-[#FFD166] text-[#15121F] font-bold shadow-[2px_2px_0px_#15121F] hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
              >
                Done Reading
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
