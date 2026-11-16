
import subprocess
import sys
import threading
import json
from pathlib import Path

from .live_history import save_flow


PROJECT_DIR = Path(__file__).resolve().parent.parent


class LiveController:

    def __init__(self):
        self.process = None
        self.flows = []
        self.errors = []
        self.lock = threading.Lock()

    def start(self):

        with self.lock:

            if self.process is not None and self.process.poll() is None:
                return False

            self.flows = []
            self.errors = []

            self.process = subprocess.Popen(
                [
                    sys.executable,
                    "-m",
                    "backend.live_worker"
                ],
                cwd=str(PROJECT_DIR),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )

            threading.Thread(
                target=self._read_flows,
                daemon=True
            ).start()

            threading.Thread(
                target=self._read_errors,
                daemon=True
            ).start()

            return True

    def _read_flows(self):

        process = self.process

        if process is None:
            return

        for line in process.stdout:

            try:
                flow = json.loads(line.strip())

                # Save every newly received flow to persistent history
                try:
                    save_flow(flow)
                except Exception as e:
                    with self.lock:
                        self.errors.append(
                            f"History save error: {e}"
                        )

                # Maintain the existing latest-100 dashboard buffer
                with self.lock:
                    self.flows.append(flow)

                    if len(self.flows) > 100:
                        self.flows.pop(0)

            except json.JSONDecodeError:
                continue

    def _read_errors(self):

        process = self.process

        if process is None:
            return

        for line in process.stderr:

            message = line.strip()

            if message:
                with self.lock:
                    self.errors.append(message)

                    if len(self.errors) > 20:
                        self.errors.pop(0)

    def stop(self):

        with self.lock:

            if self.process is None or self.process.poll() is not None:
                return False

            self.process.terminate()

            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=5)

            return True

    def status(self):

        with self.lock:

            running = (
                self.process is not None
                and self.process.poll() is None
            )

            return {
                "running": running,
                "total_flows": len(self.flows),
                "flows": list(reversed(self.flows)),
                "errors": list(self.errors)
            }


live_controller = LiveController()
