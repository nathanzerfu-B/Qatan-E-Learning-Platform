import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstructorContext } from './Instructor';
import BasicInfo from './InstructorBasicInfo';
import ContentOutline from './InstructorContentOutline';
import Materials from './InstructorMaterials';
import Quizzes from './InstructorQuizzes';
import Publish from './InstructorPublish';
import axios from 'axios';

const CourseCreation = () => {
  const navigate = useNavigate();
  const { darkMode, addCourse, editingCourse } = useContext(InstructorContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [course, setCourse] = useState({
    title: '',
    description: '',
    category: '',
    visibility: 'public',
    modules: [],
    materials: [],
    quizzes: [],
    pricing: 'paid',
    price: 49.99,
    discountPrice: 39.99,
    enableDiscount: false,
    status: 'draft'
  });

  // Load editing course data if available
  useEffect(() => {
    if (editingCourse) {
      setCourse(editingCourse);
    }
  }, [editingCourse]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ title: '', questions: [] });
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    answer: ''
  });

  const steps = [
    { label: 'Basic Info', component: BasicInfo },
    { label: 'Content Outline', component: ContentOutline },
    { label: 'Materials', component: Materials },
    { label: 'Quizzes', component: Quizzes },
    { label: 'Publish', component: Publish }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async (status) => {
    try {
      const token = localStorage.getItem("token");
      const nextStatus = status || course.status || 'draft';

      // Base payload for create/update (nested data is saved via dedicated endpoints elsewhere)
      const payload = {
        title: course.title,
        description: course.description,
        category: course.category,
        visibility: course.visibility,
        pricing: course.pricing,
        price: course.price,
        discountPrice: course.discountPrice,
        enableDiscount: course.enableDiscount,
        status: nextStatus
      };

      console.log('Course publish/draft request:', { hasId: !!course.id, payload });

      let response;
      if (course.id) {
        // Update existing course (status, pricing, basics). Do not send nested here.
        response = await axios.put(`http://localhost:5000/api/courses/${course.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create a new course (first time draft/publish)
        response = await axios.post("http://localhost:5000/api/courses", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response?.data?.success && response?.data?.course) {
        // Persist returned course (to ensure we have an id for later nested operations)
        setCourse(prev => ({ ...prev, ...response.data.course }));
        addCourse(response.data.course);
        console.log('Course saved successfully:', response.data.course);
        navigate('..'); // Navigate back to courses list after publishing or saving draft
      } else {
        console.warn('Unexpected response from server:', response?.data);
        alert('Course save returned unexpected response. Please verify data.');
      }
    } catch (error) {
      console.error("Failed to save course (draft/publish):", error);
      const msg = error?.response?.data?.error || error?.response?.data?.message || error.message;
      alert(`Failed to save course. ${msg}`);
    }
  };

  const saveQuiz = async () => {
    try {
      if (!course?.id) {
        alert('Please complete Basic Info and create a draft (e.g., add a module) before adding a quiz.');
        return;
      }
      const token = localStorage.getItem('token');
      const payload = {
        title: newQuiz.title || 'New Quiz',
        questions: newQuiz.questions || [],
        courseId: course.id
      };
      const res = await axios.post('http://localhost:5000/api/quizzes', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success && res.data?.quiz) {
        const savedQuiz = res.data.quiz;
        const updatedModules = [...course.modules];
        if (!updatedModules[selectedModuleIndex].quizzes) {
          updatedModules[selectedModuleIndex].quizzes = [];
        }
        // Reflect in UI under the selected module (backend stores at course level)
        updatedModules[selectedModuleIndex].quizzes.push({ id: savedQuiz.id, title: savedQuiz.title });
        setCourse({ ...course, modules: updatedModules });
        setShowQuizModal(false);
        setNewQuiz({ title: '', questions: [] });
      } else {
        alert('Failed to save quiz.');
      }
    } catch (err) {
      console.error('Failed to save quiz:', err);
      alert(err?.response?.data?.message || 'Failed to save quiz.');
    }
  };

  const cancelQuiz = () => {
    setShowQuizModal(false);
    setNewQuiz({ title: '', questions: [] });
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      answer: ''
    });
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

  const CurrentComponent = steps[currentStep].component;

  const lightText = '#333';
  const darkText = '#f9fafb';
  const lightSubText = '#666';
  const darkSubText = '#d1d5db';

  return (
    <div style={{padding: '20px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <button onClick={() => navigate('..')} style={{
          padding: '8px 16px',
          backgroundColor: '#6b7280',
          color: 'white',
          borderRadius: '6px',
          cursor: 'pointer',
          border: 'none'
        }}>
          Back to Courses
        </button>
      </div>
      <section style={{marginBottom: '20px'}}>
        <h1 style={{fontSize: '2rem', color: darkMode ? darkText : lightText, marginBottom: '8px'}}>{editingCourse ? 'Edit Course' : 'Create a New Course'}</h1>
        <p style={{fontSize: '1.125rem', color: darkMode ? darkSubText : lightSubText}}>Follow the steps below to {editingCourse ? 'edit and update' : 'create and publish'} your course</p>
      </section>

      {/* Progress Steps */}
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative'}}>
        {steps.map((step, index) => (
          <div key={index} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10}}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.125rem',
              backgroundColor: index <= currentStep ? '#3b82f6' : (darkMode ? '#4b5563' : '#d1d5db'),
              color: index <= currentStep ? 'white' : (darkMode ? darkText : lightText)
            }}>
              {index + 1}
            </div>
            <span style={{
              marginTop: '8px',
              fontSize: '0.875rem',
              color: index <= currentStep ? '#3b82f6' : (darkMode ? '#9ca3af' : '#6b7280'),
              fontWeight: index <= currentStep ? 'bold' : 'normal'
            }}>
              {step.label}
            </span>
          </div>
        ))}
        {/* Progress Line */}
        <div style={{position: 'absolute', top: '24px', left: '24px', right: '24px', height: '4px', backgroundColor: darkMode ? '#4b5563' : '#d1d5db', zIndex: 0}}>
          <div
            style={{
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'all 0.3s',
              width: `${(currentStep / (steps.length - 1)) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div style={{maxWidth: '1024px', margin: '0 auto'}}>
        <CurrentComponent onNext={handleNext} onPrev={handlePrev} darkMode={darkMode} course={course} setCourse={setCourse} onPublish={handlePublish} onAddQuiz={(moduleIndex) => { setSelectedModuleIndex(moduleIndex); setShowQuizModal(true); }} />
      </div>

      {showQuizModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: darkMode ? '#16161a' : 'white', padding: '20px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '90%', overflowY: 'auto' }}>
            <h3 style={{ color: darkMode ? '#f8f7f7' : '#333', marginBottom: '20px' }}>Create New Quiz</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Quiz Title</label>
              <input
                type="text"
                value={newQuiz.title}
                onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              />
            </div>

            <h4 style={{ marginBottom: '16px', color: darkMode ? '#f8f7f7' : '#333' }}>Add Questions</h4>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Question Type</label>
              <select
                value={currentQuestion.type}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="fill-blank">Fill in the Blank</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Question</label>
              <textarea
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333', minHeight: '60px' }}
              />
            </div>
            {currentQuestion.type === 'multiple-choice' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Options</label>
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
                    style={{ width: '100%', padding: '6px', marginBottom: '6px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
                  />
                ))}
                <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Correct Answer</label>
                <select
                  value={currentQuestion.answer}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
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
                <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Correct Answer</label>
                <input
                  type="text"
                  value={currentQuestion.answer}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                  placeholder="Correct answer for the blank"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
                />
              </div>
            )}
            {currentQuestion.type === 'short-answer' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Sample Answer</label>
                <textarea
                  value={currentQuestion.answer}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                  placeholder="Sample or expected answer"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333', minHeight: '60px' }}
                />
              </div>
            )}
            <button onClick={handleAddQuestion} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', marginRight: '8px' }}>
              Add Question
            </button>
            <div style={{ marginTop: '16px', marginBottom: '20px' }}>
              <h5 style={{ color: darkMode ? '#f8f7f7' : '#333' }}>Questions Added: {newQuiz.questions.length}</h5>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={cancelQuiz} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveQuiz} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Save Quiz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCreation;
