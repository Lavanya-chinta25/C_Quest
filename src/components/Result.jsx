import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const formatCode = (code) => {
    if (!code) return '';
    let formatted = '';
    let indentLevel = 0;
    let parenDepth = 0;

    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        if (char === '(') {
            parenDepth++;
            formatted += char;
        } else if (char === ')') {
            if (parenDepth > 0) parenDepth--;
            formatted += char;
        } else if (char === '{') {
            indentLevel++;
            formatted += ' {\n' + '  '.repeat(indentLevel);
        } else if (char === '}') {
            indentLevel = Math.max(0, indentLevel - 1);
            formatted += '\n' + '  '.repeat(indentLevel) + '}\n' + '  '.repeat(indentLevel);
        } else if (char === ';') {
            formatted += ';';
            if (parenDepth === 0) {
                formatted += '\n' + '  '.repeat(indentLevel);
            } else {
                formatted += ' ';
            }
        } else {
            formatted += char;
        }
    }
    return formatted.replace(/\n\s*\n/g, '\n').trim();
};

const Result = ({ studentId }) => {
    const [data, setData] = useState(null);
    const [questions, setQuestions] = useState([]); // Store fetched questions
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch results and questions in parallel
                const [resultRes, questionsRes] = await Promise.all([
                    fetch(`https://c-quiz.onrender.com/api/quiz/answers/${studentId}`),
                    fetch('/questions.json')
                ]);

                if (!resultRes.ok) throw new Error('Failed to load results');
                if (!questionsRes.ok) throw new Error('Failed to load questions');

                const resultJson = await resultRes.json();
                const questionsJson = await questionsRes.json();

                setData(resultJson);
                setQuestions(questionsJson.questions || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    if (loading) return <div>Loading results...</div>;
    if (error) return <div style={{ color: 'var(--danger-color)' }}>{error}</div>;

    // Create a map for quick lookup
    const userAnswers = {};
    if (data && data.answers) {
        data.answers.forEach(a => userAnswers[a.questionId] = a);
    }

    return (
        <div className="quiz-container" style={{ paddingBottom: '3rem' }}>
            <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1>Quiz Completed</h1>
                <p>Thank you, {studentId}. Your submission has been recorded.</p>
                <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    Score: {data.score} / {questions.length}
                </div>
            </div>

            {questions.map((q, idx) => {
                const userAnswer = userAnswers[q.id];
                const isCorrect = userAnswer?.isCorrect;
                // selected is now the option Key (A, B, C...)
                const selectedKey = userAnswer?.selectedOption;

                // options is an object { A: "...", B: "..." }
                const optionsArray = Object.entries(q.options);

                return (
                    <div key={q.id} className="glass-panel" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: '1rem', color: 'var(--text-muted)' }}>{idx + 1}.</span>
                            {q.question}
                        </h3>

                        {q.code && (
                            <div className="code-block-container" style={{ textAlign: 'left', marginBottom: '1rem' }}>
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
                                    {formatCode(q.code)}
                                </SyntaxHighlighter>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {optionsArray.map(([key, text]) => {
                                let statusClass = '';
                                // Logic for styling result options
                                // q.correct_answer is the key (e.g., "A")
                                if (key === q.answer) statusClass = 'correct';
                                else if (key === selectedKey && !isCorrect) statusClass = 'incorrect';

                                return (
                                    <div
                                        key={key}
                                        className={`option-btn ${statusClass}`}
                                        style={{ cursor: 'default', opacity: statusClass ? 1 : 0.5 }}
                                    >
                                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>{key}.</span>
                                        {text}
                                        {key === selectedKey && <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>(Your Answer)</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Result;
