import React, { useState } from 'react';
import { Button, Form, Grid, Header, Icon } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Student',
    classDivision: '',
    invitationCode: '',
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const { firstName, lastName, email, password, role, classDivision, invitationCode } = formData;

  const handleChange = (e, { name, value }) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Signup successful! Please log in.');
        window.location.href = '/login';
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
            <Icon name="user plus" />
            Create a new account
          </Header>
          <Form size="large" onSubmit={handleSubmit}>
            <Form.Group widths="equal">
              <Form.Input
                fluid
                icon="user"
                iconPosition="left"
                placeholder="First Name"
                name="firstName"
                value={firstName}
                onChange={handleChange}
                required
              />
              <Form.Input
                fluid
                icon="user"
                iconPosition="left"
                placeholder="Last Name"
                name="lastName"
                value={lastName}
                onChange={handleChange}
                required
              />
            </Form.Group>
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
              style={{ marginBottom: '1rem' }}
            />
            <Form.Dropdown
              placeholder="Select Role"
              fluid
              selection
              name="role"
              options={[
                { key: 'Student', text: 'Student', value: 'Student', icon: 'student' },
                { key: 'Teacher', text: 'Teacher', value: 'Teacher', icon: 'graduation cap' },
                { key: 'Admin', text: 'Admin', value: 'Admin', icon: 'shield' },
              ]}
              value={role}
              onChange={handleChange}
              style={{ marginBottom: '1rem' }}
            />
            {role === 'Student' && (
              <Form.Input
                fluid
                icon="university"
                iconPosition="left"
                placeholder="Class/Division (e.g., 10-A)"
                name="classDivision"
                value={classDivision}
                onChange={handleChange}
                required
                style={{ marginBottom: '1rem' }}
              />
            )}
            {(role === 'Teacher' || role === 'Admin') && (
              <Form.Input
                fluid
                icon="key"
                iconPosition="left"
                placeholder={`${role} Invitation Code`}
                name="invitationCode"
                value={invitationCode}
                onChange={handleChange}
                required
                style={{ marginBottom: '1rem' }}
              />
            )}
            <Button 
              fluid 
              size="large" 
              loading={loading}
              disabled={loading}
              className="primary-blue"
            >
              <Icon name="user plus" />
              Sign Up
            </Button>
          </Form>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.9)' }}>
            Already have an account? <Link to="/login" style={{ color: '#007BFF', fontWeight: 'bold' }}>Log In</Link>
          </div>
        </div>
      </Grid.Column>
    </Grid>
  );
};

export default Signup;
