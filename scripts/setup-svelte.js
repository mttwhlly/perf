import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupSvelte() {
    const sveltePath = join(__dirname, '..', 'test-implementations', 'svelte-app');
    const srcPath = join(sveltePath, 'src');
    
    try {
        // Create necessary directories
        await fs.mkdir(join(srcPath, 'lib'), { recursive: true });
        await fs.mkdir(join(srcPath, 'routes'), { recursive: true });

        // Create app.html
        await fs.writeFile(
            join(srcPath, 'app.html'),
            `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body>
    <div>%sveltekit.body%</div>
  </body>
</html>`
        );

        // Create +layout.svelte
        await fs.writeFile(
            join(srcPath, 'routes', '+layout.svelte'),
            `<script>
  import '../app.css'
</script>

<slot />`
        );

        // Create routes
        const routes = {
            '+page.svelte': `<script>
import FormTest from '$lib/components/form/FormTest.svelte'
</script>

<FormTest fields={[{ id: 'test' }]} />`,
            
            'form/+page.svelte': `<script>
import FormTest from '$lib/components/form/FormTest.svelte'
</script>

<FormTest fields={[{ id: 'test' }]} />`,
            
            'realtime/+page.svelte': `<script>
import RealtimeTest from '$lib/components/realtime/RealtimeTest.svelte'
</script>

<RealtimeTest frequency={60} dataSize={1000} />`,
            
            'animation/+page.svelte': `<script>
import AnimationTest from '$lib/components/animation/AnimationTest.svelte'
</script>

<AnimationTest />`,
            
            'websocket/+page.svelte': `<script>
import WebSocketTest from '$lib/components/websocket/WebSocketTest.svelte'
</script>

<WebSocketTest />`,
            
            'dom/+page.svelte': `<script>
import DOMTest from '$lib/components/dom/DOMTest.svelte'
</script>

<DOMTest list={{ items: 1000 }} />`
        };

        // Create components
        const components = {
            'form/FormTest.svelte': `<script lang="ts">
export let fields = [];
export let onSubmit = (data) => {};

let formData = {};

function handleSubmit(event) {
    event.preventDefault();
    onSubmit(formData);
}

function handleChange(event) {
    const { name, value } = event.target;
    formData[name] = value;
}
</script>

<form on:submit={handleSubmit} class="form-test">
    {#each fields as field}
        <div class="form-field">
            <input
                type={field.type || 'text'}
                id={field.id}
                name={field.id}
                on:input={handleChange}
                value={formData[field.id] || ''}
            />
        </div>
    {/each}
    <button type="submit">Submit</button>
</form>`,

            'realtime/RealtimeTest.svelte': `<script lang="ts">
import { onMount, onDestroy } from 'svelte';

export let frequency = 60;
export let dataSize = 1000;

let data = [];
let interval;

onMount(() => {
    interval = setInterval(() => {
        data = Array.from({ length: dataSize }, (_, i) => ({
            id: i,
            value: Math.random()
        }));
    }, 1000 / frequency);
});

onDestroy(() => {
    clearInterval(interval);
});
</script>

<div class="realtime-test">
    {#each data as item (item.id)}
        <div>{item.value.toFixed(3)}</div>
    {/each}
</div>`,

            'animation/AnimationTest.svelte': `<script lang="ts">
import { onMount } from 'svelte';

let canvas;

onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function animate() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        requestAnimationFrame(animate);
    }

    animate();
});
</script>

<div class="animation-test">
    <canvas bind:this={canvas} width={800} height={600} />
</div>`,

            'websocket/WebSocketTest.svelte': `<script lang="ts">
import { onMount, onDestroy } from 'svelte';

export let url = 'ws://localhost:8080';

let messages = [];
let ws;

onMount(() => {
    ws = new WebSocket(url);
    ws.onmessage = (event) => {
        messages = [...messages, event.data];
    };
});

onDestroy(() => {
    ws?.close();
});
</script>

<div class="websocket-test">
    {#each messages as msg, idx (idx)}
        <div>{msg}</div>
    {/each}
</div>`,

            'dom/DOMTest.svelte': `<script lang="ts">
import { onMount } from 'svelte';

export let list = { items: 1000 };
let items = [];

onMount(() => {
    items = Array.from({ length: list.items }, (_, i) => ({
        id: i,
        text: \`Item \${i}\`
    }));
});
</script>

<div class="dom-test">
    {#each items as item (item.id)}
        <div>{item.text}</div>
    {/each}
</div>`
        };

        // Write route files
        for (const [routePath, content] of Object.entries(routes)) {
            const fullPath = join(srcPath, 'routes', routePath);
            await fs.mkdir(dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        }

        // Write component files
        for (const [filePath, content] of Object.entries(components)) {
            const fullPath = join(srcPath, 'lib', 'components', filePath);
            await fs.mkdir(dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        }

        // Create app.css
        await fs.writeFile(
            join(srcPath, 'app.css'),
            'body { margin: 0; padding: 20px; font-family: sans-serif; }'
        );

        console.log('Svelte components and routes setup complete!');
    } catch (error) {
        console.error('Error setting up Svelte components:', error);
        throw error;
    }
}

export default setupSvelte;

// Run setup if this script is executed directly
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    setupSvelte().catch(console.error);
}