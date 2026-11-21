package config

import (
	"errors"
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	AppTimezone string
}

func Load() (Config, error) {
	cfg := Config{
		Port:        os.Getenv("PORT"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		AppTimezone: os.Getenv("APP_TIMEZONE"),
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.AppTimezone == "" {
		cfg.AppTimezone = "Asia/Colombo"
	}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	return cfg, nil
}
