from main import _http_metric_queries


def test_gateway_queries_use_api_gateway_service_labels():
    queries = _http_metric_queries("gateway", "default", "api-gateway-canary", "api-gateway-stable")
    joined = "\n".join(query for query, _ in queries)

    assert "api_gateway_http_requests_total" in joined
    assert "api_gateway_http_request_duration_seconds_bucket" in joined
    assert 'service="api-gateway-canary"' in joined
    assert 'service="api-gateway-stable"' in joined
    assert 'status_code=~"5.."' in joined


def test_app_queries_use_uit_course_metric_names():
    queries = _http_metric_queries("app", "default", "api-gateway-canary", "api-gateway-stable")
    joined = "\n".join(query for query, _ in queries)

    assert "uit_course_http_requests_total" in joined
    assert "uit_course_http_request_duration_seconds_bucket" in joined
    assert 'status_code=~"5.."' in joined
