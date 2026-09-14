import { ChangeDetectorRef, Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ApiService } from '../../services/api';

@Component({
  selector: 'app-upload-analyse',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './upload-analyse.html',

  styleUrl: './upload-analyse.scss',
})
export class UploadAnalyse {
  selectedFile: File | null = null;

  uploading = false;

  errorMessage = '';

  uploadResult: any = null;

  // Uploaded document question section

  selectedModel = 'sentence_transformer';

  topK = 5;

  question = '';

  askingQuestion = false;

  questionError = '';

  questionResult: any = null;

  // Summary section

summaryType = 'full_paper';

summaryLength = 'medium';

summaryTopic = '';

summaryModel = 'sentence_transformer';

summaryTopK = 5;

generatingSummary = false;

summaryError = '';

summaryResult: any = null;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      this.errorMessage = 'Please select a PDF file.';

      this.selectedFile = null;

      return;
    }

    this.selectedFile = file;

    this.errorMessage = '';

    this.uploadResult = null;

    this.questionResult = null;

    this.question = '';

    this.questionError = '';
    this.summaryResult = null;

this.summaryTopic = '';

this.summaryError = '';
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a PDF file first.';

      return;
    }

    this.uploading = true;

    this.errorMessage = '';

    this.uploadResult = null;

    this.questionResult = null;
    this.summaryResult = null;

    this.apiService.uploadPdf(this.selectedFile).subscribe({
      next: (response: any) => {
        console.log('Upload response:', response);

        this.uploadResult = response;

        this.uploading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Upload error:', error);

        this.errorMessage = error?.error?.detail ?? 'Unable to process the PDF.';

        this.uploading = false;

        this.cdr.detectChanges();
      },
    });
  }

  askUploadedDocument(): void {
    const cleanQuestion = this.question.trim();

    if (!this.uploadResult?.document_id) {
      this.questionError = 'Please upload a document first.';

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

    console.log('Uploaded document question request:', request);

    this.apiService.askUploadedPdf(request).subscribe({
      next: (response: any) => {
        console.log('Uploaded document answer:', response);

        this.questionResult = response;

        this.askingQuestion = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Uploaded document question error:', error);

        this.questionError = error?.error?.detail ?? 'Unable to generate an answer.';

        this.askingQuestion = false;

        this.cdr.detectChanges();
      },
    });
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

  generateSummary(): void {

  if (!this.uploadResult?.document_id) {

    this.summaryError =
      'Please upload a document first.';

    return;
  }


  if (
    this.summaryType ===
    'topic_focused' &&
    !this.summaryTopic.trim()
  ) {

    this.summaryError =
      'Please enter a topic for the topic-focused summary.';

    return;
  }


  this.generatingSummary = true;

  this.summaryError = '';

  this.summaryResult = null;


  const request: any = {

    document_id:
      this.uploadResult.document_id,

    summary_type:
      this.summaryType,

    summary_length:
      this.summaryLength,

  };


  if (
    this.summaryType ===
    'topic_focused'
  ) {

    request.topic =
      this.summaryTopic.trim();

    request.embedding_model =
      this.summaryModel;

    request.top_k =
      Number(this.summaryTopK);

  }


  console.log(
    'Summary request:',
    request,
  );


  this.apiService
    .generateSummary(
      request,
    )
    .subscribe({

      next: (response: any) => {

        console.log(
          'Summary response:',
          response,
        );

        this.summaryResult =
          response;

        this.generatingSummary =
          false;

        this.cdr
          .detectChanges();

      },


      error: (error) => {

        console.error(
          'Summary error:',
          error,
        );

        this.summaryError =
          error?.error?.detail
          ??
          'Unable to generate the summary.';

        this.generatingSummary =
          false;

        this.cdr
          .detectChanges();

      },

    });

}
}
