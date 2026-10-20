import os
import shutil
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

# Ensure directories exist
for directory in [DATA_DIR, UPLOAD_DIR, OUTPUT_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{DATA_DIR / 'clipcraft.db'}"
DB_PATH = DATA_DIR / "clipcraft.db"

# Limits & Validation
MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi", ".mkv"}
RENDER_TIMEOUT_SECONDS = 180

def find_executable(name: str) -> str:
    """Find executable on system PATH or known fallback locations."""
    # 1. Standard PATH
    found = shutil.which(name)
    if found:
        return found
    
    # 2. Known Windows paths (WinGet, Chocolatey, Program Files)
    win_name = f"{name}.exe" if not name.endswith(".exe") else name
    user_home = Path.home()
    
    candidates = [
        # WinGet packages
        *user_home.glob(f"AppData/Local/Microsoft/WinGet/Packages/**/*/{win_name}"),
        # Chocolatey
        Path(f"C:/ProgramData/chocolatey/bin/{win_name}"),
        # Program Files
        Path(f"C:/Program Files/ffmpeg/bin/{win_name}"),
        Path(f"C:/ffmpeg/bin/{win_name}"),
    ]
    
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return str(candidate.resolve())
            
    # Default to just the name and hope PATH resolves it
    return name

FFMPEG_PATH = find_executable("ffmpeg")
FFPROBE_PATH = find_executable("ffprobe")
