import { useState } from 'react';
import { setApiKey, getApiKey } from '../services/aiService';

interface Props {
  onConfigured: () => void;
}

export function ApiKeyConfig({ onConfigured }: Props) {
  const [key, setKey] = useState(getApiKey());
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      onConfigured();
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900">Configurar API Key</h2>
          <p className="text-sm text-gray-600 mt-1">
            Necesitas una API key de Google AI Studio para generar quizzes.{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600 font-medium hover:underline">
              Obtener gratis
            </a>
          </p>

          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIza..."
                className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-2 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg text-sm font-medium text-gray-600 transition-colors"
              >
                {showKey ? 'Ocultar' : 'Ver'}
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className="w-full px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Guardar configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
