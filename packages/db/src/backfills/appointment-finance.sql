-- Backfill personnel profiles from the assignments already stored on appointments.
WITH candidates AS (
	SELECT master_id AS customer_id, 'master' AS type FROM appointment
	UNION ALL
	SELECT personnel_id AS customer_id, 'assistant' AS type FROM appointment_personnel
), deduplicated AS (
	SELECT customer_id,
		CASE WHEN MAX(CASE WHEN type = 'master' THEN 1 ELSE 0 END) = 1
			THEN 'master' ELSE 'assistant' END AS type
	FROM candidates
	GROUP BY customer_id
)
INSERT INTO personnel (id, customer_id, type, active)
SELECT lower(hex(randomblob(16))), customer_id, type, 1
FROM deduplicated
WHERE NOT EXISTS (
	SELECT 1 FROM personnel existing WHERE existing.customer_id = deduplicated.customer_id
);

-- Classify only unambiguous, sign-consistent legacy appointment movements.
UPDATE "transaction" AS t
SET movement_type = CASE
	WHEN t.amount > 0
		AND t.customer_id = a.client_id
		AND NOT EXISTS (
			SELECT 1 FROM appointment_personnel ap
			WHERE ap.appointment_id = a.id AND ap.personnel_id = t.customer_id
		)
		THEN 'received'
	WHEN t.amount < 0
		AND t.customer_id <> a.client_id
		AND (
			t.customer_id = a.master_id
			OR EXISTS (
				SELECT 1 FROM appointment_personnel ap
				WHERE ap.appointment_id = a.id AND ap.personnel_id = t.customer_id
			)
		)
		THEN 'personnel_allocation'
	ELSE t.movement_type
END
FROM appointment a
WHERE t.movement_type = 'legacy_unclassified'
	AND t.appointment_id = a.id
	AND t.customer_id IS NOT NULL
	AND (
		(t.amount > 0 AND t.customer_id = a.client_id AND NOT EXISTS (
			SELECT 1 FROM appointment_personnel ap
			WHERE ap.appointment_id = a.id AND ap.personnel_id = t.customer_id
		))
		OR
		(t.amount < 0 AND t.customer_id <> a.client_id AND (
			t.customer_id = a.master_id
			OR EXISTS (
				SELECT 1 FROM appointment_personnel ap
				WHERE ap.appointment_id = a.id AND ap.personnel_id = t.customer_id
			)
		))
	);
