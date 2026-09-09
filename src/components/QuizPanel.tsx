import { useState } from 'react';
import { QuizQuestion } from '../types';
import { quizService } from '../services/dbService';

interface Props {
  questions: QuizQuestion[];
  lessonId: number;
  quizId: number;
  onComplete: () => void;
}

export function QuizPanel({ questions, lessonId, quizId, onComplete }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSelectAnswer = (questionIndex: number, answerIndex: number) => {
    if (submitted) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const validAnswers = selectedAnswers.filter((a): a is number => a !== null);
    const score = validAnswers.reduce((acc, answer, index) => {
      return acc + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);

    await quizService.saveAttempt(quizId, lessonId, score, questions.length, validAnswers);
    setShowResults(true);
  };

  const handleRetry = () => {
    setSubmitted(false);
    setShowResults(false);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setCurrentQuestion(0);
  };

  if (showResults) {
    const validAnswers = selectedAnswers.filter((a): a is number => a !== null);
    const score = validAnswers.reduce((acc, answer, index) => {
      return acc + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center max-w-lg mx-auto">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
            percentage >= 70 ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            <span className={`text-3xl font-bold ${percentage >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
              {percentage}%
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {percentage >= 70 ? '¡Excelente trabajo!' : 'Sigue practicando'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {score} de {questions.length} respuestas correctas
          </p>

          <div className="space-y-3 text-left mb-6">
            {questions.map((q, i) => {
              const isCorrect = selectedAnswers[i] === q.correctAnswer;
              return (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{q.question}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Tu respuesta: <span className={isCorrect ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                      {q.options[selectedAnswers[i] ?? 0]}
                    </span>
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                      Correcta: {q.options[q.correctAnswer]}
                    </p>
                  )}
                  {q.explanation && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200 italic">{q.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={handleRetry} className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Intentar de nuevo
            </button>
            <button onClick={onComplete} className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Repaso de Lección</h3>
        </div>
        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg">
          {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      <div className="mb-6">
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
          <div
            className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>

        <p className="text-lg font-medium text-gray-900 mb-5 leading-relaxed">
          {questions[currentQuestion].question}
        </p>

        <div className="space-y-2">
          {questions[currentQuestion].options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion] === index;
            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(currentQuestion, index)}
                className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Anterior
        </button>

        {currentQuestion < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
          >
            Siguiente
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswers.some((a) => a === null)}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Enviar respuestas
          </button>
        )}
      </div>
    </div>
  );
}
