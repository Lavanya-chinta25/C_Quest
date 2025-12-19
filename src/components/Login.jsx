import { useState } from 'react';

const Login = ({ onLogin }) => {
    const [studentId, setStudentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        const idPattern = /^[nN]\d{6}$/;

        if (!studentId.trim()) {
            setError('Please enter a Student ID');
            return;
        }

        if (!idPattern.test(studentId)) {
            setError('Invalid format. Use "n" followed by 6 digits (e.g., n200094).');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`https://c-quiz.onrender.com/api/quiz/status/${studentId}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to check status');
            }

            onLogin(studentId, data);
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h1>Welcome</h1>
            <p style={{ marginBottom: '2rem' }}>Enter your Student ID to begin the assessment.</p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    autoFocus
                />

                {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>}

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={loading}
                >
                    {loading ? 'Checking...' : 'Start Quiz'}
                </button>
            </form>
        </div>
    );
};

export default Login;
