type HttpRequest = {
  method?: string;
  path?: string;
  originalUrl?: string;
  url?: string;
  baseUrl?: string;
  route?: { path?: unknown };
};

type HttpResponse = {
  statusCode?: number;
  on(event: 'finish', listener: () => void): void;
};

type NextFunction = () => void;

class MetricsRegistry {
  private readonly serviceName = process.env.SERVICE_NAME || 'uit-course-service';
  private readonly buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  private readonly requests = new Map<string, number>();
  private readonly durationBuckets = new Map<string, number[]>();
  private readonly durationSum = new Map<string, number>();
  private readonly durationCount = new Map<string, number>();

  observeHttpRequest(method: string, route: string, statusCode: number, seconds: number): void {
    const key = this.key(method, route, String(statusCode));
    this.requests.set(key, (this.requests.get(key) || 0) + 1);
    this.durationSum.set(key, (this.durationSum.get(key) || 0) + seconds);
    this.durationCount.set(key, (this.durationCount.get(key) || 0) + 1);

    const counts = this.durationBuckets.get(key) || new Array(this.buckets.length + 1).fill(0);
    this.buckets.forEach((bucket, index) => {
      if (seconds <= bucket) {
        counts[index] += 1;
      }
    });
    counts[this.buckets.length] += 1;
    this.durationBuckets.set(key, counts);
  }

  render(): string {
    const lines: string[] = [
      '# HELP uit_course_http_requests_total Total HTTP requests handled by a service.',
      '# TYPE uit_course_http_requests_total counter',
    ];

    for (const [key, value] of this.sortedEntries(this.requests)) {
      lines.push(`uit_course_http_requests_total{${this.labels(key)}} ${value}`);
    }

    lines.push(
      '# HELP uit_course_http_request_duration_seconds HTTP request duration in seconds.',
      '# TYPE uit_course_http_request_duration_seconds histogram',
    );

    for (const [key, counts] of this.sortedEntries(this.durationBuckets)) {
      this.buckets.forEach((bucket, index) => {
        lines.push(
          `uit_course_http_request_duration_seconds_bucket{${this.labels(key)},le="${bucket}"} ${counts[index]}`,
        );
      });
      lines.push(
        `uit_course_http_request_duration_seconds_bucket{${this.labels(key)},le="+Inf"} ${counts[this.buckets.length]}`,
      );
      lines.push(`uit_course_http_request_duration_seconds_sum{${this.labels(key)}} ${this.durationSum.get(key) || 0}`);
      lines.push(`uit_course_http_request_duration_seconds_count{${this.labels(key)}} ${this.durationCount.get(key) || 0}`);
    }

    const memory = process.memoryUsage();
    lines.push(
      '# HELP uit_course_nodejs_memory_bytes Node.js memory usage by service.',
      '# TYPE uit_course_nodejs_memory_bytes gauge',
      `uit_course_nodejs_memory_bytes{service="${this.escape(this.serviceName)}",type="rss"} ${memory.rss}`,
      `uit_course_nodejs_memory_bytes{service="${this.escape(this.serviceName)}",type="heap_total"} ${memory.heapTotal}`,
      `uit_course_nodejs_memory_bytes{service="${this.escape(this.serviceName)}",type="heap_used"} ${memory.heapUsed}`,
      '',
    );

    return lines.join('\n');
  }

  private key(method: string, route: string, statusCode: string): string {
    return [method, route, statusCode].join('\t');
  }

  private labels(key: string): string {
    const [method, route, statusCode] = key.split('\t');
    return [
      `service="${this.escape(this.serviceName)}"`,
      `method="${this.escape(method)}"`,
      `route="${this.escape(route)}"`,
      `status_code="${this.escape(statusCode)}"`,
    ].join(',');
  }

  private sortedEntries<T>(map: Map<string, T>): [string, T][] {
    return Array.from(map.entries()).sort(([left], [right]) => left.localeCompare(right));
  }

  private escape(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}

export const metricsRegistry = new MetricsRegistry();

export function createMetricsMiddleware() {
  return (req: HttpRequest, res: HttpResponse, next: NextFunction): void => {
    if ((req.path || req.url) === '/metrics') {
      next();
      return;
    }

    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
      metricsRegistry.observeHttpRequest(
        req.method || 'UNKNOWN',
        routeName(req),
        res.statusCode || 0,
        durationSeconds,
      );
    });
    next();
  };
}

function routeName(req: HttpRequest): string {
  const routePath = typeof req.route?.path === 'string' ? req.route.path : req.path || req.originalUrl || req.url || 'unknown';
  const path = `${req.baseUrl || ''}${routePath}`.split('?')[0] || '/';
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}
