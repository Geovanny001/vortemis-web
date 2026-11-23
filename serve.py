import http.client
import http.server
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(os.getenv("PORT", "8080"))
UPSTREAM_HOST = os.getenv("VORTEMIS_API_HOST", "127.0.0.1")
UPSTREAM_PORT = int(os.getenv("VORTEMIS_API_PORT", "8000"))

HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _is_api(self) -> bool:
        return self.path.startswith("/v1/")

    def _proxy(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None

        headers = {
            key: value
            for key, value in self.headers.items()
            if key.lower() not in HOP_BY_HOP | {"host", "content-length"}
        }

        connection = http.client.HTTPConnection(
            UPSTREAM_HOST, UPSTREAM_PORT, timeout=60
        )
        try:
            connection.request(self.command, self.path, body=body, headers=headers)
            response = connection.getresponse()
            payload = response.read()
            status, reason = response.status, response.reason
            response_headers = response.getheaders()
        except OSError:
            self.send_error(502, "API upstream unavailable")
            return
        finally:
            connection.close()

        self.send_response(status, reason)
        for key, value in response_headers:
            if key.lower() not in HOP_BY_HOP | {"content-length"}:
                self.send_header(key, value)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(payload)

    def do_GET(self) -> None:
        if self._is_api():
            self._proxy()
        else:
            super().do_GET()

    def do_HEAD(self) -> None:
        if self._is_api():
            self._proxy()
        else:
            super().do_HEAD()

    def do_POST(self) -> None:
        if self._is_api():
            self._proxy()
        else:
            self.send_error(405, "Method not allowed")

    def do_PUT(self) -> None:
        if self._is_api():
            self._proxy()
        else:
            self.send_error(405, "Method not allowed")

    def do_DELETE(self) -> None:
        if self._is_api():
            self._proxy()
        else:
            self.send_error(405, "Method not allowed")

    def do_OPTIONS(self) -> None:
        if self._is_api():
            self._proxy()
        else:
            self.send_error(405, "Method not allowed")


if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(
        f"serving {ROOT} on http://localhost:{PORT} "
        f"(api -> {UPSTREAM_HOST}:{UPSTREAM_PORT})"
    )
    server.serve_forever()
