import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const formatCode = (code) => {
    if (!code) return '';
    // Simple C code formatter
    return code
        .replace(/;/g, ';\n')
        .replace(/{/g, '{\n  ')
        .replace(/}/g, '\n}\n')
        .replace(/\n\s*\n/g, '\n'); // Remove extra newlines
};

const Quiz = ({ studentId, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: optionKey } (e.g., "A", "B")
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch questions
    useEffect(() => {
        fetch('/questions.json')
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch questions");
                return res.json();
            })
            .then(data => {
                if (data.questions && Array.isArray(data.questions)) {
                    setQuestions(data.questions);
                } else {
                    throw new Error("Invalid questions format");
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Enter Fullscreen & Disable Right Click
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                console.error("Fullscreen error:", err);
            }
        };
        enterFullscreen();

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        const handleRightClick = (e) => e.preventDefault();

        // Warn before leave
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('contextmenu', handleRightClick);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('contextmenu', handleRightClick);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleOptionSelect = (optionKey) => {
        setAnswers((prev) => ({
            ...prev,
            [questions[currentIndex].id]: optionKey
        }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!window.confirm('Are you sure you want to submit?')) return;

        setSubmitting(true);

        // Format answers for backend
        const formattedAnswers = questions.map(q => ({
            questionId: q.id,
            selectedOption: answers[q.id] || 'Not Answered',
            isCorrect: answers[q.id] === q.correct_answer
        }));

        try {
            const res = await fetch('https://c-quiz.onrender.com/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    answers: formattedAnswers
                })
            });

            if (!res.ok) throw new Error('Submission failed');

            if (document.exitFullscreen) document.exitFullscreen().catch(() => { });

            onComplete();
        } catch (err) {
            alert('Error submitting quiz: ' + err.message);
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading questions...</div>;
    if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>Error: {error}</div>;

    if (!isFullscreen) {
        return (
            <div className="fullscreen-warning">
                <h2 style={{ marginBottom: '1rem' }}>Fullscreen Required</h2>
                <p style={{ marginBottom: '2rem' }}>Please enable fullscreen to continue the quiz.</p>
                <button className="btn btn-primary" onClick={() => document.documentElement.requestFullscreen()}>
                    Enter Fullscreen
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    // Convert options object "A": "Text" to array for mapping
    const optionsArray = Object.entries(currentQuestion.options); // [["A", "Text"], ["B", "Text"]]

    return (
        <div className="quiz-container">
            <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', opacity: 0.7 }}>
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span>Student: {studentId}</span>
                </div>

                <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', whiteSpace: 'pre-line' }}>
                    {currentQuestion.question}
                </h2>

                {currentQuestion.code && (
                    <div className="code-block-container" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                        <SyntaxHighlighter
                            language="c"
                            style={atomDark}
                            customStyle={{
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '1rem',
                                fontSize: '0.9rem'
                            }}
                        >
                            {formatCode(currentQuestion.code)}
                        </SyntaxHighlighter>
                    </div>
                )}

                <div style={{ marginBottom: '2rem' }}>
                    {optionsArray.map(([key, text]) => (
                        <button
                            key={key}
                            className={`option-btn ${answers[currentQuestion.id] === key ? 'selected' : ''}`}
                            onClick={() => handleOptionSelect(key)}
                        >
                            <span style={{ marginRight: '10px', opacity: 0.5 }}>{key}.</span>
                            {text}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        className="btn btn-outline"
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        style={{ visibility: currentIndex === 0 ? 'hidden' : 'visible' }}
                    >
                        Previous
                    </button>

                    {isLastQuestion ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleNext}>
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Quiz;
