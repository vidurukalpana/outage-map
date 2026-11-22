package ratelimit

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestMiddleware(t *testing.T) {
	limiter := New(t.Context(), Rule{Limit: 2, Window: time.Minute}, false)
	handler := limiter.Middleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Requests run in order, so each row depends on the rows before it.
	steps := []struct {
		name       string
		remoteAddr string
		wantStatus int
	}{
		{"first request allowed", "203.0.113.1:5000", http.StatusOK},
		{"second request allowed (at limit)", "203.0.113.1:5001", http.StatusOK},
		{"third request blocked", "203.0.113.1:5002", http.StatusTooManyRequests},
		{"other IP not affected", "198.51.100.9:6000", http.StatusOK},
	}

	for _, s := range steps {
		req := httptest.NewRequest(http.MethodGet, "/api/clusters", nil)
		req.RemoteAddr = s.remoteAddr
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != s.wantStatus {
			t.Fatalf("%s: status = %d, want %d", s.name, rec.Code, s.wantStatus)
		}
		if s.wantStatus == http.StatusTooManyRequests && rec.Header().Get("Retry-After") == "" {
			t.Errorf("%s: missing Retry-After header", s.name)
		}
	}
}
