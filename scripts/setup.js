// scripts/setup.js
const fs = require('fs').promises;
const path = require('path');

async function setup() {
    try {
        await setupReactRouter();
        await setupVue();
        await setupSvelte();
        await setupAngular();
        await setupBlazor();
        
        console.log('All framework setups complete!');
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

async function setupVue() {
    const vuePath = path.join(__dirname, '..', 'test-implementations', 'vue-app');
    const srcPath = path.join(vuePath, 'src');
    
    try {
        // Create directories
        await fs.mkdir(path.join(srcPath, 'components'), { recursive: true });

        // Create router configuration
        await fs.writeFile(
            path.join(srcPath, 'router.ts'),
            `import { createRouter, createWebHistory } from 'vue-router'
import FormTest from './components/FormTest.vue'
import RealtimeTest from './components/RealtimeTest.vue'
import AnimationTest from './components/AnimationTest.vue'
import WebSocketTest from './components/WebSocketTest.vue'
import DOMTest from './components/DOMTest.vue'

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

        // Create Vue components...
    } catch (error) {
        console.error('Error setting up Vue:', error);
        throw error;
    }
}

async function setupSvelte() {
    const sveltePath = path.join(__dirname, '..', 'test-implementations', 'svelte-app');
    const srcPath = path.join(sveltePath, 'src');
    
    try {
        // Create directories
        await fs.mkdir(path.join(srcPath, 'routes'), { recursive: true });

        // Create Svelte routes and components...
    } catch (error) {
        console.error('Error setting up Svelte:', error);
        throw error;
    }
}

async function setupAngular() {
    const angularPath = path.join(__dirname, '..', 'test-implementations', 'angular-app');
    const srcPath = path.join(angularPath, 'src', 'app');
    
    try {
        // Create directories
        await fs.mkdir(path.join(srcPath, 'components'), { recursive: true });

        // Update routing configuration
        await fs.writeFile(
            path.join(srcPath, 'app-routing.module.ts'),
            `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormTestComponent } from './components/form-test/form-test.component';
import { RealtimeTestComponent } from './components/realtime-test/realtime-test.component';
import { AnimationTestComponent } from './components/animation-test/animation-test.component';
import { WebSocketTestComponent } from './components/websocket-test/websocket-test.component';
import { DomTestComponent } from './components/dom-test/dom-test.component';

const routes: Routes = [
  { path: '', redirectTo: '/form', pathMatch: 'full' },
  { path: 'form', component: FormTestComponent },
  { path: 'realtime', component: RealtimeTestComponent },
  { path: 'animation', component: AnimationTestComponent },
  { path: 'websocket', component: WebSocketTestComponent },
  { path: 'dom', component: DomTestComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }`
        );

        // Create Angular components...
    } catch (error) {
        console.error('Error setting up Angular:', error);
        throw error;
    }
}

async function setupBlazor() {
    const blazorPath = path.join(__dirname, '..', 'test-implementations', 'blazor-app');
    
    try {
        // Create directories
        await fs.mkdir(path.join(blazorPath, 'Pages'), { recursive: true });

        // Create Blazor components and routing...
    } catch (error) {
        console.error('Error setting up Blazor:', error);
        throw error;
    }
}

// Export all setup functions
module.exports = {
    setup,
    setupReactRouter,
    setupVue,
    setupSvelte,
    setupAngular,
    setupBlazor
};

// Run setup if this script is executed directly
if (require.main === module) {
    setup().catch(console.error);
}