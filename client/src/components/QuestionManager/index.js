import React, { useState, useEffect } from 'react';
import { Header, Button, List } from 'semantic-ui-react';
import { toast } from 'react-toastify';

const QuestionManager = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('/api/teacher/questions', {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
          },
        });
        const data = await res.json();
        if (res.ok) {
          setQuestions(data);
        } else {
          toast.error(data.msg || 'Failed to fetch questions');
        }
      } catch (err) {
        toast.error('Server error');
      }
    };

    fetchQuestions();
  }, []);

  return (
    <div>
      <Header as="h2">Question Management</Header>
      <Button primary>Add Question</Button>
      <List divided relaxed>
        {questions.map(q => (
          <List.Item key={q._id}>
            <List.Content>
              <List.Header>{q.question}</List.Header>
              <List.Description>Subject: {q.subject}</List.Description>
            </List.Content>
          </List.Item>
        ))}
      </List>
    </div>
  );
};

export default QuestionManager;
