import { useState } from 'react';

const BasicInfo = ({ onNext, onPrev, darkMode, course, setCourse }) => {

  const handleChange = (e) => {
    setCourse({ ...course, [e.target.name]: e.target.name === 'visibility' ? e.target.value.toLowerCase() : e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  const lightBg = 'white';
  const darkBg = 'rgb(22, 21, 21)';
  const lightText = '#333';
  const darkText = '#f8f7f7';
  const lightSubText = '#666';
  const darkSubText = '#665c5c';
  const lightBorder = '#d1d5db';
  const darkBorder = '#4b5563';
  const lightInputBg = 'white';
  const darkInputBg = 'rgb(22, 21, 21)';
  const lightLabel = '#374151';
  const darkLabel = '#d6c3c3';

  return (
    <div style={{backgroundColor: darkMode ? darkBg : lightBg, padding: '24px', borderRadius: '8px', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.1)', border: darkMode ? `1px solid ${darkBorder}` : 'none', maxWidth: '512px', margin: '0 auto'}}>
      <h2 style={{fontSize: '1.5rem', marginBottom: '8px', color: darkMode ? darkText : lightText}}>Step 1: Basic Information</h2>
      <p style={{color: darkMode ? darkSubText : lightSubText, marginBottom: '24px'}}>
        Start with the essentials. Give your course a title, a compelling description, and choose the right category.
      </p>
      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
        <label style={{fontWeight: '600', color: darkMode ? darkLabel : lightLabel}}>Course Title</label>
        <input
          type="text"
          name="title"
          value={course.title}
          onChange={handleChange}
          placeholder="e.g., Introduction to Web Design"
          style={{padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText}}
          required
        />

        <label style={{fontWeight: '600', color: darkMode ? darkLabel : lightLabel}}>Course Description</label>
        <textarea
          name="description"
          value={course.description}
          onChange={handleChange}
          placeholder="A brief summary of what students will learn."
          style={{padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText, resize: 'vertical', minHeight: '96px'}}
          required
        />

        <label style={{fontWeight: '600', color: darkMode ? darkLabel : lightLabel}}>Category</label>
        <select
          name="category"
          value={course.category}
          onChange={handleChange}
          style={{padding: '12px', border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '6px', backgroundColor: darkMode ? darkInputBg : lightInputBg, color: darkMode ? darkText : lightText}}
        >
          <option>Design</option>
          <option>Development</option>
          <option>Business</option>
          <option>Marketing</option>
        </select>

        <label style={{fontWeight: '600', color: darkMode ? darkLabel : lightLabel}}>Visibility</label>
        <div style={{display: 'flex', gap: '20px'}}>
          <label style={{display: 'flex', alignItems: 'center', color: darkMode ? darkText : lightText}}>
            <input
              type="radio"
              name="visibility"
              value="Public"
              checked={course.visibility === 'public'}
              onChange={handleChange}
              style={{marginRight: '8px'}}
            />
            Public
          </label>
          <label style={{display: 'flex', alignItems: 'center', color: darkMode ? darkText : lightText}}>
            <input
              type="radio"
              name="visibility"
              value="Private"
              checked={course.visibility === 'private'}
              onChange={handleChange}
              style={{marginRight: '8px'}}
            />
            Private
          </label>
        </div>

        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '24px'}}>
          <button type="submit" style={{padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer'}}>
            Next: Content Outline
          </button>
        </div>
      </form>
    </div>
  );
};

export default BasicInfo;
