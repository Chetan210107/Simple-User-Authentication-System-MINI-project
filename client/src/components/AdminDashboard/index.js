import React, { useState, useEffect } from 'react';
import {
  Header,
  Statistic,
  Container,
  Grid,
  Button,
  Icon,
  Form,
  Modal,
  Table,
  Label,
  Confirm,
} from 'semantic-ui-react';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { CATEGORIES, DIFFICULTY } from '../../constants';

const AdminDashboard = () => {
  const { socket } = useUser();
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeStudentCount, setActiveStudentCount] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editUserModal, setEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmStopOpen, setConfirmStopOpen] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    answer: '',
    subject: '',
    difficulty: 'easy',
  });
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingApprovalData, setPendingApprovalData] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [categories, setCategories] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  const togglePasswordVisibility = (userId) => {
    setShowPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
    fetchQuestions();
    fetchSuspiciousActivities();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const normalize = (arr) =>
      Array.from(new Set((Array.isArray(arr) ? arr : []).map((s) => String(s || '').trim()).filter(Boolean)));

    try {
      const res = await fetch('/api/questions/categories', {
        headers: { 'x-auth-token': token },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error((data && data.msg) || `Failed to fetch categories (${res.status})`);
      }

      setCategories(normalize(data));
    } catch (err) {
      // Fallback to legacy endpoint (same underlying collection distinct('subject'))
      try {
        const res2 = await fetch('/api/teacher/questions/subjects', {
          headers: { 'x-auth-token': token },
        });
        const data2 = await res2.json().catch(() => null);

        if (!res2.ok) {
          throw new Error((data2 && data2.msg) || `Failed to fetch categories (${res2.status})`);
        }

        setCategories(normalize(data2));
      } catch (err2) {
        toast.error(err2.message || err.message || 'Failed to fetch categories');
      }
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('activeStudentsCount', (count) => {
        setActiveStudentCount(count);
      });
      socket.on('suspiciousAlert', (newActivity) => {
        // If critical alert (3+ violations), open approval modal
        if (newActivity.count >= 3 && newActivity.status === 'pending_admin') {
          setPendingApprovalData(newActivity);
          setApprovalModalOpen(true);
          setCountdown(10);
        } else {
          toast.warn(`Suspicious activity from ${newActivity.userName}!`);
        }
        // Add or update the activity in the list
        setSuspiciousActivities(prevActivities => {
          const existingIndex = prevActivities.findIndex(a => a.userId === newActivity.userId);
          if (existingIndex > -1) {
            const updatedActivities = [...prevActivities];
            updatedActivities[existingIndex] = { ...updatedActivities[existingIndex], ...newActivity };
            return updatedActivities;
          }
          return [newActivity, ...prevActivities];
        });
      });
      return () => {
        socket.off('activeStudentsCount');
        socket.off('suspiciousAlert');
      }
    }
  }, [socket]);

  // Countdown timer for auto-block on timeout
  useEffect(() => {
    if (!approvalModalOpen || !pendingApprovalData) return;

    if (countdown <= 0) {
      // Auto-block by default if admin doesn't respond
      handleApprovalDecision('block', true);
      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, approvalModalOpen, pendingApprovalData]);

  const handleApprovalDecision = async (decision, isAutomatic = false) => {
    if (!pendingApprovalData || !pendingApprovalData.activityId) {
      toast.error('Invalid activity data');
      return;
    }

    try {
      const res = await fetch(`/api/admin/suspicious-activities/${pendingApprovalData.activityId}/decide`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ decision }),
      });

      const data = await res.json();
      if (res.ok) {
        if (decision === 'block') {
          toast.error(`Student ${pendingApprovalData.userName} has been blocked${isAutomatic ? ' (auto-block timeout)' : ''}`);
        } else {
          toast.success(`Student ${pendingApprovalData.userName} approved to continue`);
        }
        setApprovalModalOpen(false);
        setPendingApprovalData(null);
        setCountdown(10);
      } else {
        toast.error(data.msg || `Failed to ${decision} student`);
      }
    } catch (err) {
      toast.error(`Failed to process decision: ${err.message}`);
    }
  };

  const fetchSuspiciousActivities = async () => {
    try {
      const res = await fetch('/api/admin/suspicious-activities', {
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (res.ok) {
        setSuspiciousActivities(data);
      }
    } catch (err) {
      toast.error('Failed to fetch suspicious activities');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
        setStudents(data.filter((u) => u.role === 'Student'));
      }
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/teacher/questions', {
        headers: { 'x-auth-token': token },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && data.msg) || `Failed to fetch questions (${res.status})`);
      }
      setQuestions((Array.isArray(data) ? data : []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      toast.error(err.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    try {
      const endpoint = isBlocked ? 'unblock' : 'block';
      const res = await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: 'PUT',
        headers: { 'x-auth-token': token },
      });
      if (res.ok) {
        toast.success(`User ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      if (res.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleKickUser = async (userId) => {
    try {
      const res = await fetch(`/api/admin/kick/${userId}`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.msg);
      } else {
        toast.error(data.msg);
      }
    } catch (err) {
      toast.error('Failed to kick user');
    }
  };

  const handleResetCheatedFlag = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-cheat-flag`, {
        method: 'PUT',
        headers: { 'x-auth-token': token },
      });
      if (res.ok) {
        toast.success('Cheat flag reset successfully');
        fetchUsers();
      } else {
        toast.error('Failed to reset cheat flag');
      }
    } catch (err) {
      toast.error('Failed to reset cheat flag');
    }
  };

  const handleDeleteSuspiciousActivity = async (userId) => {
    if (!window.confirm('Are you sure you want to delete all suspicious activity records for this user?')) return;

    try {
      const res = await fetch(`/api/admin/suspicious-activities/${userId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Suspicious activity records deleted successfully');
        fetchSuspiciousActivities();
      } else {
        console.error('Delete failed:', data);
        toast.error(data.msg || 'Failed to delete suspicious activity records');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete suspicious activity records');
    }
  };

  const handleGlobalStop = async () => {
    try {
      const res = await fetch('/api/admin/global-stop', {
        method: 'POST',
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.msg);
      }
    } catch (err) {
      toast.error('Failed to stop quiz globally');
    }
    setConfirmStopOpen(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({ firstName: user.firstName, lastName: user.lastName });
    setEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(userFormData),
      });
      if (res.ok) {
        toast.success('User updated successfully');
        fetchUsers();
        setEditUserModal(false);
      }
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  // Question CRUD (same as Teacher)
  const handleSubmitQuestion = async () => {
    // Validation
    if (!formData.question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    if (!formData.subject) {
      toast.error('Please select a category');
      return;
    }
    if (formData.options.filter((o) => o.trim()).length < 2) {
      toast.error('Please enter at least 2 options');
      return;
    }
    if (!formData.answer) {
      toast.error('Please select the correct answer');
      return;
    }

    try {
      const url = editingQuestion
        ? `/api/teacher/questions/${editingQuestion._id}`
        : '/api/teacher/questions';
      const method = editingQuestion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingQuestion ? 'Question updated!' : 'Question created!');
        fetchQuestions();
        closeModal();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.msg || 'Failed to save question');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      if (res.ok) {
        toast.success('Question deleted!');
        fetchQuestions();
      }
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  const openModal = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        question: question.question,
        options: question.options,
        answer: question.answer,
        subject: question.subject,
        difficulty: question.difficulty || 'easy',
      });
    } else {
      setEditingQuestion(null);
      setFormData({ question: '', options: ['', '', '', ''], answer: '', subject: '', difficulty: 'easy' });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingQuestion(null);
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const filteredQuestions = selectedSubject
    ? questions.filter((q) => q.subject === selectedSubject)
    : questions;

  return (
    <Container style={{ padding: '2rem 0' }}>
      <Header as="h1" style={{ color: 'white', marginBottom: '2rem' }}>
        <Icon name="shield" /> Admin Dashboard
      </Header>

      {/* Stats Cards */}
      <Grid columns={3} stackable style={{ marginBottom: '2rem' }}>
        <Grid.Column>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Statistic inverted>
              <Statistic.Value>{users.length}</Statistic.Value>
              <Statistic.Label>Total Users</Statistic.Label>
            </Statistic>
          </div>
        </Grid.Column>
        <Grid.Column>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Statistic inverted color="green">
              <Statistic.Value>{activeStudentCount}</Statistic.Value>
              <Statistic.Label>Active Students</Statistic.Label>
            </Statistic>
          </div>
        </Grid.Column>
        <Grid.Column>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Button color="red" size="large" onClick={() => setConfirmStopOpen(true)}>
              <Icon name="stop" /> STOP ALL QUIZZES
            </Button>
          </div>
        </Grid.Column>
      </Grid>

      {/* User Management */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <Header as="h3" style={{ color: 'white', marginBottom: '1rem' }}>
          <Icon name="users" /> User Management
        </Header>
        <Table inverted basic="very" compact>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Role</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Cheated</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((user) => (
              <Table.Row key={user._id}>
                <Table.Cell>{user.firstName} {user.lastName}</Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>
                  <Label color={user.role === 'Admin' ? 'purple' : user.role === 'Teacher' ? 'blue' : 'teal'} size="tiny">
                    {user.role}
                  </Label>
                </Table.Cell>
                <Table.Cell>
                  <Label color={user.isBlocked ? 'red' : 'green'} size="tiny">
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </Label>
                </Table.Cell>
                <Table.Cell>
                  {user.cheatedFlag ? (
                    <Label color="orange" size="tiny">Flagged</Label>
                  ) : (
                    <Label color="grey" size="tiny">Clean</Label>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Button.Group size="tiny">
                    <Button icon="edit" onClick={() => handleEditUser(user)} />
                    <Button
                      icon={user.isBlocked ? 'unlock' : 'lock'}
                      color={user.isBlocked ? 'green' : 'orange'}
                      onClick={() => handleBlockUser(user._id, user.isBlocked)}
                    />
                    <Button icon="ban" color="yellow" onClick={() => handleKickUser(user._id)} />
                    <Button icon="trash" color="red" onClick={() => handleDeleteUser(user._id)} />
                    {user.cheatedFlag && (
                      <Button
                        icon="undo"
                        color="orange"
                        title="Reset cheat flag"
                        onClick={() => handleResetCheatedFlag(user._id)}
                      />
                    )}
                  </Button.Group>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* User Credentials */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <Header as="h3" style={{ color: 'white', marginBottom: '1rem' }}>
          <Icon name="key" /> User Credentials (Admin View)
        </Header>
        <Table inverted basic="very" compact>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Username</Table.HeaderCell>
              <Table.HeaderCell>Password</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((user) => (
              <Table.Row key={user._id}>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>
                  {showPasswords[user._id] ? user.password : '•••••'}
                  <Icon
                    name={showPasswords[user._id] ? 'eye slash' : 'eye'}
                    onClick={() => togglePasswordVisibility(user._id)}
                    style={{ cursor: 'pointer', marginLeft: '10px' }}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Suspicious Activity Monitor */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <Header as="h3" style={{ color: 'white', marginBottom: '1rem' }}>
          <Icon name="eye" /> Suspicious Activity Monitor
        </Header>
        <Table inverted basic="very" compact>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Username</Table.HeaderCell>
              <Table.HeaderCell>Count</Table.HeaderCell>
              <Table.HeaderCell>Last Activity</Table.HeaderCell>
              <Table.HeaderCell>Last Activity Type</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {suspiciousActivities.map((activity) => (
              <Table.Row key={activity.userId} error={activity.count >= 3}>
                <Table.Cell>{activity.userName}</Table.Cell>
                <Table.Cell>
                  <Label color={activity.count >= 3 ? 'red' : 'yellow'}>
                    {activity.count}
                  </Label>
                </Table.Cell>
                <Table.Cell>{new Date(activity.lastTimestamp).toLocaleString()}</Table.Cell>
                <Table.Cell>{activity.lastActivityType}</Table.Cell>
                <Table.Cell>
                  <Button
                    icon="trash"
                    color="red"
                    size="mini"
                    onClick={() => handleDeleteSuspiciousActivity(activity.userId)}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Question Management */}
      <div className="glass-card">
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            background: 'rgba(0,0,0,0.15)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Header as="h3" style={{ color: 'white', margin: 0 }}>
            <Icon name="question circle" /> Question Management
          </Header>
          <Button primary onClick={() => openModal()}>
            <Icon name="plus" /> Add Question
          </Button>
        </div>

        <Form.Dropdown
          placeholder="Select Subject"
          fluid
          selection
          inverted
          menu={{ inverted: true }}
          options={[
            { key: 'all', text: 'All Questions', value: '' },
            ...categories.map((subject) => ({ key: subject, text: subject, value: subject })),
          ]}
          value={selectedSubject}
          onChange={(e, { value }) => setSelectedSubject(value)}
          style={{
            marginBottom: '1rem',
            background: '#1b1c1d',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
          }}
        />

        <Table inverted basic="very" compact>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={6}>Question Text</Table.HeaderCell>
              <Table.HeaderCell width={2}>A</Table.HeaderCell>
              <Table.HeaderCell width={2}>B</Table.HeaderCell>
              <Table.HeaderCell width={2}>C</Table.HeaderCell>
              <Table.HeaderCell width={2}>D</Table.HeaderCell>
              <Table.HeaderCell>Correct Answer</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredQuestions.map((q) => (
              <Table.Row key={q._id}>
                <Table.Cell>{q.question}</Table.Cell>
                <Table.Cell>{q.options?.[0] || '-'}</Table.Cell>
                <Table.Cell>{q.options?.[1] || '-'}</Table.Cell>
                <Table.Cell>{q.options?.[2] || '-'}</Table.Cell>
                <Table.Cell>{q.options?.[3] || '-'}</Table.Cell>
                <Table.Cell>{q.answer}</Table.Cell>
                <Table.Cell>
                  <Button size="tiny" icon="edit" onClick={() => openModal(q)} />
                  <Button size="tiny" icon="trash" color="red" onClick={() => handleDeleteQuestion(q._id)} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Question Modal */}
      <Modal open={modalOpen} onClose={closeModal} size="small">
        <Modal.Header>{editingQuestion ? 'Edit Question' : 'Add Question'}</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Input
              label="Question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            />
            <Form.Dropdown
              label="Category"
              fluid
              selection
              search
              placeholder="Select Category"
              options={CATEGORIES.filter((c) => c.value !== '0')}
              value={formData.subject}
              onChange={(e, { value }) => setFormData({ ...formData, subject: value })}
            />
<Form.Dropdown
  label="Difficulty"
  fluid
  selection
  placeholder="Select Difficulty"
  options={DIFFICULTY.filter((d) => d.value !== '0')}
  value={formData.difficulty}
  onChange={(e, { value }) => setFormData({ ...formData, difficulty: value })}
/>
            <Form.Field>
              <label>Options</label>
              {formData.options.map((opt, i) => (
                <Form.Input
                  key={i}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                />
              ))}
            </Form.Field>
            <Form.Dropdown
              label="Correct Answer"
              fluid
              selection
              options={formData.options.filter((o) => o).map((o) => ({ key: o, text: o, value: o }))}
              value={formData.answer}
              onChange={(e, { value }) => setFormData({ ...formData, answer: value })}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={closeModal}>Cancel</Button>
          <Button primary onClick={handleSubmitQuestion}>Save</Button>
        </Modal.Actions>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={editUserModal} onClose={() => setEditUserModal(false)} size="tiny">
        <Modal.Header>Edit User</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Input
              label="First Name"
              value={userFormData.firstName}
              onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
            />
            <Form.Input
              label="Last Name"
              value={userFormData.lastName}
              onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setEditUserModal(false)}>Cancel</Button>
          <Button primary onClick={handleUpdateUser}>Save</Button>
        </Modal.Actions>
      </Modal>

      {/* Confirm Global Stop */}
      <Confirm
        open={confirmStopOpen}
        header="Stop All Quizzes"
        content="This will immediately end all active quizzes for all students. Are you sure?"
        confirmButton="Yes, Stop All"
        onCancel={() => setConfirmStopOpen(false)}
        onConfirm={handleGlobalStop}
      />

      {/* Admin Approval Modal for Suspicious Activity */}
      <Modal open={approvalModalOpen} onClose={() => { setApprovalModalOpen(false); setPendingApprovalData(null); }} size="small" centered={false}>
        <Modal.Header>
          <Icon name="warning" color="red" /> Suspicious Activity Alert
        </Modal.Header>
        <Modal.Content>
          {pendingApprovalData && (
            <>
              <p><strong>Student:</strong> {pendingApprovalData.userName}</p>
              <p><strong>Violation Count:</strong> {pendingApprovalData.count} strikes</p>
              <p><strong>Activity Type:</strong> {pendingApprovalData.activityType}</p>
              <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                Auto-block in: <span style={{ fontSize: '1.5rem' }}>{countdown}s</span>
              </p>
              <p style={{ marginTop: '1rem', color: '#ffd93d' }}>
                <Icon name="info circle" /> Admin must act within 10 seconds or student will be automatically blocked.
              </p>
            </>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button negative icon="ban" labelPosition="right" content="Block Student" onClick={() => handleApprovalDecision('block')} />
          <Button positive icon="check circle" labelPosition="right" content="Allow to Continue" onClick={() => handleApprovalDecision('approve')} />
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
