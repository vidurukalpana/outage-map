package report

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

var (
	ErrNotActive    = errors.New("Report is no longer active")
	ErrAlreadyVoted = errors.New("Already added")
)

func (s *Store) MeToo(ctx context.Context, reportID, deviceID string) (int, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	// Lock the row so a parallel resolve cannot slip in before the update.
	var found bool
	err = tx.QueryRow(ctx, `
		SELECT true FROM reports
		WHERE id = $1
			AND status = 'active'
			AND last_activity_at > now() - interval '24 hours'
		FOR UPDATE`,
		reportID,
	).Scan(&found)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNotActive
	}
	if err != nil {
		return 0, err
	}

	tag, err := tx.Exec(ctx, `
		INSERT INTO report_votes (report_id, device_id, kind)
		VALUES ($1, $2, 'me_too')
		ON CONFLICT DO NOTHING`,
		reportID, deviceID,
	)
	if err != nil {
		return 0, err
	}
	if tag.RowsAffected() == 0 {
		return 0, ErrAlreadyVoted
	}

	var count int
	err = tx.QueryRow(ctx, `
		UPDATE reports
		SET me_too_count = me_too_count + 1, last_activity_at = now()
		WHERE id = $1
		RETURNING me_too_count`,
		reportID,
	).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, tx.Commit(ctx)
}
