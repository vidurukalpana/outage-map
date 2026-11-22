package config

import (
	"errors"
	"os"
	"strconv"
)

type Config struct {
	Port        string
	DatabaseURL string
	AppTimezone string
	TrustProxy  bool
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
	if v := os.Getenv("TRUST_PROXY"); v != "" {
		trust, err := strconv.ParseBool(v)
		if err != nil {
			return Config{}, errors.New("TRUST_PROXY must be true or false")
		}
		cfg.TrustProxy = trust
	}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	return cfg, nil
}
