const http = require("http");
const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const PORT = Number(process.env.PORT || 80);
const STATIC_DIR = process.env.STATIC_DIR || "/usr/share/api-gateway/html";

const ROUTES = [
  {
    prefix: "/api/auth/",
    route: "auth",
    backend: "auth-service",
    target: process.env.AUTH_SERVICE_URL || "http://auth-service.default.svc.cluster.local:3001",
  },
  {
    prefix: "/api/courses/",
    route: "courses",
    backend: "course-service",
    target: process.env.COURSE_SERVICE_URL || "http://course-service.default.svc.cluster.local:3002",
  },
  {
    prefix: "/api/registrations/",
    route: "registrations",
    backend: "registration-service",
    target: process.env.REGISTRATION_SERVICE_URL || "http://registration-service.default.svc.cluster.local:3003",
  },
  {
    prefix: "/api/notifications/",
    route: "notifications",
    backend: "notification-service",
    target: process.env.NOTIFICATION_SERVICE_URL || "http://notification-service.default.svc.cluster.local:3004",
  },
];

const HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
const requestCounters = new Map();
const durationHistograms = new Map();

function labelKey(labels) {
  return ["method", "route", "backend", "status_code"].map((key) => `${key}=${labels[key]}`).join("|");
}

function incRequest(labels) {
  const key = labelKey(labels);
  requestCounters.set(key, { labels, value: (requestCounters.get(key)?.value || 0) + 1 });
}

function observeDuration(labels, seconds) {
  const key = labelKey(labels);
  const existing = durationHistograms.get(key) || {
    labels,
    buckets: HISTOGRAM_BUCKETS.map(() => 0),
    count: 0,
    sum: 0,
  };

  existing.count += 1;
  existing.sum += seconds;
  HISTOGRAM_BUCKETS.forEach((bucket, index) => {
    if (seconds <= bucket) {
      existing.buckets[index] += 1;
    }
  });
  durationHistograms.set(key, existing);
}

function escapeLabelValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function formatLabels(labels, extra = {}) {
  return Object.entries({ ...labels, ...extra })
    .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
    .join(",");
}

function metricsResponse() {
  const lines = [
    "# HELP api_gateway_http_requests_total Total HTTP requests proxied by the API Gateway.",
    "# TYPE api_gateway_http_requests_total counter",
  ];

  for (const { labels, value } of requestCounters.values()) {
    lines.push(`api_gateway_http_requests_total{${formatLabels(labels)}} ${value}`);
  }

  lines.push(
    "# HELP api_gateway_http_request_duration_seconds HTTP proxy request duration in seconds.",
    "# TYPE api_gateway_http_request_duration_seconds histogram",
  );

  for (const histogram of durationHistograms.values()) {
    histogram.buckets.forEach((value, index) => {
      lines.push(
        `api_gateway_http_request_duration_seconds_bucket{${formatLabels(histogram.labels, { le: HISTOGRAM_BUCKETS[index] })}} ${value}`,
      );
    });
    lines.push(
      `api_gateway_http_request_duration_seconds_bucket{${formatLabels(histogram.labels, { le: "+Inf" })}} ${histogram.count}`,
    );
    lines.push(`api_gateway_http_request_duration_seconds_sum{${formatLabels(histogram.labels)}} ${histogram.sum}`);
    lines.push(`api_gateway_http_request_duration_seconds_count{${formatLabels(histogram.labels)}} ${histogram.count}`);
  }

  return `${lines.join("\n")}\n`;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };
  return types[ext] || "application/octet-stream";
}

function recordGatewayRequest(req, route, backend, statusCode, startedAt) {
  const labels = {
    method: req.method,
    route,
    backend,
    status_code: String(statusCode),
  };
  incRequest(labels);
  observeDuration(labels, (performance.now() - startedAt) / 1000);
}

function sendStatic(req, res) {
  const startedAt = performance.now();
  const parsedPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const normalized = path.normalize(parsedPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(STATIC_DIR, normalized);

  if (parsedPath === "/" || !path.extname(filePath)) {
    filePath = path.join(STATIC_DIR, "index.html");
  }

  if (!filePath.startsWith(path.resolve(STATIC_DIR))) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("forbidden\n");
    recordGatewayRequest(req, "frontend", "static", 403, startedAt);
    return;
  }

  fs.readFile(filePath, (err, body) => {
    if (err) {
      fs.readFile(path.join(STATIC_DIR, "index.html"), (fallbackErr, fallbackBody) => {
        if (fallbackErr) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("not found\n");
          recordGatewayRequest(req, "frontend", "static", 404, startedAt);
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(fallbackBody);
        recordGatewayRequest(req, "frontend", "static", 200, startedAt);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    res.end(body);
    recordGatewayRequest(req, "frontend", "static", 200, startedAt);
  });
}

function matchRoute(urlPath) {
  return ROUTES.find((route) => urlPath === route.prefix.slice(0, -1) || urlPath.startsWith(route.prefix));
}

function proxyRequest(req, res, route) {
  const startedAt = performance.now();
  const incomingUrl = new URL(req.url, "http://localhost");
  const targetUrl = new URL(route.target);
  const upstreamSuffix = incomingUrl.pathname === route.prefix.slice(0, -1)
    ? ""
    : incomingUrl.pathname.slice(route.prefix.length);
  const upstreamPath = `/${upstreamSuffix}${incomingUrl.search}`;

  const upstreamReq = http.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      method: req.method,
      path: upstreamPath,
      headers: {
        ...req.headers,
        host: targetUrl.host,
        "x-forwarded-for": [req.headers["x-forwarded-for"], req.socket.remoteAddress].filter(Boolean).join(", "),
        "x-forwarded-proto": "http",
      },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
      upstreamRes.on("end", () => {
        recordGatewayRequest(req, route.route, route.backend, upstreamRes.statusCode || 502, startedAt);
      });
    },
  );

  upstreamReq.on("error", () => {
    recordGatewayRequest(req, route.route, route.backend, 502, startedAt);
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("bad gateway\n");
  });

  req.pipe(upstreamReq);
}

const server = http.createServer((req, res) => {
  const urlPath = new URL(req.url, "http://localhost").pathname;

  if (urlPath.startsWith("/api/courses")) {
  const startedAt = performance.now();
  recordGatewayRequest(req, "courses", "course-service", 500, startedAt);
  res.writeHead(500, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "demo canary failure" }));
  return;
}
  
  if (urlPath === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok\n");
    return;
  }

  if (urlPath === "/metrics") {
    res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" });
    res.end(metricsResponse());
    return;
  }

  const route = matchRoute(urlPath);
  if (route) {
    proxyRequest(req, res, route);
    return;
  }

  sendStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`api-gateway listening on ${PORT}-demo rollback`);
});