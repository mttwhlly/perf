// test-scenarios/index.js
export class TestScenarios {
    constructor() {
        this.scenarios = {
            form: this.setupFormTest,
            realtime: this.setupRealtimeTest,
            animation: this.setupAnimationTest,
            websocket: this.setupWebSocketTest,
            dom: this.setupDOMTest
        };
    }

    async setupFormTest(framework) {
        const formData = {
            fields: Array.from({ length: 50 }, (_, i) => ({
                id: `field-${i}`,
                type: i % 5 === 0 ? 'select' : 'input',
                validation: ['required', i % 3 === 0 ? 'email' : 'text'],
                dependent: i > 25 ? `field-${i-25}` : null
            }))
        };

        return {
            component: await this.loadComponent(framework, 'form'),
            props: formData,
            actions: [
                { type: 'fill', count: 1000 },
                { type: 'validate', count: 100 },
                { type: 'submit', count: 50 }
            ]
        };
    }

    async setupRealtimeTest(framework) {
        const updateData = {
            frequency: 60, // updates per second
            dataSize: 1000, // items to update
            transformations: ['sort', 'filter', 'aggregate']
        };

        return {
            component: await this.loadComponent(framework, 'realtime'),
            props: updateData,
            actions: [
                { type: 'connect', count: 1 },
                { type: 'update', count: 1000 },
                { type: 'transform', count: 100 }
            ]
        };
    }

    async setupAnimationTest(framework) {
        const animationConfig = {
            css: {
                elements: 1000,
                properties: ['transform', 'opacity'],
                duration: 1000
            },
            canvas: {
                particles: 10000,
                fps: 60
            },
            svg: {
                paths: 1000,
                morphing: true
            }
        };

        return {
            component: await this.loadComponent(framework, 'animation'),
            props: animationConfig,
            actions: [
                { type: 'animate-css', count: 100 },
                { type: 'animate-canvas', count: 100 },
                { type: 'animate-svg', count: 100 }
            ]
        };
    }

    async setupWebSocketTest(framework) {
        const wsConfig = {
            url: 'ws://localhost:8080',
            messageSize: 1024, // bytes
            messageFrequency: 100, // ms
            reconnectStrategy: {
                attempts: 5,
                backoff: 'exponential'
            }
        };

        return {
            component: await this.loadComponent(framework, 'websocket'),
            props: wsConfig,
            actions: [
                { type: 'connect', count: 100 },
                { type: 'send', count: 1000 },
                { type: 'receive', count: 1000 },
                { type: 'disconnect', count: 100 }
            ]
        };
    }

    async setupDOMTest(framework) {
        const domConfig = {
            list: {
                items: 10000,
                itemTemplate: {
                    nesting: 3,
                    elements: 5
                }
            },
            virtualScroll: {
                windowSize: 50,
                totalItems: 100000
            },
            updates: {
                frequency: 60,
                batchSize: 100
            }
        };

        return {
            component: await this.loadComponent(framework, 'dom'),
            props: domConfig,
            actions: [
                { type: 'render', count: 100 },
                { type: 'scroll', count: 1000 },
                { type: 'update', count: 100 }
            ]
        };
    }

    async loadComponent(framework, type) {
        const componentPath = `../test-implementations/${framework}-app/src/components/${type}`;
        return import(componentPath);
    }

    async runScenario(framework, scenario, options = {}) {
        const setup = await this.scenarios[scenario].call(this, framework);
        const results = [];

        for (const action of setup.actions) {
            const actionResults = [];
            
            for (let i = 0; i < action.count; i++) {
                const start = performance.now();
                await this.executeAction(setup.component, action.type, setup.props);
                actionResults.push(performance.now() - start);
            }

            results.push({
                action: action.type,
                averageTime: actionResults.reduce((a, b) => a + b) / action.count,
                median: this.calculateMedian(actionResults),
                p95: this.calculatePercentile(actionResults, 95),
                p99: this.calculatePercentile(actionResults, 99)
            });
        }

        return {
            framework,
            scenario,
            results,
            metadata: {
                timestamp: new Date().toISOString(),
                options
            }
        };
    }

    calculateMedian(numbers) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];
    }

    calculatePercentile(numbers, percentile) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    async executeAction(component, actionType, props) {
        // Implementation specific to each action type
        const actions = {
            fill: () => component.fillForm(props),
            validate: () => component.validateForm(props),
            submit: () => component.submitForm(props),
            connect: () => component.connect(props),
            update: () => component.update(props),
            transform: () => component.transform(props),
            'animate-css': () => component.animateCSS(props),
            'animate-canvas': () => component.animateCanvas(props),
            'animate-svg': () => component.animateSVG(props),
            render: () => component.render(props),
            scroll: () => component.scroll(props),
            send: () => component.sendMessage(props),
            receive: () => component.receiveMessage(props),
            disconnect: () => component.disconnect(props)
        };

        return actions[actionType]();
    }
}