# Suraksha AI - Scam Detection App

This is a web application built with Next.js in Firebase Studio, designed to help users detect scams, fake news, and misinformation.

## Technology Stack

*   **Frontend Framework:** [Next.js](https://nextjs.org/) (with App Router)
*   **UI Library:** [React](https://react.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Generative AI:** [Genkit (via Google AI)](https://firebase.google.com/docs/genkit)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore)

## Application Framework

The application is structured as a full-stack Next.js project. It utilizes server-side rendering and server actions for performance and security. The core logic is built around Genkit flows, which orchestrate calls to the Google Gemini model to perform content analysis. Firebase is used for storing user analysis history in Firestore.

### Key Features:
*   **AI-Powered Analysis:** Leverages a powerful AI model to analyze text, URLs, images, QR codes, and videos.
*   **Comprehensive Reports:** Provides detailed analysis reports including a risk score, explanation, and safety advice.
*   **Session History:** Temporarily stores analysis results from the current user session for easy review.
*   **Intelligent Chatbot:** An in-app assistant that can answer questions about the application and its features.
*   **Responsive Design:** A modern and responsive UI that works across devices.

## Limitations

This application uses a free tier of the Google Gemini API, which comes with certain usage limitations:

*   **Web App Analysis:** The main analysis features (text, image, URL, etc.) are limited to approximately **20 responses per day**.
*   **Chatbot Usage:** The chatbot is limited to **5 responses per minute**.
*   **Disclaimer:** The analysis is performed by an AI model and is not guaranteed to be 100% accurate. It should be used as a helpful guide, not as a definitive verdict.

To get started with the code, take a look at `src/app/analyzer/page.tsx`.