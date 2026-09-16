import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../services/api';

type ComparisonMode = 'research' | 'uploaded';
type ComparisonTask = 'qa' | 'summary';
type SummaryLength = 'short' | 'medium' | 'detailed';

interface UploadResult {
  document_id: string;
  filename?: string;
  filenames?: string[];
  document_count?: number;
  status?: string;
  pages?: number;
  chunks?: number;
  chunk_size?: number;
  chunk_overlap?: number;
}

@Component({
  selector: 'app-compare-models',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compare-models.html',
  styleUrl: './compare-models.scss',
})
export class CompareModels {
  readonly MAX_FILES = 10;
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  readonly MAX_TOTAL_SIZE = 50 * 1024 * 1024;

  comparisonMode: ComparisonMode = 'research';
  comparisonTask: ComparisonTask = 'qa';

  question = '';
  topK = 5;
  loading = false;
  errorMessage = '';
  comparisonResult: any = null;

  selectedFiles: File[] = [];
  uploading = false;
  uploadError = '';
  uploadResult: UploadResult | null = null;

  summaryTopic = '';
  summaryLength: SummaryLength = 'medium';
  summaryTopK = 5;
  summaryLoading = false;
  summaryError = '';
  summaryComparisonResult: any = null;

  get totalSelectedSize(): number {
    return this.selectedFiles.reduce((total, file) => total + file.size, 0);
  }

  get processedDocumentCount(): number {
    return this.uploadResult?.document_count
      ?? this.uploadResult?.filenames?.length
      ?? (this.uploadResult?.filename ? 1 : 0);
  }

  get processedFilenames(): string[] {
    if (this.uploadResult?.filenames?.length) {
      return this.uploadResult.filenames;
    }
    return this.uploadResult?.filename ? [this.uploadResult.filename] : [];
  }

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  setMode(mode: ComparisonMode): void {
    if (this.comparisonMode === mode) {
      return;
    }

    this.comparisonMode = mode;
    this.comparisonResult = null;
    this.summaryComparisonResult = null;
    this.errorMessage = '';
    this.summaryError = '';
    this.question = '';
  }

  setComparisonTask(task: ComparisonTask): void {
    this.comparisonTask = task;
    this.comparisonResult = null;
    this.summaryComparisonResult = null;
    this.errorMessage = '';
    this.summaryError = '';
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (!files.length) return;

    const invalidFile = files.find(file => !this.isPdf(file));
    if (invalidFile) {
      this.uploadError = `${invalidFile.name} is not a PDF document.`;
      input.value = '';
      return;
    }

    const emptyFile = files.find(file => file.size === 0);
    if (emptyFile) {
      this.uploadError = `${emptyFile.name} is empty and cannot be uploaded.`;
      input.value = '';
      return;
    }

    const oversizedFile = files.find(file => file.size > this.MAX_FILE_SIZE);
    if (oversizedFile) {
      this.uploadError = `${oversizedFile.name} exceeds the 10 MB file-size limit.`;
      input.value = '';
      return;
    }

    const existing = new Set(
      this.selectedFiles.map(file => `${file.name}-${file.size}-${file.lastModified}`),
    );

    const newFiles = files.filter(
      file => !existing.has(`${file.name}-${file.size}-${file.lastModified}`),
    );

    const combinedFiles = [...this.selectedFiles, ...newFiles];

    if (combinedFiles.length > this.MAX_FILES) {
      this.uploadError = `You can upload a maximum of ${this.MAX_FILES} PDF documents per collection.`;
      input.value = '';
      return;
    }

    const combinedSize = combinedFiles.reduce((total, file) => total + file.size, 0);
    if (combinedSize > this.MAX_TOTAL_SIZE) {
      this.uploadError = 'The selected documents exceed the 50 MB collection limit.';
      input.value = '';
      return;
    }

    this.selectedFiles = combinedFiles;
    this.uploadError = '';
    this.uploadResult = null;
    this.comparisonResult = null;
    this.summaryComparisonResult = null;
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
    this.uploadError = '';
  }

  clearSelectedFiles(): void {
    this.selectedFiles = [];
    this.uploadError = '';
  }

  uploadDocuments(): void {
    if (!this.selectedFiles.length) {
      this.uploadError = 'Please select at least one PDF document.';
      return;
    }

    const validationError = this.validateSelectedFiles();
    if (validationError) {
      this.uploadError = validationError;
      return;
    }

    this.uploading = true;
    this.uploadError = '';
    this.uploadResult = null;
    this.comparisonResult = null;
    this.summaryComparisonResult = null;

    this.apiService.uploadPdfs(this.selectedFiles).subscribe({
      next: (response: UploadResult) => {
        this.uploadResult = response;
        this.uploading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Comparison collection upload error:', error);
        this.uploadError =
          error?.error?.detail ?? 'Unable to process the selected documents.';
        this.uploading = false;
        this.cdr.detectChanges();
      },
    });
  }

