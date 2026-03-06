import React, { useState } from 'react';
import { Button, Form, Grid, Header, Segment, Message } from 'semantic-ui-react';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleChange = (e, { value }) => {
    setEmail(value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/forgotpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('An email has been sent with instructions to reset your password.');
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
          Forgot Your Password?
        </Header>
        <Form size="large" onSubmit={handleSubmit}>
          <Segment stacked className="glass">
            <Form.Input
              fluid
              icon="user"
              iconPosition="left"
              placeholder="E-mail address"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              required
            />

            <Button color="blue" fluid size="large">
              Send Reset Email
            </Button>
          </Segment>
        </Form>
        <Message>
          Remember your password? <a href="/login">Log In</a>
        </Message>
      </Grid.Column>
    </Grid>
  );
};

export default ForgotPassword;
