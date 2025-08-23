import { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

export default function Auth() {
  const location = useLocation();
  const initialModeFromQuery = new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState(initialModeFromQuery);
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [registerError, setRegisterError] = useState('');

  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login(loginData.email, loginData.password);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err?.response?.data?.message || err?.message || 'Login failed');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }
    try {
      await register({
        name: registerData.name,
        email: registerData.email,
        role: registerData.role,
        password: registerData.password
      });
      setMode('signin');
    } catch (err) {
      setRegisterError(err?.response?.data?.message || err?.message || 'Registration failed');
    }
  };

  const goSignUp = () => setMode('signup');
  const goSignIn = () => setMode('signin');

  return (
    <div className="auth-page">
      <div className={`container ${mode === 'signup' ? 'right-panel-active' : ''}`} id="container">
        <div className="form-container sign-up-container">
          <form onSubmit={handleRegisterSubmit} noValidate>
            <h1>Create Account</h1>
            <span>or use your email for registration</span>
            <input type="text" name="name" placeholder="Name" value={registerData.name} onChange={handleRegisterChange} required />
            <input type="email" name="email" placeholder="Email" value={registerData.email} onChange={handleRegisterChange} required />
            <input type="password" name="password" placeholder="Password" value={registerData.password} onChange={handleRegisterChange} required minLength={6} />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={registerData.confirmPassword} onChange={handleRegisterChange} required minLength={6} />
            <div className="role-options">
              <label style={{ marginRight: 12 }}>
                <input type="radio" name="role" value="student" checked={registerData.role === 'student'} onChange={handleRegisterChange} /> Student
              </label>
              <label>
                <input type="radio" name="role" value="teacher" checked={registerData.role === 'teacher'} onChange={handleRegisterChange} /> Teacher
              </label>
            </div>
            <button type="submit">Sign Up</button>
            {registerError && <p className="error">{registerError}</p>}
          </form>
        </div>

        <div className="form-container sign-in-container">
          <form onSubmit={handleLoginSubmit} noValidate>
            <h1>Sign in</h1>
            <span>or use your account</span>
            <input type="email" name="email" placeholder="Email" value={loginData.email} onChange={handleLoginChange} required />
            <input type="password" name="password" placeholder="Password" value={loginData.password} onChange={handleLoginChange} required />
            <Link to="/forgot" className="muted">Forgot your password?</Link>
            <button type="submit">Sign In</button>
            {loginError && <p className="error">{loginError}</p>}
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" type="button" onClick={goSignIn} id="signIn">Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" type="button" onClick={goSignUp} id="signUp">Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
