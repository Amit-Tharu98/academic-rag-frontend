import {
  ChangeDetectorRef,
  Component,
} from '@angular/core';

import {
  CommonModule,
} from '@angular/common';

import {
  FormsModule,
} from '@angular/forms';

import {
  ApiService,
} from '../../services/api';


@Component({
  selector: 'app-ask-question',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  templateUrl: './ask-question.html',

  styleUrl: './ask-question.scss',
})
export class AskQuestion {

  selectedModel = 'sentence_transformer';

  question = '';

  topK = 5;

  loading = false;

  errorMessage = '';

  result: any = null;


  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}


  askQuestion(): void {

    const cleanQuestion =
      this.question.trim();


    if (!cleanQuestion) {

      this.errorMessage =
        'Please enter a question.';

      return;
    }


    this.loading = true;

    this.errorMessage = '';

    this.result = null;


    const request = {

      question:
        cleanQuestion,

      embedding_model:
        this.selectedModel,

      top_k:
        Number(this.topK),

    };


    this.apiService
      .askQuestion(request)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Ask response:',
            response
          );

          this.result =
            response;

          this.loading =
            false;

          this.cdr
            .detectChanges();

        },


        error: (error) => {

          console.error(
            'Ask API error:',
            error
          );

          this.errorMessage =
            error?.error?.detail
            ??
            'Unable to generate an answer.';

          this.loading =
            false;

          this.cdr
            .detectChanges();

        },

      });

  }


  formatModelName(
    model: string,
  ): string {

    if (
      model ===
      'sentence_transformer'
    ) {
      return 'Sentence Transformer';
    }

    if (
      model ===
      'bge'
    ) {
      return 'BGE';
    }

    if (
      model ===
      'openai'
    ) {
      return 'OpenAI';
    }

    return model;
  }


  formatScore(
    value: number | null | undefined,
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return Number(
      value
    ).toFixed(4);
  }


  formatTime(
    value: number | null | undefined,
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return Number(
      value
    ).toFixed(4);
  }

}