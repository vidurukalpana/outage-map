package ratelimit

import (
	"context"
	"math"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"

	"outage-map/backend/internal/httpx"
)

const (
	idleTimeout     = 10 * time.Minute
	cleanupInterval = time.Minute
)

// Rule allows Limit requests per Window, refilled evenly over the window.
type Rule struct {
	Limit  int
	Window time.Duration
}

var (
	Create = Rule{Limit: 5, Window: 10 * time.Minute}
	Votes  = Rule{Limit: 20, Window: 10 * time.Minute}
	Reads  = Rule{Limit: 120, Window: time.Minute}
)

type entry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// Limiter tracks one token bucket per client IP, held only in memory.
type Limiter struct {
	rule       Rule
	trustProxy bool

	mu      sync.Mutex
	entries map[string]*entry
}

// New starts a limiter whose cleanup goroutine stops when ctx is done.
func New(ctx context.Context, rule Rule, trustProxy bool) *Limiter {
	l := &Limiter{
		rule:       rule,
		trustProxy: trustProxy,
		entries:    make(map[string]*entry),
	}
	go l.cleanup(ctx)
	return l
}

func (l *Limiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		now := time.Now()
		res := l.get(l.clientIP(r), now).ReserveN(now, 1)
		if delay := res.DelayFrom(now); delay > 0 {
			res.CancelAt(now)
			seconds := int(math.Ceil(delay.Seconds()))
			w.Header().Set("Retry-After", strconv.Itoa(seconds))
			httpx.WriteError(w, http.StatusTooManyRequests, "Too many requests, try again in a few minutes")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (l *Limiter) get(ip string, now time.Time) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()

	e, ok := l.entries[ip]
	if !ok {
		every := rate.Every(l.rule.Window / time.Duration(l.rule.Limit))
		e = &entry{limiter: rate.NewLimiter(every, l.rule.Limit)}
		l.entries[ip] = e
	}
	e.lastSeen = now
	return e.limiter
}

func (l *Limiter) cleanup(ctx context.Context) {
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			l.mu.Lock()
			for ip, e := range l.entries {
				if now.Sub(e.lastSeen) > idleTimeout {
					delete(l.entries, ip)
				}
			}
			l.mu.Unlock()
		}
	}
}

// clientIP trusts X-Forwarded-For only behind a known proxy, since clients can forge it.
func (l *Limiter) clientIP(r *http.Request) string {
	if l.trustProxy {
		first, _, _ := strings.Cut(r.Header.Get("X-Forwarded-For"), ",")
		if ip := strings.TrimSpace(first); ip != "" {
			return ip
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
