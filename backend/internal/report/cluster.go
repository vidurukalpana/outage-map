package report

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"
)

// Largest map area accepted, in degrees per side.
const maxBBoxSpan = 10.0

type BBox struct {
	MinLng, MinLat, MaxLng, MaxLat float64
}

type Cluster struct {
	Type           string          `json:"type"`
	Lat            float64         `json:"lat"`
	Lng            float64         `json:"lng"`
	ReportCount    int             `json:"reportCount"`
	MeTooCount     int             `json:"meTooCount"`
	LastActivityAt time.Time       `json:"lastActivityAt"`
	Reports        json.RawMessage `json:"reports"`
}

func ParseBBox(s string) (BBox, error) {
	errFormat := errors.New("bbox must be minLng,minLat,maxLng,maxLat")
	parts := strings.Split(s, ",")
	if len(parts) != 4 {
		return BBox{}, errFormat
	}
	var v [4]float64
	for i, p := range parts {
		f, err := strconv.ParseFloat(strings.TrimSpace(p), 64)
		if err != nil {
			return BBox{}, errFormat
		}
		v[i] = f
	}
	b := BBox{MinLng: v[0], MinLat: v[1], MaxLng: v[2], MaxLat: v[3]}
	if b.MinLng >= b.MaxLng || b.MinLat >= b.MaxLat ||
		b.MinLng < -180 || b.MaxLng > 180 || b.MinLat < -90 || b.MaxLat > 90 {
		return BBox{}, errFormat
	}
	if b.MaxLng-b.MinLng > maxBBoxSpan || b.MaxLat-b.MinLat > maxBBoxSpan {
		return BBox{}, errors.New("bbox is too large")
	}
	return b, nil
}

// ParseTypes returns every type when s is empty.
func ParseTypes(s string) ([]string, error) {
	if s == "" {
		return []string{"power", "water", "internet", "road"}, nil
	}
	types := strings.Split(s, ",")
	for _, t := range types {
		if !validTypes[t] {
			return nil, errors.New("types must be one of power, water, internet, road")
		}
	}
	return types, nil
}

func (s *Store) Clusters(ctx context.Context, b BBox, types []string) ([]Cluster, error) {
	rows, err := s.pool.Query(ctx, `
		WITH active AS (
			SELECT id, type, note, location, me_too_count, created_at, last_activity_at
			FROM reports
			WHERE status = 'active'
				AND last_activity_at > now() - interval '24 hours'
				AND location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
				AND type = ANY($5)
		),
		clustered AS (
			SELECT *,
				ST_ClusterDBSCAN(ST_Transform(location, 3857), eps => 500, minpoints => 1)
					OVER (PARTITION BY type ORDER BY id) AS cluster_id
			FROM active
		),
		ranked AS (
			SELECT *,
				row_number() OVER (PARTITION BY type, cluster_id ORDER BY created_at DESC) AS rn
			FROM clustered
		)
		SELECT
			type,
			ST_Y(ST_Centroid(ST_Collect(location))),
			ST_X(ST_Centroid(ST_Collect(location))),
			count(*),
			sum(me_too_count),
			max(last_activity_at),
			json_agg(
				json_build_object('id', id, 'note', note, 'createdAt', created_at, 'meTooCount', me_too_count)
				ORDER BY created_at DESC
			) FILTER (WHERE rn <= 20)
		FROM ranked
		GROUP BY type, cluster_id
		ORDER BY count(*) DESC`,
		b.MinLng, b.MinLat, b.MaxLng, b.MaxLat, types,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	clusters := []Cluster{}
	for rows.Next() {
		var c Cluster
		if err := rows.Scan(&c.Type, &c.Lat, &c.Lng, &c.ReportCount, &c.MeTooCount, &c.LastActivityAt, &c.Reports); err != nil {
			return nil, err
		}
		clusters = append(clusters, c)
	}
	return clusters, rows.Err()
}
