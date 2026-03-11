import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Container,
  Segment,
  Item,
  Divider,
  Button,
  Icon,
  Message,
  Menu,
  Header,
  Modal,
} from 'semantic-ui-react';
import he from 'he';
import { toast } from 'react-toastify';

import Countdown from '../Countdown';
import { useUser } from '../../context/UserContext';
import { getLetter } from '../../utils';

const Quiz = ({ data, countdownTime, endQuiz, resetQuiz }) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [userSlectedAns, setUserSlectedAns] = useState(null);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState([]);
  const [timeTaken, setTimeTaken] = useState(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [awaitingAdminDecision, setAwaitingAdminDecision] = useState(false);

  const suspiciousCountRef = useRef(0);
  const lastReportTimeRef = useRef(0);
  const loggedOutRef = useRef(false);
  const SUSPICIOUS_THRESHOLD = 3;
  const DEBOUNCE_MS = 2000;

  const { user, socket } = useUser();

  const handleImmediateLogout = useCallback(() => {
    // Prevent multiple logout attempts
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;

    // Immediate logout actions
    localStorage.setItem('cheatingLogout', 'true');
    localStorage.removeItem('token');
    toast.error('Maximum suspicious activity limit reached. You have been logged out.');
    
    // Hard redirect to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  }, []);

  const reportActivity = useCallback((type) => {
    // Prevent any activity after logout
    if (loggedOutRef.current) return;

    // Hard limit: prevent reporting if already at threshold
    if (suspiciousCountRef.current >= SUSPICIOUS_THRESHOLD) return;

    const now = Date.now();
    if (now - lastReportTimeRef.current < DEBOUNCE_MS) return;
    lastReportTimeRef.current = now;
    suspiciousCountRef.current += 1;
    const currentCount = suspiciousCountRef.current;
    setWarningCount(currentCount);

    // Report to backend
    const token = localStorage.getItem('token');
    fetch('/api/auth/suspicious-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ activityType: type }),
    }).catch(console.error);

    // When threshold reached, wait for admin decision (do NOT auto-logout)
    if (currentCount >= SUSPICIOUS_THRESHOLD) {
      if (user && user.role === 'Student') {
        setAwaitingAdminDecision(true);
        toast.warning(
          'Suspicious activity threshold reached. Awaiting admin decision...'
        );
      }
    } else {
      setWarningOpen(true);
      toast.warning(
        `Suspicious activity detected (${currentCount}/${SUSPICIOUS_THRESHOLD}).`
      );
    }
  }, [user]);

  // Cheating detection: tab switch, window blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!user || user.role !== 'Student') return;
      if (document.hidden) {
        reportActivity('tab_switch');
      }
    };

    const handleBlur = () => {
      if (!user || user.role !== 'Student') return;
      // Only report blur if document is still visible (not already a tab switch)
      setTimeout(() => {
        if (!document.hidden) {
          reportActivity('window_blur');
        }
      }, 150);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [reportActivity, user]);

  // Listen for admin approval/block decision
  useEffect(() => {
    if (!socket) return;

    socket.on('forceLogout', (data) => {
      loggedOutRef.current = true;
      setAwaitingAdminDecision(false);
      localStorage.setItem('cheatingLogout', 'true');
      localStorage.removeItem('token');
      toast.error(data.msg || 'Your account has been blocked due to suspicious activity.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    });

    socket.on('suspicionApproved', (data) => {
      setAwaitingAdminDecision(false);
      toast.success(data.msg || 'Admin has approved. You may continue with the quiz.');
    });

    return () => {
      socket.off('forceLogout');
      socket.off('suspicionApproved');
    };
  }, [socket]);

  useEffect(() => {
    if (questionIndex > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [questionIndex]);

  const handleItemClick = (e, { name }) => {
    if (!userSlectedAns) {
      setUserSlectedAns(name);
    }
  };

  const handleNext = () => {
    let point = 0;
    if (userSlectedAns === he.decode(data[questionIndex].correct_answer)) {
      point = 1;
    }

    const qna = questionsAndAnswers;
    qna.push({
      question: he.decode(data[questionIndex].question),
      user_answer: userSlectedAns,
      correct_answer: he.decode(data[questionIndex].correct_answer),
      point,
    });

    if (questionIndex === data.length - 1) {
      return endQuiz({
        totalQuestions: data.length,
        correctAnswers: correctAnswers + point,
        timeTaken,
        questionsAndAnswers: qna,
      });
    }

    setCorrectAnswers(correctAnswers + point);
    setQuestionIndex(questionIndex + 1);
    setUserSlectedAns(null);
    setQuestionsAndAnswers(qna);
  };

  const timeOver = timeTaken => {
    return endQuiz({
      totalQuestions: data.length,
      correctAnswers,
      timeTaken,
      questionsAndAnswers,
    });
  };

  return (
    <Item.Header>
      <Container>
        <Segment>
          <Item.Group divided>
            <Item>
              <Item.Content>
                <Item.Extra>
                  <Header as="h1" block floated="left">
                    <Icon name="info circle" />
                    <Header.Content>
                      {`Question No.${questionIndex + 1} of ${data.length}`}
                    </Header.Content>
                  </Header>
                  <Countdown
                    countdownTime={countdownTime}
                    timeOver={timeOver}
                    setTimeTaken={setTimeTaken}
                  />
                </Item.Extra>
                <br />
                <Item.Meta>
                  <Message size="huge" floating>
                    <b>{`Q. ${he.decode(data[questionIndex].question)}`}</b>
                  </Message>
                  <br />
                  <Item.Description>
                    <h3>Please choose one of the following answers:</h3>
                  </Item.Description>
                  <Divider />
                  <Menu vertical fluid size="massive">
                    {data[questionIndex].options.map((option, i) => {
                      const letter = getLetter(i);
                      const decodedOption = he.decode(option);
                      const isCorrect =
                        decodedOption ===
                        he.decode(data[questionIndex].correct_answer);

                      let color = null;
                      if (userSlectedAns) {
                        if (userSlectedAns === decodedOption) {
                          if (isCorrect) {
                            color = 'green';
                          } else {
                            color = 'red';
                          }
                        } else if (isCorrect) {
                          color = 'green';
                        }
                      }

                      return (
                        <Menu.Item
                          key={decodedOption}
                          name={decodedOption}
                          active={userSlectedAns === decodedOption}
                          onClick={!userSlectedAns ? handleItemClick : null}
                          color={color}
                        >
                          <b style={{ marginRight: '8px' }}>{letter}</b>
                          {decodedOption}
                        </Menu.Item>
                      );
                    })}
                  </Menu>
                </Item.Meta>
                <Divider />
                <Item.Extra>
                  <Button
                    color="red"
                    content="Quit"
                    onClick={resetQuiz}
                    floated="left"
                    size="big"
                    icon="stop"
                    labelPosition="left"
                  />
                  <Button
                    primary
                    content="Next"
                    onClick={handleNext}
                    floated="right"
                    size="big"
                    icon="right chevron"
                    labelPosition="right"
                    disabled={!userSlectedAns}
                  />
                </Item.Extra>
              </Item.Content>
            </Item>
          </Item.Group>
        </Segment>
        <br />
      </Container>

      {/* Admin Decision Modal */}
      <Modal open={awaitingAdminDecision} size="small" onClose={() => {}} closeIcon={false}>
        <Modal.Header>
          <Icon name="hourglass half" loading /> Awaiting Admin Decision
        </Modal.Header>
        <Modal.Content>
          <p>
            You have exceeded the suspicious activity threshold. An administrator is reviewing your case.
          </p>
          <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
            Please wait while the admin decides whether to block or allow your continuation...
          </p>
        </Modal.Content>
      </Modal>
    </Item.Header>
  );
};

Quiz.propTypes = {
  data: PropTypes.array.isRequired,
  countdownTime: PropTypes.number.isRequired,
  endQuiz: PropTypes.func.isRequired,
  resetQuiz: PropTypes.func.isRequired,
};

export default Quiz;