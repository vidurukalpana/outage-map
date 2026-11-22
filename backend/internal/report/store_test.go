package report

import (
	"errors"
	"os"
	"slices"
	"strconv"
	"testing"

	"outage-map/backend/internal/db"
)

const (
	deviceA = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
	deviceB = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff"
)

// Box covering all test points (Colombo to Kandy).
var testBBox = BBox{MinLng: 79.5, MinLat: 6.5, MaxLng: 81.0, MaxLat: 7.5}

// newTestStore connects to TEST_DATABASE_URL with an empty reports table.
func newTestStore(t *testing.T) *Store {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL not set")
	}
	if err := db.Migrate(url); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	pool, err := db.NewPool(t.Context(), url, "Asia/Colombo")
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	if _, err := pool.Exec(t.Context(), "TRUNCATE reports CASCADE"); err != nil {
		t.Fatalf("truncate: %v", err)
	}
	return NewStore(pool)
}

func addReport(t *testing.T, s *Store, typ string, lat, lng float64) string {
	t.Helper()
	id, err := s.Create(t.Context(), NewReport{Type: typ, Lat: lat, Lng: lng, DeviceID: deviceA})
	if err != nil {
		t.Fatalf("create report: %v", err)
	}
	return id
}

func TestClustersGroupByDistanceAndType(t *testing.T) {
	s := newTestStore(t)
	addReport(t, s, "power", 6.927, 79.861) // three power reports within 300 m
	addReport(t, s, "power", 6.928, 79.862)
	addReport(t, s, "power", 6.929, 79.861)
	addReport(t, s, "power", 6.945, 79.861) // power report 2 km away
	addReport(t, s, "water", 6.927, 79.861) // water report at the same spot

	clusters, err := s.Clusters(t.Context(), testBBox, []string{"power", "water"})
	if err != nil {
		t.Fatalf("clusters: %v", err)
	}

	var got []string
	for _, c := range clusters {
		got = append(got, c.Type+":"+strconv.Itoa(c.ReportCount))
	}
	slices.Sort(got)
	want := []string{"power:1", "power:3", "water:1"}
	if !slices.Equal(got, want) {
		t.Errorf("clusters = %v, want %v", got, want)
	}
}

func TestClustersExcludeInactiveReports(t *testing.T) {
	s := newTestStore(t)
	addReport(t, s, "power", 6.927, 79.861)
	resolved := addReport(t, s, "power", 6.927, 79.861)
	stale := addReport(t, s, "power", 6.927, 79.861)

	if err := s.Resolve(t.Context(), resolved, deviceB); err != nil {
		t.Fatalf("resolve: %v", err)
	}
	if _, err := s.pool.Exec(t.Context(),
		"UPDATE reports SET last_activity_at = now() - interval '25 hours' WHERE id = $1", stale); err != nil {
		t.Fatalf("age report: %v", err)
	}

	clusters, err := s.Clusters(t.Context(), testBBox, []string{"power"})
	if err != nil {
		t.Fatalf("clusters: %v", err)
	}
	if len(clusters) != 1 || clusters[0].ReportCount != 1 {
		t.Errorf("clusters = %+v, want one cluster with 1 active report", clusters)
	}
}

func TestHistorySquareCounts(t *testing.T) {
	s := newTestStore(t)
	for range 5 {
		addReport(t, s, "power", 6.927, 79.861)
	}
	addReport(t, s, "water", 7.291, 80.633)

	squares, err := s.History(t.Context(), 30, "")
	if err != nil {
		t.Fatalf("history: %v", err)
	}
	if len(squares) != 2 || squares[0].Count != 5 || squares[1].Count != 1 {
		t.Errorf("square counts = %+v, want [5 1]", squares)
	}
}

func TestMeTooRejectsDuplicate(t *testing.T) {
	s := newTestStore(t)
	id := addReport(t, s, "power", 6.927, 79.861)

	if count, err := s.MeToo(t.Context(), id, deviceB); err != nil || count != 1 {
		t.Fatalf("first me too = (%d, %v), want (1, nil)", count, err)
	}
	if _, err := s.MeToo(t.Context(), id, deviceB); !errors.Is(err, ErrAlreadyVoted) {
		t.Errorf("second me too error = %v, want ErrAlreadyVoted", err)
	}
}
