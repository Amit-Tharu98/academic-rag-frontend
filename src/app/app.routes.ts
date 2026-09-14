import { Routes } from '@angular/router';

import { ResearchDashboard } from './pages/research-dashboard/research-dashboard';
import { AskQuestion } from './pages/ask-question/ask-question';
import { UploadAnalyse } from './pages/upload-analyse/upload-analyse';
import { CompareModels } from './pages/compare-models/compare-models';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'research',
    pathMatch: 'full',
  },
  {
    path: 'research',
    component: ResearchDashboard,
  },
  {
    path: 'ask',
    component: AskQuestion,
  },
  {
    path: 'upload',
    component: UploadAnalyse,
  },
  {
    path: 'compare',
    component: CompareModels,
  },
  {
    path: '**',
    redirectTo: 'research',
  },
];