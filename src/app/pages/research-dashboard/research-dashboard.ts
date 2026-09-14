import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../services/api';


@Component({
  selector: 'app-research-dashboard',
  standalone: true,

  imports: [
    CommonModule,
  ],

  templateUrl: './research-dashboard.html',
  styleUrl: './research-dashboard.scss',
})
export class ResearchDashboard implements OnInit {

  overview: any = null;

  retrievalResults: any[] = [];

  generationResults: any[] = [];

  loading = true;

  errorMessage = '';


  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}


  ngOnInit(): void {
    this.loadResearchData();
  }


  loadResearchData(): void {

    this.loading = true;
    this.errorMessage = '';

    forkJoin({

      overview:
        this.apiService.getResearchOverview(),

      retrieval:
        this.apiService.getRetrievalResults(),

      generation:
        this.apiService.getGenerationResults(),

    }).subscribe({

      next: (response: any) => {

        this.overview =
          response.overview;

        this.retrievalResults =
          response.retrieval?.results ?? [];

        this.generationResults =
          response.generation?.results ?? [];

        this.loading = false;

        this.cdr.detectChanges();
      },


      error: (error) => {

        console.error(
          'Research dashboard API error:',
          error
        );

        this.errorMessage =
          'Unable to load research results.';

        this.loading = false;

        this.cdr.detectChanges();
      },

    });
  }


  // ------------------------------------------------
  // Formatting
  // ------------------------------------------------

  formatPercent(
    value: number,
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return (
      Number(value) * 100
    ).toFixed(2) + '%';
  }


  formatNumber(
    value: number,
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return Number(value)
      .toFixed(4);
  }


  formatModelName(
    model: string,
  ): string {

    if (!model) {
      return '';
    }

    if (model === 'openai') {
      return 'OpenAI';
    }

    if (model === 'bge') {
      return 'BGE';
    }

    if (
      model ===
      'sentence_transformer'
    ) {
      return 'Sentence Transformer';
    }

    return model;
  }


  // ------------------------------------------------
  // Chart helpers
  // ------------------------------------------------

  getTop5Width(
    value: number,
  ): number {

    return Number(value) * 100;
  }


  getMrrWidth(
    value: number,
  ): number {

    return Number(value) * 100;
  }


  getRougeWidth(
    value: number,
  ): number {

    return Number(value) * 100;
  }


  getRetrievalTimeWidth(
    value: number,
  ): number {

    if (
      !this.retrievalResults.length
    ) {
      return 0;
    }

    const maxTime =
      Math.max(
        ...this.retrievalResults.map(
          result =>
            Number(
              result.retrieval_time
            )
        )
      );

    if (maxTime === 0) {
      return 0;
    }

    return (
      Number(value) / maxTime
    ) * 100;
  }

}