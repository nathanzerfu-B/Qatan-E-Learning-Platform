import { useState, useEffect } from 'react';
import axios from 'axios';

const Publish = ({ onPrev, darkMode, course, onPublish, setCourse }) => {
  const [showQuizManager, setShowQuizManager] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingModuleIndex, setEditingModuleIndex] = useState(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    answer: ''
  });
  const [showEditSettings, setShowEditSettings] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const handlePublish = () => {
    onPublish('pending_approval');
  };

  const handleSaveDraft = () => {
    onPublish('draft');
  };

  // Removed unused variable isPublished

  // Removed unused handleEditCourse function


  const handleManageQuizzes = () => setShowQuizManager(true);

  const handleEditQuiz = (moduleIndex, quizIndex) => {
    setEditingModuleIndex(moduleIndex);
    setEditingQuiz({ ...course.modules[moduleIndex].quizzes[quizIndex], quizIndex });
  };

  const handleSaveQuizEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const quizId = editingQuiz.id;

      if (!quizId) {
        console.error('Quiz ID not found for update');
        alert('Error: Quiz ID not found. Please refresh and try again.');
        return;
      }

      // Update the quiz on the backend
      const response = await axios.put(`http://localhost:5000/api/quizzes/${quizId}`, {
        title: editingQuiz.title,
        questions: editingQuiz.questions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        // Update local state
        const updatedModules = [...course.modules];
        updatedModules[editingModuleIndex].quizzes[editingQuiz.quizIndex] = {
          ...editingQuiz,
          title: editingQuiz.title,
          questions: editingQuiz.questions
        };
        setCourse({ ...course, modules: updatedModules });
        setEditingQuiz(null);
        setEditingModuleIndex(null);
        console.log('Quiz updated successfully');
      } else {
        alert('Failed to save quiz changes.');
      }
    } catch (error) {
      console.error('Failed to save quiz changes:', error);
      alert('Failed to save quiz changes. Please try again.');
    }
  };

  const handleAddQuestion = () => {
    const updatedQuestions = [...editingQuiz.questions, { ...newQuestion, id: Date.now() }];
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
    setNewQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      answer: ''
    });
    setShowAddQuestion(false);
  };

  const handleUpdateNewQuestion = (field, value) => {
    setNewQuestion({ ...newQuestion, [field]: value });
  };

  const handleUpdateNewQuestionOption = (optIndex, value) => {
    const options = [...newQuestion.options];
    options[optIndex] = value;
    setNewQuestion({ ...newQuestion, options });
  };

  const handleDeleteQuestion = (questionIndex) => {
    const updatedQuestions = editingQuiz.questions.filter((_, index) => index !== questionIndex);
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const handleUpdateQuestion = (questionIndex, field, value) => {
    const updatedQuestions = [...editingQuiz.questions];
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], [field]: value };
    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
  };

  const handleUpdateMultipleChoiceOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...editingQuiz.questions];
    const question = updatedQuestions[questionIndex];
    if (question.type === 'multiple-choice') {
      const options = [...question.options];
      options[optionIndex] = value;
      updatedQuestions[questionIndex] = { ...question, options };
      setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
    }
  };

  const handleEditSettings = () => {
    setEditingCourse({ ...course });
    setShowEditSettings(true);
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/courses/${course.id}`, {
        title: editingCourse.title,
        description: editingCourse.description,
        category: editingCourse.category,
        visibility: editingCourse.visibility
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setCourse(editingCourse);
        setShowEditSettings(false);
        setEditingCourse(null);
        console.log('Course settings updated successfully');
      } else {
        alert('Failed to save course settings.');
      }
    } catch (error) {
      console.error('Failed to save course settings:', error);
      alert('Failed to save course settings. Please try again.');
    }
  };

  const handleUpdateCourseField = (field, value) => {
    setEditingCourse({ ...editingCourse, [field]: value });
  };

  const handlePricingChange = (e) => {
    setCourse({ ...course, pricing: e.target.value });
  };

  const handlePriceChange = (e) => {
    setCourse({ ...course, price: parseFloat(e.target.value) || 0 });
  };

  const handleDiscountPriceChange = (e) => {
    setCourse({ ...course, discountPrice: parseFloat(e.target.value) || 0 });
  };

  const handleEnableDiscountChange = (e) => {
    setCourse({ ...course, enableDiscount: e.target.checked });
  };

  // Fetch full course with nested relations for Publish summaries
  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!course?.id) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/courses/${course.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res?.data?.success && res?.data?.course) {
          // Update parent with the full nested course
          setCourse(res.data.course);
        }
      } catch (err) {
        console.error('Failed to load full course for Publish:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [course?.id, setCourse]);

  // --- Styles ---
  const cardStyle = !darkMode
    ? {
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)',
        padding: 24,
        border: '1px solid #f0f0f0',
      }
    : {
        border: '1px solid #4b5563',
        borderRadius: 12,
        padding: 24,
      };

  const cardClass = darkMode
    ? 'bg-[#23232b] text-gray-100 shadow-lg rounded-xl'
    : '';

  const headingStyle = !darkMode
    ? { color: '#222', fontWeight: 700, fontSize: 20, marginBottom: 18 }
    : { fontWeight: 700, fontSize: 20, marginBottom: 18 };

  const labelStyle = !darkMode
    ? { color: '#222', fontWeight: 600, fontSize: 15 }
    : { fontWeight: 600, fontSize: 15 };

  const inputStyle = !darkMode
    ? {
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '8px 12px',
        background: '#fff',
        color: '#222',
        marginTop: 4,
        marginBottom: 8,
        fontSize: 15,
      }
    : {
        border: '1px solid #4b5563',
        borderRadius: 8,
        padding: '8px 12px',
        background: '#23232b',
        color: '#f8f7f7',
        marginTop: 4,
        marginBottom: 8,
        fontSize: 15,
      };

  const btnStyle = !darkMode
    ? {
        borderRadius: 8,
        padding: '12px 0',
        fontWeight: 600,
        fontSize: 16,
        marginBottom: 12,
        marginTop: 0,
        boxShadow: 'none',
        border: 'none',
        transition: 'background 0.2s',
      }
    : {
        borderRadius: 8,
        padding: '12px 0',
        fontWeight: 600,
        fontSize: 16,
        marginBottom: 12,
        marginTop: 0,
        boxShadow: 'none',
        border: 'none',
        transition: 'background 0.2s',
        backgroundColor: '#2563eb',
        color: '#fff',
      };

  const primaryBtnColor = !darkMode
    ? { background: '#2563eb', color: '#fff' }
    : {};

  const secondaryBtnColor = !darkMode
    ? { background: '#63666e', color: '#fff' }
    : {};

  // Stepper style


  if (loading) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <p>Loading course data...</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center w-full"
      style={{
        background: !darkMode ? '#fcf7f5' : undefined,
        minHeight: '100vh',
        padding: '32px 0',
      }}
    >
      <div style={{ maxWidth: 1200, width: '100%' }}>
        
        {/* Title and subtitle */}
        <div style={{ marginBottom: 32 }}>
          <h2
            className={darkMode ? 'text-gray-100' : ''}
            style={{
              fontWeight: 600,
              fontSize: 28,
              textAlign: 'center',
              marginBottom: 8,
              color: !darkMode ? '#222' : undefined,
              letterSpacing: 0.2,
            }}
          >
            {course.title || 'Course Title'}
          </h2>
          <p
            className={darkMode ? 'text-gray-300' : ''}
            style={{
              textAlign: 'center',
              color: !darkMode ? '#444' : undefined,
              marginBottom: 0,
              fontSize: 16,
            }}
          >
            Ready to go live? Review your course details one last time before publishing.
          </p>
        </div>
        {/* Main grid layout */}
        <div
          className="grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Course Details */}
            <div className={cardClass} style={cardStyle}>
              <div style={headingStyle}>Course Details</div>
              <div style={{ marginBottom: 8 }}>
                <span style={labelStyle}>Title:</span> {course.title}
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={labelStyle}>Description:</span> {course.description}
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={labelStyle}>Category:</span> &gt; {course.category}
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={labelStyle}>Visibility:</span> {course.visibility}
              </div>
              <button
                onClick={handleEditSettings}
                style={
                  !darkMode
                    ? {
                        ...secondaryBtnColor,
                        ...btnStyle,
                        width: 120,
                        marginTop: 8,
                      }
                    : {
                        ...btnStyle,
                        width: 120,
                        marginTop: 8,
                        backgroundColor: '#4b5563',
                      }
                }
              >
                Edit Settings
              </button>
            </div>
            {/* Course Pricing */}
            <div className={cardClass} style={cardStyle}>
              <div style={headingStyle}>Course Pricing</div>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="radio"
                  id="paid"
                  name="pricing"
                  value="paid"
                  checked={course.pricing === 'paid'}
                  onChange={handlePricingChange}
                  style={{ marginRight: 4 }}
                />
                <label htmlFor="paid" style={{ marginRight: 16, ...labelStyle }}>
                  Paid
                </label>
                <input
                  type="radio"
                  id="free"
                  name="pricing"
                  value="free"
                  checked={course.pricing === 'free'}
                  onChange={handlePricingChange}
                  style={{ marginRight: 4 }}
                />
                <label htmlFor="free" style={labelStyle}>
                  Free
                </label>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Set Price:</label>
                <input
                  type="number"
                  value={course.price}
                  onChange={handlePriceChange}
                  style={{ ...inputStyle, width: 120, marginLeft: 8 }}
                />
                <span style={{ marginLeft: 8, color: '#63666e', fontWeight: 500 }}>Birr</span>
              </div>
              <div>
                <label style={labelStyle}>Discount Price:</label>
                <input
                  type="number"
                  value={course.discountPrice}
                  onChange={handleDiscountPriceChange}
                  disabled={!course.enableDiscount}
                  style={{ ...inputStyle, width: 120, marginLeft: 8 }}
                />
                <span style={{ marginLeft: 8, color: '#63666e', fontWeight: 500 }}>Birr</span>
                <input
                  type="checkbox"
                  id="discount"
                  checked={course.enableDiscount}
                  onChange={handleEnableDiscountChange}
                  style={{ marginLeft: 16 }}
                />
                <label htmlFor="discount" style={{ marginLeft: 4, ...labelStyle }}>
                  Enable Discount
                </label>
              </div>
            </div>
          </div>
          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Publish Course */}
            <div className={cardClass} style={cardStyle}>
              <div style={headingStyle}>Publish Course</div>
              <p style={{ color: !darkMode ? '#444' : undefined, marginBottom: 20, fontSize: 15 }}>
                Once you publish, your course will be live and accessible to students.
              </p>
              <button
                onClick={handlePublish}
                style={
                  !darkMode
                    ? {
                        ...primaryBtnColor,
                        ...btnStyle,
                        width: '100%',
                        marginBottom: 12,
                      }
                    : {
                        ...btnStyle,
                        width: '100%',
                        marginBottom: 12,
                      }
                }
              >
                Publish Now
              </button>
              <button
                onClick={handleSaveDraft}
                style={
                  !darkMode
                    ? {
                        ...secondaryBtnColor,
                        ...btnStyle,
                        width: '100%',
                        marginBottom: 12,
                      }
                    : {
                        ...btnStyle,
                        width: '100%',
                        marginBottom: 12,
                        backgroundColor: '#4b5563',
                      }
                }
              >
                Save as Draft
              </button>
              <button
                onClick={onPrev}
                style={
                  !darkMode
                    ? {
                        ...secondaryBtnColor,
                        ...btnStyle,
                        width: 180,
                        marginTop: 0,
                      }
                    : {
                        ...btnStyle,
                        width: 180,
                        marginTop: 0,
                        backgroundColor: '#4b5563',
                      }
                }
              >
                Previous Steps
              </button>
            </div>
            {/* Settings Review */}
            <div className={cardClass} style={cardStyle}>
              <div style={headingStyle}>Settings Review</div>
              <div style={{ marginBottom: 8, fontSize: 15 }}>
                Enrollment:{' '}
                <strong style={{ color: '#2563eb' }}>{course.pricing}</strong>
              </div>
              <div style={{ marginBottom: 8, fontSize: 15 }}>
                Price:{' '}
                <strong style={{ color: '#2563eb' }}>${course.price}</strong>
              </div>
              {course.enableDiscount && (
                <div style={{ fontSize: 15 }}>
                  Discount Price:{' '}
                  <strong style={{ color: '#2563eb' }}>
                    ${course.discountPrice}
                  </strong>
                </div>
              )}
            </div>
          </div>
          {/* Content Outline Summary (spans both columns) */}
          <div
            className={cardClass}
            style={{
              ...cardStyle,
              gridColumn: '1 / span 2',
              marginTop: 0,
            }}
          >
            <div style={headingStyle}>Content Outline Summary</div>
            {course.modules && course.modules.length > 0 ? course.modules.map((module, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                {/* Module header */}
                <div
                  style={{
                    marginBottom: 8,
                    padding: 12,
                    borderRadius: 8,
                    background: !darkMode ? '#f7f8fa' : '#18181c',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 15,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{module.title}</span>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>
                    {module.lessons ? module.lessons.length : 0} lessons
                  </span>
                </div>
                {/* Lessons list */}
                {module.lessons && module.lessons.length > 0 && (
                  <div style={{ marginLeft: 16 }}>
                    {module.lessons.map((lesson, lIndex) => (
                      <div
                        key={lIndex}
                        style={{
                          marginBottom: 8,
                          padding: 10,
                          borderRadius: 6,
                          background: !darkMode ? '#f0f0f0' : '#2a2a2a',
                          fontSize: 14,
                          color: !darkMode ? '#333' : '#ddd'
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{lesson.title}</div>
                        <div style={{ fontSize: 12, marginTop: 4, color: !darkMode ? '#555' : '#bbb' }}>
                          Type: <strong>{lesson.contentType || 'text'}</strong>
                          {lesson.mediaUrl ? (
                            <>
                              {' '}• Media: <a href={lesson.mediaUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                                {lesson.mediaUrl}
                              </a>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <div style={{ padding: 12, color: !darkMode ? '#666' : '#9ca3af' }}>
                No modules found. Please go back to Content Outline step.
              </div>
            )}
          </div>
          {/* Quiz Summary (spans both columns) */}
          <div
            className={cardClass}
            style={{
              ...cardStyle,
              gridColumn: '1 / span 2',
              marginTop: 0,
            }}
          >
            <div style={headingStyle}>Quiz Summary</div>
            <div
              style={{
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 15,
              }}
            >
              <span>
                Total Quizzes:{' '}
                <strong style={{ color: '#2563eb' }}>
                  {course.modules && course.modules.length > 0 ? course.modules.reduce(
                    (total, module) => total + (module.quizzes ? module.quizzes.length : 0),
                    0
                  ) : 0}
                </strong>
              </span>
              <button
                onClick={handleManageQuizzes}
                style={
                  !darkMode
                    ? {
                        ...secondaryBtnColor,
                        borderRadius: 8,
                        padding: '8px 24px',
                        fontWeight: 600,
                        fontSize: 15,
                      }
                    : {
                        ...btnStyle,
                        padding: '8px 24px',
                        fontWeight: 600,
                        fontSize: 15,
                        backgroundColor: '#4b5563',
                      }
                }
              >
                Manage Quizzes
              </button>
            </div>
            {course.modules && course.modules.length > 0 ? course.modules.map((module, moduleIndex) =>
              module.quizzes && module.quizzes.length > 0 ? module.quizzes.map((quiz, quizIndex) => (
                <div
                  key={`${moduleIndex}-${quizIndex}`}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 8,
                    background: !darkMode ? '#f7f8fa' : '#18181c',
                    fontSize: 15,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    {module.title} - {quiz.title} ({Array.isArray(quiz.questions) ? quiz.questions.length : 0} questions)
                  </div>

                  {/* Full question list */}
                  {Array.isArray(quiz.questions) && quiz.questions.length > 0 && (
                    <div style={{ marginLeft: 12 }}>
                      {quiz.questions.map((q, qIndex) => (
                        <div
                          key={qIndex}
                          style={{
                            marginBottom: 8,
                            padding: 8,
                            borderRadius: 6,
                            background: !darkMode ? '#f0f0f0' : '#2a2a2a',
                            color: !darkMode ? '#333' : '#ddd'
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            Q{qIndex + 1}: {q.question}
                          </div>
                          <div style={{ fontSize: 12, marginTop: 4, color: !darkMode ? '#555' : '#bbb' }}>
                            Type: <strong>{q.type}</strong>
                          </div>
                          {q.type === 'multiple-choice' && Array.isArray(q.options) && q.options.length > 0 && (
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                              <div style={{ fontWeight: 600, marginBottom: 4 }}>Options:</div>
                              <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {q.options.map((opt, oi) => (
                                  <li key={oi} style={{ marginBottom: 2 }}>{opt}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            Answer: <strong>{q.answer}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )) : null
            ) : (
              <div style={{ padding: 12, color: !darkMode ? '#666' : '#9ca3af' }}>
                No quizzes found. Please go back to Quizzes step.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modals remain unchanged */}
      {showQuizManager && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: darkMode ? '#16161a' : 'white', padding: '20px', borderRadius: '8px', maxWidth: '800px', width: '90%', maxHeight: '90%', overflowY: 'auto' }}>
            <h3 className={headingStyle} style={{ marginBottom: '20px' }}>Manage Quizzes</h3>

            {course.modules.map((module, moduleIndex) =>
              module.quizzes.map((quiz, quizIndex) => (
                <div key={`${moduleIndex}-${quizIndex}`} style={{ marginBottom: '20px', padding: '15px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ color: darkMode ? '#f8f7f7' : '#333', margin: 0 }}>{module.title} - {quiz.title}</h4>
                    <button onClick={() => handleEditQuiz(moduleIndex, quizIndex)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                      Edit
                    </button>
                  </div>
                  <p style={{ color: darkMode ? '#d1d5db' : '#666', marginBottom: '10px' }}>{quiz.questions.length} questions</p>
                  <div>
                    {quiz.questions.map((question, qIndex) => (
                      <div key={qIndex} style={{ marginBottom: '8px', padding: '8px', backgroundColor: darkMode ? '#1f2937' : '#f9fafb', borderRadius: '4px' }}>
                        <strong style={{ color: darkMode ? '#f8f7f7' : '#333' }}>Q{qIndex + 1}:</strong> {question.question}
                        <br />
                        <small style={{ color: darkMode ? '#9ca3af' : '#666' }}>
                          Type: {question.type} | Answer: {question.answer}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}  

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowQuizManager(false)} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {editingQuiz && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: darkMode ? '#16161a' : 'white', padding: '20px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '90%', overflowY: 'auto' }}>
            <h3 style={{ color: darkMode ? '#f8f7f7' : '#333', marginBottom: '20px' }}>Edit Quiz</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Quiz Title</label>
              <input
                type="text"
                value={editingQuiz.title}
                onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              />
            </div>

            <h4 style={{ marginBottom: '16px', color: darkMode ? '#f8f7f7' : '#333' }}>Questions</h4>
            {editingQuiz.questions.map((question, qIndex) => (
              <div key={qIndex} style={{ marginBottom: '16px', padding: '12px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: darkMode ? '#f8f7f7' : '#333' }}>Question {qIndex + 1}</strong>
                  <button onClick={() => handleDeleteQuestion(qIndex)} style={{ padding: '4px 8px', backgroundColor: '#dc2626', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Question Text</label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
                  />
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Question Type</label>
                  <select
                    value={question.type}
                    onChange={(e) => handleUpdateQuestion(qIndex, 'type', e.target.value)}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="fill-in-the-blank">Fill in the Blank</option>
                    <option value="short-answer">Short Answer</option>
                  </select>
                </div>

                {question.type === 'multiple-choice' && (
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Options</label>
                    {question.options.map((option, optIndex) => (
                      <input
                        key={optIndex}
                        type="text"
                        value={option}
                        onChange={(e) => handleUpdateMultipleChoiceOption(qIndex, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`}
                        style={{ width: '100%', padding: '4px', marginBottom: '4px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
                      />
                    ))}
                  </div>
                )}

                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Correct Answer</label>
                  <input
                    type="text"
                    value={question.answer}
                    onChange={(e) => handleUpdateQuestion(qIndex, 'answer', e.target.value)}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
                  />
                </div>
              </div>
            ))}

            {/* Add New Question Button */}
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <button
                onClick={() => setShowAddQuestion(true)}
                style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
              >
                Add New Question
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingQuiz(null)} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveQuizEdit} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showAddQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: darkMode ? '#16161a' : 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px', width: '90%', maxHeight: '90%', overflowY: 'auto' }}>
            <h3 style={{ color: darkMode ? '#f8f7f7' : '#333', marginBottom: '20px' }}>Add New Question</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Question Type</label>
              <select
                value={newQuestion.type}
                onChange={(e) => handleUpdateNewQuestion('type', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="fill-in-the-blank">Fill in the Blank</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Question Text</label>
              <textarea
                value={newQuestion.question}
                onChange={(e) => handleUpdateNewQuestion('question', e.target.value)}
                rows="3"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              />
            </div>

            {newQuestion.type === 'multiple-choice' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Options</label>
                {newQuestion.options.map((option, optIndex) => (
                  <input
                    key={optIndex}
                    type="text"
                    value={option}
                    onChange={(e) => handleUpdateNewQuestionOption(optIndex, e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    style={{ width: '100%', padding: '6px', marginBottom: '4px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
                  />
                ))}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Correct Answer</label>
              <input
                type="text"
                value={newQuestion.answer}
                onChange={(e) => handleUpdateNewQuestion('answer', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddQuestion(false)} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddQuestion} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Add Question</button>
            </div>
          </div>
        </div>
      )}

      {showEditSettings && editingCourse && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: darkMode ? '#16161a' : 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px', width: '90%', maxHeight: '90%', overflowY: 'auto' }}>
            <h3 style={{ color: darkMode ? '#f8f7f7' : '#333', marginBottom: '20px' }}>Edit Course Settings</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Course Title</label>
              <input
                type="text"
                value={editingCourse.title || ''}
                onChange={(e) => handleUpdateCourseField('title', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Description</label>
              <textarea
                value={editingCourse.description || ''}
                onChange={(e) => handleUpdateCourseField('description', e.target.value)}
                rows="4"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Category</label>
              <select
                value={editingCourse.category || ''}
                onChange={(e) => handleUpdateCourseField('category', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              >
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="Marketing">Marketing</option>
                <option value="Business">Business</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', color: darkMode ? '#f8f7f7' : '#333' }}>Visibility</label>
              <select
                value={editingCourse.visibility || ''}
                onChange={(e) => handleUpdateCourseField('visibility', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`, backgroundColor: darkMode ? '#16161a' : 'white', color: darkMode ? '#f8f7f7' : '#333' }}
              >
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditSettings(false)} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveSettings} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Publish;
