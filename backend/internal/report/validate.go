package report

import (
	"errors"
	"math"
	"regexp"
	"strings"
	"unicode/utf8"
)

// Sri Lanka bounding box.
const (
	minLat = 5.8
	maxLat = 10.0
	minLng = 79.5
	maxLng = 82.0
)

const maxNoteLength = 140

var (
	validTypes  = map[string]bool{"power": true, "water": true, "internet": true, "road": true}
	uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)
)

type CreateRequest struct {
	Type string  `json:"type"`
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
	Note string  `json:"note"`
}

type NewReport struct {
	Type     string
	Lat      float64
	Lng      float64
	Note     *string
	DeviceID string
}

func ValidateDeviceID(id string) error {
	if !uuidPattern.MatchString(id) {
		return errors.New("X-Device-Id must be a valid UUID")
	}
	return nil
}

func ValidateCreate(req CreateRequest, deviceID string) (NewReport, error) {
	if err := ValidateDeviceID(deviceID); err != nil {
		return NewReport{}, err
	}
	if !validTypes[req.Type] {
		return NewReport{}, errors.New("type must be one of power, water, internet, road")
	}
	if req.Lat < minLat || req.Lat > maxLat || req.Lng < minLng || req.Lng > maxLng {
		return NewReport{}, errors.New("location must be inside Sri Lanka")
	}

	note := strings.TrimSpace(req.Note)
	if utf8.RuneCountInString(note) > maxNoteLength {
		return NewReport{}, errors.New("note must be at most 140 characters")
	}

	r := NewReport{
		Type:     req.Type,
		Lat:      round3(req.Lat),
		Lng:      round3(req.Lng),
		DeviceID: deviceID,
	}
	if note != "" {
		r.Note = &note
	}
	return r, nil
}

// round3 keeps 3 decimals (~100 m) so no exact home location is stored.
func round3(v float64) float64 {
	return math.Round(v*1000) / 1000
}
