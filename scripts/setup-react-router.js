import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupReactRouter() {
    const routerPath = join(__dirname, '..', 'test-implementations', 'react-router-app');
    const srcPath = join(routerPath, 'src');
    
    try {
        // Create necessary directories
        await fs.mkdir(join(srcPath, 'components'), { recursive: true });
        await fs.mkdir(join(srcPath, 'routes'), { recursive: true });

        // Create main.tsx
        await fs.writeFile(
            join(srcPath, 'main.tsx'),
            `import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)`
        );

        // Create routes/index.tsx
        await fs.writeFile(
            join(srcPath, 'routes', 'index.tsx'),
            `import { createBrowserRouter } from 'react-router-dom';
import { FormTest } from '../components/form/FormTest';
import { RealtimeTest } from '../components/realtime/RealtimeTest';
import { AnimationTest } from '../components/animation/AnimationTest';
import { WebSocketTest } from '../components/websocket/WebSocketTest';
import { DOMTest } from '../components/dom/DOMTest';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <FormTest fields={[{ id: 'test' }]} />,
  },
  {
    path: '/form',
    element: <FormTest fields={[{ id: 'test' }]} />,
  },
  {
    path: '/realtime',
    element: <RealtimeTest frequency={60} dataSize={1000} />,
  },
  {
    path: '/animation',
    element: <AnimationTest />,
  },
  {
    path: '/websocket',
    element: <WebSocketTest />,
  },
  {
    path: '/dom',
    element: <DOMTest />,
  },
]);`
        );

        // Create component files
        const components = {
            'form/FormTest.tsx': `import { Form } from 'react-router-dom';
import { useState, useCallback } from 'react';

interface Field {
  id: string;
  type?: string;
}

interface FormTestProps {
  fields?: Field[];
  onSubmit?: (data: any) => void;
}

export function FormTest({ fields = [], onSubmit }: FormTestProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  return (
    <Form method="post" onSubmit={handleSubmit} className="form-test">
      {fields.map(field => (
        <div key={field.id} className="form-field">
          <input
            type="text"
            id={field.id}
            name={field.id}
            onChange={handleChange}
            value={formData[field.id] || ''}
          />
        </div>
      ))}
      <button type="submit">Submit</button>
    </Form>
  );
}`,

            'realtime/RealtimeTest.tsx': `import { useState, useEffect } from 'react';

interface RealtimeTestProps {
  frequency?: number;
  dataSize?: number;
}

export function RealtimeTest({ 
  frequency = 60, 
  dataSize = 1000 
}: RealtimeTestProps) {
  const [data, setData] = useState<Array<{ id: number; value: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(Array.from({ length: dataSize }, (_, i) => ({
        id: i,
        value: Math.random()
      })));
    }, 1000 / frequency);

    return () => clearInterval(interval);
  }, [frequency, dataSize]);

  return (
    <div className="realtime-test">
      {data.map(item => (
        <div key={item.id}>{item.value.toFixed(3)}</div>
      ))}
    </div>
  );
}`,

            'animation/AnimationTest.tsx': `import { useRef, useEffect } from 'react';

interface AnimationTestProps {
  css?: any;
  canvas?: any;
  svg?: any;
}

export function AnimationTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="animation-test">
      <canvas ref={canvasRef} width={800} height={600} />
    </div>
  );
}`,

            'websocket/WebSocketTest.tsx': `import { useState, useEffect } from 'react';

interface WebSocketTestProps {
  url?: string;
}

export function WebSocketTest({ url = 'ws://localhost:8080' }: WebSocketTestProps) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data]);
    };

    return () => ws.close();
  }, [url]);

  return (
    <div className="websocket-test">
      {messages.map((msg, idx) => (
        <div key={idx}>{msg}</div>
      ))}
    </div>
  );
}`,

            'dom/DOMTest.tsx': `import { useState, useEffect } from 'react';

interface DOMTestProps {
  list?: {
    items?: number;
  };
}

export function DOMTest({ list = { items: 1000 } }: DOMTestProps) {
  const [items, setItems] = useState<Array<{ id: number; text: string }>>([]);

  useEffect(() => {
    setItems(Array.from({ length: list.items }, (_, i) => ({
      id: i,
      text: \`Item \${i}\`
    })));
  }, [list.items]);

  return (
    <div className="dom-test">
      {items.map(item => (
        <div key={item.id}>{item.text}</div>
      ))}
    </div>
  );
}`
        };

        // Write component files
        for (const [filePath, content] of Object.entries(components)) {
            const fullPath = join(srcPath, 'components', filePath);
            await fs.mkdir(dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        }

        // Create CSS
        await fs.writeFile(
            join(srcPath, 'index.css'),
            'body { margin: 0; padding: 20px; font-family: sans-serif; }'
        );

        console.log('React Router components and routes setup complete!');
    } catch (error) {
        console.error('Error setting up React Router components:', error);
        throw error;
    }
}

// Export the function
export default setupReactRouter;

// Run setup if this script is executed directly
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    setupReactRouter().catch(console.error);
}