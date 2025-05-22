import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers like .toBeInTheDocument()
import EquationHistoryPanel from './EquationHistoryPanel';
import { HistoryEntry } from './EquationHistoryPanel'; // Assuming HistoryEntry is exported or defined here

// Mock data for testing
const mockHistory: HistoryEntry[] = [
    {
        id: '1',
        imageData: 'data:image/png;base64,test1',
        results: [{ expression: '2+2', answer: '4' }],
        dictOfVarsSnapshot: { var1: 'val1' },
        timestamp: new Date(2023, 0, 1, 10, 0, 0), // Jan 1, 2023 10:00:00
    },
    {
        id: '2',
        imageData: 'data:image/png;base64,test2',
        results: [{ expression: 'x=5', answer: '5' }, { expression: 'x*2', answer: '10' }],
        dictOfVarsSnapshot: { x: '5' },
        timestamp: new Date(2023, 0, 2, 11, 0, 0), // Jan 2, 2023 11:00:00
    },
];

describe('EquationHistoryPanel', () => {
    const mockOnRestore = jest.fn();

    beforeEach(() => {
        // Clear mock calls before each test
        mockOnRestore.mockClear();
    });

    it('renders "No history yet." when history is empty', () => {
        render(<EquationHistoryPanel history={[]} onRestore={mockOnRestore} />);
        expect(screen.getByText('No history yet.')).toBeInTheDocument();
    });

    it('renders history items correctly', () => {
        render(<EquationHistoryPanel history={mockHistory} onRestore={mockOnRestore} />);

        // Check if correct number of items are rendered
        expect(screen.getAllByRole('button', { name: 'Restore' })).toHaveLength(mockHistory.length);

        // Check content of the first item
        expect(screen.getByText((content, element) => content.startsWith('Timestamp:') && content.includes(new Date(2023, 0, 1, 10, 0, 0).toLocaleString()))).toBeInTheDocument();
        expect(screen.getByAltText('Equation sketch 1')).toHaveAttribute('src', 'data:image/png;base64,test1'); // Adjusted alt text to match component
        expect(screen.getByText('Expr: 2+2, Ans: 4')).toBeInTheDocument();
        expect(screen.getByText(/"var1": "val1"/)).toBeInTheDocument(); // Check for variable snapshot content

        // Check content of the second item (specifically multiple results)
        expect(screen.getByText('Expr: x=5, Ans: 5')).toBeInTheDocument();
        expect(screen.getByText('Expr: x*2, Ans: 10')).toBeInTheDocument();
        expect(screen.getByAltText('Equation sketch 2')).toHaveAttribute('src', 'data:image/png;base64,test2'); // Adjusted alt text to match component
    });

    it('calls onRestore with the correct entry when "Restore" button is clicked', () => {
        render(<EquationHistoryPanel history={mockHistory} onRestore={mockOnRestore} />);

        const restoreButtons = screen.getAllByRole('button', { name: 'Restore' });
        fireEvent.click(restoreButtons[0]); // Click restore for the first item

        expect(mockOnRestore).toHaveBeenCalledTimes(1);
        expect(mockOnRestore).toHaveBeenCalledWith(mockHistory[0]);

        fireEvent.click(restoreButtons[1]); // Click restore for the second item
        expect(mockOnRestore).toHaveBeenCalledTimes(2);
        expect(mockOnRestore).toHaveBeenCalledWith(mockHistory[1]);
    });

    // Minor change to the component needed: Add unique alt text for images if not already present
    // The test uses 'Equation sketch 1', 'Equation sketch 2'. (Adjusted from _ to space to match component)
    // Modify EquationHistoryPanel.tsx to include index in alt text for images:
    // e.g. alt={`Equation sketch ${entry.id}`} (This was done in the previous step)
});
