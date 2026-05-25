import sys
from pathlib import Path

AI_AGENT_ROOT = Path(__file__).resolve().parents[1]
if str(AI_AGENT_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_AGENT_ROOT))