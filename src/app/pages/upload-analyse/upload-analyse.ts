import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../services/api';

type EmbeddingModel = 'sentence_transformer' | 'bge' | 'openai';
type SummaryType = 'full_paper' | 'topic_focused';
type SummaryLength = 'short' | 'medium' | 'detailed';

interface UploadResult {
  document_id: string;
  status?: string;
  document_count?: number;
  filename?: string;
  filenames?: string[];
  pages?: number;
  chunks?: number;
  chunk_size?: number;
  chunk_overlap?: number;
}

interface SourceResult {
  rank: number;
  chunk_id: string;
  source: string;
  page: number;
  score: number;
}

interface QuestionResult {
  embedding_model: EmbeddingModel;
  answer: string;
  retrieval_time: number;
  top_similarity_score?: number | null;
  average_similarity_score?: number | null;
  sources: SourceResult[];
}

interface SummaryResult {
  summary_type: SummaryType;
  summary_length: SummaryLength;
  summary: string;
  topic?: string | null;
  embedding_model?: EmbeddingModel | null;
  chunks_processed?: number;
  sections_summarised?: number;
  top_similarity_score?: number | null;
  average_similarity_score?: number | null;
  sources?: SourceResult[];
}

interface SummaryRequest {
  document_id: string;
  summary_type: SummaryType;
  summary_length: SummaryLength;
  topic?: string;
  embedding_model?: EmbeddingModel;
  top_k?: number;
}

@Component({
  selector: 'app-upload-analyse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-analyse.html',
  styleUrl: './upload-analyse.scss',
})
export class UploadAnalyse {
  readonly MAX_FILES = 10;
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  readonly MAX_TOTAL_SIZE = 50 * 1024 * 1024;

  selectedFiles: File[] = [];
  uploading = false;
  errorMessage = '';
  uploadResult: UploadResult | null = null;

  selectedModel: EmbeddingModel = 'sentence_transformer';
  topK = 5;
  question = '';
  askingQuestion = false;
  questionError = '';
  questionResult: QuestionResult | null = null;

  summaryType: SummaryType = 'full_paper';
  summaryLength: SummaryLength = 'medium';
  summaryTopic = '';
  summaryModel: EmbeddingModel = 'sentence_transformer';
  summaryTopK = 5;
  generatingSummary = false;
  summaryError = '';
  summaryResult: SummaryResult | null = null;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

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

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (!files.length) {
      return;
    }

    const invalidFiles = files.filter(file => !this.isPdf(file));

    if (invalidFiles.length) {
      this.errorMessage = 'Only PDF documents can be uploaded.';
      input.value = '';
      return;
    }

    const oversizedFile = files.find(file => file.size > this.MAX_FILE_SIZE);

    if (oversizedFile) {
      this.errorMessage = `${oversizedFile.name} exceeds the 10 MB file-size limit.`;
      input.value = '';
      return;
    }

    const emptyFile = files.find(file => file.size === 0);

    if (emptyFile) {
      this.errorMessage = `${emptyFile.name} is empty and cannot be uploaded.`;
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
      this.errorMessage = `You can upload a maximum of ${this.MAX_FILES} PDF documents per collection.`;
      input.value = '';
      return;
    }

    const combinedSize = combinedFiles.reduce(
      (total, file) => total + file.size,
      0,
    );

    if (combinedSize > this.MAX_TOTAL_SIZE) {
      this.errorMessage = 'The selected documents exceed the 50 MB collection limit.';
      input.value = '';
      return;
    }

    this.selectedFiles = combinedFiles;
    this.errorMessage = '';

