import React from 'react';

// Define HistoryEntry interface here and export it
export interface HistoryEntry { // Added export
    id: string;
    imageData: string;
    results: Array<{ expression: string; answer: string }>;
    dictOfVarsSnapshot: Record<string, string>;
    timestamp: Date;
}

interface EquationHistoryPanelProps {
    history: HistoryEntry[];
    onRestore: (entry: HistoryEntry) => void; // Added this
}

const EquationHistoryPanel: React.FC<EquationHistoryPanelProps> = ({ history, onRestore }) => {
    if (!history || history.length === 0) {
        return (
            <div style={{ padding: '10px', margin: '10px', textAlign: 'center', color: 'white' }}>
                <p>No history yet.</p>
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            top: '150px', // Adjust as needed, below variable display
            right: '10px',
            width: '300px', // Or whatever width fits your design
            maxHeight: 'calc(100vh - 160px)', // Adjust based on top position and other elements
            overflowY: 'auto',
            backgroundColor: 'rgba(50, 50, 50, 0.9)', // Semi-transparent dark background
            border: '1px solid #666',
            borderRadius: '8px',
            padding: '15px',
            color: 'white', // Text color
            zIndex: 1000 // Ensure it's above the canvas but potentially below modals if any
        }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #888', paddingBottom: '10px' }}>Equation History</h4>
            {history.map((entry) => (
                <div key={entry.id} style={{ borderBottom: '1px solid #555', marginBottom: '15px', paddingBottom: '15px' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>
                        <strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    <img
                        src={entry.imageData}
                        alt={`Equation sketch ${entry.id}`} // Made alt text unique
                        style={{
                            width: '100%', // Make image responsive to panel width
                            maxWidth: '250px', // Max width for image
                            border: '1px solid #ccc',
                            margin: '10px auto', // Center image
                            display: 'block',
                            borderRadius: '4px'
                        }}
                    />
                    <div style={{ marginBottom: '10px' }}>
                        <strong style={{ display: 'block', marginBottom: '5px' }}>Results:</strong>
                        {entry.results.map((res, index) => (
                            <div key={index} style={{ fontSize: '0.9em', marginLeft: '10px', background: '#444', padding: '3px 6px', borderRadius: '3px', marginBottom: '3px' }}>
                                {`Expr: ${res.expression}, Ans: ${res.answer}`}
                            </div>
                        ))}
                    </div>
                    <div>
                        <strong style={{ display: 'block', marginBottom: '5px' }}>Variables:</strong>
                        <pre style={{ 
                            fontSize: '0.8em', 
                            backgroundColor: '#333', 
                            color: '#eee',
                            padding: '8px', 
                            borderRadius: '4px', 
                            whiteSpace: 'pre-wrap', // Wrap long lines
                            wordBreak: 'break-all' // Break long words/strings
                        }}>
                            {JSON.stringify(entry.dictOfVarsSnapshot, null, 2)}
                        </pre>
                    </div>
                    <button 
                        onClick={() => onRestore(entry)} 
                        style={{ 
                            marginTop: '10px', 
                            padding: '5px 10px', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer' 
                        }}
                    >
                        Restore
                    </button>
                </div>
            ))}
        </div>
    );
};

export default EquationHistoryPanel;
