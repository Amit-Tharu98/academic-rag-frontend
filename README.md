# Academic RAG Frontend

Frontend application for the MSc Computer Science dissertation project:

**Comparative Evaluation of Embedding Models for Retrieval-Augmented Academic Document Analysis**

The frontend is built with Angular and provides the user interface for the Academic RAG research prototype.

## Features

- Research Results dashboard for controlled retrieval and generation evaluation.
- Ask Question page for querying the fixed academic research corpus.
- Upload & Analyse page for temporary PDF collections.
- Compare Models page for comparing Sentence Transformer, BGE and OpenAI embeddings.
- Multi-PDF upload and analysis.
- Full collection and topic-focused summaries.
- Retrieved source/page display.
- Responsive desktop, tablet and mobile navigation.

## Technology

The repository currently uses:

- Angular 21.1.x
- TypeScript 5.9.x
- RxJS 7.8.x
- SCSS
- npm 11.16.0

The exact dependency versions are defined in `package.json`.

## Prerequisites

Install the following before continuing:

1. Git
2. Node.js compatible with Angular 21
3. npm

A Node.js 22.x installation is recommended for this project.

Check the installed versions:

```bash
node --version
npm --version
```

You do not need to install Angular CLI globally because the project includes Angular CLI as a development dependency and the npm scripts use the local installation.

## Clone the repository

```bash
git clone <FRONTEND_REPOSITORY_URL>
cd rag-research-frontend
```

Replace `<FRONTEND_REPOSITORY_URL>` with the URL of this repository.

## Install dependencies

```bash
npm install
```

This installs the dependencies from `package.json`/`package-lock.json`.

If `package-lock.json` is committed, a clean reproducible installation can also be performed with:

```bash
npm ci
```

## Backend requirement

The frontend requires the separate Academic RAG FastAPI backend.

For local development, start the backend first at:

```text
http://127.0.0.1:8000
```

The development Angular environment is already configured to use:

```text
http://127.0.0.1:8000/api
```

The production environment is configured to use the deployed backend.

Configuration files:

```text
src/environments/environment.ts
src/environments/environment.development.ts
```

The API service reads `environment.apiUrl`, so API URLs should be changed in the environment files rather than throughout individual components.

## Run locally

After the backend is running, start the Angular development server:

```bash
npm start
```

Equivalent command:

```bash
npx ng serve
```

Open:

```text
http://localhost:4200
```

The development build automatically uses `environment.development.ts`.

## Main routes

```text
/research
/ask
/upload
/compare
```

Examples:

```text
http://localhost:4200/research
http://localhost:4200/ask
http://localhost:4200/upload
http://localhost:4200/compare
```

## Recommended local startup

Use two terminals.

### Terminal 1 - Backend

```bash
cd <BACKEND_PROJECT_FOLDER>
```

Activate the backend virtual environment and run:

```bash
python -m uvicorn backend.main:app --reload
```

Verify:

```text
http://127.0.0.1:8000/docs
```

### Terminal 2 - Frontend

```bash
cd rag-research-frontend
npm install
npm start
```

Then open:

```text
http://localhost:4200
```

## PDF upload limits

The interactive demonstrator supports:

- PDF only
- Maximum 10 PDFs per collection
- Maximum 10 MB per PDF
- Maximum 50 MB combined upload size

These restrictions apply to the interactive uploaded-document feature. They do not change the fixed corpus used for the controlled dissertation evaluation.

## Build for production

```bash
npm run build
```

Angular writes the production build under the project's `dist` directory. For the current application builder, the browser output is normally:

```text
dist/rag-research-frontend/browser
```

## Netlify deployment

The project can be deployed as a static Angular application.

Build command:

```bash
npm run build
```

Publish directory:

```text
dist/rag-research-frontend/browser
```

For Angular client-side routes to work after a direct refresh, keep the Netlify redirect file at:

```text
public/_redirects
```

with:

```text
/* /index.html 200
```

## API configuration

The API service is located under:

```text
src/app/services/api.ts
```

It uses:

```typescript
private baseUrl = environment.apiUrl;
```

Local development API:

```text
http://127.0.0.1:8000/api
```

Production API:

```text
https://academic-rag-backend-w133.onrender.com/api
```

If you deploy your own backend, change the production `apiUrl` in:

```text
src/environments/environment.ts
```

If your local backend runs on a different port, change the development `apiUrl` in:

```text
src/environments/environment.development.ts
```

## Testing

Run Angular tests with:

```bash
npm test
```

## Common problems

### `npm install` fails

Check Node.js and npm:

```bash
node --version
npm --version
```

Delete `node_modules` and reinstall only if necessary.

Windows:

```bash
rmdir /s /q node_modules
npm install
```

macOS/Linux:

```bash
rm -rf node_modules
npm install
```

### `ng` is not recognized

You do not need a global Angular CLI installation. Use:

```bash
npm start
```

or:

```bash
npx ng serve
```

### API requests fail

First check that the backend is running:

```text
http://127.0.0.1:8000/docs
```

Then check:

```text
src/environments/environment.development.ts
```

It should point to the backend `/api` URL.

### CORS error

The backend must allow:

```text
http://localhost:4200
```

The supplied backend configuration already includes this origin.

### Route gives 404 on Netlify refresh

Ensure `public/_redirects` contains:

```text
/* /index.html 200
```

Then rebuild and redeploy.

### First request is slow

The deployed backend or local embedding models may need startup/model-loading time. This is especially noticeable when an embedding model is used for the first time.

## Security

Never place an OpenAI API key or other secret in Angular source code.

The OpenAI key belongs only in the backend environment.

Do not commit credentials, tokens or secrets to this repository.

## Research context

This application is a research prototype for comparing embedding models in Retrieval-Augmented Generation for academic document analysis.

The three evaluated embedding approaches are:

1. Sentence Transformer (`sentence-transformers/all-MiniLM-L6-v2`)
2. BGE (`BAAI/bge-base-en-v1.5`)
3. OpenAI (`text-embedding-3-small`)

The interactive application demonstrates the system. Controlled dissertation evaluation is performed separately using a fixed benchmark corpus and evaluation questions.

## Author

Amit Chaudhary  
MSc Computer Science  
University College Birmingham
