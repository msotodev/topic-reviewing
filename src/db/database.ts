import { PDFDocument, Lesson, Quiz, QuizAttempt } from '../types';

const DB_NAME = 'TopicReviewingDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains('pdfs')) {
        const pdfStore = database.createObjectStore('pdfs', { keyPath: 'id', autoIncrement: true });
        pdfStore.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!database.objectStoreNames.contains('lessons')) {
        const lessonStore = database.createObjectStore('lessons', { keyPath: 'id', autoIncrement: true });
        lessonStore.createIndex('pdf_id', 'pdf_id', { unique: false });
      }

      if (!database.objectStoreNames.contains('quizzes')) {
        const quizStore = database.createObjectStore('quizzes', { keyPath: 'id', autoIncrement: true });
        quizStore.createIndex('lesson_id', 'lesson_id', { unique: false });
      }

      if (!database.objectStoreNames.contains('quiz_attempts')) {
        const attemptStore = database.createObjectStore('quiz_attempts', { keyPath: 'id', autoIncrement: true });
        attemptStore.createIndex('lesson_id', 'lesson_id', { unique: false });
      }
    };
  });
}

function getAll<T>(storeName: string, indexName?: string, query?: IDBKeyRange): Promise<T[]> {
  return openDB().then((db) =>
    new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const request = source.getAll(query);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    })
  );
}

function getById<T>(storeName: string, id: number): Promise<T | undefined> {
  return openDB().then((db) =>
    new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    })
  );
}

function add<T>(storeName: string, data: T): Promise<number> {
  return openDB().then((db) =>
    new Promise<number>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    })
  );
}

function put<T>(storeName: string, data: T): Promise<void> {
  return openDB().then((db) =>
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    })
  );
}

function remove(storeName: string, id: number): Promise<void> {
  return openDB().then((db) =>
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    })
  );
}

export const pdfService = {
  async addPdf(title: string, filename: string, fileData: ArrayBuffer, pageCount: number): Promise<number> {
    const pdfData: Omit<PDFDocument, 'id'> = {
      title,
      filename,
      file_data: fileData,
      page_count: pageCount,
      created_at: new Date().toISOString(),
    };
    return add<Omit<PDFDocument, 'id'>>('pdfs', pdfData);
  },

  async getAllPdfs(): Promise<PDFDocument[]> {
    return getAll<PDFDocument>('pdfs');
  },

  async getPdfById(id: number): Promise<PDFDocument | undefined> {
    return getById<PDFDocument>('pdfs', id);
  },

  async deletePdf(id: number): Promise<void> {
    await remove('pdfs', id);
  },
};

export const lessonService = {
  async createLessons(pdfId: number, lessons: Omit<Lesson, 'id'>[]): Promise<void> {
    for (const lesson of lessons) {
      await add('lessons', { ...lesson, pdf_id: pdfId });
    }
  },

  async getLessonsByPdfId(pdfId: number): Promise<Lesson[]> {
    return new Promise((resolve, reject) => {
      openDB().then((db) => {
        const tx = db.transaction('lessons', 'readonly');
        const store = tx.objectStore('lessons');
        const index = store.index('pdf_id');
        const request = index.getAll(pdfId);
        request.onsuccess = () => {
          const results = request.result.sort((a: Lesson, b: Lesson) => a.page_start - b.page_start);
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    });
  },

  async markCompleted(lessonId: number): Promise<void> {
    const lesson = await getById<Lesson>('lessons', lessonId);
    if (lesson) {
      lesson.is_completed = true;
      lesson.completed_at = new Date().toISOString();
      await put('lessons', lesson);
    }
  },

  async markIncomplete(lessonId: number): Promise<void> {
    const lesson = await getById<Lesson>('lessons', lessonId);
    if (lesson) {
      lesson.is_completed = false;
      lesson.completed_at = null;
      await put('lessons', lesson);
    }
  },

  async getProgressByPdfId(pdfId: number): Promise<{ total: number; completed: number }> {
    const lessons = await this.getLessonsByPdfId(pdfId);
    return {
      total: lessons.length,
      completed: lessons.filter((l) => l.is_completed).length,
    };
  },
};

export const quizService = {
  async saveQuiz(lessonId: number, questions: Quiz['questions']): Promise<number> {
    const quiz: Omit<Quiz, 'id'> = {
      lesson_id: lessonId,
      questions,
      created_at: new Date().toISOString(),
    };
    return add<Omit<Quiz, 'id'>>('quizzes', quiz);
  },

  async getQuizByLessonId(lessonId: number): Promise<Quiz | undefined> {
    const quizzes = await getAll<Quiz>('quizzes', 'lesson_id', IDBKeyRange.only(lessonId));
    return quizzes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  },

  async saveAttempt(quizId: number, lessonId: number, score: number, totalQuestions: number, answers: number[]): Promise<number> {
    const attempt: Omit<QuizAttempt, 'id'> = {
      quiz_id: quizId,
      lesson_id: lessonId,
      score,
      total_questions: totalQuestions,
      answers,
      completed_at: new Date().toISOString(),
    };
    return add<Omit<QuizAttempt, 'id'>>('quiz_attempts', attempt);
  },

  async getAttemptsByLessonId(lessonId: number): Promise<QuizAttempt[]> {
    return getAll<QuizAttempt>('quiz_attempts', 'lesson_id', IDBKeyRange.only(lessonId));
  },

  async getAllAttempts(): Promise<QuizAttempt[]> {
    return getAll<QuizAttempt>('quiz_attempts');
  },
};
