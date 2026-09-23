import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const SettingsPage = () => {
  const { user, updateUser, darkMode } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    password: '',
    confirmPassword: '',
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(user?.profilePicture || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Update form data when user data changes
    setFormData(prev => ({
      ...prev,
      name: user?.name || '',
    }));
  }, [user]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleProfilePictureChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setProfilePictureFile(file);
        setProfilePicturePreview(URL.createObjectURL(file));
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage({ type: '', text: '' });
    
      // Validation: check if passwords match
      if (formData.password && formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        setLoading(false);
        return;
      }
    
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage({ type: 'error', text: 'You are not logged in.' });
          setLoading(false);
          return;
        }
    
        // Prepare FormData for multipart/form-data
        const multipartFormData = new FormData();
        multipartFormData.append('name', formData.name);
        multipartFormData.append('bio', formData.bio);
        if (formData.password) multipartFormData.append('password', formData.password);
        if (profilePictureFile) multipartFormData.append('profilePicture', profilePictureFile);
    
        const response = await axios.put(
          'http://localhost:5000/api/instructors/profile',
          multipartFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
    
        if (response.data.success) {
          setMessage({ type: 'success', text: 'Profile updated successfully!' });
          // Update user context with new data
          updateUser(response.data.user);
          // Clear password fields
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } else {
          setMessage({ type: 'error', text: response.data.message || 'Failed to update profile.' });
        }
      } catch (error) {
        console.error('Profile update error:', error);
        setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      } finally {
        setLoading(false);
      }
    };
    
  

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-color)',
        minHeight: '100vh',
        padding: 'var(--padding)',
        fontFamily: 'sans-serif',
        textAlign: 'left',
      }}
    >
      <button
        style={{
          backgroundColor: 'var(--button-bg)',
          color: 'var(--button-color)',
          padding: 'var(--button-padding)',
          borderRadius: 'var(--border-radius-small)',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '16px',
        }}
        onClick={() => window.history.back()}
      >
        ← Back
      </button>
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'bold',
          color: 'var(--text-color)',
          marginBottom: '32px',
        }}
      >
        Settings
      </h1>
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          padding: 'var(--card-padding)',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-h2)',
            fontWeight: 'bold',
            color: 'var(--text-color)',
            marginBottom: '16px',
          }}
        >
          Profile Settings
        </h2>
        {message.text && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--border-radius-small)',
              marginBottom: 'var(--spacing-md)',
              backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-small)',
                fontWeight: '500',
                color: 'var(--text-color)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: 'var(--input-padding)',
                backgroundColor: 'var(--card-bg)',
                backdropFilter: 'blur(4px)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-small)',
                outline: 'none',
                color: 'var(--text-color)',
                transition: 'all 0.3s',
                boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px var(--primary-focus)';
                e.target.style.borderColor = 'var(--primary-color)';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0,0,0,0.06)';
                e.target.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>

          <div>
            <label
              htmlFor="bio"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-small)',
                fontWeight: '500',
                color: 'var(--text-color)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              style={{
                width: '100%',
                padding: 'var(--input-padding)',
                backgroundColor: 'var(--card-bg)',
                backdropFilter: 'blur(4px)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-small)',
                outline: 'none',
                color: 'var(--text-color)',
                transition: 'all 0.3s',
                boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
                resize: 'vertical',
                marginBottom: 'var(--spacing-md)',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px var(--primary-focus)';
                e.target.style.borderColor = 'var(--primary-color)';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0,0,0,0.06)';
                e.target.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>

          <div>
            <label
              htmlFor="profilePicture"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-small)',
                fontWeight: '500',
                color: 'var(--text-color)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Profile Photo
            </label>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              accept="image/*"
              onChange={handleProfilePictureChange}
              style={{
                width: '100%',
                padding: 'var(--input-padding)',
                borderRadius: 'var(--border-radius-small)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                color: 'var(--text-color)',
                backgroundColor: 'var(--card-bg)',
                marginBottom: 'var(--spacing-md)',
              }}
            />
            {profilePicturePreview && (
              <img
                src={profilePicturePreview}
                alt="Profile Preview"
                style={{
                  marginTop: '8px',
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                }}
              />
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-small)',
                fontWeight: '500',
                color: 'var(--text-color)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              New Password (optional)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: 'var(--input-padding)',
                backgroundColor: 'var(--card-bg)',
                backdropFilter: 'blur(4px)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-small)',
                outline: 'none',
                color: 'var(--text-color)',
                transition: 'all 0.3s',
                boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px var(--primary-focus)';
                e.target.style.borderColor = 'var(--primary-color)';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0,0,0,0.06)';
                e.target.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-small)',
                fontWeight: '500',
                color: 'var(--text-color)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: 'var(--input-padding)',
                backgroundColor: 'var(--card-bg)',
                backdropFilter: 'blur(4px)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-small)',
                outline: 'none',
                color: 'var(--text-color)',
                transition: 'all 0.3s',
                boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px var(--primary-focus)';
                e.target.style.borderColor = 'var(--primary-color)';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0,0,0,0.06)';
                e.target.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? 'var(--muted-text)' : 'var(--button-bg)',
              color: 'var(--button-color)',
              padding: 'var(--button-padding)',
              borderRadius: 'var(--border-radius-small)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = 'var(--button-hover)';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = 'var(--button-bg)';
            }}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
