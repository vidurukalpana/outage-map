package report

import (
	"context"
	"time"
)

type ResolvedReport struct {
	ID              string    `json:"id"`
	Type            string    `json:"type"`
	Lat             float64   `json:"lat"`
	Lng             float64   `json:"lng"`
	Note            *string   `json:"note"`
	MeTooCount      int       `json:"meTooCount"`
	CreatedAt       time.Time `json:"createdAt"`
	ResolvedAt      time.Time `json:"resolvedAt"`
	DurationMinutes int       `json:"durationMinutes"`
}

// Resolved lists reports fixed in the period, most recently fixed first.
func (s *Store) Resolved(ctx context.Context, days int, typ string) ([]ResolvedReport, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT
			id::text, type, ST_Y(location), ST_X(location), note, me_too_count,
			created_at, resolved_at,
			round(extract(epoch FROM resolved_at - created_at) / 60)::int
		FROM reports
		WHERE status = 'resolved'
			AND resolved_at > now() - make_interval(days => $1)
			AND ($2::text = '' OR type = $2)
		ORDER BY resolved_at DESC
		LIMIT 200`,
		days, typ,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reports := []ResolvedReport{}
	for rows.Next() {
		var r ResolvedReport
		if err := rows.Scan(&r.ID, &r.Type, &r.Lat, &r.Lng, &r.Note, &r.MeTooCount,
			&r.CreatedAt, &r.ResolvedAt, &r.DurationMinutes); err != nil {
			return nil, err
		}
		reports = append(reports, r)
	}
	return reports, rows.Err()
}
