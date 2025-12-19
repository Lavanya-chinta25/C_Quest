import { useState } from 'react';
import Login from './components/Login';
import Quiz from './components/Quiz';
import Result from './components/Result';

function App() {
  const [step, setStep] = useState('login'); // login | quiz | result
  const [studentId, setStudentId] = useState('');

  const handleLogin = (id, statusData) => {
    setStudentId(id);
    if (statusData.attempted) {
      setStep('result');
    } else {
      setStep('quiz');
    }
  };

  const handleQuizComplete = () => {
    setStep('result');
  };

  return (
    <>
      {step === 'login' && <Login onLogin={handleLogin} />}
      {step === 'quiz' && <Quiz studentId={studentId} onComplete={handleQuizComplete} />}
      {step === 'result' && <Result studentId={studentId} />}
    </>
  );
}

export default App;
