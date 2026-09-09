import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfViewer } from '../components/PdfViewer';
import { LessonSidebar } from '../components/LessonSidebar';
import { QuizPanel } from '../components/QuizPanel';
import { pdfService, lessonService, quizService } from '../services/dbService';
import { generateQuizFromLesson, getApiKey } from '../services/aiService';
import { PDFDocument, Lesson, QuizQuestion } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export function PdfViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pdf, setPdf] = useState<PDFDocument | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentQuizId, setCurrentQuizId] = useState<number | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [lessonText, setLessonText] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      const pdfData = await pdfService.getPdfById(Number(id));
      if (!pdfData) {
        navigate('/');
        return;
      }
      setPdf(pdfData);
      const lessonData = await lessonService.getLessonsByPdfId(Number(id));
      setLessons(lessonData);
      if (lessonData.length > 0) {
        setCurrentLesson(lessonData[0]);
        setCurrentPage(lessonData[0].page_start);
      }
    };
    loadData();
  }, [id, navigate]);

  const loadLessonText = async (lesson: Lesson) => {
    if (!pdf) return '';
    try {
      const pdfDoc = await pdfjsLib.getDocument({ data: pdf.file_data.slice(0) }).promise;
      let text = '';
      for (let i = lesson.page_start; i <= lesson.page_end; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: unknown) => (item as { str: string }).str).join(' ') + '\n';
      }
      return text;
    } catch {
      return '';
    }
  };

  const handleSelectLesson = async (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCurrentPage(lesson.page_start);
    setQuizQuestions(null);
    setCurrentQuizId(null);
    setShowMobileSidebar(false);

    const text = await loadLessonText(lesson);
    setLessonText(text);
  };

  const handleGenerateQuiz = async () => {
    if (!currentLesson) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      alert('Por favor configura tu API Key de Google AI en la página principal.');
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const text = lessonText || await loadLessonText(currentLesson);
      const questions = await generateQuizFromLesson(currentLesson.title, text);
      const quizId = await quizService.saveQuiz(currentLesson.id, questions);
      setQuizQuestions(questions);
      setCurrentQuizId(quizId);
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Error al generar el quiz. Verifica tu API Key e intenta de nuevo.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!currentLesson) return;
    if (currentLesson.is_completed) {
      await lessonService.markIncomplete(currentLesson.id);
    } else {
      await lessonService.markCompleted(currentLesson.id);
    }

    const updatedLessons = await lessonService.getLessonsByPdfId(Number(id));
    setLessons(updatedLessons);
    const updated = updatedLessons.find((l) => l.id === currentLesson.id);
    if (updated) setCurrentLesson(updated);
  };

  const handleQuizComplete = () => {
    setQuizQuestions(null);
    setCurrentQuizId(null);
  };

  if (!pdf) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {showMobileSidebar && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 overflow-auto">
            <LessonSidebar
              lessons={lessons}
              currentLessonId={currentLesson?.id ?? null}
              onSelectLesson={handleSelectLesson}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:block w-64 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
          <LessonSidebar
            lessons={lessons}
            currentLessonId={currentLesson?.id ?? null}
            onSelectLesson={handleSelectLesson}
          />
        </aside>

        <main className="flex-1 min-w-0 flex flex-col min-h-0 relative">
          {quizQuestions && currentQuizId ? (
            <div className="flex-1 overflow-y-auto p-3">
              <QuizPanel
                questions={quizQuestions}
                lessonId={currentLesson!.id}
                quizId={currentQuizId}
                onComplete={handleQuizComplete}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0 p-3">
              <PdfViewer
                pdf={pdf}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          <div className="fixed bottom-6 left-6 z-20">
            <button
              onClick={() => navigate('/')}
              className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Volver al inicio"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </button>
          </div>

          <div className="fixed bottom-6 right-6 z-20 flex flex-col items-center gap-3">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Lecciones"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz || !currentLesson}
              className="w-12 h-12 rounded-full bg-purple-600 shadow-lg flex items-center justify-center text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Generar quiz"
            >
              {isGeneratingQuiz ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              )}
            </button>

            {currentLesson && (
              <button
                onClick={handleToggleComplete}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                  currentLesson.is_completed
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                aria-label={currentLesson.is_completed ? 'Marcar incompleta' : 'Marcar completada'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
