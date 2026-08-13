# ==========================================================================
# Orbit Backend Server — Native PowerShell http.server & Database Sync
# ==========================================================================

$port = 3000
$url = "http://localhost:$port/"
$dbFile = Join-Path $PSScriptRoot "db.json"

# Default state database if missing (synced with app.js structure)
$defaultState = @'
{
  "user": {
    "name": "Alex Carter",
    "email": "alex@example.com",
    "loggedIn": true
  },
  "workspace": {
    "name": "Acme Studio",
    "type": "team",
    "created": "2026-08-10"
  },
  "members": [
    { "id": "u-1", "name": "Alex Carter", "email": "alex@example.com", "role": "team_head" },
    { "id": "u-2", "name": "Sarah Connor", "email": "sarah@example.com", "role": "team_member" },
    { "id": "u-3", "name": "John Doe", "email": "john@example.com", "role": "team_member" }
  ],
  "invitations": [
    { "id": "i-1", "email": "designer@example.com", "status": "pending", "expires": "2026-08-20" }
  ],
  "projects": [
    { "id": "p-1", "name": "Website Rebranding", "description": "Design and implement the new corporate branding online.", "status": "active", "start": "2026-08-01", "due": "2026-08-20" },
    { "id": "p-2", "name": "Mobile Application", "description": "Build the iOS/Android client portal.", "status": "active", "start": "2026-08-05", "due": "2026-08-30" }
  ],
  "tasks": [
    {
      "id": "t-1",
      "projectId": "p-1",
      "assignedTo": "u-2",
      "title": "Design main branding illustrations",
      "description": "Create pastel vector illustrations for the home page header area.",
      "priority": "high",
      "status": "in_progress",
      "progress": 50,
      "start": "2026-08-01",
      "due": "2026-08-15"
    },
    {
      "id": "t-2",
      "projectId": "p-1",
      "assignedTo": "u-3",
      "title": "Write styleguide documentation",
      "description": "Format color palettes, typography specs, and button classes.",
      "priority": "low",
      "status": "not_started",
      "progress": 0,
      "start": "2026-08-10",
      "due": "2026-08-18"
    },
    {
      "id": "t-3",
      "projectId": "p-2",
      "assignedTo": "u-2",
      "title": "Setup API Integration layers",
      "description": "Connect endpoint handlers to user session authentications.",
      "priority": "medium",
      "status": "in_progress",
      "progress": 30,
      "start": "2026-08-06",
      "due": "2026-08-28"
    },
    {
      "id": "t-4",
      "projectId": "p-1",
      "assignedTo": "u-1",
      "title": "Deliver core logo vectors",
      "description": "Export high-resolution variations for light/dark platforms.",
      "priority": "high",
      "status": "completed",
      "progress": 100,
      "start": "2026-08-01",
      "due": "2026-08-10"
    }
  ],
  "subtasks": [
    { "id": "s-1", "taskId": "t-1", "title": "Sketch layouts on paper", "completed": true },
    { "id": "s-2", "taskId": "t-1", "title": "Trace illustrations in vector tool", "completed": false }
  ],
  "comments": [
    { "id": "c-1", "taskId": "t-1", "userId": "u-2", "body": "Illustrations are looking great, need copy refinement.", "time": "2026-08-12T14:30:00Z" }
  ],
  "activities": [
    { "id": "a-1", "taskId": "t-1", "userId": "u-2", "action": "created", "details": "created the task illustration asset.", "time": "2026-08-10T10:00:00Z" },
    { "id": "a-2", "taskId": "t-1", "userId": "u-2", "action": "subtask_completed", "details": "marked sketch layout completed.", "time": "2026-08-11T12:00:00Z" }
  ]
}
'@

# Ensure database exists
if (-not (Test-Path $dbFile)) {
    Write-Host "Creating default database file: $dbFile" -ForegroundColor Cyan
    $defaultState | Out-File -FilePath $dbFile -Encoding utf8
}

# Start HttpListener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

Write-Host "=============================================" -ForegroundColor Green
Write-Host "Orbit Workspace API Server is running!" -ForegroundColor Green
Write-Host "Local URL: $url" -ForegroundColor Cyan
Write-Host "Database File: $dbFile" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to terminate..." -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Green

try {
    $listener.Start()
} catch {
    Write-Error "Failed to start listener. Make sure port $port is not occupied or run as Administrator if needed."
    Exit 1
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Enable CORS headers for development/safety
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        $path = $request.Url.LocalPath
        $method = $request.HttpMethod

        Write-Host "[$method] $path" -ForegroundColor Green

        # Handle Preflight OPTIONS request
        if ($method -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # API: Get State
        if ($path -eq "/api/state" -and $method -eq "GET") {
            $response.ContentType = "application/json"
            $content = Get-Content $dbFile -Raw -Encoding utf8
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # API: Save State
        if ($path -eq "/api/state" -and $method -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $jsonBody = $reader.ReadToEnd()
            $reader.Close()

            # Save to flat file db
            $jsonBody | Out-File -FilePath $dbFile -Encoding utf8
            
            $response.ContentType = "application/json"
            $resMsg = '{"status":"success"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($resMsg)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # Static File Serving
        $filePath = ""
        $contentType = "text/html"

        if ($path -eq "/" -or $path -eq "/index.html") {
            $filePath = Join-Path $PSScriptRoot "index.html"
            $contentType = "text/html"
        }
        elseif ($path -eq "/style.css") {
            $filePath = Join-Path $PSScriptRoot "style.css"
            $contentType = "text/css"
        }
        elseif ($path -eq "/app.js") {
            $filePath = Join-Path $PSScriptRoot "app.js"
            $contentType = "application/javascript"
        }

        # Serve static file if exists
        if ($filePath -ne "" -and (Test-Path $filePath)) {
            $response.ContentType = $contentType
            $content = Get-Content $filePath -Raw -Encoding utf8
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            # Not Found
            $response.StatusCode = 404
            $resMsg = "404 Not Found"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($resMsg)
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        $response.Close()
    }
    catch {
        # Catch unexpected errors in loop and keep listener alive
        Write-Host "Error processing request: $_" -ForegroundColor Red
        if ($null -ne $response) {
            try {
                $response.StatusCode = 500
                $response.Close()
            } catch {}
        }
    }
}
