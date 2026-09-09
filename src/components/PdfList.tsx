import { PDFDocument } from '../types';
import { lessonService } from '../services/dbService';
import { useState, useEffect } from 'react';

interface Props {
  pdfs: PDFDocument[];
  onSelect: (pdf: PDFDocument) => void;
  onDelete: (id: number) => void;
}

export function PdfList({ pdfs, onSelect, onDelete }: Props) {
  const [progressMap, setProgressMap] = useState<Record<number, { total: number; completed: number }>>({});

  useEffect(() => {
    const loadProgress = async () => {
      const map: Record<number, { total: number; completed: number }> = {};
      for (const pdf of pdfs) {
        map[pdf.id] = await lessonService.getProgressByPdfId(pdf.id);
      }
      setProgressMap(map);
    };
    if (pdfs.length > 0) loadProgress();
  }, [pdfs]);

  if (pdfs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-gray-900 font-medium">No hay documentos</p>
        <p className="text-sm text-gray-500 mt-1">Sube tu primer PDF para comenzar</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pdfs.map((pdf, index) => {
        const progress = progressMap[pdf.id] || { total: 0, completed: 0 };
        const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

        return (
          <div
            key={pdf.id}
            onClick={() => onSelect(pdf)}
            className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all group"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                      {pdf.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {pdf.page_count} {pdf.page_count === 1 ? 'página' : 'páginas'} · {pdf.filename}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('¿Eliminar este documento?')) {
                        onDelete(pdf.id);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>

                {progress.total > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">
                        {progress.completed} de {progress.total} lecciones
                      </span>
                      <span className={`font-medium ${progressPercent === 100 ? 'text-emerald-600' : 'text-purple-600'}`}>
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPercent === 100
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-purple-500 to-violet-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
