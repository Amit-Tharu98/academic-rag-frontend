import { ChangeDetectorRef, Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ApiService } from '../../services/api';

@Component({
  selector: 'app-compare-models',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './compare-models.html',

  styleUrl: './compare-models.scss',
})
export class CompareModels {
  comparisonMode: 'research' | 'uploaded' = 'research';

  question = '';

  topK = 5;

  loading = false;

  errorMessage = '';

  comparisonResult: any = null;

  // Uploaded document

  selectedFile: File | null = null;

  uploading = false;

  uploadError = '';

  uploadResult: any = null;
  comparisonTask:
  'qa' |
  'summary'
  = 'qa';


summaryTopic = '';

summaryLength = 'medium';

summaryTopK = 5;

summaryLoading = false;

summaryError = '';

summaryComparisonResult: any = null;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  setMode(mode: 'research' | 'uploaded'): void {
    this.comparisonMode = mode;

    this.comparisonResult = null;

    this.errorMessage = '';

    this.question = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      this.uploadError = 'Please select a PDF file.';

      this.selectedFile = null;

      return;
    }

    this.selectedFile = file;

    this.uploadError = '';

    this.uploadResult = null;

    this.comparisonResult = null;
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Please select a PDF file first.';

      return;
    }

    this.uploading = true;

    this.uploadError = '';

    this.uploadResult = null;

    this.comparisonResult = null;

    this.apiService.uploadPdf(this.selectedFile).subscribe({
      next: (response: any) => {
        console.log('Comparison upload response:', response);

        this.uploadResult = response;

        this.uploading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Comparison upload error:', error);

        this.uploadError = error?.error?.detail ?? 'Unable to process the PDF.';

        this.uploading = false;

        this.cdr.detectChanges();
      },
    });
  }

  compareModels(): void {
    const cleanQuestion = this.question.trim();

    if (!cleanQuestion) {
      this.errorMessage = 'Please enter a question.';

      return;
    }

    if (this.comparisonMode === 'uploaded' && !this.uploadResult?.document_id) {
      this.errorMessage = 'Please upload and process a PDF first.';

      return;
    }

    this.loading = true;

    this.errorMessage = '';

    this.comparisonResult = null;

    if (this.comparisonMode === 'research') {
      this.compareResearchCorpus(cleanQuestion);

      return;
    }

    this.compareUploadedPdf(cleanQuestion);
  }

  private compareResearchCorpus(cleanQuestion: string): void {
    const request = {
      question: cleanQuestion,

      top_k: Number(this.topK),
    };

    console.log('Research comparison request:', request);

    this.apiService.compareModels(request).subscribe({
      next: (response: any) => {
        console.log('Research comparison response:', response);

        this.comparisonResult = response;

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        this.handleComparisonError(error);
      },
    });
  }

  private compareUploadedPdf(cleanQuestion: string): void {
    const request = {
      document_id: this.uploadResult.document_id,

      question: cleanQuestion,

      top_k: Number(this.topK),
    };

    console.log('Uploaded comparison request:', request);

    this.apiService.compareUploadedPdf(request).subscribe({
      next: (response: any) => {
        console.log('Uploaded comparison response:', response);

        this.comparisonResult = response;

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        this.handleComparisonError(error);
      },
    });
  }

  private handleComparisonError(error: any): void {
    console.error('Comparison API error:', error);

    this.errorMessage = error?.error?.detail ?? 'Unable to compare embedding models.';

    this.loading = false;

    this.cdr.detectChanges();
  }

  formatModelName(model: string): string {
    if (model === 'sentence_transformer') {
      return 'Sentence Transformer';
    }

    if (model === 'bge') {
      return 'BGE';
    }

    if (model === 'openai') {
      return 'OpenAI';
    }

    return model;
  }

  formatScore(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return Number(value).toFixed(4);
  }

  formatTime(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return Number(value).toFixed(4);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  setComparisonTask(
  task: 'qa' | 'summary',
): void {

  this.comparisonTask =
    task;

  this.comparisonResult =
    null;

  this.summaryComparisonResult =
    null;

  this.errorMessage =
    '';

  this.summaryError =
    '';
}

compareTopicSummary(): void {

  if (
    !this.uploadResult?.document_id
  ) {

    this.summaryError =
      'Please upload and process a PDF first.';

    return;
  }


  const cleanTopic =
    this.summaryTopic.trim();


  if (!cleanTopic) {

    this.summaryError =
      'Please enter a topic.';

    return;
  }


  this.summaryLoading = true;

  this.summaryError = '';

  this.summaryComparisonResult =
    null;


  const request = {

    document_id:
      this.uploadResult.document_id,

    topic:
      cleanTopic,

    top_k:
      Number(this.summaryTopK),

    summary_length:
      this.summaryLength,

  };


  console.log(
    'Summary comparison request:',
    request,
  );


  this.apiService
    .compareSummaries(
      request,
    )
    .subscribe({

      next: (response: any) => {

        console.log(
          'Summary comparison response:',
          response,
        );

        this.summaryComparisonResult =
          response;

        this.summaryLoading =
          false;

        this.cdr
          .detectChanges();
      },


      error: (error) => {

        console.error(
          'Summary comparison error:',
          error,
        );

        this.summaryError =
          error?.error?.detail
          ??
          'Unable to compare topic summaries.';

        this.summaryLoading =
          false;

        this.cdr
          .detectChanges();
      },

    });

}
}
