import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Container, Menu } from 'semantic-ui-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import Stats from './Stats';
import QNA from './QNA';

const Result = ({
  totalQuestions,
  correctAnswers,
  timeTaken,
  questionsAndAnswers,
  replayQuiz,
  resetQuiz,
}) => {
  const [activeTab, setActiveTab] = useState('Stats');
  const resultRef = useRef();

  const handleTabClick = (e, { name }) => {
    setActiveTab(name);
  };

  const handleDownload = () => {
    const input = resultRef.current;
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('quiz-result.pdf');
    });
  };

  return (
    <div ref={resultRef} className="result-section">
      <Container>
        <Menu fluid widths={3}>
          <Menu.Item
            name="Stats"
            active={activeTab === 'Stats'}
            onClick={handleTabClick}
          />
          <Menu.Item
            name="QNA"
            active={activeTab === 'QNA'}
            onClick={handleTabClick}
          />
          <Menu.Item name="Download" onClick={handleDownload} />
        </Menu>
        {activeTab === 'Stats' && (
          <Stats
            totalQuestions={totalQuestions}
            correctAnswers={correctAnswers}
            timeTaken={timeTaken}
            replayQuiz={replayQuiz}
            resetQuiz={resetQuiz}
          />
        )}
        {activeTab === 'QNA' && <QNA questionsAndAnswers={questionsAndAnswers} />}
        <br />
      </Container>
    </div>
  );
};

Result.propTypes = {
  totalQuestions: PropTypes.number.isRequired,
  correctAnswers: PropTypes.number.isRequired,
  timeTaken: PropTypes.number.isRequired,
  questionsAndAnswers: PropTypes.array.isRequired,
  replayQuiz: PropTypes.func.isRequired,
  resetQuiz: PropTypes.func.isRequired,
};

export default Result;