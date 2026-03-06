import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Header, Button } from 'semantic-ui-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import ShareButton from '../ShareButton';
import { calculateScore, calculateGrade, timeConverter } from '../../utils';

const Stats = ({
  totalQuestions,
  correctAnswers,
  timeTaken,
  replayQuiz,
  resetQuiz,
}) => {
  const score = calculateScore(totalQuestions, correctAnswers);
  const { grade, remarks } = calculateGrade(score);
  const { hours, minutes, seconds } = timeConverter(timeTaken);

  const printDocument = () => {
    const input = document.getElementById('divToPrint');
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('result.pdf');
    });
  };

  return (
    <Segment>
      <div id="divToPrint" className="container">
        <Header as="h1" textAlign="center" block style={{ color: '#333' }}>
          {remarks}
        </Header>
        <Header as="h2" textAlign="center" block style={{ color: '#333' }}>
          Grade: {grade}
        </Header>
        <Header as="h3" textAlign="center" block style={{ color: '#333' }}>
          Total Questions: {totalQuestions}
        </Header>
        <Header as="h3" textAlign="center" block style={{ color: '#333' }}>
          Correct Answers: {correctAnswers}
        </Header>
        <Header as="h3" textAlign="center" block style={{ color: '#333' }}>
          Your Score: {score}%
        </Header>
        <Header as="h3" textAlign="center" block style={{ color: '#333' }}>
          Passing Score: 60%
        </Header>
        <Header as="h3" textAlign="center" block style={{ color: '#333' }}>
          Time Taken:{' '}
          {`${Number(hours)}h ${Number(minutes)}m ${Number(seconds)}s`}
        </Header>
      </div>
      <div style={{ marginTop: 35 }}>
        <Button
          primary
          content="Play Again"
          onClick={replayQuiz}
          size="big"
          icon="redo"
          labelPosition="left"
          style={{ marginRight: 15, marginBottom: 8 }}
        />
        <Button
          color="teal"
          content="Back to Home"
          onClick={resetQuiz}
          size="big"
          icon="home"
          labelPosition="left"
          style={{ marginBottom: 8 }}
        />
        <ShareButton />
        <Button
          color="blue"
          content="Download Report"
          onClick={printDocument}
          size="big"
          icon="download"
          labelPosition="left"
          style={{ marginBottom: 8 }}
        />
      </div>
    </Segment>
  );
};

Stats.propTypes = {
  totalQuestions: PropTypes.number.isRequired,
  correctAnswers: PropTypes.number.isRequired,
  timeTaken: PropTypes.number.isRequired,
  replayQuiz: PropTypes.func.isRequired,
  resetQuiz: PropTypes.func.isRequired,
};

export default Stats;