  startNewCollection(): void {
    this.selectedFiles = [];
    this.uploadResult = null;
    this.uploadError = '';
    this.question = '';
    this.summaryTopic = '';
    this.comparisonResult = null;
    this.summaryComparisonResult = null;
    this.errorMessage = '';
    this.summaryError = '';
  }

  compareModels(): void {
    const cleanQuestion = this.question.trim();

    if (!cleanQuestion) {
      this.errorMessage = 'Please enter a question.';
      return;
    }

    if (this.comparisonMode === 'uploaded' && !this.uploadResult?.document_id) {
      this.errorMessage = 'Please upload and process your PDF collection first.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.comparisonResult = null;

    if (this.comparisonMode === 'research') {
      this.compareResearchCorpus(cleanQuestion);
      return;
    }

    this.compareUploadedCollection(cleanQuestion);
  }

  compareTopicSummary(): void {
    if (!this.uploadResult?.document_id) {
      this.summaryError = 'Please upload and process your PDF collection first.';
      return;
    }

    const cleanTopic = this.summaryTopic.trim();

    if (!cleanTopic) {
      this.summaryError = 'Please enter a topic.';
      return;
    }

    this.summaryLoading = true;
    this.summaryError = '';
    this.summaryComparisonResult = null;

    const request = {
      document_id: this.uploadResult.document_id,
      topic: cleanTopic,
      top_k: Number(this.summaryTopK),
      summary_length: this.summaryLength,
    };

    this.apiService.compareSummaries(request).subscribe({
      next: (response: any) => {
        this.summaryComparisonResult = response;
        this.summaryLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Summary comparison error:', error);
        this.summaryError =
          error?.error?.detail ?? 'Unable to compare topic summaries.';
        this.summaryLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private compareResearchCorpus(cleanQuestion: string): void {
    const request = {
      question: cleanQuestion,
      top_k: Number(this.topK),
    };

    this.apiService.compareModels(request).subscribe({
      next: (response: any) => {
        this.comparisonResult = response;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => this.handleComparisonError(error),
    });
  }

  private compareUploadedCollection(cleanQuestion: string): void {
    if (!this.uploadResult?.document_id) {
      this.errorMessage = 'Please upload and process your PDF collection first.';
      this.loading = false;
      return;
    }

    const request = {
      document_id: this.uploadResult.document_id,
      question: cleanQuestion,
      top_k: Number(this.topK),
    };

    this.apiService.compareUploadedPdf(request).subscribe({
      next: (response: any) => {
        this.comparisonResult = response;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => this.handleComparisonError(error),
    });
  }

  private handleComparisonError(error: any): void {
    console.error('Comparison API error:', error);
    this.errorMessage =
      error?.error?.detail ?? 'Unable to compare embedding models.';
    this.loading = false;
    this.cdr.detectChanges();
  }

  formatModelName(model: string): string {
    const names: Record<string, string> = {
      sentence_transformer: 'Sentence Transformer',
      bge: 'BGE',
      openai: 'OpenAI',
    };

    return names[model] ?? model;
  }

  formatScore(value: number | null | undefined): string {
    return value === null || value === undefined
      ? '—'
      : Number(value).toFixed(4);
  }

  formatTime(value: number | null | undefined): string {
    return value === null || value === undefined
      ? '—'
      : Number(value).toFixed(4);
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

  private validateSelectedFiles(): string | null {
    if (this.selectedFiles.length > this.MAX_FILES) {
      return `You can upload a maximum of ${this.MAX_FILES} PDF documents per collection.`;
    }

    for (const file of this.selectedFiles) {
      if (!this.isPdf(file)) return `${file.name} is not a PDF document.`;
      if (file.size === 0) return `${file.name} is empty and cannot be uploaded.`;
      if (file.size > this.MAX_FILE_SIZE) {
        return `${file.name} exceeds the 10 MB file-size limit.`;
      }
    }

    if (this.totalSelectedSize > this.MAX_TOTAL_SIZE) {
      return 'The selected documents exceed the 50 MB collection limit.';
    }

    return null;
  }

  private isPdf(file: File): boolean {
    return file.type === 'application/pdf'
      || file.name.toLowerCase().endsWith('.pdf');
  }
}
