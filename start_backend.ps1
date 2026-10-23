# Run from: sentineliq/
Set-Location "$PSScriptRoot\backend"

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv venv
}

.\venv\Scripts\Activate.ps1

# requirements.txt pins versions for the Python 3.10 deployment image. Those
# pins have no prebuilt wheels for Python 3.12+, so on newer Python install
# current versions of the same packages instead.
$minor = [int](python -c "import sys; print(sys.version_info.minor)")
Write-Host "Installing backend packages for Python 3.$minor (first run takes several minutes)..."
if ($minor -le 11) {
    pip install -r requirements.txt
} else {
    pip install fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" aiosqlite greenlet scikit-learn torch xgboost shap numpy pandas pydantic python-multipart httpx openai
}

Write-Host ""
Write-Host "Starting backend on http://localhost:8000 (first start trains the models, about 30 seconds)"
python -m uvicorn main:app --host 127.0.0.1 --port 8000
