import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupVue() {
    const vuePath = join(__dirname, '..', 'test-implementations', 'vue-app');
    const srcPath = join(vuePath, 'src');
    
    try {
        // Create necessary directories
        await fs.mkdir(join(srcPath, 'components'), { recursive: true });
        await fs.mkdir(join(srcPath, 'views'), { recursive: true });

        // Create main.ts
        await fs.writeFile(
            join(srcPath, 'main.ts'),
            `import { createApp } from 'vue'
import { router } from './router'
import App from './App.vue'
import './index.css'

const app = createApp(App)
app.use(router)
app.mount('#app')`
        );

        // Create App.vue
        await fs.writeFile(
            join(srcPath, 'App.vue'),
            `<template>
  <router-view></router-view>
</template>`
        );

        // Create router.ts
        await fs.writeFile(
            join(srcPath, 'router.ts'),
            `import { createRouter, createWebHistory } from 'vue-router'
import FormTest from './components/form/FormTest.vue'
import RealtimeTest from './components/realtime/RealtimeTest.vue'
import AnimationTest from './components/animation/AnimationTest.vue'
import WebSocketTest from './components/websocket/WebSocketTest.vue'
import DOMTest from './components/dom/DOMTest.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: FormTest },
    { path: '/form', component: FormTest },
    { path: '/realtime', component: RealtimeTest },
    { path: '/animation', component: AnimationTest },
    { path: '/websocket', component: WebSocketTest },
    { path: '/dom', component: DOMTest }
  ]
})`
        );

        // Create component files
        const components = {
            'form/FormTest.vue': `<template>
  <form @submit.prevent="handleSubmit" class="form-test">
    <div v-for="field in fields" :key="field.id" class="form-field">
      <input
        :type="field.type || 'text'"
        :id="field.id"
        :name="field.id"
        v-model="formData[field.id]"
      />
    </div>
    <button type="submit">Submit</button>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

interface Field {
  id: string
  type?: string
}

export default defineComponent({
  props: {
    fields: {
      type: Array as () => Field[],
      default: () => []
    }
  },
  emits: ['submit'],
  setup(props, { emit }) {
    const formData = ref<Record<string, string>>({})

    const handleSubmit = () => {
      emit('submit', formData.value)
    }

    return {
      formData,
      handleSubmit
    }
  }
})
</script>`,

            'realtime/RealtimeTest.vue': `<template>
  <div class="realtime-test">
    <div v-for="item in data" :key="item.id">
      {{ item.value.toFixed(3) }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'

interface DataItem {
  id: number
  value: number
}

export default defineComponent({
  props: {
    frequency: {
      type: Number,
      default: 60
    },
    dataSize: {
      type: Number,
      default: 1000
    }
  },
  setup(props) {
    const data = ref<DataItem[]>([])
    let interval: NodeJS.Timeout

    onMounted(() => {
      interval = setInterval(() => {
        data.value = Array.from({ length: props.dataSize }, (_, i) => ({
          id: i,
          value: Math.random()
        }))
      }, 1000 / props.frequency)
    })

    onUnmounted(() => {
      clearInterval(interval)
    })

    return { data }
  }
})
</script>`,

            'animation/AnimationTest.vue': `<template>
  <div class="animation-test">
    <canvas ref="canvas" width="800" height="600" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'

export default defineComponent({
  setup() {
    const canvas = ref<HTMLCanvasElement | null>(null)

    onMounted(() => {
      const ctx = canvas.value?.getContext('2d')
      if (!ctx) return

      const animate = () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        requestAnimationFrame(animate)
      }

      animate()
    })

    return { canvas }
  }
})
</script>`,

            'websocket/WebSocketTest.vue': `<template>
  <div class="websocket-test">
    <div v-for="(msg, idx) in messages" :key="idx">
      {{ msg }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'

export default defineComponent({
  props: {
    url: {
      type: String,
      default: 'ws://localhost:8080'
    }
  },
  setup(props) {
    const messages = ref<string[]>([])
    let ws: WebSocket

    onMounted(() => {
      ws = new WebSocket(props.url)
      ws.onmessage = (event) => {
        messages.value.push(event.data)
      }
    })

    onUnmounted(() => {
      ws?.close()
    })

    return { messages }
  }
})
</script>`,

            'dom/DOMTest.vue': `<template>
  <div class="dom-test">
    <div v-for="item in items" :key="item.id">
      {{ item.text }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'

interface Item {
  id: number
  text: string
}

export default defineComponent({
  props: {
    list: {
      type: Object,
      default: () => ({ items: 1000 })
    }
  },
  setup(props) {
    const items = ref<Item[]>([])

    onMounted(() => {
      items.value = Array.from({ length: props.list.items }, (_, i) => ({
        id: i,
        text: \`Item \${i}\`
      }))
    })

    return { items }
  }
})
</script>`
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

        console.log('Vue components and routes setup complete!');
    } catch (error) {
        console.error('Error setting up Vue components:', error);
        throw error;
    }
}

export default setupVue;

// Run setup if this script is executed directly
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    setupVue().catch(console.error);
}