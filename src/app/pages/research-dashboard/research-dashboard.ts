import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../services/api';

interface CorpusInfo {
  documents: number;
  pages: number;
  chunks: number;
  evaluation_questions: number;
  top_k?: number;
}

interface FindingValue {
  model: string;
  value: number;
}

interface FastestModelFinding {
  model: string;
  retrieval_time: number;
}

interface ResearchOverview {
  corpus: CorpusInfo;
  retrieval_findings: {
    best_top5_accuracy: FindingValue;
    best_mrr: FindingValue;
    fastest_model: FastestModelFinding;
  };
  generation_findings: {
    best_rouge1?: FindingValue;
    best_rouge2?: FindingValue;
    best_rougeL: FindingValue;
  };
  interpretation: string;
}

interface RetrievalResult {
  model: string;
  'precision@1': number;
  'precision@3'?: number;
  'precision@5'?: number;
  'recall@1'?: number;
  'recall@3'?: number;
  'recall@5': number;
  top1_accuracy?: number;
  top3_accuracy?: number;
  top5_accuracy: number;
  reciprocal_rank: number;
  retrieval_time: number;
}

interface GenerationResult {
  model: string;
  rouge1: number;
  rouge2: number;
  rougeL: number;
  retrieval_time: number;
}

interface ResultsResponse<T> {
  results: T[];
}

interface DashboardResponse {
  overview: ResearchOverview;
  retrieval: ResultsResponse<RetrievalResult>;
  generation: ResultsResponse<GenerationResult>;
}

type StatIcon = 'document' | 'pages' | 'chunks' | 'questions';

interface MetricCard {
  label: string;
  value: number | string;
  note: string;
  icon: StatIcon;
}

@Component({
  selector: 'app-research-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './research-dashboard.html',
  styleUrl: './research-dashboard.scss',
})
export class ResearchDashboard implements OnInit {
  overview: ResearchOverview | null = null;
  retrievalResults: RetrievalResult[] = [];
  generationResults: GenerationResult[] = [];

  loading = true;
  errorMessage = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadResearchData();
  }

  loadResearchData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      overview: this.apiService.getResearchOverview(),
      retrieval: this.apiService.getRetrievalResults(),
      generation: this.apiService.getGenerationResults(),
    }).subscribe({
      next: (response: DashboardResponse) => {
        this.overview = response.overview;
        this.retrievalResults = response.retrieval?.results ?? [];
        this.generationResults = response.generation?.results ?? [];
        this.finishLoading();
      },
      error: (error) => {
        console.error('Unable to load research dashboard data:', error);
        this.errorMessage = 'The research results could not be loaded. Please try again.';
        this.finishLoading();
      },
    });
  }

  get corpusStats(): MetricCard[] {
    if (!this.overview) {
      return [];
    }

    const corpus = this.overview.corpus;

    return [
      { label: 'Documents', value: corpus.documents, note: 'Academic papers', icon: 'document' },
      { label: 'Pages', value: corpus.pages, note: 'Processed pages', icon: 'pages' },
      { label: 'Chunks', value: corpus.chunks.toLocaleString(), note: 'Searchable passages', icon: 'chunks' },
      { label: 'Questions', value: corpus.evaluation_questions, note: 'Benchmark queries', icon: 'questions' },
    ];
  }

  formatModelName(model: string): string {
    const modelNames: Record<string, string> = {
      openai: 'OpenAI',
      bge: 'BGE',
      sentence_transformer: 'Sentence Transformer',
    };

    return modelNames[model] ?? model;
  }

  formatPercent(value: number | null | undefined): string {
    return this.hasValue(value) ? `${(Number(value) * 100).toFixed(2)}%` : '-';
  }

  formatNumber(value: number | null | undefined): string {
    return this.hasValue(value) ? Number(value).toFixed(4) : '-';
  }

  formatTime(value: number | null | undefined): string {
    return this.hasValue(value) ? `${Number(value).toFixed(4)} s` : '-';
  }

  getMetricWidth(value: number): number {
    return this.clamp(Number(value) * 100);
  }

  getRetrievalTimeWidth(value: number): number {
    const times = this.retrievalResults.map((result) => Number(result.retrieval_time));
    const maxTime = Math.max(...times, 0);

    return maxTime ? this.clamp((Number(value) / maxTime) * 100) : 0;
  }

  isBestTop5(result: RetrievalResult): boolean {
    return result.model === this.overview?.retrieval_findings.best_top5_accuracy.model;
  }

  isBestMrr(result: RetrievalResult): boolean {
    return result.model === this.overview?.retrieval_findings.best_mrr.model;
  }

  isFastest(result: RetrievalResult): boolean {
    return result.model === this.overview?.retrieval_findings.fastest_model.model;
  }

  isBestRougeL(result: GenerationResult): boolean {
    return result.model === this.overview?.generation_findings.best_rougeL.model;
  }

  private finishLoading(): void {
    this.loading = false;
    this.cdr.detectChanges();
  }

  private hasValue(value: number | null | undefined): boolean {
    return value !== null && value !== undefined && !Number.isNaN(Number(value));
  }

  private clamp(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }
}
