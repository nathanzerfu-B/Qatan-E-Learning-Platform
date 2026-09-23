import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './admin.css';
import './AdminReviewLesson.css';
import AdminNavigation from './AdminNavigation';

import { useAppContext } from './context/AppContext';
import axios from 'axios';



function LessonViewer({ lesson, status, onComplete, onNextLesson }) {
  const videoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { darkTheme } = useAppContext();

  useEffect(() => {
    if (status === 'in-progress' && videoRef.current) {
      videoRef.current.play();
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [status, lesson]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      video.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        video.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, []);

  if (!lesson) {
    return (
      <div className={`relative ${darkTheme ? 'bg-gray-900' : 'bg-gray-100'} aspect-w-16 aspect-h-9 flex items-center justify-center rounded-lg`}>
        <button
          className="w-24 h-24 rounded-full flex items-center justify-center"
          disabled
          style={{
            backgroundColor: darkTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
            border: darkTheme ? 'none' : '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <span className="material-icons text-6xl" style={{ color: darkTheme ? '#e8e8e8' : '#111827' }}>code</span>
        </button>
      </div>
    );
  }

  const mediaSrc = lesson.mediaSrc;
  const ext = mediaSrc.split('.').pop().toLowerCase();

  let mediaElement;
  if (ext === 'mp4') {
    mediaElement = (
      <video
        ref={videoRef}
        src={mediaSrc}
        className="w-full"
        style={{ height: '300px' }}
        controls={true}
        onEnded={onComplete}
      />
    );
  } else if (ext === 'jpg' || ext === 'png' || ext === 'webp') {
    mediaElement = (
      <img
        src={mediaSrc}
        alt={lesson.name}
        className="w-full object-contain"
        style={{ height: '300px' }}
        onLoad={() => onComplete()} // Assume image viewing completes immediately
      />
    );
  } else {
    // Remove document support, show message instead
    mediaElement = (
      <div className="w-full flex items-center justify-center" style={{ height: '300px' }}>
        <p style={{ color: darkTheme ? '#e8e8e8' : '#111827' }}>Document viewing is not supported. Please use video or image lessons only.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-900 rounded-lg max-w-3xl mx-auto">
      {mediaElement}
      {status === 'completed' && ext === 'mp4' && (
        <button
          onClick={onNextLesson}
          className={`${isFullscreen ? 'fixed' : 'absolute'} bottom-4 right-4 p-2 rounded-full hover:opacity-90 transition z-10`}
          title="Next Lesson"
          style={{
            backgroundColor: darkTheme ? 'rgba(0,0,0,0.7)' : '#ffffff',
            color: darkTheme ? '#e8e8e8' : '#111827',
            boxShadow: darkTheme ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'
          }}
        >
          <span className="material-icons">skip_next</span>
        </button>
      )}
    </div>
  );
}

function LessonItem({ lesson, onStart, darkTheme }) {
  const { name, status, locked } = lesson;

  const handleStart = () => {
    if (!locked) {
      onStart(lesson);
    }
  };

  return (
    <div
      className={`flex justify-between text-sm items-center ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
  <span style={{ color: darkTheme ? '#e8e8e8' : '#111827' }}>{locked ? '🔒 ' : ''}{name} <span style={{ color: darkTheme ? '#9ca3af' : '#6b7280' }}>- {status}</span></span>
      {!locked && (
        <button
          onClick={handleStart}
          className="text-primary font-medium hover:underline"
          style={{ color: darkTheme ? '#e8e8e8' : '#1976d2' }}
        >
          View
        </button>
      )}
    </div>
  );
}

function CourseOutline({ modules, onLessonStart, onQuizStart, darkTheme }) {
  const [expandedModules, setExpandedModules] = useState({});

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  return (
    <div className="AdminReview-course-outline-container">
      {modules.map(module => (
        <div key={module.id} className={`AdminReview-module-card ${expandedModules[module.id] ? 'expanded' : ''}`}>
          <div className="AdminReview-module-header">
            <button
              type="button"
              className="AdminReview-module-button"
              onClick={() => toggleModule(module.id)}
            >
              <div className="AdminReview-module-info">
                <p className="AdminReview-module-name" style={{ color: darkTheme ? '#e8e8e8' : '#111827' }}>{module.name}</p>
                <p className="AdminReview-module-lessons" style={{ color: darkTheme ? '#9ca3af' : '#6b7280' }}>
                  {module.totalLessons} Lessons
                </p>
              </div>
              {module.quizStatus === 'passed' && (
                <span className="AdminReview-quiz-passed">Quiz Passed</span>
              )}
              <span className="material-icons AdminReview-expand-icon" style={{ color: darkTheme ? '#9ca3af' : '#6b7280' }}>
                {expandedModules[module.id] ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
          {expandedModules[module.id] && (
            <div className="AdminReview-lessons-list">
              {module.lessons.map(lesson => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  onStart={onLessonStart}
                  darkTheme={darkTheme}
                />
              ))}
              {module.quizStatus === 'available' && (
                <button
                  type="button"
                  className="AdminReview-quiz-button AdminReview-view"
                  style={{ color: darkTheme ? '#e8e8e8' : 'white' }}
                  onClick={() => onQuizStart(module.id)}
                >
                  View Quiz
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QuizModal({ quiz, onClose }) {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    // Show all questions for review
    if (!quiz || !quiz.questions) {
      setQuestions([]);
      return;
    }
    const allQuestions = quiz.questions;
    setQuestions(allQuestions);
  }, [quiz]);

  if (questions.length === 0) {
    return (
      <div className="admin-modal AdminReview-quiz-modal">
        <div className="admin-modal-content AdminReview-quiz-modal-content">
          <div className="admin-modal-header">
            <h3>{quiz?.title || 'Quiz'} Review</h3>
            <button className="admin-modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="admin-form-group AdminReview-quiz-modal-form-group">
            <p>No questions available for this quiz.</p>
          </div>
          <div className="admin-modal-actions">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-modal AdminReview-quiz-modal">
      <div className="admin-modal-content AdminReview-quiz-modal-content">
        <div className="admin-modal-header">
          <h3>{quiz?.title || 'Quiz'} Review</h3>
          <button className="admin-modal-close" onClick={onClose}>&times;</button>
        </div>
          <div className="admin-form-group AdminReview-quiz-modal-form-group">
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                <p className="font-medium mb-2 text-gray-900 dark:text-gray-100">{index + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.type === 'multiple-choice' ? (
                    q.options.map((option, i) => {
                      const isCorrect = i === q.correct;
                      const optionClass = isCorrect ? 'option correct' : 'option';
                      return (
                        <div key={i} className={optionClass}>
                          <span className="mr-3 text-lg">{String.fromCharCode(65 + i)}.</span>
                          <span className={`${isCorrect ? 'font-semibold text-white' : 'text-gray-700 dark:text-gray-300'}`}>{option}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="option correct">
                      <span className="font-semibold text-white">Answer: {q.answer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AdminReviewLesson() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkTheme, toggleTheme } = useAppContext();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setCourse(response.data.course);
        } else {
          setError('Failed to load course');
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const modules = course ? course.modules.map(module => ({
    id: module.id,
    name: module.title,
    totalLessons: module.lessons.length,
    quizStatus: course.quizzes.find(q => q.moduleId === module.id) ? 'available' : 'none',
    locked: false,
    lessons: module.lessons.map(lesson => ({
      id: lesson.id,
      name: lesson.title,
      status: 'not-started',
      locked: false,
      mediaSrc: lesson.mediaUrl || ''
    })),
    quiz: course.quizzes.find(q => q.moduleId === module.id)
  })) : [];

  // Set initial state for first time user with no course taken
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonStatus, setLessonStatus] = useState('not-started');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizModule, setCurrentQuizModule] = useState(null);

  const handleLessonStart = (lesson) => {
    if (!lesson.locked) {
      setCurrentLesson(lesson);
      setLessonStatus('in-progress');
      updateLessonStatus(lesson.id, 'in-progress');
    }
  };



  const handleLessonComplete = () => {
    setLessonStatus('completed');
    updateLessonStatus(currentLesson.id, 'completed');
    unlockNextLesson(currentLesson.id);
  };

  const handleNextLesson = () => {
    const nextLessonId = currentLesson.id + 1;
    const nextLesson = modules.flatMap(m => m.lessons).find(l => l.id === nextLessonId);
    if (nextLesson && !nextLesson.locked) {
      handleLessonStart(nextLesson);
    }
  };

  const updateLessonStatus = (lessonId, status) => {
    setModules(prevModules =>
      prevModules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson =>
          lesson.id === lessonId ? { ...lesson, status } : lesson
        ),
      }))
    );
  };

  const unlockNextLesson = (completedLessonId) => {
    setModules(prevModules =>
      prevModules.map(module => ({
        ...module,
        lessons: module.lessons.map((lesson) => {
          if (lesson.id === completedLessonId + 1 && lesson.locked && !module.locked) {
            return { ...lesson, locked: false };
          }
          return lesson;
        }),
      }))
    );
  };

  const handleQuizStart = (moduleId) => {
    setCurrentQuizModule(moduleId);
    setShowQuizModal(true);
  };

  if (loading) {
    return (
      <div className={`admin-container ${darkTheme ? 'admin-dark-theme' : ''}`}>
        <AdminNavigation
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          darkTheme={darkTheme}
          toggleTheme={toggleTheme}
        />
        <div id="main-content" className="admin-main-content">
          <div className="admin-page-content">
            <div className="admin-page-header">
              <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/approvals')}>← Back to Approval</button>
              <h1 className="admin-title-right">Course Review for Approval</h1>
            </div>
            <div className="flex justify-center items-center h-64">
              <p style={{ color: darkTheme ? '#e8e8e8' : '#111827' }}>Loading course...</p>
            </div>
          </div>
        </div>
        {sidebarOpen && <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`admin-container ${darkTheme ? 'admin-dark-theme' : ''}`}>
        <AdminNavigation
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          darkTheme={darkTheme}
          toggleTheme={toggleTheme}
        />
        <div id="main-content" className="admin-main-content">
          <div className="admin-page-content">
            <div className="admin-page-header">
              <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/approvals')}>← Back to Approval</button>
              <h1 className="admin-title-right">Course Review for Approval</h1>
            </div>
            <div className="flex justify-center items-center h-64">
              <p style={{ color: 'red' }}>{error}</p>
            </div>
          </div>
        </div>
        {sidebarOpen && <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>}
      </div>
    );
  }

  return (
    <div className={`admin-container ${darkTheme ? 'admin-dark-theme' : ''}`}>
      <AdminNavigation
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        darkTheme={darkTheme}
        toggleTheme={toggleTheme}
      />

      <div id="main-content" className="admin-main-content">
        <div className="admin-page-content">
          <div className="admin-page-header">
            <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/approvals')}>← Back to Approval</button>
            <h1 className="admin-title-right">Course Review for Approval: {course?.title}</h1>
          </div>
          {currentLesson && (
            <LessonViewer
              lesson={currentLesson}
              status={lessonStatus}
              onComplete={handleLessonComplete}
              onNextLesson={handleNextLesson}
            />
          )}
          {showQuizModal && (
            <QuizModal
              quiz={modules.find(m => m.id === currentQuizModule)?.quiz}
              onClose={() => setShowQuizModal(false)}
            />
          )}

          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2" style={{ color: darkTheme ? '#e8e8e8' : '#111827' }}>Course Outline</h4>
            <CourseOutline
              modules={modules}
              onLessonStart={handleLessonStart}
              onQuizStart={handleQuizStart}
              darkTheme={darkTheme}
            />
          </div>


        </div>
      </div>

      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>}
    </div>
  );
}
