// app/survey/page.tsx
'use client';

import { Suspense } from 'react';
import SurveyForm from './SurveyForm';

export default function SurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <SurveyForm />
    </Suspense>
  );
}