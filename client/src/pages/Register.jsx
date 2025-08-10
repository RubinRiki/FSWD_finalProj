import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',   // ← שינוי מ-fullName ל-name
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        password: formData.password
      });
      navigate('/dashboard'); // או ישר ל-/login אם את מעדיפה
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Registration failed';
      setError(msg);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required /><br />
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required /><br />
        <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required /><br />
        <input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required /><br />

        <label>
          <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} />
          Student
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" name="role" value="teacher" checked={formData.role === 'teacher'} onChange={handleChange} />
          Teacher
        </label>
        <br />

        <button type="submit">Create account</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
