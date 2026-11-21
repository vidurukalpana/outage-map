package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "time/tzdata"

	"github.com/go-chi/chi/v5"

	"outage-map/backend/internal/config"
	"outage-map/backend/internal/db"
	"outage-map/backend/internal/httpx"
	"outage-map/backend/internal/report"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	// API timestamps use this zone, since pgx returns times in time.Local.
	loc, err := time.LoadLocation(cfg.AppTimezone)
	if err != nil {
		log.Fatalf("APP_TIMEZONE: %v", err)
	}
	time.Local = loc

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.NewPool(ctx, cfg.DatabaseURL, cfg.AppTimezone)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(cfg.DatabaseURL); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	reports := report.NewHandler(report.NewStore(pool))

	r := chi.NewRouter()
	r.Get("/health", health)
	r.Post("/api/reports", reports.Create)
	r.Get("/api/clusters", reports.Clusters)
	r.Post("/api/reports/{id}/me-too", reports.MeToo)
	r.Post("/api/reports/{id}/resolve", reports.Resolve)

	srv := &http.Server{
		Addr:    "0.0.0.0:" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	<-ctx.Done()
	log.Print("shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}

// health never touches the database so sleeping Neon is not woken by uptime pings.
func health(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
