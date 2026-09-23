import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstructorContext } from './Instructor';

const InstructorHomePage = () => {
  const { darkMode, courses } = useContext(InstructorContext);
  const navigate = useNavigate();

  const defaultCourses = [
    {
      title: 'Introduction to Programming',
      description: 'Learn the basics of programming with Python, covering syntax, data types, and control structures.',
      rating: '⭐️4.5(56)',
      students: '1,200 students'
    },
    {
      title: 'Introduction to Web Design',
      description: 'A beginner guide to HTML.CSS and web development principles.',
      rating: '⭐️4.5(300)',
      students: '1,234 students'
    },
    {
      title: 'Advanced JavaScript',
      description: 'Deep dive into JavaScript, covering ES6 features and asynchronous programming.',
      rating: '⭐️4.8(180)',
      students: '987 students'
    },
    {
      title: 'Data Science with Python',
      description: 'Learn data analysis, visualization, and machine learning using Python.',
      rating: '⭐️4.7(406)',
      students: '1,500 students'
    },
    {
      title: 'Mobile App Development',
      description: 'Create Android and iOS apps using Flutter and Dart.',
      rating: '⭐️4.6(196)',
      students: '1,100 students'
    }
  ];

  const displayCourses = courses.length > 0 ? courses : defaultCourses;

  if (courses.length === 0) {
    return (
      <div style={{backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'rgb(250, 247, 247)', minHeight: '100vh', border: 'none', boxShadow: 'none'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'}}>
          <h1 style={{fontSize: '2rem', color: darkMode ? '#f8f7f7' : '#333', marginBottom: '8px'}}>Welcome Back, Instructor!</h1>
          <p style={{fontSize: '1.125rem', color: darkMode ? '#665c5c' : '#666', marginBottom: '20px'}}>Here's a summary of your courses</p>
        </div>

        <div style={{padding: '20px', borderRadius: darkMode ? '0' : '10px', boxShadow: darkMode ? 'none' : '0 2px 4px rgba(23, 114, 53, 0.1)', width: '100%', flexWrap: 'wrap'}}>
          <section style={{marginBottom: '20px'}}>
            <h2 style={{fontSize: '1.5rem', marginBottom: '20px', color: darkMode ? '#c2b9b9' : '#333', fontWeight: 'bold'}}>Summary of Courses</h2>
          </section>

          <div style={{textAlign: 'center', padding: '60px 20px', color: darkMode ? '#9ca3af' : '#666'}}>
            <h3 style={{fontSize: '2rem', marginBottom: '16px'}}>No courses yet</h3>
            <p style={{fontSize: '1.125rem', marginBottom: '32px'}}>Create your first course to get started with teaching!</p>
            <button
              onClick={() => navigate('/instructor/dashboard/courses/create')}
              style={{padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'}}
            >
              Create Your First Course
            </button>
          </div>
        </div>

        <footer style={{textAlign: 'center', padding: '12px', marginTop: '50px', color: darkMode ? '#f6f8fa' : '#666'}}>
          <p>&copy; 2025 Qatan E-Learning. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div style={{backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'rgb(250, 247, 247)', minHeight: '100vh', border: 'none', boxShadow: 'none'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'}}>
        <h1 style={{fontSize: '2rem', color: darkMode ? '#f8f7f7' : '#333', marginBottom: '8px'}}>Welcome Back, Instructor!</h1>
        <p style={{fontSize: '1.125rem', color: darkMode ? '#665c5c' : '#666', marginBottom: '20px'}}>Here's a summary of your courses</p>
      </div>

      <div style={{padding: '20px', borderRadius: darkMode ? '0' : '10px', boxShadow: darkMode ? 'none' : '0 2px 4px rgba(23, 114, 53, 0.1)', width: '100%', flexWrap: 'wrap'}}>
        <section style={{marginBottom: '20px'}}>
          <h2 style={{fontSize: '1.5rem', marginBottom: '20px', color: darkMode ? '#c2b9b9' : '#333', fontWeight: 'bold'}}>Summary of Courses</h2>
        </section>

        <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start', padding: '20px', borderRadius: darkMode ? '0' : '10px'}}>
          {displayCourses.map((course, index) => (
            <div key={index} style={{backgroundColor: darkMode ? 'rgb(22, 21, 21)' : 'white', border: darkMode ? '1px solid #4b5563' : '1px solid #ddd', borderRadius: darkMode ? '0' : '8px', padding: '20px', boxShadow: darkMode ? 'none' : '0 2px 4px rgba(0,0,0,0.1)', width: 'calc(33.333% - 20px)', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', transition: 'transform 0.2s, box-shadow 0.2s'}}>
              <h3 style={{fontSize: '1.25rem', marginBottom: '12px', color: darkMode ? '#d6c3c3' : '#333', fontWeight: 'bold'}}>{course.title}</h3>
              <p style={{fontSize: '1rem', color: darkMode ? '#e4dada' : '#666', marginBottom: '12px', fontWeight: '300'}}>{course.description}</p>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span style={{color: darkMode ? '#e6a133' : '#f59e0b', fontWeight: 'bold'}}>{course.rating || '⭐️4.5(0)'}</span>
                <span style={{color: darkMode ? '#f4efef' : '#9ca3af', fontStyle: 'italic', fontWeight: 'bold'}}>{course.students || '0 students'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{textAlign: 'center', padding: '12px', marginTop: '50px', color: darkMode ? '#f6f8fa' : '#666'}}>
        <p>&copy; 2025 Qatan E-Learning. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default InstructorHomePage;
