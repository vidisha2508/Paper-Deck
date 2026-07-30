/**
 * PaperDeck Research Evolution Timeline - Data Types
 */

export interface PaperData {
  id: string;
  title: string;
  year: number;
  authors: string[];
  contribution: string;
  methodology: string;
  limitation: string;
  future_scope: string;
  citation_count: number;
}

export interface EvolutionSummaryData {
  major_breakthroughs: string[];
  methodology_evolution: string;
  current_state: string;
}

export interface ResearchGapData {
  id?: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface InfluentialPaper {
  id: string;
  title: string;
  reason: string;
  year: number;
}

export interface MostCitedPaper {
  id: string;
  title: string;
  citation_count: number;
  year: number;
}

export interface MethodologyShift {
  title: string;
  from_method: string;
  to_method: string;
  impact: string;
  year: number;
}

export interface EmergingTrend {
  trend: string;
  description: string;
  key_papers: string[];
}

export interface KeyTurningPointsData {
  most_influential_paper: InfluentialPaper;
  most_cited_paper: MostCitedPaper;
  biggest_methodology_shift: MethodologyShift;
  emerging_trend: EmergingTrend;
}

export interface ResearchEvolutionDataset {
  topic: string;
  papers: PaperData[];
  summary: EvolutionSummaryData;
  gaps: ResearchGapData[];
  turning_points: KeyTurningPointsData;
}
