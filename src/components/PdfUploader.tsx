import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { pdfService, lessonService } from '../services/dbService';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export function PdfUploader({ onUploadComplete }: { onUploadComplete: () => Promise<void> }) {
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const originalBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: originalBuffer.slice(0) }).promise;
      const pageCount = pdf.numPages;

      const pdfTitle = title.trim() || file.name.replace('.pdf', '');
      const pdfId = await pdfService.addPdf(pdfTitle, file.name, originalBuffer.slice(0), pageCount);

      const lessons = [];

      const outline = await pdf.getOutline();
      if (outline && outline.length > 0) {
        const getPageFromDest = async (dest: unknown): Promise<number> => {
          try {
            const d = typeof dest === 'string'
              ? await pdf.getDestination(dest)
              : dest;
            if (d) {
              const pageIndex = await pdf.getPageIndex((d as unknown[])[0] as pdfjsLib.PDFRef);
              return pageIndex + 1;
            }
          } catch {}
          return 1;
        };

        for (let i = 0; i < outline.length; i++) {
          const item = outline[i];
          const pageStart = await getPageFromDest(item.dest);
          let pageEnd = pageCount;
          if (i < outline.length - 1) {
            const nextStart = await getPageFromDest(outline[i + 1].dest);
            pageEnd = nextStart - 1;
          }
          lessons.push({
            pdf_id: pdfId,
            title: item.title.trim(),
            page_start: pageStart,
            page_end: Math.max(pageStart, pageEnd),
            is_completed: false,
            completed_at: null,
          });
        }
      } else {
        let tocStartPage = -1;
        let tocText = '';
        const pagesToScan = Math.min(pageCount, 20);

        for (let i = 1; i <= pagesToScan; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const text = content.items.map((item: unknown) => (item as { str: string }).str).join(' ');
          if (/contenido/i.test(text)) {
            tocStartPage = i;
            tocText = text + '\n';
            break;
          }
        }

        if (tocStartPage > 0) {
          for (let i = tocStartPage + 1; i <= Math.min(tocStartPage + 5, pageCount); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const text = content.items.map((item: unknown) => (item as { str: string }).str).join(' ');
            if (/^\d+\.\s+/.test(text.trim())) {
              tocText += text + '\n';
            } else {
              break;
            }
          }
        }

        const lines = tocText.split('\n');
        const entries: { title: string; page: number }[] = [];

        for (const line of lines) {
          const cleaned = line.trim();
          const m = cleaned.match(/^(\d+)\.\s+(.+?)\s+[_\.]{3,}\s*(\d+)\s*$/);
          if (m) {
            entries.push({
              title: `${m[1]}. ${m[2].trim()}`,
              page: parseInt(m[3]),
            });
          }
        }

        if (entries.length > 0) {
          for (let i = 0; i < entries.length; i++) {
            const pageStart = entries[i].page;
            const pageEnd = i < entries.length - 1 ? entries[i + 1].page - 1 : pageCount;
            lessons.push({
              pdf_id: pdfId,
              title: entries[i].title,
              page_start: pageStart,
              page_end: Math.max(pageStart, pageEnd),
              is_completed: false,
              completed_at: null,
            });
          }
        }
      }

      if (lessons.length === 0) {
        lessons.push({
          pdf_id: pdfId,
          title: pdfTitle,
          page_start: 1,
          page_end: pageCount,
          is_completed: false,
          completed_at: null,
        });
      }

      await lessonService.createLessons(pdfId, lessons);

      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await onUploadComplete();
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error al subir el PDF. Por favor intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(e.dataTransfer.files[0]);
        input.files = dataTransfer.files;
        handleUpload({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Subir nuevo PDF</h2>
          <p className="text-sm text-gray-500">Adjunta un documento para comenzar</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Título del documento
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Introducción a React"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isUploading}
          />
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              dragActive ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {dragActive ? 'Suelta el archivo aquí' : 'Arrastra un PDF o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Solo archivos .pdf</p>
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-purple-600">Procesando PDF...</span>
          </div>
        )}
      </div>
    </div>
  );
}
