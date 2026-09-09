import { useState, useEffect } from 'react';
import { PdfUploader } from '../components/PdfUploader';
import { PdfList } from '../components/PdfList';
import { ApiKeyConfig } from '../components/ApiKeyConfig';
import { pdfService, lessonService, quizService } from '../services/dbService';
import { getApiKey } from '../services/aiService';
import { PDFDocument } from '../types';

interface Props {
  onSelectPdf: (pdf: PDFDocument) => void;
}

export function HomePage({ onSelectPdf }: Props) {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [stats, setStats] = useState({ totalPdfs: 0, completedLessons: 0, totalLessons: 0, totalQuizzes: 0, avgScore: 0 });

  const loadPdfs = async () => {
    const allPdfs = await pdfService.getAllPdfs();
    setPdfs(allPdfs);

    let totalLessons = 0;
    let completedLessons = 0;
    for (const pdf of allPdfs) {
      const progress = await lessonService.getProgressByPdfId(pdf.id);
      totalLessons += progress.total;
      completedLessons += progress.completed;
    }

    const attempts = await quizService.getAllAttempts();
    const totalQuizzes = attempts.length;
    const avgScore = totalQuizzes > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.score / a.total_questions) * 100, 0) / totalQuizzes)
      : 0;

    setStats({ totalPdfs: allPdfs.length, completedLessons, totalLessons, totalQuizzes, avgScore });
  };

  useEffect(() => {
    loadPdfs();
    setHasApiKey(!!getApiKey());
  }, []);

  const handleDelete = async (id: number) => {
    await pdfService.deletePdf(id);
    await loadPdfs();
  };

  const completedPercent = stats.totalLessons > 0
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Topic Reviewing</h1>
              <p className="text-xs text-gray-500">Repasa tus lecciones</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasApiKey && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                API Key
              </span>
            )}
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="px-3 py-1.5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Subir PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {!hasApiKey && (
          <ApiKeyConfig onConfigured={() => setHasApiKey(true)} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Documentos</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalPdfs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Lecciones</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-xl font-bold text-gray-900">{stats.completedLessons}/{stats.totalLessons}</p>
                </div>
              </div>
            </div>
            {stats.totalLessons > 0 && (
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completedPercent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-500 to-violet-500'
                  }`}
                  style={{ width: `${completedPercent}%` }}
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Quizzes</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                  {stats.totalQuizzes > 0 && (
                    <span className={`text-xs font-medium ${stats.avgScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {stats.avgScore}% acierto
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showUploader && (
          <PdfUploader onUploadComplete={async () => { await loadPdfs(); setShowUploader(false); }} />
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Mis Documentos</h2>
            {pdfs.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                {pdfs.length}
              </span>
            )}
          </div>
          <PdfList pdfs={pdfs} onSelect={onSelectPdf} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
}
