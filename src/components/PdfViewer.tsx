import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument as PDFDocType } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Props {
  pdf: PDFDocType;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PdfViewer({ pdf, currentPage, onPageChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [totalPages, setTotalPages] = useState(pdf.page_count);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const renderPage = async () => {
      setLoading(true);
      try {
        const pdfDoc = await pdfjsLib.getDocument({ data: pdf.file_data.slice(0) }).promise;
        if (cancelled) return;

        setTotalPages(pdfDoc.numPages);

        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;

        if (canvas) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
          }
        }
      } catch (error) {
        console.error('Error rendering PDF:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    renderPage();
    return () => { cancelled = true; };
  }, [pdf, currentPage]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Pág</span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-semibold rounded">{currentPage}</span>
          <span className="text-gray-500">de</span>
          <span className="font-semibold text-gray-900">{totalPages}</span>
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1 overflow-auto flex justify-center p-4 bg-gray-100 min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Cargando...</span>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="shadow-lg rounded max-w-full h-fit" />
      </div>
    </div>
  );
}