    // Allow the same input to be used again after adding files.
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, fileIndex) => fileIndex !== index);
  }

  clearSelectedFiles(): void {
    this.selectedFiles = [];
    this.errorMessage = '';
  }

  uploadDocuments(): void {
    if (!this.selectedFiles.length) {
      this.errorMessage = 'Please select at least one PDF document.';
      return;
    }

    const validationError = this.validateSelectedFiles();

    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.uploading = true;
    this.errorMessage = '';
    this.clearAnalysisResults();

    /*
     * The API method should send all selected files in one multipart request
     * using the field name "files".
     */
    this.apiService.uploadPdfs(this.selectedFiles).subscribe({
      next: (response: UploadResult) => {
        this.uploadResult = response;
        this.uploading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Document upload failed:', error);
        this.errorMessage =
          error?.error?.detail ?? 'Unable to process the selected documents.';
        this.uploading = false;
        this.cdr.detectChanges();
      },
    });
  }

  askUploadedDocuments(): void {
    const cleanQuestion = this.question.trim();

    if (!this.uploadResult?.document_id) {
      this.questionError = 'Please upload and process your documents first.';
      return;
    }

    if (!cleanQuestion) {
      this.questionError = 'Please enter a question.';
      return;
    }

    this.askingQuestion = true;
    this.questionError = '';
    this.questionResult = null;

    const request = {
      document_id: this.uploadResult.document_id,
      embedding_model: this.selectedModel,
      question: cleanQuestion,
      top_k: Number(this.topK),
    };

    this.apiService.askUploadedPdf(request).subscribe({
      next: (response: QuestionResult) => {
        this.questionResult = response;
        this.askingQuestion = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Question request failed:', error);
        this.questionError =
          error?.error?.detail ?? 'Unable to generate an answer.';
        this.askingQuestion = false;
        this.cdr.detectChanges();
      },
    });
  }

  generateSummary(): void {
    if (!this.uploadResult?.document_id) {
      this.summaryError = 'Please upload and process your documents first.';
      return;
    }

    if (this.summaryType === 'topic_focused' && !this.summaryTopic.trim()) {
      this.summaryError = 'Please enter a topic for the topic-focused summary.';
      return;
    }

    this.generatingSummary = true;
    this.summaryError = '';
    this.summaryResult = null;

    const request: SummaryRequest = {
      document_id: this.uploadResult.document_id,
      summary_type: this.summaryType,
      summary_length: this.summaryLength,
    };

    if (this.summaryType === 'topic_focused') {
      request.topic = this.summaryTopic.trim();
      request.embedding_model = this.summaryModel;
      request.top_k = Number(this.summaryTopK);
    }

    this.apiService.generateSummary(request).subscribe({
      next: (response: SummaryResult) => {
        this.summaryResult = response;
        this.generatingSummary = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Summary request failed:', error);
        this.summaryError =
          error?.error?.detail ?? 'Unable to generate the summary.';
        this.generatingSummary = false;
        this.cdr.detectChanges();
      },
    });
  }

  setSummaryType(type: SummaryType): void {
    this.summaryType = type;
    this.summaryError = '';
    this.summaryResult = null;
  }

  useExampleQuestion(question: string): void {
    this.question = question;
    this.questionError = '';
  }

  clearQuestion(): void {
    this.question = '';
    this.questionError = '';
    this.questionResult = null;
  }

  startNewCollection(): void {
    this.selectedFiles = [];
    this.uploadResult = null;
    this.errorMessage = '';
    this.question = '';
    this.summaryTopic = '';
    this.clearAnalysisResults();
  }

  modelDescription(model: EmbeddingModel): string {
    const descriptions: Record<EmbeddingModel, string> = {
      sentence_transformer: 'Fast local embedding model.',
      bge: 'Strong open-source retrieval model.',
      openai: 'API-based embedding model used in the comparison.',
    };

    return descriptions[model];
  }

  formatModelName(model?: string | null): string {
    const names: Record<string, string> = {
      sentence_transformer: 'Sentence Transformer',
      bge: 'BGE',
      openai: 'OpenAI',
    };

    return model ? (names[model] ?? model) : '—';
  }

  formatNumber(value: number | null | undefined): string {
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

  titleCase(value?: string | null): string {
    if (!value) {
      return '—';
    }

    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  private validateSelectedFiles(): string | null {
    if (this.selectedFiles.length > this.MAX_FILES) {
      return `You can upload a maximum of ${this.MAX_FILES} PDF documents per collection.`;
    }

    for (const file of this.selectedFiles) {
      if (!this.isPdf(file)) {
        return `${file.name} is not a PDF document.`;
      }

      if (file.size === 0) {
        return `${file.name} is empty and cannot be uploaded.`;
      }

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

  private clearAnalysisResults(): void {
    this.questionResult = null;
    this.questionError = '';
    this.summaryResult = null;
    this.summaryError = '';
  }
}
