import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./LessonViewer.css";

function LessonViewer({ lesson, status, onComplete, onNextLesson }) {
  const videoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (status === "in-progress" && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [status]);

  // Fullscreen change listener
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
      };
    }
  }, []);

  // Restore playback position on load
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    if (lesson?.id) {
      const savedTime = localStorage.getItem(`qatan_video_${lesson.id}`);
      if (savedTime && parseFloat(savedTime) < video.duration - 5) {
        video.currentTime = parseFloat(savedTime);
      }
    }
    video.playbackRate = playbackSpeed;
  };

  // Save playback progress periodically
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (lesson?.id && Math.floor(video.currentTime) % 4 === 0) {
      localStorage.setItem(`qatan_video_${lesson.id}`, video.currentTime.toString());
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const skipSeconds = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
      );
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        skipSeconds(-10);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        skipSeconds(10);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleComplete = () => {
    if (lesson?.id) {
      localStorage.removeItem(`qatan_video_${lesson.id}`);
    }
    onComplete();
  };

  if (!lesson) {
    return (
      <div className="lv-media-wrap">
        <div className="lv-placeholder">
          <button className="lv-placeholder-btn" disabled>
            <span className="material-icons lv-placeholder-icon">code</span>
          </button>
        </div>
      </div>
    );
  }

  const mediaSrc = lesson.mediaSrc;
  const ext = mediaSrc.split(".").pop().toLowerCase();

  let mediaElement;
  if (ext === "mp4") {
    mediaElement = (
      <video
        ref={videoRef}
        src={mediaSrc}
        className="lv-media"
        controls={true}
        autoPlay
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleComplete}
      />
    );
  } else if (ext === "jpg" || ext === "png") {
    mediaElement = (
      <img
        src={mediaSrc}
        alt={lesson.name}
        className="lv-media img-contain"
        onLoad={() => handleComplete()}
      />
    );
  } else {
    mediaElement = (
      <div className="lv-media lv-media-empty">
        <p className="lv-media-empty-text">
          Document viewing is not supported. Please use video or image lessons only.
        </p>
      </div>
    );
  }

  return (
    <div className="lv-media-wrap">
      {mediaElement}
      
      {/* Enhanced Pro Controls Toolbar for Videos */}
      {ext === "mp4" && (
        <div className="lv-pro-toolbar">
          <div className="lv-toolbar-left">
            <button
              type="button"
              onClick={togglePlay}
              className="lv-tool-btn"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              <span className="material-icons">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => skipSeconds(-10)}
              className="lv-tool-btn"
              title="Rewind 10s (←)"
            >
              <span className="material-icons">replay_10</span>
            </button>
            <button
              type="button"
              onClick={() => skipSeconds(10)}
              className="lv-tool-btn"
              title="Forward 10s (→)"
            >
              <span className="material-icons">forward_10</span>
            </button>
            <span className="lv-timestamp">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="lv-toolbar-right">
            <div className="lv-speed-selector">
              {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  type="button"
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`lv-speed-pill ${
                    playbackSpeed === speed ? "active" : ""
                  }`}
                  title={`Speed ${speed}x`}
                >
                  {speed}x
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="lv-tool-btn"
              title="Fullscreen (F)"
            >
              <span className="material-icons">
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
          </div>
        </div>
      )}

      {status === "completed" && ext === "mp4" && (
        <button
          onClick={onNextLesson}
          className={`lv-next-lesson ${
            isFullscreen ? "lv-fixed" : "lv-absolute"
          }`}
          title="Next Lesson"
        >
          <span className="material-icons">skip_next</span>
        </button>
      )}
    </div>
  );
}


