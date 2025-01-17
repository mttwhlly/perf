import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupAngular() {
    const angularPath = join(__dirname, '..', 'test-implementations', 'angular-app');
    const srcPath = join(angularPath, 'src', 'app');
    
    try {
        // Create necessary directories
        await fs.mkdir(join(srcPath, 'components'), { recursive: true });

        // Create routing configuration
        await fs.writeFile(
            join(srcPath, 'app-routing.module.ts'),
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

        // Create app.component.ts
        await fs.writeFile(
            join(srcPath, 'app.component.ts'),
            `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent { }`
        );

        // Create app.module.ts
        await fs.writeFile(
            join(srcPath, 'app.module.ts'),
            `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormTestComponent } from './components/form-test/form-test.component';
import { RealtimeTestComponent } from './components/realtime-test/realtime-test.component';
import { AnimationTestComponent } from './components/animation-test/animation-test.component';
import { WebSocketTestComponent } from './components/websocket-test/websocket-test.component';
import { DomTestComponent } from './components/dom-test/dom-test.component';

@NgModule({
  declarations: [
    AppComponent,
    FormTestComponent,
    RealtimeTestComponent,
    AnimationTestComponent,
    WebSocketTestComponent,
    DomTestComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`
        );

        // Create component files
        const components = {
            'form-test/form-test.component.ts': `import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

interface Field {
  id: string;
  type?: string;
}

@Component({
  selector: 'app-form-test',
  template: \`
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-test">
      <div *ngFor="let field of fields" class="form-field">
        <input
          [type]="field.type || 'text'"
          [id]="field.id"
          [formControlName]="field.id"
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  \`
})
export class FormTestComponent {
  @Input() fields: Field[] = [{ id: 'test' }];
  @Output() submit = new EventEmitter<any>();
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    this.fields.forEach(field => {
      this.form.addControl(field.id, this.fb.control(''));
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.submit.emit(this.form.value);
    }
  }
}`,

            'realtime-test/realtime-test.component.ts': `import { Component, Input, OnInit, OnDestroy } from '@angular/core';

interface DataItem {
  id: number;
  value: number;
}

@Component({
  selector: 'app-realtime-test',
  template: \`
    <div class="realtime-test">
      <div *ngFor="let item of data">
        {{item.value | number:'1.3-3'}}
      </div>
    </div>
  \`
})
export class RealtimeTestComponent implements OnInit, OnDestroy {
  @Input() frequency = 60;
  @Input() dataSize = 1000;
  data: DataItem[] = [];
  private interval: any;

  ngOnInit() {
    this.interval = setInterval(() => {
      this.data = Array.from({ length: this.dataSize }, (_, i) => ({
        id: i,
        value: Math.random()
      }));
    }, 1000 / this.frequency);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}`,

            'animation-test/animation-test.component.ts': `import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-animation-test',
  template: \`
    <div class="animation-test">
      <canvas #canvas width="800" height="600"></canvas>
    </div>
  \`
})
export class AnimationTestComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      requestAnimationFrame(animate);
    };

    animate();
  }
}`,

            'websocket-test/websocket-test.component.ts': `import { Component, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-websocket-test',
  template: \`
    <div class="websocket-test">
      <div *ngFor="let msg of messages">{{msg}}</div>
    </div>
  \`
})
export class WebSocketTestComponent implements OnInit, OnDestroy {
  @Input() url = 'ws://localhost:8080';
  messages: string[] = [];
  private ws!: WebSocket;

  ngOnInit() {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (event) => {
      this.messages = [...this.messages, event.data];
    };
  }

  ngOnDestroy() {
    this.ws?.close();
  }
}`,

            'dom-test/dom-test.component.ts': `import { Component, Input, OnInit } from '@angular/core';

interface Item {
  id: number;
  text: string;
}

@Component({
  selector: 'app-dom-test',
  template: \`
    <div class="dom-test">
      <div *ngFor="let item of items">{{item.text}}</div>
    </div>
  \`
})
export class DomTestComponent implements OnInit {
  @Input() list = { items: 1000 };
  items: Item[] = [];

  ngOnInit() {
    this.items = Array.from({ length: this.list.items }, (_, i) => ({
      id: i,
      text: \`Item \${i}\`
    }));
  }
}`
        };

        // Write component files
        for (const [componentPath, content] of Object.entries(components)) {
            const fullPath = join(srcPath, 'components', componentPath);
            await fs.mkdir(dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        }

        // Create styles.css
        await fs.writeFile(
            join(angularPath, 'src', 'styles.css'),
            'body { margin: 0; padding: 20px; font-family: sans-serif; }'
        );

        console.log('Angular components and routes setup complete!');
    } catch (error) {
        console.error('Error setting up Angular components:', error);
        throw error;
    }
}

export default setupAngular;

// Run setup if this script is executed directly
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    setupAngular().catch(console.error);
}