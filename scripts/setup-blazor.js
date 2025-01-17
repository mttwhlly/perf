import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupBlazor() {
    const blazorPath = join(__dirname, '..', 'test-implementations', 'blazor-app');
    const pagesPath = join(blazorPath, 'Pages');
    const sharedPath = join(blazorPath, 'Shared');
    const wwwrootPath = join(blazorPath, 'wwwroot');
    
    try {
        // Create necessary directories
        await fs.mkdir(pagesPath, { recursive: true });
        await fs.mkdir(sharedPath, { recursive: true });
        await fs.mkdir(wwwrootPath, { recursive: true });

        // Create App.razor
        await fs.writeFile(
            join(blazorPath, 'App.razor'),
            `<Router AppAssembly="@typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
        <FocusOnNavigate RouteData="@routeData" Selector="h1" />
    </Found>
    <NotFound>
        <PageTitle>Not found</PageTitle>
        <LayoutView Layout="@typeof(MainLayout)">
            <p role="alert">Sorry, there's nothing at this address.</p>
        </LayoutView>
    </NotFound>
</Router>`
        );

        // Create MainLayout.razor
        await fs.writeFile(
            join(sharedPath, 'MainLayout.razor'),
            `@inherits LayoutComponentBase

<main>
    @Body
</main>

@code {
}`
        );

        // Create component pages
        const pages = {
            'Index.razor': `@page "/"

<PageTitle>Home</PageTitle>

<FormTest Fields="@(new[] { new Field { Id = "test" } })" />

@code {
    public class Field
    {
        public string Id { get; set; }
        public string Type { get; set; } = "text";
    }
}`,

            'FormTest.razor': `@page "/form"
@using System.Collections.Generic
@using Microsoft.AspNetCore.Components.Forms

<div class="form-test">
    <EditForm Model="@formData" OnValidSubmit="@HandleSubmit">
        @foreach (var field in Fields)
        {
            <div class="form-field">
                <InputText id="@field.Id" @bind-Value="formData[field.Id]" />
            </div>
        }
        <button type="submit">Submit</button>
    </EditForm>
</div>

@code {
    [Parameter]
    public Field[] Fields { get; set; } = Array.Empty<Field>();

    private Dictionary<string, string> formData = new();

    public class Field
    {
        public string Id { get; set; }
        public string Type { get; set; } = "text";
    }

    private void HandleSubmit()
    {
        // Handle form submission
    }

    protected override void OnInitialized()
    {
        foreach (var field in Fields)
        {
            formData[field.Id] = string.Empty;
        }
    }
}`,

            'RealtimeTest.razor': `@page "/realtime"
@using System.Timers
@implements IDisposable

<div class="realtime-test">
    @foreach (var item in Data)
    {
        <div>@item.Value.ToString("F3")</div>
    }
</div>

@code {
    [Parameter]
    public int Frequency { get; set; } = 60;

    [Parameter]
    public int DataSize { get; set; } = 1000;

    private Timer timer;
    private List<DataItem> Data = new();
    private Random random = new();

    protected override void OnInitialized()
    {
        timer = new Timer(1000.0 / Frequency);
        timer.Elapsed += (sender, e) =>
        {
            Data = Enumerable.Range(0, DataSize)
                .Select(i => new DataItem { Id = i, Value = random.NextDouble() })
                .ToList();
            InvokeAsync(StateHasChanged);
        };
        timer.Start();
    }

    public void Dispose()
    {
        timer?.Dispose();
    }

    private class DataItem
    {
        public int Id { get; set; }
        public double Value { get; set; }
    }
}`,

            'AnimationTest.razor': `@page "/animation"
@using Microsoft.JSInterop
@inject IJSRuntime JSRuntime

<div class="animation-test">
    <canvas @ref="canvasReference" width="800" height="600"></canvas>
</div>

@code {
    private ElementReference canvasReference;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await JSRuntime.InvokeVoidAsync("setupCanvas", canvasReference);
        }
    }
}`,

            'WebSocketTest.razor': `@page "/websocket"
@implements IAsyncDisposable
@using System.Net.WebSockets
@using System.Text

<div class="websocket-test">
    @foreach (var message in messages)
    {
        <div>@message</div>
    }
</div>

@code {
    [Parameter]
    public string Url { get; set; } = "ws://localhost:8080";

    private ClientWebSocket webSocket;
    private List<string> messages = new();
    private CancellationTokenSource cts = new();

    protected override async Task OnInitializedAsync()
    {
        webSocket = new ClientWebSocket();
        await webSocket.ConnectAsync(new Uri(Url), cts.Token);
        _ = ReceiveLoop();
    }

    private async Task ReceiveLoop()
    {
        var buffer = new byte[1024 * 4];
        while (!cts.Token.IsCancellationRequested)
        {
            try
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cts.Token);
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    messages.Add(message);
                    await InvokeAsync(StateHasChanged);
                }
            }
            catch (WebSocketException)
            {
                break;
            }
        }
    }

    public async ValueTask DisposeAsync()
    {
        cts.Cancel();
        if (webSocket != null)
        {
            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
            webSocket.Dispose();
        }
        cts.Dispose();
    }
}`,

            'DOMTest.razor': `@page "/dom"

<div class="dom-test">
    @foreach (var item in items)
    {
        <div>@item.Text</div>
    }
</div>

@code {
    [Parameter]
    public TestList List { get; set; } = new() { Items = 1000 };

    private List<TestItem> items = new();

    protected override void OnInitialized()
    {
        items = Enumerable.Range(0, List.Items)
            .Select(i => new TestItem { Id = i, Text = $"Item {i}" })
            .ToList();
    }

    public class TestList
    {
        public int Items { get; set; }
    }

    public class TestItem
    {
        public int Id { get; set; }
        public string Text { get; set; }
    }
}`
        };

        // Create JavaScript interop file for canvas
        await fs.writeFile(
            join(wwwrootPath, 'canvasInterop.js'),
            `window.setupCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function animate() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        requestAnimationFrame(animate);
    }

    animate();
};`
        );

        // Write page files
        for (const [pageName, content] of Object.entries(pages)) {
            const fullPath = join(pagesPath, pageName);
            await fs.writeFile(fullPath, content);
        }

        // Create wwwroot/css/site.css
        await fs.mkdir(join(wwwrootPath, 'css'), { recursive: true });
        await fs.writeFile(
            join(wwwrootPath, 'css', 'site.css'),
            'body { margin: 0; padding: 20px; font-family: sans-serif; }'
        );

        // Create _Imports.razor
        await fs.writeFile(
            join(blazorPath, '_Imports.razor'),
            `@using System.Net.Http
@using System.Net.Http.Json
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using Microsoft.AspNetCore.Components.WebAssembly.Http
@using Microsoft.JSInterop
@using BlazorApp`
        );

        console.log('Blazor components and routes setup complete!');
    } catch (error) {
        console.error('Error setting up Blazor components:', error);
        throw error;
    }
}

export default setupBlazor;

// Run setup if this script is executed directly
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    setupBlazor().catch(console.error);
}