function CourseOutline({
  modules,
  currentLessonId,
  onLessonStart,
  onLessonComplete,
  onQuizStart,
}) {
  const [expandedModules, setExpandedModules] = useState(() => {
    const initial = {};
    if (modules && modules.length > 0) {
      initial[modules[0].id] = true;
    }
    return initial;
  });

  // Auto-expand module containing current active lesson
  useEffect(() => {
    if (!currentLessonId || !modules) return;
    const activeModule = modules.find((m) =>
      m.lessons.some((l) => l.id === currentLessonId)
    );
    if (activeModule) {
      setExpandedModules((prev) => ({
        ...prev,
        [activeModule.id]: true,
      }));
    }
  }, [currentLessonId, modules]);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const expandAll = () => {
    const all = {};
    modules.forEach((m) => {
      all[m.id] = true;
    });
    setExpandedModules(all);
  };

  const collapseAll = () => {
    setExpandedModules({});
  };

  return (
    <div className="outline-list">
      <div className="flex justify-end gap-3 mb-2 px-1">
        <button
          type="button"
          onClick={expandAll}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Expand All
        </button>
        <span className="text-xs text-muted-foreground">•</span>
        <button
          type="button"
          onClick={collapseAll}
          className="text-xs font-semibold text-muted-foreground hover:underline"
        >
          Collapse All
        </button>
      </div>

      {modules.map((module) => (
        <div key={module.id} className="outline-module">
          <div className="module-header">
            <button
              type="button"
              className="module-toggle"
              onClick={() => toggleModule(module.id)}
            >
              <div className="module-info min-w-0">
                <p className="module-title truncate" title={module.name}>{module.name}</p>
                <p className="module-sub">
                  {module.completedLessons}/{module.totalLessons} Lessons
                </p>
              </div>
              {module.quizStatus === "passed" && (
                <span className="module-passed shrink-0">Quiz Passed</span>
              )}
              <span className="material-icons module-expand shrink-0">
                {expandedModules[module.id] ? "expand_less" : "expand_more"}
              </span>
            </button>
          </div>
          {expandedModules[module.id] && (
            <div className="module-lessons">
              {module.lessons.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  isActive={lesson.id === currentLessonId}
                  onStart={onLessonStart}
                  onComplete={onLessonComplete}
                />
              ))}
              {!module.locked &&
                (module.quizStatus === "available" ||
                  module.quizStatus === "failed") && (
                  <button
                    type="button"
                    className={`module-quiz ${
                      module.quizStatus === "failed"
                        ? "module-quiz-failed"
                        : "module-quiz-available"
                    }`}
                    onClick={() => onQuizStart(module.id)}
                  >
                    {module.quizStatus === "failed"
                      ? "Retake Quiz"
                      : "Take Quiz"}
                  </button>
                )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LessonItem({ lesson, isActive, onStart, onComplete }) {
  const { name, status, locked } = lesson;

  const handleStart = () => {
    if (!locked) {
      onStart(lesson);
    }
  };

  const handleComplete = () => {
    if (!locked) {
      onComplete(lesson);
    }
  };

  return (
    <div
      className={`lesson-item ${locked ? "lesson-locked" : ""} ${
        isActive ? "lesson-item-active" : ""
      }`}
      title={name}
    >
      <span
        className={`lesson-name ${
          !locked && status !== "completed" ? "lesson-clickable" : ""
        }`}
        onClick={!locked && status !== "completed" ? handleStart : undefined}
      >
        <span className="shrink-0 mr-1.5">{locked ? "🔒" : isActive ? "▶️" : "📄"}</span>
        <span className="truncate">{name}</span>
        {isActive && (
          <span className="ml-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#1c6048]/15 text-[#1c6048] dark:text-[#34d399] shrink-0">
            Playing
          </span>
        )}
      </span>
      <div className="lesson-actions shrink-0">
        <span
          className={`lesson-status ${
            status === "completed" ? "lesson-completed" : "lesson-notstarted"
          }`}
        >
          {status === "completed" ? (
            <button
              onClick={handleStart}
              className="lesson-rewatch"
              title="Rewatch"
            >
              ▶️ Rewatch
            </button>
          ) : status === "in-progress" ? (
            "In Progress"
          ) : (
            "Not Started"
          )}
        </span>
        {status === "in-progress" && (
          <button onClick={handleComplete} className="lesson-complete-btn">
            Complete
          </button>
        )}
      </div>
    </div>
  );
}

function QuizModal({ moduleId, onClose, onResult }) {
  if (!moduleId) {
    // Defensive: do not fetch or render if invalid moduleId
    console.warn("QuizModal: invalid moduleId, skipping fetch");
    return null;
  }

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null); // Initialize as null to set after fetch
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(null);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0); // new state for total questions count

  useEffect(() => {
    // Fetch quiz questions from backend
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/quizzes/module/${moduleId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
          if (response.data.success && response.data.quiz) {
            const quiz = response.data.quiz;
            // Log raw quiz questions for debugging
            console.log("Fetched quiz questions:", quiz.questions);
            // Use all questions without limiting to 5
            const allQuestions = quiz.questions || [];
            console.log("All questions count:", allQuestions.length); // added debug log
            // Optionally shuffle all questions, but do not limit to 5
            const shuffled = allQuestions.sort(() => 0.5 - Math.random());
            setQuestions(shuffled);
            setTotalQuestions(shuffled.length); // set total questions count to shuffled length to avoid mismatch
            // Set timeLeft from quiz timeLimit or default to 60 seconds
setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : 60);
          } else {
            setQuestions([]);
            setTotalQuestions(0);
            setTimeLeft(60);
          }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        setQuestions([]);
        setTotalQuestions(0);
        setTimeLeft(60);
      }
    };
    fetchQuiz();
  }, [moduleId]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    // Ensure all questions have been answered, else treat unanswered as incorrect
    const correctCount = questions.filter((q) => {
      if (answers[q.id] === undefined || answers[q.id] === "") return false;
      // Handle different question types
      if (q.type === "multiple-choice") {
        // Convert both to string for comparison to avoid type mismatch
        return String(answers[q.id]) === String(q.answer);
      } else {
        // For fill-blank and short-answer, q.answer is the text answer
        return (
          answers[q.id].toLowerCase().trim() === q.answer.toLowerCase().trim()
        );
      }
    }).length;
    const calculatedScore = (correctCount / questions.length) * 100;
    // Pass if score >= 40%
    const didPass = calculatedScore >= 40;
    setPassed(didPass);
    setScore(calculatedScore);
    setCorrectAnswersCount(correctCount);

    // Submit quiz attempt to backend
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/quizzes/module/${moduleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success && response.data.quiz) {
        const quizId = response.data.quiz.id;

        // Submit the quiz attempt
        await axios.post(
          "http://localhost:5000/api/quizzes/submit",
          {
            quizId: quizId,
            answers: answers,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Quiz attempt saved successfully");
      }
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
    }

    onResult(didPass);
  }, [questions, answers, onResult, moduleId]);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, submitted, handleSubmit]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitted, onClose]);

  if (submitted) {
    return (
      <div className="quiz-overlay">
        <div className="quiz-modal quiz-modal-result">
          <h2 className="quiz-title">Quiz Result</h2>
          <div className="quiz-result-body">
            <p
              className={`quiz-passfail ${passed ? "quiz-pass" : "quiz-fail"}`}
            >
              {passed ? "PASS" : "FAIL"}
            </p>
          <p className="quiz-score">
            Score: {correctAnswersCount}/{totalQuestions} ({score.toFixed(0)}%)
          </p>
          </div>
          <p className="quiz-message">
            {passed
              ? "Congratulations! You have Passed."
              : "You need at least 40% to pass. Please review the module and try again."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-overlay">
      <div className="quiz-modal">
        <div className="quiz-header">
          <h2 className="quiz-title">Module {moduleId} Quiz</h2>
          <div className="quiz-timer">Time: {formatTime(timeLeft)}</div>
        </div>
        <div className="quiz-body">
          {questions.map((q, index) => (
            <div key={q.id} className="quiz-question">
              <p className="quiz-question-title">
                {index + 1}. {q.question}
              </p>
              {q.type === "multiple-choice" ? (
                <div className="quiz-options">
                  {q.options.map((option, i) => (
                    <label key={i} className="quiz-option">
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={i}
                        checked={answers[q.id] === i}
                        onChange={() => handleAnswerChange(q.id, i)}
                      />
                      <span className="quiz-option-text">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="quiz-text-input">
                  <input
                    type="text"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Enter your answer"
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      color: "#333",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="quiz-actions">
          <button onClick={handleSubmit} className="quiz-submit">
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Dark mode is handled globally by AuthContext, no need for local override
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonStatus, setLessonStatus] = useState("not-started");
  const [overallProgress, setOverallProgress] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizModule, setCurrentQuizModule] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        let courseId =
          location.state?.courseId ||
          new URLSearchParams(location.search).get("courseId") ||
          new URLSearchParams(location.search).get("id");

        const rawToken = localStorage.getItem("token");
        const token = rawToken && rawToken !== "null" && rawToken !== "undefined" ? rawToken : null;
        const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        if (!courseId && token) {
          try {
            const enrollRes = await axios.get(
              "http://localhost:5000/api/enrollments",
              authHeaders
            );
            if (enrollRes.data?.success && enrollRes.data.enrollments?.length > 0) {
              courseId =
                enrollRes.data.enrollments[0].courseId ||
                enrollRes.data.enrollments[0].course?.id;
            }
          } catch (e) {
            console.warn("Fallback enrollment fetch failed:", e);
          }
        }

        if (!courseId) {
          try {
            const publicRes = await axios.get("http://localhost:5000/api/courses");
            if (publicRes.data?.success && publicRes.data.courses?.length > 0) {
              const bestCourse = publicRes.data.courses.find((c) => c.id === 12) || publicRes.data.courses[0];
              courseId = bestCourse.id;
            }
          } catch (e) {
            console.warn("Fallback public course fetch failed:", e);
          }
        }

        if (!courseId) {
          setError("No course selected");
          setLoading(false);
          return;
        }

        const courseResponse = await axios.get(
          `http://localhost:5000/api/courses/${courseId}`,
          authHeaders
        );

        if (courseResponse.data?.success && courseResponse.data.course) {
          const courseData = courseResponse.data.course;
          setCourse(courseData);

          let progressData = null;
          if (token) {
            try {
              const progressResponse = await axios.get(
                `http://localhost:5000/api/progress/course/${courseId}`,
                authHeaders
              );
              if (progressResponse.data?.success) {
                progressData = progressResponse.data.progress;
              }
            } catch (pErr) {
              console.warn("Progress fetch skipped or not available:", pErr);
            }
          }

          const rawModules = courseData.modules || [];
          const modulesWithQuizStatus = await Promise.all(
            rawModules.map(async (module) => {
              const moduleProgress = progressData?.modules?.find(
                (m) => m.module?.id === module.id || m.moduleId === module.id
              );

              let quizStatus = "available";
              if (token) {
                try {
                  const quizResponse = await axios.get(
                    `http://localhost:5000/api/quizzes/module/${module.id}`,
                    authHeaders
                  );

                  if (quizResponse.data?.success && quizResponse.data.quiz) {
                    const quizId = quizResponse.data.quiz.id;
                    const attemptResponse = await axios.get(
                      `http://localhost:5000/api/quizzes/${quizId}/student-attempt`,
                      authHeaders
                    );

                    if (attemptResponse.data?.success) {
                      const attempt = attemptResponse.data.attempt;
                      if (!attempt) {
                        quizStatus = "available";
                      } else if (attempt.status === "passed") {
                        quizStatus = "passed";
                      } else if (attempt.status === "failed") {
                        quizStatus = "failed";
                      }
                    }
                  }
                } catch {
                  quizStatus = "available";
                }
              }

              return {
                id: module.id,
                name: module.title,
                totalLessons: module.lessons ? module.lessons.length : 0,
                completedLessons: moduleProgress
                  ? moduleProgress.completedCount || 0
                  : 0,
                quizStatus: quizStatus,
                locked: false,
                lessons: (module.lessons || []).map((lesson) => {
                  const lessonProgress = moduleProgress?.lessons?.find(
                    (l) => l.id === lesson.id
                  )?.progress;
                  return {
                    id: lesson.id,
                    name: lesson.title,
                    moduleName: module.title,
                    moduleId: module.id,
                    status: lessonProgress
                      ? lessonProgress.status
                      : "not-started",
                    locked: false,
                    mediaSrc: lesson.mediaUrl || "/img/default-lesson.png",
                  };
                }),
              };
            })
          );

          setModules(modulesWithQuizStatus);

          // Automatically select first lesson if available and none selected yet
          if (
            modulesWithQuizStatus.length > 0 &&
            modulesWithQuizStatus[0].lessons?.length > 0
          ) {
            setCurrentLesson((prev) => prev || modulesWithQuizStatus[0].lessons[0]);
          }
        } else {
          setError("Course not found");
        }
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [location.state, location.search]);

  const handleLessonStart = async (lesson) => {
    if (!lesson.locked) {
      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `http://localhost:5000/api/progress/lesson/${lesson.id}`,
          {
            status: "in_progress",
            progress: 0,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCurrentLesson(lesson);
        setLessonStatus("in-progress");
        updateLessonStatus(lesson.id, "in-progress");
      } catch (error) {
        console.error("Error updating progress:", error);
      }
    }
  };

  const handleLessonComplete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/progress/lesson/${currentLesson.id}`,
        {
          status: "completed",
          progress: 100,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLessonStatus("completed");
      updateLessonStatus(currentLesson.id, "completed");
      unlockNextLesson(currentLesson.id);
      updateProgress();
      checkModuleCompletion(currentLesson.id);
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleLessonResume = () => {
    setLessonStatus("in-progress");
    updateLessonStatus(currentLesson.id, "in-progress");
  };

  const handleLessonStop = () => {
    setLessonStatus("paused");
    updateLessonStatus(currentLesson.id, "in-progress"); // Keep as in-progress but paused
  };

  const handleNextLesson = () => {
    const nextLessonId = currentLesson.id + 1;
    const nextLesson = modules
      .flatMap((m) => m.lessons)
      .find((l) => l.id === nextLessonId);
    if (nextLesson && !nextLesson.locked) {
      handleLessonStart(nextLesson);
    }
  };

  const updateLessonStatus = (lessonId, status) => {
    setModules((prevModules) =>
      prevModules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) =>
          lesson.id === lessonId ? { ...lesson, status } : lesson
        ),
      }))
    );
  };

  const unlockNextLesson = (completedLessonId) => {
    setModules((prevModules) =>
      prevModules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => {
          if (
            lesson.id === completedLessonId + 1 &&
            lesson.locked &&
            !module.locked
          ) {
            return { ...lesson, locked: false };
          }
          return lesson;
        }),
      }))
    );
  };

  const updateProgress = () => {
    const totalLessons = modules.reduce(
      (sum, module) => sum + module.totalLessons,
      0
    );
    const completedLessons =
      modules.reduce((sum, module) => sum + module.completedLessons, 0) + 1; // +1 for just completed
    const progress = Math.round((completedLessons / totalLessons) * 100);
    setOverallProgress(progress);

    setModules((prevModules) =>
      prevModules.map((module) => ({
        ...module,
        completedLessons: module.lessons.filter((l) => l.status === "completed")
          .length,
      }))
    );
  };

  const checkModuleCompletion = () => {
    // Module completion logic if needed, but quiz availability is now handled on module unlock
  };

  const handleQuizStart = (moduleId) => {
    setCurrentQuizModule(moduleId);
    setShowQuizModal(true);
  };

  const handleQuizResult = (passed) => {
    setModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === currentQuizModule) {
          const newStatus = passed ? "passed" : "failed";
          return { ...module, quizStatus: newStatus };
        }
        if (passed && module.id === currentQuizModule + 1) {
          // Unlock next module and all its lessons, and make quiz available
          return {
            ...module,
            locked: false,
            quizStatus: "available",
            lessons: module.lessons.map((lesson) => ({
              ...lesson,
              locked: false,
            })),
          };
        }
        return module;
      })
    );
    // Move clearing currentQuizModule to after modal close to avoid fetch with null moduleId race
    // setCurrentQuizModule(null);
  };

  const getNextLesson = () => {
    if (currentLesson) {
      const nextId = currentLesson.id + 1;
      const allLessons = modules.flatMap((module) => module.lessons);
      return allLessons.find((lesson) => lesson.id === nextId) || null;
    } else {
      for (const module of modules) {
        for (const lesson of module.lessons) {
          if (lesson.status !== "completed") {
            return lesson;
          }
        }
      }
      return null; // All lessons completed
    }
  };

  if (loading) {
    return (
      <div className="lv-page">
        <div className="lv-page-inner">
          <button
            onClick={() => navigate("/student/courses")}
            className="lv-back-to-courses"
          >
            Back to Courses
          </button>
          <main className="lv-main">
            <h2 className="lv-title">Loading Course...</h2>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lv-page">
        <div className="lv-page-inner">
          <button
            onClick={() => navigate("/student/courses")}
            className="lv-back-to-courses"
          >
            Back to Courses
          </button>
          <main className="lv-main">
            <h2 className="lv-title">Error</h2>
            <p>{error}</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="lv-page">
      {/* Top Studio Navigation Bar */}
      <header className="lv-top-nav-bar sticky top-0 z-30 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/student/courses")}
            className="lv-top-nav-back-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            ← Back to Courses
          </button>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <h1 className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
            {course ? course.title : "Continue Learning"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-foreground">
              {overallProgress}% Completed
            </span>
            <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 2-Column Cinema Studio Layout */}
      <div className="lv-cinema-layout">
        {/* Left Column: Video Cinema Player & Lesson Details */}
        <div className="flex flex-col gap-6">
          <div className="w-full">
            <LessonViewer
              lesson={currentLesson}
              status={lessonStatus}
              onStart={() => handleLessonStart(currentLesson)}
              onResume={handleLessonResume}
              onStop={handleLessonStop}
              onComplete={handleLessonComplete}
              onNextLesson={handleNextLesson}
            />
          </div>

          {/* Active Lesson Controls & Information */}
          <div className="p-6 bg-card rounded-2xl border border-border/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-1">
                  {currentLesson ? currentLesson.moduleName : "Course Overview"}
                </span>
                <h2 className="text-lg font-bold text-foreground">
                  {currentLesson ? currentLesson.name : "Select a lesson to begin"}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="resume-btn"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
                  onClick={() => {
                    if (!currentLesson) {
                      const next = getNextLesson();
                      if (next) handleLessonStart(next);
                    } else if (
                      lessonStatus === "not-started" ||
                      lessonStatus === "completed"
                    ) {
                      handleLessonStart(currentLesson);
                    } else if (lessonStatus === "paused") {
                      handleLessonResume();
                    } else if (lessonStatus === "in-progress") {
                      handleLessonStop();
                    }
                  }}
                  disabled={!currentLesson && !getNextLesson()}
                >
                  {!currentLesson
                    ? "Start First Lesson"
                    : lessonStatus === "in-progress"
                    ? "Pause Lesson"
                    : lessonStatus === "paused"
                    ? "Resume Playback"
                    : "Replay Lesson"}
                </button>

                {(() => {
                  const nextLesson = getNextLesson();
                  return (
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-muted text-foreground border border-border text-xs font-bold hover:bg-muted/80 transition-colors disabled:opacity-50"
                      onClick={() => nextLesson && handleLessonStart(nextLesson)}
                      disabled={!nextLesson}
                    >
                      Next Lesson →
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Course & Lesson Description */}
            {course && (
              <div className="space-y-2 text-xs text-muted-foreground">
                <h3 className="font-semibold text-foreground text-sm">About this Course</h3>
                <p className="leading-relaxed">{course.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Curriculum Sidebar */}
        {/* Right Column: Sticky Curriculum Sidebar */}
        <div className="lv-sidebar-sticky w-full min-w-0">
          <div className="p-4 sm:p-5 bg-card rounded-2xl border border-border/80 shadow-sm space-y-4 w-full box-border overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-sm font-bold text-foreground truncate">Course Content</h3>
                <span className="text-[11px] text-muted-foreground truncate block">
                  {modules.reduce((sum, m) => sum + m.completedLessons, 0)} of{" "}
                  {modules.reduce((sum, m) => sum + m.totalLessons, 0)} lessons completed
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {overallProgress}%
              </span>
            </div>

            {/* Curriculum Accordion */}
            <CourseOutline
              modules={modules}
              currentLessonId={currentLesson?.id}
              onLessonStart={handleLessonStart}
              onLessonComplete={handleLessonComplete}
              onQuizStart={handleQuizStart}
            />
          </div>

          {/* Discord Community Card */}
          <div
            className="lv-discord-card p-3.5 sm:p-4 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-2xl cursor-pointer hover:bg-[#5865F2]/15 transition-all flex items-center gap-3 overflow-hidden w-full box-border"
            onClick={() => {
              const userInfo = localStorage.getItem("user");
              let userEmail = null;
              if (userInfo) {
                try {
                  const parsedUser = JSON.parse(userInfo);
                  userEmail = parsedUser.email;
                } catch {
                  userEmail = null;
                }
              }
              if (userEmail) {
                window.location.href = `http://localhost:5000/api/auth/discord/join?email=${encodeURIComponent(userEmail)}`;
              } else {
                alert("Please log in to join our Discord community.");
              }
            }}
            title="Join Study Discord Community"
          >
            <div className="lv-discord-icon-wrap w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] shrink-0 flex items-center justify-center rounded-xl bg-[#5865F2]/15 text-[#5865F2]">
              <svg
                width="22"
                height="22"
                className="shrink-0 text-[#5865F2]"
                style={{
                  width: "22px",
                  height: "22px",
                  minWidth: "22px",
                  minHeight: "22px",
                  maxWidth: "22px",
                  maxHeight: "22px",
                  flexShrink: 0,
                  display: "block",
                }}
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
              </svg>
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs font-bold text-foreground truncate">Join Study Discord</p>
              <p className="text-[11px] text-muted-foreground truncate">Collaborate with peers & instructor</p>
            </div>
            <span className="text-[#5865F2] text-xs font-bold shrink-0 ml-auto">→</span>
          </div>
        </div>
      </div>

      {showQuizModal && (
        <QuizModal
          moduleId={currentQuizModule}
          onClose={() => setShowQuizModal(false)}
          onResult={handleQuizResult}
        />
      )}
    </div>
  );
}
