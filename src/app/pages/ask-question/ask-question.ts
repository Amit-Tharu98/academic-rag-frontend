import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ApiService } from '../../services/api';

type EmbeddingModel = 'sentence_transformer' | 'bge' | 'openai';

interface RetrievedSource {
  rank: number;
  chunk_id: string;
  source: string;
  page: number;
  score: number;
}

interface AskQuestionResponse {
  embedding_model: EmbeddingModel;
  answer: string;
  retrieval_time: number;
  top_similarity_score?: number | null;
  average_similarity_score?: number | null;
  sources: RetrievedSource[];
}

@Component({
  selector: 'app-ask-question',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ask-question.html',
  styleUrl: './ask-question.scss',
})
export class AskQuestion {
  selectedModel: EmbeddingModel = 'sentence_transformer';
  question = '';
  topK = 5;

  loading = false;
  errorMessage = '';
  result: AskQuestionResponse | null = null;

  readonly modelOptions: Array<{ value: EmbeddingModel; label: string; description: string }> = [
    {
      value: 'sentence_transformer',
      label: 'Sentence Transformer',
      description: 'Fast local embedding model',
    },
    {
      value: 'bge',
      label: 'BGE',
      description: 'Strong open-source retrieval model',
    },
    {
      value: 'openai',
      label: 'OpenAI',
      description: 'Best overall benchmark performance',
    },
  ];

  readonly topKOptions = [3, 5, 10];

  readonly exampleQuestions = [
    'What are the main limitations of retrieval-augmented generation?',
    'How do embedding models affect semantic retrieval quality?',
    'What evaluation metrics are commonly used for RAG systems?',
  ];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  askQuestion(): void {
    const cleanQuestion = this.question.trim();

    if (!cleanQuestion) {
      this.errorMessage = 'Please enter a question before generating an answer.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.result = null;

    const request = {
      question: cleanQuestion,
      embedding_model: this.selectedModel,
      top_k: Number(this.topK),
    };

    this.apiService
      .askQuestion(request)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: AskQuestionResponse) => {
          this.result = response;
        },
        error: (error) => {
          console.error('Ask question request failed:', error);
          this.errorMessage =
            error?.error?.detail ?? 'Unable to generate an answer. Please try again.';
        },
      });
  }

  useExample(question: string): void {
    this.question = question;
    this.errorMessage = '';
  }

  clearQuestion(): void {
    this.question = '';
    this.result = null;
    this.errorMessage = '';
  }

  formatModelName(model: string): string {
    return this.modelOptions.find((option) => option.value === model)?.label ?? model;
  }

  formatScore(value: number | null | undefined): string {
    return value == null ? '-' : Number(value).toFixed(4);
  }

  formatTime(value: number | null | undefined): string {
    return value == null ? '-' : Number(value).toFixed(4);
  }
}
