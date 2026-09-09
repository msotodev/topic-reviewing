import { Lesson } from '../types';

interface Props {
  lessons: Lesson[];
  currentLessonId: number | null;
  onSelectLesson: (lesson: Lesson) => void;
}

export function LessonSidebar({ lessons, currentLessonId, onSelectLesson }: Props) {
  const completedCount = lessons.filter((l) => l.is_completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Lecciones</h3>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
            {completedCount}/{lessons.length}
          </span>
        </div>
        {lessons.length > 0 && (
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
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {lessons.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">No hay lecciones</p>
          </div>
        ) : (
          <div className="py-1">
            {lessons.map((lesson) => {
              const isActive = currentLessonId === lesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson)}
                  className={`w-full text-left px-4 py-3 transition-all ${
                    isActive
                      ? 'bg-purple-50 border-l-3 border-l-purple-600'
                      : 'border-l-3 border-l-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        lesson.is_completed
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {lesson.is_completed ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        lesson.page_start
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${
                        isActive ? 'text-purple-700' : lesson.is_completed ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Pág. {lesson.page_start}{lesson.page_start !== lesson.page_end ? `–${lesson.page_end}` : ''}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
