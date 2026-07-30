import React, { useState } from 'react';
import { PaperData, ResearchEvolutionDataset } from '../types/timeline';
import { Timeline } from './Timeline';
import { PaperModal } from './PaperModal';
import { ResearchEvolutionSummary } from './ResearchEvolutionSummary';
import { CommonResearchGaps } from './CommonResearchGaps';
import { KeyTurningPoints } from './KeyTurningPoints';
import mockData from '../data/mockResearchData.json';
import { Compass, Sparkles, BookOpen, Layers, RefreshCw } from 'lucide-react';

export interface ResearchEvolutionDashboardProps {
  initialData?: ResearchEvolutionDataset;
  onRefreshTopic?: (topic: string) => void;
}

export const ResearchEvolutionDashboard: React.FC<ResearchEvolutionDashboardProps> = ({
  initialData,
  onRefreshTopic,
}) => {
  // Use provided data or fallback to mock data
  const data: ResearchEvolutionDataset = (initialData || mockData) as ResearchEvolutionDataset;

  const [selectedPaper, setSelectedPaper] = useState<PaperData | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'timeline' | 'summary' | 'gaps' | 'turning_points'>('all');

  const handleSelectPaperById = (id: string) => {
    const found = data.papers.find((p) => p.id === id);
    if (found) {
      setSelectedPaper(found);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FFF4E3] text-[#15121F] font-sans pb-20">
      {/* Top Hero Banner */}
      <header className="relative overflow-hidden border-b-3 border-[#15121F] bg-white pt-10 pb-8 px-4 sm:px-8 shadow-[0px_4px_0px_#15121F]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display font-black text-3xl sm:text-5xl text-[#15121F] tracking-tight leading-none mb-3">
                Research Evolution Timeline
              </h1>
              <p className="text-base sm:text-lg text-[#4A4560] font-medium max-w-2xl">
                Domain Exploration: <span className="font-bold text-[#7C5CFC] underline decoration-2">{data.topic}</span>
              </p>
            </div>

            {/* Quick Metrics Header Pills */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-[#E7DFFF] border-2 border-[#15121F] shadow-[3px_3px_0px_#15121F] font-mono text-xs font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#7C5CFC]" />
                <span>{data.papers.length} Analyzed Papers</span>
              </div>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 pt-1 border-t-2 border-dashed border-[#15121F]/15">
            {[
              { id: 'all', label: 'Full Overview' },
              { id: 'timeline', label: 'Timeline Lineage' },
              { id: 'turning_points', label: 'Key Turning Points' },
              { id: 'summary', label: 'Evolution Summary' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold whitespace-nowrap transition-all border-2 border-[#15121F] ${
                  activeTab === tab.id
                    ? 'bg-[#15121F] text-white shadow-[3px_3px_0px_#7C5CFC]'
                    : 'bg-[#FFF4E3] text-[#15121F] hover:bg-[#FFF3C4] shadow-[2px_2px_0px_#15121F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-12">
        {/* Section 1: Key Turning Points */}
        {(activeTab === 'all' || activeTab === 'turning_points') && (
          <KeyTurningPoints
            turningPoints={data.turning_points}
            onSelectPaperById={handleSelectPaperById}
          />
        )}

        {/* Section 2: Chronological Timeline */}
        {(activeTab === 'all' || activeTab === 'timeline') && (
          <Timeline
            papers={data.papers}
            onSelectPaper={(paper) => setSelectedPaper(paper)}
          />
        )}

        {/* Section 3: Research Evolution Summary */}
        {(activeTab === 'all' || activeTab === 'summary') && (
          <ResearchEvolutionSummary summary={data.summary} />
        )}
      </main>

      {/* Interactive Paper Popup Modal */}
      <PaperModal
        paper={selectedPaper}
        onClose={() => setSelectedPaper(null)}
      />
    </div>
  );
};
