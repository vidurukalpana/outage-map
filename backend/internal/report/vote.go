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

// lockActive locks the report row so parallel votes on it run one at a time.
func lockActive(ctx context.Context, tx pgx.Tx, reportID string) error {
	var found bool
	err := tx.QueryRow(ctx, `
		SELECT true FROM reports
		WHERE id = $1
			AND status = 'active'
			AND last_activity_at > now() - interval '24 hours'
		FOR UPDATE`,
		reportID,
	).Scan(&found)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotActive
	}
	return err
}

func (s *Store) MeToo(ctx context.Context, reportID, deviceID string) (int, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	if err := lockActive(ctx, tx, reportID); err != nil {
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

func (s *Store) Resolve(ctx context.Context, reportID, deviceID string) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if err := lockActive(ctx, tx, reportID); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO report_votes (report_id, device_id, kind)
		VALUES ($1, $2, 'resolve')`,
		reportID, deviceID,
	); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE reports
		SET status = 'resolved', resolved_at = now()
		WHERE id = $1`,
		reportID,
	); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
