import React, { useContext, useState, useEffect } from 'react';
import { InstructorContext } from './Instructor';
import axios from 'axios';

const QuizzesPage = () => {
  const { darkMode, courses, quizzes, setQuizzes } = useContext(InstructorContext);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [newQuiz, setNewQuiz] = useState({ title: '', courseId: '', questions: [], timeLimit: '' });
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    answer: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/quizzes", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setQuizzes(response.data.quizzes);
        }
      } catch (error) {
        console.error("Failed to fetch quizzes:", error);
        // Fallback to mock data if API fails
        setQuizzes([
          { id: 1, title: 'Python Basics Quiz', courseId: 1, questions: [{ type: 'multiple-choice', question: 'What is Python?', options: ['Snake', 'Programming Language', 'Food', 'Animal'], answer: 'Programming Language' }] },
          { id: 2, title: 'JavaScript Fundamentals', courseId: 2, questions: [{ type: 'fill-blank', question: 'JavaScript is a ___ language.', answer: 'programming' }] }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [setQuizzes]);

  const handleCreateQuiz = () => {
    setIsCreatingQuiz(true);
    setEditingQuizId(null);
    setNewQuiz({ title: '', courseId: '', questions: [] });
  };

  const handleSaveQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      let response;
      if (editingQuizId) {
        response = await axios.put(`http://localhost:5000/api/quizzes/${editingQuizId}`, newQuiz, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post("http://localhost:5000/api/quizzes", newQuiz, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      if (response.data.success) {
        if (editingQuizId) {
          setQuizzes(quizzes.map(q => q.id === editingQuizId ? response.data.quiz : q));
        } else {
          setQuizzes([...quizzes, response.data.quiz]);
        }
        setIsCreatingQuiz(false);
        setNewQuiz({ title: '', courseId: '', questions: [] });
        setEditingQuizId(null);
      }
    } catch (error) {
      console.error("Failed to save quiz:", error);
      alert('Failed to save quiz. Please try again.');
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuizId(quiz.id);
    setNewQuiz(quiz);
    setIsCreatingQuiz(true);
  };

  const handleDeleteQuiz = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.delete(`http://localhost:5000/api/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setQuizzes(quizzes.filter(q => q.id !== id));
        }
      } catch (error) {
        console.error("Failed to delete quiz:", error);
        alert('Failed to delete quiz. Please try again.');
      }
    }
  };

  const handleAddQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, { ...currentQuestion, id: Date.now() }]
    });
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      answer: ''
    });
  };

  const lightBg = 'rgb(250, 247, 247)';
  const darkBg = 'rgb(22, 21, 21)';
  const lightText = '#333';
  const darkText = '#f8f7f7';
  const lightSubText = '#666';
  const darkSubText = '#665c5c';
  const lightBorder = '#d1d5db';
  const darkBorder = '#4b5563';
  const lightInputBg = 'white';
  const darkInputBg = 'rgb(22, 21, 21)';

  if (loading) {
    return <div style={{ padding: '20px', backgroundColor: darkMode ? darkBg : lightBg, minHeight: '100vh', color: darkMode ? darkText : lightText }}>Loading quizzes...</div>;
  }

  if (isCreatingQuiz) {
    return (
      <div style={{ padding: '20px', backgroundColor: darkMode ? darkBg : lightBg, minHeight: '100vh', color: darkMode ? darkText : lightText }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '24px' }}>{editingQuizId ? 'Edit Quiz' : 'Create New Quiz'}</h1>
        <div style={{ backgroundColor: darkMode ? darkBg : 'white', padding: '24px', borderRadius: '8px', border: darkMode ? `1px solid ${darkBorder}` : '1px solid #ddd' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Quiz Title</label>
            <input
              type="text"
              value={newQuiz.title}
              onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
              style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Associate with Course</label>
            <select
              value={newQuiz.courseId}
              onChange={(e) => setNewQuiz({ ...newQuiz, courseId: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText }}
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Time Limit (minutes)</label>
            <input
              type="number"
              min={1}
              value={newQuiz.timeLimit}
              onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: e.target.value })}
              placeholder="Enter time limit in minutes"
              style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText }}
            />
          </div>

          <h3 style={{ marginBottom: '16px' }}>Add Questions</h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Question Type</label>
            <select
              value={currentQuestion.type}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
              style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText }}
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="fill-blank">Fill in the Blank</option>
              <option value="short-answer">Short Answer</option>
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Question</label>
            <textarea
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
              style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText, minHeight: '80px' }}
            />
          </div>
          {currentQuestion.type === 'multiple-choice' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Options</label>
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
                  style={{ width: '100%', padding: '8px', marginBottom: '8px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText }}
                />
              ))}
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Correct Answer</label>
              <select
                value={currentQuestion.answer}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText }}
              >
                <option value="">Select Correct Answer</option>
                {currentQuestion.options.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}
          {currentQuestion.type === 'fill-blank' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Correct Answer</label>
              <input
                type="text"
                value={currentQuestion.answer}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                placeholder="Correct answer for the blank"
                style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText }}
              />
            </div>
          )}
          {currentQuestion.type === 'short-answer' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Sample Answer</label>
              <textarea
                value={currentQuestion.answer}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                placeholder="Sample or expected answer"
                style={{ width: '100%', padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText, minHeight: '80px' }}
              />
            </div>
          )}
          <button onClick={handleAddQuestion} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', marginRight: '8px' }}>
            Add Question
          </button>
          <div style={{ marginTop: '16px' }}>
            <h4>Questions Added: {newQuiz.questions.length}</h4>
          </div>
          <div style={{ marginTop: '24px' }}>
            <button onClick={() => setIsCreatingQuiz(false)} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', marginRight: '8px' }}>
              Back
            </button>
            <button onClick={handleSaveQuiz} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', marginRight: '8px' }}>
              Save Quiz
            </button>
            <button onClick={() => setIsCreatingQuiz(false)} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: darkMode ? darkBg : lightBg, minHeight: '100vh', color: darkMode ? darkText : lightText }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: darkMode ? darkText : lightText }}>Quizzes</h1>
        <button
          onClick={handleCreateQuiz}
          style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
        >
          New Quiz
        </button>
      </div>
      <p style={{ marginBottom: '24px', color: darkMode ? darkSubText : lightSubText }}>Manage quizzes for your courses.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {quizzes.map((quiz) => (
          <div key={quiz.id} style={{
            backgroundColor: darkMode ? darkBg : 'white',
            padding: '24px',
            borderRadius: darkMode ? '0' : '8px',
            boxShadow: darkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
            border: darkMode ? `1px solid ${darkBorder}` : '1px solid #ddd',
            transition: 'transform 0.3s, box-shadow 0.3s'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: darkMode ? darkText : lightText }}>{quiz.title}</h3>
            <p style={{ fontSize: '1rem', color: darkMode ? darkSubText : lightSubText, marginBottom: '16px' }}>Course: {courses.find(c => c.id === quiz.courseId)?.title || 'Unknown'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: darkMode ? darkText : lightText }}>
              <span>{quiz.questions.length} questions</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEditQuiz(quiz)} style={{ color: darkMode ? '#0f75eb' : '#3b82f6', textDecoration: 'none', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDeleteQuiz(quiz.id)} style={{ color: darkMode ? '#ef4444' : '#ef4444', textDecoration: 'none', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizzesPage;
