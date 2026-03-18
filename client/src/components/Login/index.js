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
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cheatedWarning, setCheatedWarning] = useState(false);
  const [warningLoading, setWarningLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);

  const navigate = useNavigate();
  const { login } = useUser();

  const { email, password } = formData;

  const handleChange = (e, { name, value }) => {
    setFormData({ ...formData, [name]: value });

    // If user changes email, reset OTP state
    if (name === 'email') {
      setOtpSent(false);
      setOtp('');
      setOtpExpired(false);
      setOtpTimer(0);
    }
  };

  React.useEffect(() => {
    if (!otpSent || otpTimer <= 0) return;

    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          setOtpSent(false);
          setOtpExpired(true);
          setOtp('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  const OTP_EXPIRY_SECONDS = 300;

  const handleSendOtp = async () => {
    setOtpExpired(false);
    setSendingOtp(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('OTP sent! Please check your email.');
        setOtpSent(true);
        setOtpTimer(OTP_EXPIRY_SECONDS);
      } else {
        toast.error(data.msg || 'Could not send OTP');
      }
    } catch (err) {
      toast.error('Server error. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        const token = data.token;
        setUserToken(token);
        localStorage.setItem('token', token);
        await login(token);

        if (data.cheatedFlag === true) {
          setCheatedWarning(true);
        } else {
          window.location.href = '/';
        }
      } else {
        toast.error(data.msg || 'Invalid OTP');
      }
    } catch (err) {
      toast.error('Server error. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
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

    if (otpSent) {
      toast.info('Please verify the OTP sent to your email.');
      return;
    }

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

            {!otpExpired ? (
              <Button
                fluid
                type="button"
                size="large"
                loading={sendingOtp}
                disabled={
                  sendingOtp ||
                  !email ||
                  !password ||
                  (otpSent && otpTimer > 0)
                }
                className="secondary"
                style={{ marginBottom: '1rem' }}
                onClick={handleSendOtp}
              >
                <Icon name="mail" />
                {otpSent && otpTimer > 0 ? 'Resend OTP (waiting)' : 'Send OTP'}
              </Button>
            ) : (
              <Button
                fluid
                type="button"
                size="large"
                loading={sendingOtp}
                disabled={sendingOtp || !email || !password}
                className="secondary"
                style={{ marginBottom: '1rem' }}
                onClick={handleSendOtp}
              >
                <Icon name="redo" />
                Resend OTP
              </Button>
            )}

            {otpExpired && (
              <Message warning content="OTP expired. Please send a new one." />
            )}

            {otpSent && (
              <>
                <Message
                  info
                  style={{ marginBottom: '1rem' }}
                  content={
                    otpTimer > 0
                      ? `Check your email for the OTP. Expires in ${Math.floor(
                          otpTimer / 60
                        )}:${String(otpTimer % 60).padStart(2, '0')}`
                      : 'OTP expired. Please request a new one.'
                  }
                />
                <div style={{ marginBottom: '1.5rem' }}>
                  <Form.Input
                    fluid
                    icon="key"
                    iconPosition="left"
                    placeholder="Enter OTP"
                    name="otp"
                    value={otp}
                    onChange={(e, { value }) => setOtp(value)}
                    required
                    style={{ marginBottom: '1rem' }}
                  />
                  <Button
                    fluid
                    type="button"
                    size="large"
                    loading={verifyingOtp}
                    disabled={verifyingOtp || !otp}
                    className="primary-blue"
                    onClick={handleVerifyOtp}
                  >
                    <Icon name="check" />
                    Verify OTP
                  </Button>
                </div>
              </>
            )}

            {!otpSent && (
              <>
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
              </>
            )}
            
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
