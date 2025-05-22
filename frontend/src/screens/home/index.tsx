import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import EquationHistoryPanel from '@/components/EquationHistoryPanel';

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

// HistoryEntry is now defined in EquationHistoryPanel.tsx
// and implicitly used by the equationHistory state.
// No need to redefine or import it here if EquationHistoryPanel handles its own props type.

// Forward declaration for HistoryEntry, assuming its structure from EquationHistoryPanel.tsx
// This is needed for the handleRestoreFromHistory function argument type.
interface HistoryEntry {
    id: string;
    imageData: string;
    results: Array<{ expression: string; answer: string }>;
    dictOfVarsSnapshot: Record<string, string>;
    timestamp: Date;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState<Record<string, string>>({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [equationHistory, setEquationHistory] = useState<HistoryEntry[]>([]);

    // ✅ Memoized function to prevent re-creation on re-renders
    const renderLatexToCanvas = useCallback((expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression((prev) => [...prev, latex]);

        // Clear the canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result, renderLatexToCanvas]); // ✅ Fixed missing dependency warning

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
            });
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => setIsDrawing(false);

    const runRoute = async () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/calculate`, {
                image: canvas.toDataURL('image/png'),
                dict_of_vars: dictOfVars
            });

            const resp = await response.data;
            console.log('Response:', resp);

            // Create a snapshot of dictOfVars *before* processing new assignments for this run
            const initialDictOfVarsSnapshot = { ...dictOfVars };

            resp.data.forEach((data: Response) => {
                if (data.assign) {
                    setDictOfVars((prev) => ({
                        ...prev,
                        [data.expr]: data.result // Assuming data.expr is variable name for assignment
                    }));
                }
            });

            // Create history entry after all processing for this run is done
            const newHistoryEntry: HistoryEntry = {
                id: new Date().toISOString() + Math.random(),
                imageData: canvas.toDataURL('image/png'),
                results: resp.data.map((d: Response) => ({ expression: d.expr, answer: d.result })),
                dictOfVarsSnapshot: { ...dictOfVars }, // Capture dictOfVars *after* current run's assignments
                timestamp: new Date(),
            };
            setEquationHistory(prev => [newHistoryEntry, ...prev]);


            // Get bounding box for non-transparent pixels
            const ctx = canvas.getContext('2d');
            const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const i = (y * canvas.width + x) * 4;
                    if (imageData.data[i + 3] > 0) { // If pixel is not transparent
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            setLatexPosition({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });

            resp.data.forEach((data: Response) => {
                // The existing logic for setResult and renderLatexToCanvas handles live display
                // It might be slightly delayed due to setTimeout, which is fine.
                setTimeout(() => {
                    setResult({
                        expression: data.expr,
                        answer: data.result
                    });
                }, 1000);
            });
        }
    };

    };

    const handleRestoreFromHistory = (entry: HistoryEntry) => {
        // 1. Restore dictOfVars
        setDictOfVars(entry.dictOfVarsSnapshot);

        // 2. Clear current canvas & LaTeX
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        setLatexExpression([]); // Clear existing LaTeX expressions
        setResult(undefined); // Clear current single result display

        // 3. Redraw image from history onto the canvas
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                if (ctx) { // Check ctx again inside onload
                   ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Or draw with original dimensions if stored/preferred
                }
            };
            img.src = entry.imageData;
        }

        // 4. Re-render LaTeX results from the history entry
        const newLatexExpressions: string[] = [];
        entry.results.forEach(res => {
            const latex = `\\(\\LARGE{${res.expression} = ${res.answer}}\\)`;
            newLatexExpressions.push(latex);
        });
        setLatexExpression(newLatexExpressions);

        // Optional: Update 'result' for the last item if needed for other effects,
        // but renderLatexToCanvas is tied to `result` and clears canvas.
        // Direct setting of latexExpression is preferred for history restore.
    };

    return (
        <>
            <div className='grid grid-cols-3 gap-2'>
                <Button onClick={() => setReset(true)} className='z-20 bg-black text-white'>
                    Reset
                </Button>
                <Group className='z-20'>
                    {SWATCHES.map((swatch) => (
                        <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)} />
                    ))}
                </Group>
                <Button onClick={runRoute} className='z-20 bg-black text-white'>
                    Run
                </Button>
            </div>
            <canvas
                ref={canvasRef}
                id='canvas'
                className='absolute top-0 left-0 w-full h-full'
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />

            {latexExpression.map((latex, index) => (
                <Draggable key={index} defaultPosition={latexPosition} onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}>
                    <div className="absolute p-2 text-white rounded shadow-md">
                        <div className="latex-content">{latex}</div>
                    </div>
                </Draggable>
            ))}

            {Object.keys(dictOfVars).length > 0 && (
                <div className="absolute top-20 right-4 p-4 bg-gray-700 text-white rounded shadow-lg z-30">
                    <h3 className="text-lg font-semibold mb-2">Variables:</h3>
                    <ul>
                        {Object.entries(dictOfVars).map(([key, value]) => (
                            <li key={key}>{`${key}: ${value}`}</li>
                        ))}
                    </ul>
                </div>
            )}
            <EquationHistoryPanel history={equationHistory} onRestore={handleRestoreFromHistory} />
        </>
    );
}
