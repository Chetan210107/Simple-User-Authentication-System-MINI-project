import React, { useState } from 'react';
import { Button, Form, Grid, Header, Segment, Message, Icon, Modal } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [cheatedWarning, setCheatedWarning] = useState(false);
  const [warningLoading, setWarningLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);

  const navigate = useNavigate();
  const { login } = useUser();

  const { email, password } = formData;

  const handleChange = (e, { name, value }) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleClearCheatedFlag = async () => {
    setWarningLoading(true);
    try {
      // Use the token that's already been logged in with
      let token = userToken || localStorage.getItem('token');
      
      if (!token) {
        console.error('No token available');
        toast.error('Session expired. Please refresh and log in again.');
        window.location.href = '/login';
        return;
      }

      console.log('Attempting to clear cheated flag with token:', token.substring(0, 20) + '...');

      const res = await fetch('/api/auth/clear-cheated-flag', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      console.log('Clear flag response status:', res.status);
      
      const data = await res.json();
      console.log('Clear flag response data:', data);

      if (res.ok && data.success) {
        toast.success('Welcome back! Warning cleared.');
        setCheatedWarning(false);
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        console.error('Clear warning failed:', data);
        toast.error(data.msg || 'Could not clear warning. Please contact admin.');
      }
    } catch (err) {
      console.error('Network error clearing warning:', err);
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      toast.error('Network error. Please check connection and try again.');
    } finally {
      setWarningLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Login successful!');
        // Store token before awaiting login context
        const token = data.token;
        setUserToken(token);
        localStorage.setItem('token', token);
        
        await login(data.token);
        
        // Show cheated warning modal if server indicates previous suspicious activity
        if (data.cheatedFlag === true) {
          setCheatedWarning(true);
        } else {
          // Force page reload to ensure context is updated
          window.location.href = '/';
        }
      } else {
        toast.error(data.msg || 'Something went wrong');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid textAlign="center" style={{ minHeight: '100vh', padding: '2rem' }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <div className="glass-card">
          <Header as="h2" textAlign="center" style={{ color: '#007BFF', marginBottom: '1.5rem' }}>
            <Icon name="sign in" />
            Log-in to your account
          </Header>
          <Form size="large" onSubmit={handleSubmit}>
            <Form.Input
              fluid
              icon="mail"
              iconPosition="left"
              placeholder="E-mail address"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              required
              style={{ marginBottom: '1rem' }}
            />
            <Form.Input
              fluid
              icon="lock"
              iconPosition="left"
              placeholder="Password"
              name="password"
              type="password"
              value={password}
              onChange={handleChange}
              required
              style={{ marginBottom: '1.5rem' }}
            />

            <Button 
              fluid 
              size="large" 
              loading={loading}
              disabled={loading}
              className="primary-blue"
              style={{ marginBottom: '1rem' }}
            >
              <Icon name="sign in" />
              Login
            </Button>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/forgot-password" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Forgot password?
              </Link>
            </div>
          </Form>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.9)' }}>
            New to us? <Link to="/signup" style={{ color: '#007BFF', fontWeight: 'bold' }}>Sign Up</Link>
          </div>
        </div>
      </Grid.Column>

      <Modal open={cheatedWarning} size="small">
        <Modal.Header>⚠️ Suspicious Activity Detected</Modal.Header>
        <Modal.Content>
          You have been logged out because suspicious activity was detected three times during the quiz. The teacher and admin have been notified.
        </Modal.Content>
        <Modal.Actions>
          <Button 
            primary 
            content="I Understand" 
            loading={warningLoading}
            disabled={warningLoading}
            onClick={handleClearCheatedFlag} 
          />
        </Modal.Actions>
      </Modal>
    </Grid>
  );
};

export default Login;
