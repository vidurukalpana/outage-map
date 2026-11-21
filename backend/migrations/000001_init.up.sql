CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('power', 'water', 'internet', 'road')),
    note text CHECK (char_length(note) <= 140),
    location geometry(Point, 4326) NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    me_too_count int NOT NULL DEFAULT 0,
    device_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_activity_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);

CREATE INDEX reports_location_idx ON reports USING GIST (location);
CREATE INDEX reports_status_activity_idx ON reports (status, last_activity_at);

CREATE TABLE report_votes (
    report_id uuid REFERENCES reports (id) ON DELETE CASCADE,
    device_id uuid NOT NULL,
    kind text NOT NULL CHECK (kind IN ('me_too', 'resolve')),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (report_id, device_id, kind)
);
