import React, { useState, useEffect } from 'react';
import {
  Header,
  Statistic,
  Container,
  Grid,
  Card,
  Button,
  Icon,
  Form,
  Modal,
  Table,
  Label,
} from 'semantic-ui-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';

const TeacherDashboard = () => {
  const { socket } = useUser();
  const [students, setStudents] = useState([]);
  const [activeStudentCount, setActiveStudentCount] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    answer: '',
    subject: '',
  });

  const token = localStorage.getItem('token');

  // Fetch initial data
  useEffect(() => {
    fetchStudents();
    fetchQuestions();
  }, []);

  // Listen for real-time active student count
  useEffect(() => {
    if (socket) {
      socket.on('activeStudentsCount', (count) => {
        setActiveStudentCount(count);
      });

      return () => {
        socket.off('activeStudentsCount');
      };
    }
  }, [socket]);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/teacher/students', {
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data);
      }
    } catch (err) {
      toast.error('Failed to fetch students');
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/teacher/questions', {
        headers: { 'x-auth-token': token },
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.sort((a, b) => a.order - b.order));
      }
    } catch (err) {
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleKickStudent = async (studentId) => {
    try {
      const res = await fetch(`/api/teacher/kick/${studentId}`, {
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
      toast.error('Failed to kick student');
    }
  };

  const handleSubmitQuestion = async () => {
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
        const data = await res.json();
        toast.error(data.msg || 'Failed to save question');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      const res = await fetch(`/api/teacher/questions/${id}`, {
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

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);

    // Save new order to backend
    try {
      await fetch('/api/teacher/questions/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ questionIds: items.map((q) => q._id) }),
      });
    } catch (err) {
      toast.error('Failed to save order');
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
      });
    } else {
      setEditingQuestion(null);
      setFormData({ question: '', options: ['', '', '', ''], answer: '', subject: '' });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingQuestion(null);
    setFormData({ question: '', options: ['', '', '', ''], answer: '', subject: '' });
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <Container style={{ padding: '2rem 0' }}>
      <Header as="h1" style={{ color: 'white', marginBottom: '2rem' }}>
        <Icon name="dashboard" /> Teacher Dashboard
      </Header>

      {/* Stats Cards */}
      <Grid columns={3} stackable style={{ marginBottom: '2rem' }}>
        <Grid.Column>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Statistic inverted>
              <Statistic.Value>{students.length}</Statistic.Value>
              <Statistic.Label>Total Students</Statistic.Label>
            </Statistic>
          </div>
        </Grid.Column>
        <Grid.Column>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Statistic inverted color="green">
              <Statistic.Value>{activeStudentCount}</Statistic.Value>
              <Statistic.Label>Active Now</Statistic.Label>
            </Statistic>
          </div>
        </Grid.Column>
        <Grid.Column>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Statistic inverted color="blue">
              <Statistic.Value>{questions.length}</Statistic.Value>
              <Statistic.Label>Questions</Statistic.Label>
            </Statistic>
          </div>
        </Grid.Column>
      </Grid>

      {/* Question Management */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Header as="h3" style={{ color: 'white', margin: 0 }}>
            <Icon name="question circle" /> Question Management
          </Header>
          <Button primary onClick={() => openModal()}>
            <Icon name="plus" /> Add Question
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {questions.map((q, index) => (
                  <Draggable key={q._id} draggableId={q._id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          background: snapshot.isDragging
                            ? 'rgba(0, 123, 255, 0.3)'
                            : 'rgba(255, 255, 255, 0.1)',
                          padding: '1rem',
                          marginBottom: '0.5rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ color: 'white' }}>
                            <Icon name="bars" style={{ marginRight: '1rem', cursor: 'grab' }} />
                            <strong>{q.question}</strong>
                            <Label size="tiny" style={{ marginLeft: '1rem' }}>{q.subject}</Label>
                          </div>
                          <div>
                            <Button size="tiny" icon="edit" onClick={() => openModal(q)} />
                            <Button size="tiny" icon="trash" color="red" onClick={() => handleDeleteQuestion(q._id)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Student Management */}
      <div className="glass-card">
        <Header as="h3" style={{ color: 'white', marginBottom: '1rem' }}>
          <Icon name="users" /> Student Management
        </Header>
        <Table inverted basic="very">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Class</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {students.map((student) => (
              <Table.Row key={student._id}>
                <Table.Cell>{student.firstName} {student.lastName}</Table.Cell>
                <Table.Cell>{student.email}</Table.Cell>
                <Table.Cell>{student.classDivision}</Table.Cell>
                <Table.Cell>
                  <Button size="tiny" color="red" onClick={() => handleKickStudent(student._id)}>
                    <Icon name="ban" /> Kick
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Add/Edit Question Modal */}
      <Modal open={modalOpen} onClose={closeModal} size="small">
        <Modal.Header>{editingQuestion ? 'Edit Question' : 'Add New Question'}</Modal.Header>
        <Modal.Content>
          <Form>
            <Form.Input
              label="Question"
              placeholder="Enter question text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            />
            <Form.Input
              label="Subject"
              placeholder="e.g., Math, Science, History"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
              placeholder="Select correct answer"
              fluid
              selection
              options={formData.options
                .filter((opt) => opt.trim())
                .map((opt) => ({ key: opt, text: opt, value: opt }))}
              value={formData.answer}
              onChange={(e, { value }) => setFormData({ ...formData, answer: value })}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={closeModal}>Cancel</Button>
          <Button primary onClick={handleSubmitQuestion}>
            {editingQuestion ? 'Update' : 'Create'}
          </Button>
        </Modal.Actions>
      </Modal>
    </Container>
  );
};

export default TeacherDashboard;
