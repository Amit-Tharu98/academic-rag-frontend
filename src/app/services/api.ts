import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) {}

  // -----------------------------------------
  // Research APIs
  // -----------------------------------------

  getResearchOverview(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/research/overview`
    );
  }

  getRetrievalResults(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/research/retrieval`
    );
  }

  getGenerationResults(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/research/generation`
    );
  }

  getRetrievalDetails(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/research/retrieval/details`
    );
  }

  getGenerationDetails(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/research/generation/details`
    );
  }

  // -----------------------------------------
  // Existing corpus QA
  // -----------------------------------------

  askQuestion(
    payload: any,
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/ask`,
      payload,
    );
  }

  compareModels(
    payload: any,
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/compare`,
      payload,
    );
  }

  // -----------------------------------------
  // Upload PDF
  // -----------------------------------------

  uploadPdf(
    file: File,
  ): Observable<any> {

    const formData = new FormData();

    formData.append(
      'file',
      file,
    );

    return this.http.post(
      `${this.baseUrl}/upload`,
      formData,
    );
  }

  askUploadedPdf(
    payload: any,
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/upload/ask`,
      payload,
    );
  }

  compareUploadedPdf(
    payload: any,
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/upload/compare`,
      payload,
    );
  }

  // -----------------------------------------
  // Summary
  // -----------------------------------------

  generateSummary(
    payload: any,
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/upload/summary`,
      payload,
    );
  }

  compareSummaries(
    payload: any,
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/upload/summary/compare`,
      payload,
    );
  }
}