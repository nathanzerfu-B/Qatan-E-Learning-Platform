import { useState, useEffect } from 'react';
import axios from 'axios';

const Materials = ({ onNext, onPrev, darkMode, course, setCourse }) => {
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [thumbnailPreview, setThumbnailPreview] = useState(course.thumbnailUrl || null);

  // Lesson-level materials state
  const [modules, setModules] = useState([]);
  const [lessonUploadProgress, setLessonUploadProgress] = useState({});
  const [lessonUploadErrors, setLessonUploadErrors] = useState({});

  const token = localStorage.getItem('token');

  // Fetch modules/lessons for this course to show per-lesson materials
  useEffect(() => {
    const fetchModules = async () => {
      if (!course?.id) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/modules/${course.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          const fetchedModules = res.data.modules;
          setModules(Array.isArray(fetchedModules) ? fetchedModules : []);
        }
      } catch (err) {
        console.error('Failed to fetch modules for materials:', err.response?.data || err.message);
        setModules([]); // Ensure modules is always an array
      }
    };
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  const handleThumbnailUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadErrors({ ...uploadErrors, thumbnail: 'Please select a valid image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors({ ...uploadErrors, thumbnail: 'File size must be less than 5MB' });
      return;
    }

    setUploadProgress({ ...uploadProgress, thumbnail: 0 });
    setUploadErrors({ ...uploadErrors, thumbnail: null });

    const formData = new FormData();
    formData.append('thumbnail', file);
    formData.append('courseId', course.id || 'temp'); // Use temp ID if course not created yet

    try {
      const response = await axios.post('http://localhost:5000/api/courses/upload-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress({ ...uploadProgress, thumbnail: percentCompleted });
        }
      });

      if (response.data.success) {
        setCourse({ ...course, thumbnailUrl: response.data.thumbnailUrl });
        setThumbnailPreview(response.data.thumbnailUrl);
        setUploadProgress({ ...uploadProgress, thumbnail: 100 });
      }
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      setUploadErrors({ ...uploadErrors, thumbnail: error.response?.data?.error || 'Upload failed' });
    } finally {
      // no-op
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadErrors({ ...uploadErrors, video: 'Please select a valid video file' });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setUploadErrors({ ...uploadErrors, video: 'File size must be less than 100MB' });
      return;
    }

    setUploadProgress({ ...uploadProgress, video: 0 });
    setUploadErrors({ ...uploadErrors, video: null });

    const formData = new FormData();
    formData.append('video', file);
    formData.append('courseId', course.id || 'temp');

    try {
      const response = await axios.post('http://localhost:5000/api/courses/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress({ ...uploadProgress, video: percentCompleted });
        }
      });

      if (response.data.success) {
        const newVideoUrls = [...(course.videoUrls || []), response.data.videoUrl];
        setCourse({ ...course, videoUrls: newVideoUrls });
        setUploadProgress({ ...uploadProgress, video: 100 });
      }
    } catch (error) {
      console.error('Video upload error:', error);
      setUploadErrors({ ...uploadErrors, video: error.response?.data?.error || 'Upload failed' });
    } finally {
      // no-op
    }
  };

  const handleThumbnailDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleThumbnailUpload(file);
  };

  const handleVideoDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleVideoUpload(file);
  };

  // Helpers to update a lesson record inside local modules state
  const updateLessonInState = (lessonId, patch) => {
    setModules(prev =>
      prev.map(m => ({
        ...m,
        lessons: Array.isArray(m.lessons) ? m.lessons.map(lesson =>
          lesson.id === lessonId ? { ...lesson, ...patch } : lesson
        ) : []
      }))
    );
  };

  // Upload media to a specific lesson (type: 'image' | 'video')
  const handleLessonMediaUpload = async (lessonId, file, type) => {
    if (!file || !lessonId) return;

    // Basic validation by type
    if (type === 'image' && !file.type.startsWith('image/')) {
      setLessonUploadErrors(prev => ({ ...prev, [lessonId]: 'Please select a valid image file' }));
      return;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      setLessonUploadErrors(prev => ({ ...prev, [lessonId]: 'Please select a valid video file' }));
      return;
    }

    // Size limits
    if (type === 'image' && file.size > 5 * 1024 * 1024) {
      setLessonUploadErrors(prev => ({ ...prev, [lessonId]: 'Image must be less than 5MB' }));
      return;
    }
    if (type === 'video' && file.size > 100 * 1024 * 1024) {
      setLessonUploadErrors(prev => ({ ...prev, [lessonId]: 'Video must be less than 100MB' }));
      return;
    }

    setLessonUploadErrors(prev => ({ ...prev, [lessonId]: null }));
    setLessonUploadProgress(prev => ({ ...prev, [lessonId]: 0 }));

    const formData = new FormData();
    formData.append('media', file);
    formData.append('lessonId', lessonId);

    try {
      const url =
        type === 'image'
          ? 'http://localhost:5000/api/lessons/upload-image'
          : 'http://localhost:5000/api/lessons/upload-video';

      const res = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (evt) => {
          const percent = Math.round((evt.loaded * 100) / (evt.total || 1));
          setLessonUploadProgress(prev => ({ ...prev, [lessonId]: percent }));
        }
      });

      if (res.data?.success) {
        // Update the specific lesson with new media url and contentType
        updateLessonInState(lessonId, {
          mediaUrl: res.data.mediaUrl,
          contentType: res.data.contentType || (type === 'image' ? 'image' : 'video')
        });
        setLessonUploadProgress(prev => ({ ...prev, [lessonId]: 100 }));
      }
    } catch (err) {
      console.error('Lesson media upload error:', err);
      setLessonUploadErrors(prev => ({ ...prev, [lessonId]: err.response?.data?.error || 'Upload failed' }));
    } finally {
      // small delay to show 100% before clearing optional
      setTimeout(() => {
        setLessonUploadProgress(prev => ({ ...prev, [lessonId]: undefined }));
      }, 800);
    }
  };

  const handleLessonImageFileSelect = (lessonId, e) => {
    const file = e.target.files?.[0];
    if (file) handleLessonMediaUpload(lessonId, file, 'image');
  };

  const handleLessonVideoFileSelect = (lessonId, e) => {
    const file = e.target.files?.[0];
    if (file) handleLessonMediaUpload(lessonId, file, 'video');
  };

  const clearLessonMedia = async (lessonId) => {
    try {
      // Set mediaUrl null and contentType back to 'text'
      const res = await axios.put(`http://localhost:5000/api/lessons/${lessonId}`, {
        mediaUrl: null,
        contentType: 'text'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        updateLessonInState(lessonId, { mediaUrl: null, contentType: 'text' });
      }
    } catch (err) {
      console.error('Failed to clear lesson media:', err.response?.data || err.message);
      setLessonUploadErrors(prev => ({ ...prev, [lessonId]: err.response?.data?.error || 'Failed to clear media' }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleThumbnailFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleThumbnailUpload(file);
  };

  const handleVideoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleVideoUpload(file);
  };

  const removeVideo = (index) => {
    const newVideoUrls = course.videoUrls.filter((_, i) => i !== index);
    setCourse({ ...course, videoUrls: newVideoUrls });
  };

  const handleSaveMaterials = () => {
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
  const lightButtonBg = '#e5e7eb';
  const darkButtonBg = '#4b5563';

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', backgroundColor: darkMode ? darkBg : lightBg, padding: '24px', borderRadius: '8px', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.1)', border: darkMode ? `1px solid ${darkBorder}` : 'none' }}>
      <h2 style={{ fontSize: '1.5rem', color: darkMode ? darkText : lightText, marginBottom: '16px' }}>Upload Course Materials</h2>
      <p style={{ color: darkMode ? darkSubText : lightSubText, marginBottom: '24px' }}>Upload course thumbnail and videos. Drag and drop files or click to select.</p>

      {/* Thumbnail Upload Section */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: darkMode ? darkText : lightText, marginBottom: '16px' }}>Course Thumbnail</h3>
        <div
          onDrop={handleThumbnailDrop}
          onDragOver={handleDragOver}
          style={{
            border: `2px dashed ${darkMode ? darkBorder : lightBorder}`,
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            backgroundColor: darkMode ? darkInputBg : lightInputBg,
            cursor: 'pointer',
            position: 'relative'
          }}
          onClick={() => document.getElementById('thumbnail-input').click()}
        >
          {thumbnailPreview ? (
            <div>
              <img src={thumbnailPreview} alt="Thumbnail preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px' }} />
              <p style={{ color: darkMode ? darkSubText : lightSubText, marginTop: '8px' }}>Click to change thumbnail</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', color: darkMode ? darkSubText : lightSubText, marginBottom: '8px' }}>📷</div>
              <p style={{ color: darkMode ? darkText : lightText, marginBottom: '4px' }}>Drag and drop thumbnail image here</p>
              <p style={{ color: darkMode ? darkSubText : lightSubText }}>or click to browse (max 5MB)</p>
            </div>
          )}
          <input
            id="thumbnail-input"
            type="file"
            accept="image/*"
            onChange={handleThumbnailFileSelect}
            style={{ display: 'none' }}
          />
        </div>
        {uploadProgress.thumbnail !== undefined && uploadProgress.thumbnail < 100 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ width: '100%', height: '4px', backgroundColor: darkMode ? darkBorder : lightBorder, borderRadius: '2px' }}>
              <div style={{ width: `${uploadProgress.thumbnail}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s' }}></div>
            </div>
            <p style={{ fontSize: '0.875rem', color: darkMode ? darkSubText : lightSubText, marginTop: '4px' }}>Uploading... {uploadProgress.thumbnail}%</p>
          </div>
        )}
        {uploadErrors.thumbnail && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>{uploadErrors.thumbnail}</p>
        )}
      </div>

      {/* Video Upload Section */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: darkMode ? darkText : lightText, marginBottom: '16px' }}>Course Trailer (optional)</h3>
        <div
          onDrop={handleVideoDrop}
          onDragOver={handleDragOver}
          style={{
            border: `2px dashed ${darkMode ? darkBorder : lightBorder}`,
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            backgroundColor: darkMode ? darkInputBg : lightInputBg,
            cursor: 'pointer'
          }}
          onClick={() => document.getElementById('video-input').click()}
        >
          <div style={{ fontSize: '3rem', color: darkMode ? darkSubText : lightSubText, marginBottom: '8px' }}>🎥</div>
          <p style={{ color: darkMode ? darkText : lightText, marginBottom: '4px' }}>Drag and drop video files here</p>
          <p style={{ color: darkMode ? darkSubText : lightSubText }}>or click to browse (max 100MB each)</p>
          <input
            id="video-input"
            type="file"
            accept="video/*"
            onChange={handleVideoFileSelect}
            style={{ display: 'none' }}
          />
        </div>
        {uploadProgress.video !== undefined && uploadProgress.video < 100 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ width: '100%', height: '4px', backgroundColor: darkMode ? darkBorder : lightBorder, borderRadius: '2px' }}>
              <div style={{ width: `${uploadProgress.video}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s' }}></div>
            </div>
            <p style={{ fontSize: '0.875rem', color: darkMode ? darkSubText : lightSubText, marginTop: '4px' }}>Uploading... {uploadProgress.video}%</p>
          </div>
        )}
        {uploadErrors.video && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>{uploadErrors.video}</p>
        )}

        {/* Uploaded Videos List */}
        {course.videoUrls && course.videoUrls.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: darkMode ? darkText : lightText, marginBottom: '8px' }}>Uploaded Videos ({course.videoUrls.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {course.videoUrls.map((url, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: darkMode ? darkBg : lightBg, border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '4px' }}>
                  <span style={{ color: darkMode ? darkText : lightText, flex: 1, marginRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Video {index + 1}: {url.split('/').pop()}
                  </span>
                  <button
                    onClick={() => removeVideo(index)}
                    style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Per-Lesson Materials Section */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: darkMode ? darkText : lightText, marginBottom: '16px' }}>
          Lesson Materials
        </h3>
        {(!modules || modules.length === 0) && (
          <p style={{ color: darkMode ? darkSubText : lightSubText }}>
            No modules/lessons yet. Add lessons in Content Outline to upload materials here.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {modules.map((m) => {
            const lessons = Array.isArray(m.lessons) ? m.lessons : [];
            return (
              <div key={m.id} style={{ border: `1px solid ${darkMode ? darkBorder : lightBorder}`, borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 'bold', color: darkMode ? darkText : lightText, marginBottom: '8px' }}>
                  Module: {m.title || `#${m.id}`}
                </div>
                {lessons.length === 0 ? (
                  <p style={{ color: darkMode ? darkSubText : lightSubText, marginLeft: '8px' }}>No lessons in this module.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {lessons.map((lesson, lessonIndex) => {
                      const lessonId = lesson.id || `temp-${m.id}-${lessonIndex}`;
                      const progress = lessonUploadProgress[lessonId];
                      const error = lessonUploadErrors[lessonId];
                      return (
                        <div key={lessonId} style={{ padding: '10px', borderRadius: '6px', border: `1px dashed ${darkMode ? darkBorder : lightBorder}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ color: darkMode ? darkText : lightText, fontWeight: 600 }}>
                              Lesson: {lesson.title || `#${lessonId}`}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <label style={{ padding: '6px 10px', background: darkMode ? darkButtonBg : lightButtonBg, borderRadius: '4px', cursor: 'pointer' }}>
                                Upload Image
                                <input type="file" accept="image/*" onChange={(e) => handleLessonImageFileSelect(lessonId, e)} style={{ display: 'none' }} />
                              </label>
                              <label style={{ padding: '6px 10px', background: darkMode ? darkButtonBg : lightButtonBg, borderRadius: '4px', cursor: 'pointer' }}>
                                Upload Video
                                <input type="file" accept="video/*" onChange={(e) => handleLessonVideoFileSelect(lessonId, e)} style={{ display: 'none' }} />
                              </label>
                              {lesson.mediaUrl && (
                                <button
                                  onClick={() => clearLessonMedia(lessonId)}
                                  style={{ padding: '6px 10px', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                >
                                  Clear Media
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Preview */}
                          {lesson.mediaUrl ? (
                            <div style={{ marginTop: '8px' }}>
                              {lesson.contentType === 'image' ? (
                                <img src={lesson.mediaUrl} alt="Lesson" style={{ maxWidth: '240px', borderRadius: '4px' }} />
                              ) : lesson.contentType === 'video' ? (
                                <video controls src={lesson.mediaUrl} style={{ maxWidth: '360px', borderRadius: '4px' }} />
                              ) : (
                                <span style={{ color: darkMode ? darkSubText : lightSubText }}>Media attached</span>
                              )}
                            </div>
                          ) : (
                            <p style={{ color: darkMode ? darkSubText : lightSubText, marginTop: '4px' }}>No media attached</p>
                          )}
                          {/* Progress and errors */}
                          {typeof progress === 'number' && progress < 100 && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ width: '100%', height: '4px', backgroundColor: darkMode ? darkBorder : lightBorder, borderRadius: '2px' }}>
                                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s' }}></div>
                              </div>
                              <p style={{ fontSize: '0.875rem', color: darkMode ? darkSubText : lightSubText, marginTop: '4px' }}>
                                Uploading... {progress}%
                              </p>
                            </div>
                          )}
                          {error && (
                            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>{error}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button type="button" onClick={onPrev} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          Previous Steps
        </button>
        <button type="button" onClick={handleSaveMaterials} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          Save Materials
        </button>
        <button type="button" onClick={onNext} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          Next: Publish
        </button>
      </div>
    </div>
  );
};

export default Materials;
