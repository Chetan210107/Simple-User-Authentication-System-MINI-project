import React, { useState } from 'react';
import { Button, Form, Grid, Header, Segment, Message } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    token: '',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();

  const { token, password, confirmPassword } = formData;

  const handleChange = (e, { name, value }) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      const res = await fetch('/api/auth/resetpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Password reset successful! Please log in.');
        navigate('/login');
      } else {
        toast.error(data.msg || 'Something went wrong');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  return (
    <Grid textAlign="center" style={{ height: '100vh' }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as="h2" color="blue" textAlign="center">
          Reset Your Password
        </Header>
        <Form size="large" onSubmit={handleSubmit}>
          <Segment stacked className="glass">
            <Form.Input
              fluid
              icon="key"
              iconPosition="left"
              placeholder="OTP"
              name="token"
              value={token}
              onChange={handleChange}
              required
            />
            <Form.Input
              fluid
              icon="lock"
              iconPosition="left"
              placeholder="New Password"
              name="password"
              type="password"
              value={password}
              onChange={handleChange}
              required
            />
            <Form.Input
              fluid
              icon="lock"
              iconPosition="left"
              placeholder="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleChange}
              required
            />

            <Button color="blue" fluid size="large">
              Reset Password
            </Button>
          </Segment>
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default ResetPassword;
