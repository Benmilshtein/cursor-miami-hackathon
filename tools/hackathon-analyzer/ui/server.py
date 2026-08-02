#!/usr/bin/env python3
"""
Minimal local web UI server to browse hackathon analysis outputs.
Serves static files from ui/static and JSON/text APIs backed by work/* artifacts.
Usage: python3 ui/server.py --work-dir work --port 8000
"""

import argparse
import csv
import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote

# Resolve relative to project root (parent of ui/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
JUDGE_RESPONSES_PATH = PROJECT_ROOT / "data" / "judge-responses-normalized.json"


class UiHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, work_dir: Path, static_dir: Path, **kwargs):
        self.work_dir = work_dir
        self.static_dir = static_dir
        super().__init__(*args, directory=str(static_dir), **kwargs)

    def _send_json(self, payload, status=200):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_text(self, text, status=200):
        data = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = unquote(self.path.split("?", 1)[0])
        if path == "/api/summary":
            return self.handle_summary()
        if path == "/api/judges":
            return self.handle_judges()
        if path.startswith("/api/repo/"):
            return self.handle_repo(path)
        return super().do_GET()

    def handle_summary(self):
        summary_path = self.work_dir / "summary" / "metrics_summary.csv"
        if not summary_path.exists():
            return self._send_json({"error": "summary not found"}, status=404)
        rows = []
        with summary_path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
        return self._send_json({"rows": rows})

    def handle_judges(self):
        if not JUDGE_RESPONSES_PATH.exists():
            return self._send_json({"error": "judge data not found"}, status=404)
        try:
            data = json.loads(JUDGE_RESPONSES_PATH.read_text(encoding="utf-8"))
        except Exception as exc:
            return self._send_json({"error": f"failed to load judge data: {exc}"}, status=500)
        return self._send_json(data)

    def handle_repo(self, path: str):
        parts = path.split("/")
        if len(parts) < 4:
            return self._send_json({"error": "invalid repo path"}, status=400)
        repo_id = parts[3]
        suffix = "/".join(parts[4:]) if len(parts) > 4 else ""
        metrics_path = self.work_dir / "metrics" / f"{repo_id}.json"
        commits_path = self.work_dir / "metrics" / f"{repo_id}_commits.csv"
        ai_path = self.work_dir / "ai_outputs" / f"{repo_id}.txt"

        if suffix.startswith("metrics"):
            if not metrics_path.exists():
                return self._send_json({"error": "metrics not found"}, status=404)
            data = json.loads(metrics_path.read_text(encoding="utf-8"))
            return self._send_json(data)

        if suffix.startswith("commits"):
            if not commits_path.exists():
                return self._send_json({"error": "commits not found"}, status=404)
            commits = []
            with commits_path.open(newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    commits.append(row)
            return self._send_json({"rows": commits})

        if suffix.startswith("ai"):
            if not ai_path.exists():
                return self._send_text("AI output not found.", status=404)
            return self._send_text(ai_path.read_text(encoding="utf-8"))

        return self._send_json({"error": "unknown repo endpoint"}, status=404)


def run_server(work_dir: Path, static_dir: Path, port: int):
    handler = lambda *args, **kwargs: UiHandler(*args, work_dir=work_dir, static_dir=static_dir, **kwargs)
    httpd = HTTPServer(("0.0.0.0", port), handler)
    print(f"Serving UI at http://localhost:{port} (work dir: {work_dir})")
    httpd.serve_forever()


def main():
    parser = argparse.ArgumentParser(description="Serve local web UI for hackathon analyzer outputs.")
    parser.add_argument("--work-dir", default="work", help="Work directory containing metrics/summary/ai_outputs")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on")
    args = parser.parse_args()

    work_dir = Path(args.work_dir).resolve()
    static_dir = Path(__file__).resolve().parent / "static"
    run_server(work_dir, static_dir, args.port)


if __name__ == "__main__":
    main()
