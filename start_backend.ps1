# Run from: sentineliq/
Set-Location "$PSScriptRoot\backend"

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv venv
}

.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip --quiet

Write-Host "Installing backend packages (first run can take several minutes)..."
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -ne 0) {
    # The pinned versions (e.g. torch 2.1.2) have no wheels for newer Python
    # releases. Fall back to current versions of the same packages.
    Write-Host "Pinned versions unavailable for this Python. Installing current versions instead..."
    pip install fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" aiosqlite greenlet scikit-learn torch xgboost shap numpy pandas pydantic python-multipart httpx openai --quiet
}

Write-Host "Starting backend on http://localhost:8000 (first start trains the models, about 30 seconds)"
uvicorn main:app --host 127.0.0.1 --port 8000
