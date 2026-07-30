import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResearchGapData } from '../types/timeline';
import { AlertCircle, ShieldAlert, Filter, AlertTriangle, Info } from 'lucide-react';

export interface CommonResearchGapsProps {
  gaps: ResearchGapData[];
}

export const CommonResearchGaps: React.FC<CommonResearchGapsProps> = ({ gaps }) => {
  const [filterSeverity, setFilterSeverity] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const filteredGaps = gaps.filter(
    (gap) => filterSeverity === 'All' || gap.severity === filterSeverity
  );

  const getSeverityBadge = (severity: 'Low' | 'Medium' | 'High') => {
    switch (severity) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF6FB5] border-2 border-[#15121F] text-[#15121F] font-mono text-xs font-extrabold shadow-[2px_2px_0px_#15121F]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#15121F]" />
            High Severity
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFD166] border-2 border-[#15121F] text-[#15121F] font-mono text-xs font-extrabold shadow-[2px_2px_0px_#15121F]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#15121F]" />
            Medium Severity
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#DCF1FF] border-2 border-[#15121F] text-[#15121F] font-mono text-xs font-extrabold shadow-[2px_2px_0px_#15121F]">
            <Info className="w-3.5 h-3.5 text-[#4FA3F7]" />
            Low Severity
          </span>
        );
    }
  };

  return (
    <section className="w-full max-w-5xl mx-auto py-10 px-4 sm:px-6">
      {/* Header Row & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF6FB5] border-2 border-[#15121F] shadow-[3px_3px_0px_#15121F] flex items-center justify-center text-[#15121F] font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#15121F]">
              Common Research Gaps
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4560] font-medium">
              Recurring limitations and critical open challenges across analyzed papers.
            </p>
          </div>
        </div>

        {/* Severity Filter Controls */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#FFF3C4] border-2 border-[#15121F] shadow-[3px_3px_0px_#15121F]">
          <Filter className="w-4 h-4 text-[#15121F] ml-1 mr-0.5" />
          {(['All', 'High', 'Medium', 'Low'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                filterSeverity === sev
                  ? 'bg-[#15121F] text-white shadow-[2px_2px_0px_#7C5CFC]'
                  : 'text-[#15121F] hover:bg-white/60'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Gap Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredGaps.map((gap, index) => (
            <motion.div
              key={gap.id || gap.title || index}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -5 }}
              className="group relative flex flex-col justify-between rounded-2xl border-3 border-[#15121F] bg-white p-6 shadow-[6px_6px_0px_#15121F] hover:shadow-[10px_10px_0px_#15121F] transition-all duration-200"
            >
              <div>
                {/* Top Badge */}
                <div className="mb-4">{getSeverityBadge(gap.severity)}</div>

                {/* Gap Title */}
                <h3 className="font-display font-bold text-lg text-[#15121F] leading-snug mb-2 group-hover:text-[#FF6FB5] transition-colors">
                  {gap.title}
                </h3>

                {/* Gap Description */}
                <p className="text-xs sm:text-sm text-[#4A4560] leading-relaxed mb-4">
                  {gap.description}
                </p>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-dashed border-[#15121F]/15 flex items-center justify-between text-[11px] font-mono text-[#8A84A0]">
                <span>Unresolved Limitation</span>
                <span className="font-bold text-[#15121F]">PaperDeck AI Insight</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredGaps.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-[#15121F] shadow-[4px_4px_0px_#15121F]">
          <p className="text-sm font-bold text-[#4A4560]">No gaps match the selected severity filter.</p>
        </div>
      )}
    </section>
  );
};
