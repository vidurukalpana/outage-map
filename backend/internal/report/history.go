package report

import (
	"context"
	"errors"
)

type CountByType struct {
	Power    int `json:"power"`
	Water    int `json:"water"`
	Internet int `json:"internet"`
	Road     int `json:"road"`
}

type HistorySquare struct {
	Lat                float64     `json:"lat"`
	Lng                float64     `json:"lng"`
	Count              int         `json:"count"`
	CountByType        CountByType `json:"countByType"`
	AvgDurationMinutes *int        `json:"avgDurationMinutes"`
}

var validDays = map[string]int{"": 30, "7": 7, "30": 30, "90": 90}

// ParseHistoryQuery returns the period in days plus the type filter ("" means all types).
func ParseHistoryQuery(days, typ string) (int, string, error) {
	d, ok := validDays[days]
	if !ok {
		return 0, "", errors.New("days must be 7, 30 or 90")
	}
	if typ != "" && !validTypes[typ] {
		return 0, "", errors.New("type must be one of power, water, internet, road")
	}
	return d, typ, nil
}

func (s *Store) History(ctx context.Context, days int, typ string) ([]HistorySquare, error) {
	rows, err := s.pool.Query(ctx, `
		WITH squared AS (
			SELECT
				ST_SnapToGrid(ST_Transform(location, 3857), 1000) AS square,
				type, created_at, resolved_at
			FROM reports
			WHERE created_at > now() - make_interval(days => $1)
				AND ($2::text = '' OR type = $2)
		)
		SELECT
			ST_Y(ST_Transform(square, 4326)),
			ST_X(ST_Transform(square, 4326)),
			count(*),
			count(*) FILTER (WHERE type = 'power'),
			count(*) FILTER (WHERE type = 'water'),
			count(*) FILTER (WHERE type = 'internet'),
			count(*) FILTER (WHERE type = 'road'),
			round(avg(extract(epoch FROM resolved_at - created_at) / 60))::int
		FROM squared
		GROUP BY square
		ORDER BY count(*) DESC
		LIMIT 100`,
		days, typ,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	squares := []HistorySquare{}
	for rows.Next() {
		var h HistorySquare
		c := &h.CountByType
		if err := rows.Scan(&h.Lat, &h.Lng, &h.Count, &c.Power, &c.Water, &c.Internet, &c.Road, &h.AvgDurationMinutes); err != nil {
			return nil, err
		}
		squares = append(squares, h)
	}
	return squares, rows.Err()
}
