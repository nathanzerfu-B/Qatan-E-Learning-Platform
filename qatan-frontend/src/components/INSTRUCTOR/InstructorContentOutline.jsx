import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContentOutline = ({ onNext, onPrev, darkMode, course, setCourse }) => {
  const [modules, setModules] = useState([]);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleFields, setEditingModuleFields] = useState({ title: '', description: '' });
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingLessonFields, setEditingLessonFields] = useState({ title: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course.id) {
      fetchModules();
    }
  }, [course.id]);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/modules/${course.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setModules(response.data.modules);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  // Ensure a draft course exists and return its id
  const ensureCourseExists = async () => {
    if (course?.id) return course.id;

    // Validate minimal required fields
    if (!course?.title || !course?.description) {
      alert('Please complete Basic Info (Title and Description) before adding modules.');
      throw new Error('Course not initialized');
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: course.title,
        description: course.description,
        // Optional fields; backend stores only supported ones
        category: course.category,
        visibility: course.visibility,
        // Do not send price for draft creation
        status: 'draft'
      };

      const response = await axios.post('http://localhost:5000/api/courses', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success && response.data?.course?.id) {
        const newId = response.data.course.id;
        // Persist id in parent course state
        if (typeof setCourse === 'function') {
          setCourse(prev => ({ ...prev, id: newId, status: response.data.course.status || prev.status }));
        }
        return newId;
      } else {
        throw new Error('Failed to create draft course');
      }
    } catch (err) {
      console.error('Error creating draft course:', err);
      alert('Failed to create draft course. Please try again.');
      throw err;
    }
  };

  const addModule = async () => {
    try {
      const token = localStorage.getItem('token');

      // Ensure we have a course id to attach the module to
      const courseId = await ensureCourseExists();

      const response = await axios.post(`http://localhost:5000/api/modules/${courseId}`, {
        title: 'New Module',
        description: '',
        order: modules.length
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Initialize lessons array for new module to avoid undefined errors
        setModules([...modules, { ...response.data.module, lessons: [] }]);
      }
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Failed to create module');
    }
  };

  const addLesson = async (moduleIndex) => {
    try {
      const token = localStorage.getItem('token');
      const module = modules[moduleIndex];
      const response = await axios.post(`http://localhost:5000/api/lessons/${module.id}`, {
        title: 'New Lesson',
        content: '',
        contentType: 'text',
        order: Array.isArray(module.lessons) ? module.lessons.length : 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const updatedModules = [...modules];
        if (!Array.isArray(updatedModules[moduleIndex].lessons)) {
          updatedModules[moduleIndex].lessons = [];
        }
        updatedModules[moduleIndex].lessons.push(response.data.lesson);
        setModules(updatedModules);
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Failed to create lesson');
    }
  };



  const deleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/modules/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModules(modules.filter(m => m.id !== moduleId));
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Failed to delete module');
    }
  };

  const deleteLesson = async (lessonId, moduleIndex) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter(l => l.id !== lessonId);
      setModules(updatedModules);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson');
    }
  };

  // Inline edit handlers
  const startEditModule = (module) => {
    setEditingModuleId(module.id);
    setEditingModuleFields({ title: module.title || '', description: module.description || '' });
  };

  const cancelEditModule = () => {
    setEditingModuleId(null);
    setEditingModuleFields({ title: '', description: '' });
  };

  const saveModule = async (moduleId) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/modules/${moduleId}`, editingModuleFields, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const updated = modules.map(m => m.id === moduleId ? { ...m, ...response.data.module } : m);
        setModules(updated);
        cancelEditModule();
      }
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Failed to update module');
    } finally {
      setSaving(false);
    }
  };

  const startEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setEditingLessonFields({ title: lesson.title || '' });
  };

  const cancelEditLesson = () => {
    setEditingLessonId(null);
    setEditingLessonFields({ title: '' });
  };

  const saveLesson = async (lessonId) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/lessons/${lessonId}`, editingLessonFields, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const updated = modules.map(m => ({
          ...m,
          lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...response.data.lesson } : l)
        }));
        setModules(updated);
        cancelEditLesson();
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      alert('Failed to update lesson');
    } finally {
      setSaving(false);
    }
  };

  const lightBg = 'white';
  const darkBg = 'rgb(22, 21, 21)';
  const lightText = '#333';
  const darkText = '#f8f7f7';
  const lightSubText = '#666';
  const darkSubText = '#665c5c';
  const lightBorder = '#d1d5db';
  const darkBorder = '#4b5563';
  const lightGray = '#f9fafb';
  const darkGray = 'rgb(31, 41, 55)';
  const lightButtonBg = '#e5e7eb';
  const darkButtonBg = '#4b5563';


  return (
    <div>
      <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
        {/* Content Outline */}
        <div style={{ flex: 1, backgroundColor: darkMode ? darkBg : lightBg, padding: '20px', borderRadius: '8px', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.1)', border: darkMode ? `1px solid ${darkBorder}` : 'none', maxHeight: '384px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', color: darkMode ? darkText : lightText }}>Content Outline</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button onClick={addModule} style={{ padding: '8px 12px', backgroundColor: darkMode ? darkButtonBg : lightButtonBg, color: darkMode ? darkText : lightText, borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                Add Module
              </button>
            </div>
          </div>

          {modules.map((module, moduleIndex) => (
            <div key={module.id} style={{ border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', padding: '12px', marginBottom: '12px', backgroundColor: darkMode ? darkGray : lightGray }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                {editingModuleId === module.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      value={editingModuleFields.title}
                      onChange={(e) => setEditingModuleFields({ ...editingModuleFields, title: e.target.value })}
                      placeholder="Module title"
                      style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, backgroundColor: darkMode ? darkBg : lightBg, color: darkMode ? darkText : lightText }}
                    />
                    <button onClick={() => saveModule(module.id)} disabled={saving} style={{ padding: '6px 10px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none' }}>Save</button>
                    <button onClick={cancelEditModule} style={{ padding: '6px 10px', backgroundColor: '#6b7280', color: 'white', borderRadius: '6px', border: 'none' }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontWeight: 'bold', color: darkMode ? darkText : lightText }}>{module.title}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEditModule(module)} style={{ color: '#3b82f6' }}>✏️</button>
                      <button onClick={() => deleteModule(module.id)} style={{ color: '#ef4444' }}>🗑️</button>
                    </div>
                  </>
                )}
              </div>

              {/* Lessons */}
              <div style={{ marginLeft: '20px', marginTop: '12px' }}>
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '12px', padding: '8px', marginBottom: '8px', backgroundColor: darkMode ? darkBg : lightBg, borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      {editingLessonId === lesson.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <input
                            type="text"
                            value={editingLessonFields.title}
                            onChange={(e) => setEditingLessonFields({ ...editingLessonFields, title: e.target.value })}
                            placeholder="Lesson title"
                            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, backgroundColor: darkMode ? darkBg : lightBg, color: darkMode ? darkText : lightText }}
                          />
                          <button onClick={() => saveLesson(lesson.id)} disabled={saving} style={{ padding: '6px 10px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none' }}>Save</button>
                          <button onClick={cancelEditLesson} style={{ padding: '6px 10px', backgroundColor: '#6b7280', color: 'white', borderRadius: '6px', border: 'none' }}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontWeight: '600', color: darkMode ? darkText : lightText }}>
                            {lesson.title}
                            {lesson.contentType === 'video' && ' [Video]'}
                            {lesson.contentType === 'image' && ' [Image]'}
                            {lesson.contentType === 'quiz' && ' [Quiz]'}
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => startEditLesson(lesson)} style={{ color: '#3b82f6' }}>✏️</button>
                            <button onClick={() => deleteLesson(lesson.id, moduleIndex)} style={{ color: '#ef4444' }}>🗑️</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={() => addLesson(moduleIndex)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                  Add Lesson
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Course Structure */}
        <div style={{ flex: 1, backgroundColor: darkMode ? darkBg : lightBg, padding: '20px', borderRadius: '8px', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.1)', border: darkMode ? `1px solid ${darkBorder}` : 'none' }}>
          <h2 style={{ fontSize: '1.25rem', color: darkMode ? darkText : lightText, marginBottom: '12px' }}>Course Structure</h2>
          <p style={{ color: darkMode ? darkSubText : lightSubText, marginBottom: '20px' }}>A high-level overview of your course structure.</p>
          {modules.map((module, index) => (
            <div key={index}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: darkMode ? darkText : lightText, marginBottom: '8px' }}>{module.title}</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: darkMode ? darkSubText : lightSubText, marginBottom: '20px' }}>
                {module.lessons.map((lesson, lIndex) => (
                  <li key={lIndex}>{lesson.title}</li>
                ))}
              </ul>
              {module.quizzes && module.quizzes.length > 0 && (
                <div>
                  <h4 style={{ fontWeight: '600', color: darkMode ? darkText : lightText }}>Quizzes</h4>
                  <ul style={{ listStyleType: 'circle', paddingLeft: '40px', color: darkMode ? darkSubText : lightSubText }}>
                    {module.quizzes.map((quiz, qIndex) => (
                      <li key={qIndex}>{quiz.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <button onClick={onPrev} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          Previous Steps
        </button>
        <button onClick={onNext} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          Next: Materials
        </button>
      </div>


    </div>
  );
};

export default ContentOutline;
