import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Quizzes = ({ onNext, onPrev, darkMode, course, setCourse }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [quizData, setQuizData] = useState({ title: '', questions: [], timeLimit: '' });
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    answer: ''
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  const handleEditQuestion = (index) => {
    setEditingQuestionIndex(index);
    setCurrentQuestion({ ...quizData.questions[index] });
  };

  const saveEditedQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Please enter a question.');
      return;
    }
    if (currentQuestion.type === 'multiple-choice' && (currentQuestion.answer === '' || currentQuestion.answer === null || currentQuestion.answer === undefined)) {
      alert('Please select the correct answer for multiple choice.');
      return;
    }
    if (currentQuestion.type !== 'multiple-choice' && !currentQuestion.answer.trim()) {
      alert('Please provide an answer.');
      return;
    }

    const updatedQuestions = [...quizData.questions];
    updatedQuestions[editingQuestionIndex] = { ...currentQuestion, id: updatedQuestions[editingQuestionIndex].id };
    setQuizData({ ...quizData, questions: updatedQuestions });
    setEditingQuestionIndex(null);
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      answer: ''
    });
  };

  const cancelEditQuestion = () => {
    setEditingQuestionIndex(null);
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      answer: ''
    });
  };

  useEffect(() => {
    if (course.id) {
      fetchModules();
    }
  }, [course.id]);

  // Load existing draft for current module (if any) when module changes
  useEffect(() => {
    if (!modules.length) return;
    const moduleId = modules[currentModuleIndex]?.id;
    if (!moduleId) return;
    const drafts = course.quizDrafts || {};
    const draft = drafts[moduleId];
    setQuizData(draft || { title: '', questions: [], timeLimit: '' });
    setEditingQuestionIndex(null);
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      answer: ''
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModuleIndex, modules.length]);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/modules/${course.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setModules(response.data.modules);
        // Initialize quiz draft for first module if present
        const firstModule = response.data.modules?.[0];
        if (firstModule) {
          const drafts = course.quizDrafts || {};
          const draft = drafts[firstModule.id];
          setQuizData(draft || { title: '', questions: [] });
        }
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      alert('Failed to load modules for quiz creation.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Please enter a question.');
      return;
    }
    if (currentQuestion.type === 'multiple-choice' && (currentQuestion.answer === '' || currentQuestion.answer === null || currentQuestion.answer === undefined)) {
      alert('Please select the correct answer for multiple choice.');
      return;
    }
    if (currentQuestion.type !== 'multiple-choice' && !currentQuestion.answer.trim()) {
      alert('Please provide an answer.');
      return;
    }

    const updated = {
      ...quizData,
      questions: [...quizData.questions, { ...currentQuestion, id: Date.now() }]
    };
    setQuizData(updated);

    // Persist draft to parent (to survive step navigation)
    const moduleId = modules[currentModuleIndex]?.id;
    if (moduleId && setCourse) {
      setCourse(prev => ({
        ...prev,
        quizDrafts: {
          ...(prev.quizDrafts || {}),
          [moduleId]: updated
        }
      }));
    }

    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      answer: ''
    });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    const updated = { ...quizData, questions: updatedQuestions };
    setQuizData(updated);

    // Persist to parent drafts
    const moduleId = modules[currentModuleIndex]?.id;
    if (moduleId && setCourse) {
      setCourse(prev => ({
        ...prev,
        quizDrafts: {
          ...(prev.quizDrafts || {}),
          [moduleId]: updated
        }
      }));
    }
  };

  const saveQuiz = async () => {
    if (!quizData.title.trim()) {
      alert('Please enter a quiz title.');
      return;
    }
    if (quizData.questions.length === 0) {
      alert('Please add at least one question.');
      return;
    }
    if (!quizData.timeLimit || isNaN(quizData.timeLimit) || Number(quizData.timeLimit) <= 0) {
      alert('Please enter a valid time limit in minutes.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: quizData.title,
        questions: quizData.questions,
        moduleId: modules[currentModuleIndex].id,
        timeLimit: Number(quizData.timeLimit)
      };

      const response = await axios.post('http://localhost:5000/api/quizzes', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });


      if (response.data.success) {
        // Update local modules state to reflect saved quiz
        const updatedModules = [...modules];
        if (!updatedModules[currentModuleIndex].quizzes) {
          updatedModules[currentModuleIndex].quizzes = [];
        }
        updatedModules[currentModuleIndex].quizzes.push({
          id: response.data.quiz.id,
          title: response.data.quiz.title
        });
        setModules(updatedModules);

        // Reset for next module or proceed
        setQuizData({ title: '', questions: [] });
        setCurrentQuestion({
          type: 'multiple-choice',
          question: '',
          options: ['', '', '', ''],
          answer: ''
        });

        // Move to next module or proceed to publish
        if (currentModuleIndex < modules.length - 1) {
          setCurrentModuleIndex(currentModuleIndex + 1);
        } else {
          // All modules have quizzes, proceed to publish
          onNext();
        }
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Failed to save quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canProceedToPublish = modules.every(module => module.quizzes && module.quizzes.length > 0);

  const lightBg = 'white';
  const darkBg = 'rgb(22, 21, 21)';
  const lightText = '#333';
  const darkText = '#f8f7f7';
  const LIGHT_SUB_TEXT = '#666';
  const DARK_SUB_TEXT = '#665c5c';
  const lightBorder = '#d1d5db';
  const darkBorder = '#4b5563';
  const lightInputBg = 'white';
  const darkInputBg = 'rgb(22, 21, 21)';
  const lightInputText = '#333';
  const darkInputText = '#f8f7f7';
  const lightGray = '#f3f4f6';
  const darkGray = 'rgb(31, 41, 55)';
  const LIGHT_BUTTON_BG = '#e5e7eb';
  const DARK_BUTTON_BG = '#4b5563';

  if (loading) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: darkMode ? darkText : lightText }}>Loading modules...</p>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <p style={{ color: darkMode ? darkText : lightText }}>No modules found. Please add modules in the Content Outline step first.</p>
        <button onClick={onPrev} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          Back to Content Outline
        </button>
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];

  const hasQuiz = currentModule?.quizzes && currentModule.quizzes.length > 0;

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', backgroundColor: darkMode ? darkBg : lightBg, padding: '24px', borderRadius: '8px', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.1)', border: darkMode ? `1px solid ${darkBorder}` : 'none' }}>
      <h2 style={{ fontSize: '1.5rem', color: darkMode ? darkText : lightText, marginBottom: '16px' }}>
        Create Quiz for Module: {currentModule.title}
      </h2>

      {hasQuiz ? (
        <div style={{ padding: '16px', backgroundColor: darkMode ? darkGray : lightGray, borderRadius: '6px', marginBottom: '16px' }}>
          <p style={{ color: darkMode ? darkText : lightText, margin: 0 }}>
            Quiz already created: <strong>{currentModule.quizzes[0].title}</strong>
          </p>
          <button
            onClick={() => {
              if (currentModuleIndex < modules.length - 1) {
                setCurrentModuleIndex(currentModuleIndex + 1);
              } else {
                onNext();
              }
            }}
            style={{ marginTop: '8px', padding: '6px 12px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            {currentModuleIndex < modules.length - 1 ? 'Next Module' : 'Proceed to Publish'}
          </button>
        </div>
      ) : (
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
            <label style={{ display: 'block', fontWeight: 'bold', color: darkMode ? darkText : lightText, marginBottom: '8px' }}>Quiz Title</label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              placeholder="e.g., Module Quiz"
              style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkInputText : lightInputText }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', color: darkMode ? darkText : lightText, marginBottom: '8px' }}>Time Limit (minutes)</label>
            <input
              type="number"
              min={1}
              value={quizData.timeLimit}
              onChange={(e) => setQuizData({ ...quizData, timeLimit: e.target.value })}
              placeholder="Enter time limit in minutes"
              style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkInputText : lightInputText }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', color: darkMode ? darkText : lightText, marginBottom: '8px' }}>Add Questions</label>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? darkText : lightText }}>Question Type</label>
              <select
                value={currentQuestion.type}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
                style={{ width: '100%', padding: '8px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '4px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkInputText : lightInputText }}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="fill-blank">Fill in the Blank</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? darkText : lightText }}>Question</label>
              <textarea
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                placeholder="Enter your question here..."
                style={{ width: '100%', padding: '8px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '4px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkInputText : lightInputText, minHeight: '60px' }}
              />
            </div>

            {currentQuestion.type === 'multiple-choice' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? darkText : lightText }}>Options</label>
                {currentQuestion.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...currentQuestion.options];
                      newOptions[index] = e.target.value;
                      setCurrentQuestion({ ...currentQuestion, options: newOptions });
                    }}
                    placeholder={`Option ${index + 1}`}
                    style={{ width: '100%', padding: '6px', marginBottom: '6px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '4px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkInputText : lightInputText }}
                  />
                ))}
                <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? darkText : lightText }}>Correct Answer</label>
                <select
                  value={currentQuestion.answer}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '4px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkInputText : lightInputText }}
                >
                  <option value="">Select Correct Answer</option>
                  {currentQuestion.options.map((option, index) => (
                    <option key={index} value={index}>{String.fromCharCode(65 + index)}. {option}</option>
                  ))}
                </select>
              </div>
            )}

            {(currentQuestion.type === 'fill-blank' || currentQuestion.type === 'short-answer') && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? darkText : lightText }}>
                  {currentQuestion.type === 'fill-blank' ? 'Correct Answer' : 'Sample Answer'}
                </label>
                <input
                  type="text"
                  value={currentQuestion.answer}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                  placeholder={currentQuestion.type === 'fill-blank' ? 'Correct answer for the blank' : 'Sample or expected answer'}
                  style={{ width: '100%', padding: '8px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '4px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkInputText : lightInputText }}
                />
              </div>
            )}

            {editingQuestionIndex !== null ? (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={saveEditedQuestion}
                  style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                >
                  Save Edited Question
                </button>
                <button
                  type="button"
                  onClick={cancelEditQuestion}
                  style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                >
                  Cancel Edit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddQuestion}
                style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', marginBottom: '16px' }}
              >
                Add Question
              </button>
            )}
          </div>

          <div>
            <h4 style={{ color: darkMode ? darkText : lightText, marginBottom: '8px' }}>Questions Added ({quizData.questions.length})</h4>
            {quizData.questions.map((q, index) => (
              <div key={q.id} style={{ padding: '8px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '4px', marginBottom: '8px', backgroundColor: darkMode ? darkGray : lightGray }}>
                <p style={{ margin: '0 0 4px 0', color: darkMode ? darkText : lightText, fontWeight: 'bold' }}>
                  {index + 1}. {q.question} ({q.type})
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleEditQuestion(index)}
                    style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  // Persist current draft before leaving step
                  const moduleId = modules[currentModuleIndex]?.id;
                  if (moduleId && setCourse) {
                    setCourse(prev => ({
                      ...prev,
                      quizDrafts: {
                        ...(prev.quizDrafts || {}),
                        [moduleId]: quizData
                      }
                    }));
                  }
                  onPrev();
                }}
                style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              >
                Previous Steps
              </button>
              {currentModuleIndex > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    // Persist current draft and go to prev module
                    const moduleId = modules[currentModuleIndex]?.id;
                    if (moduleId && setCourse) {
                      setCourse(prev => ({
                        ...prev,
                        quizDrafts: {
                          ...(prev.quizDrafts || {}),
                          [moduleId]: quizData
                        }
                      }));
                    }
                    setCurrentModuleIndex(currentModuleIndex - 1);
                  }}
                  style={{ padding: '8px 16px', backgroundColor: '#9ca3af', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                >
                  Previous Module
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={async () => {
                  // Persist draft to parent before actual save
                  const moduleId = modules[currentModuleIndex]?.id;
                  if (moduleId && setCourse) {
                    setCourse(prev => ({
                      ...prev,
                      quizDrafts: {
                        ...(prev.quizDrafts || {}),
                        [moduleId]: quizData
                      }
                    }));
                  }
                  await saveQuiz();
                  // Clear draft for this module on successful save
                  if (moduleId && setCourse) {
                    setCourse(prev => {
                      const nextDrafts = { ...(prev.quizDrafts || {}) };
                      delete nextDrafts[moduleId];
                      return { ...prev, quizDrafts: nextDrafts };
                    });
                  }
                }}
                disabled={saving}
                style={{ padding: '8px 16px', backgroundColor: saving ? '#9ca3af' : '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save Quiz'}
              </button>

              {canProceedToPublish && (
                <button
                  type="button"
                  onClick={onNext}
                  style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                >
                  Proceed to Publish
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: darkMode ? darkGray : lightGray, borderRadius: '6px' }}>
        <p style={{ color: darkMode ? darkText : lightText, margin: 0 }}>
          Module {currentModuleIndex + 1} of {modules.length} •
          {modules.filter(m => m.quizzes && m.quizzes.length > 0).length} of {modules.length} modules have quizzes
        </p>
      </div>
    </div>
  );
};

export default Quizzes;
