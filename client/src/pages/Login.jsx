import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.login({ email, password });
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      navigate('/');
      window.location.reload();
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.msg || 'Something went wrong';
      setError(errorMsg);
    }
  };

  return (
    <div>
      <h1>Sign In</h1>
      <p>Sign into your account</p>
      <form onSubmit={onSubmit}>
        <div>
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            name="password"
            minLength="6"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        <input type="submit" value="Login" />
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <hr />
      <p>Or</p>
      <a href="http://localhost:5000/api/auth/google">
        <button>Sign in with Google</button>
      </a>
    </div>
  );
};

export default Login;
