package report

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) Create(ctx context.Context, r NewReport) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `
		INSERT INTO reports (type, note, location, device_id)
		VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5)
		RETURNING id::text`,
		r.Type, r.Note, r.Lng, r.Lat, r.DeviceID,
	).Scan(&id)
	return id, err
}
