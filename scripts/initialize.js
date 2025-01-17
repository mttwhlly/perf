// scripts/initialize.js
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initialize() {
    try {
        console.log('Initializing project structure...');
        
        // Create base directories
        const dirs = [
            'test-implementations',
            'results',
            'scripts'
        ];
        
        dirs.forEach(dir => {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        });

        // Initialize each framework
        await initReactRouter();
        await initVue();
        await initSvelte();
        await initAngular();
        await initBlazor();

        console.log('\nInitialization complete!');
    } catch (error) {
        console.error('Initialization failed:', error);
        process.exit(1);
    }
}

async function initReactRouter() {
    console.log('\nInitializing React Router application...');
    const appPath = join(process.cwd(), 'test-implementations', 'react-router-app');
    
    if (existsSync(appPath)) {
        rmSync(appPath, { recursive: true, force: true });
    }

    process.chdir('test-implementations');
    execSync('npx create-react-router@latest react-router-app', { stdio: 'inherit' });
    process.chdir('react-router-app');
    
    // Update package.json and install dependencies...
    process.chdir('../..');
}

async function initVue() {
    console.log('\nInitializing Vue application...');
    const appPath = join(process.cwd(), 'test-implementations', 'vue-app');
    
    if (existsSync(appPath)) {
        rmSync(appPath, { recursive: true, force: true });
    }

    process.chdir('test-implementations');
    execSync('npm create vue@latest vue-app -- --typescript --router --jsx --force', { stdio: 'inherit' });
    process.chdir('vue-app');
    execSync('npm install', { stdio: 'inherit' });
    process.chdir('../..');
}

async function initSvelte() {
    console.log('\nInitializing Svelte application...');
    const appPath = join(process.cwd(), 'test-implementations', 'svelte-app');
    
    if (existsSync(appPath)) {
        rmSync(appPath, { recursive: true, force: true });
    }

    process.chdir('test-implementations');
    execSync('npx sv create svelte-app', { stdio: 'inherit' });
    process.chdir('svelte-app');
    execSync('npm install', { stdio: 'inherit' });
    process.chdir('../..');
}

async function initAngular() {
    console.log('\nInitializing Angular application...');
    const appPath = join(process.cwd(), 'test-implementations', 'angular-app');
    
    if (existsSync(appPath)) {
        rmSync(appPath, { recursive: true, force: true });
    }

    process.chdir('test-implementations');
    execSync('npx -p @angular/cli ng new angular-app --routing --style css --strict --skip-git --skip-tests', { stdio: 'inherit' });
    process.chdir('angular-app');
    execSync('npm install', { stdio: 'inherit' });
    process.chdir('../..');
}

async function initBlazor() {
    console.log('\nInitializing Blazor application...');
    const appPath = join(process.cwd(), 'test-implementations', 'blazor-app');
    
    if (existsSync(appPath)) {
        rmSync(appPath, { recursive: true, force: true });
    }

    process.chdir('test-implementations');
    execSync('dotnet new blazorwasm -o blazor-app', { stdio: 'inherit' });
    process.chdir('..');
}

export default initialize;

// Run initialization if this script is executed directly
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    initialize();
}