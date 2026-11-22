package report

import (
	"strings"
	"testing"
)

func TestValidateCreate(t *testing.T) {
	const device = "3f6c1a2e-8b4d-4c1f-9e2a-7d5b6c8e9f01"

	tests := []struct {
		name     string
		req      CreateRequest
		deviceID string
		wantErr  string
	}{
		{"valid report", CreateRequest{Type: "power", Lat: 6.927149, Lng: 79.861244, Note: " dark "}, device, ""},
		{"outside Sri Lanka", CreateRequest{Type: "power", Lat: 13.0827, Lng: 80.2707}, device, "location must be inside Sri Lanka"},
		{"unknown type", CreateRequest{Type: "gas", Lat: 6.93, Lng: 79.86}, device, "type must be one of power, water, internet, road"},
		{"note too long", CreateRequest{Type: "road", Lat: 6.93, Lng: 79.86, Note: strings.Repeat("a", 141)}, device, "note must be at most 140 characters"},
		{"invalid device ID", CreateRequest{Type: "power", Lat: 6.93, Lng: 79.86}, "not-a-uuid", "X-Device-Id must be a valid UUID"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ValidateCreate(tt.req, tt.deviceID)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Fatalf("error = %v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.Lat != 6.927 || got.Lng != 79.861 {
				t.Errorf("location = (%v, %v), want rounded to (6.927, 79.861)", got.Lat, got.Lng)
			}
			if got.Note == nil || *got.Note != "dark" {
				t.Errorf("note = %v, want trimmed \"dark\"", got.Note)
			}
		})
	}
}
