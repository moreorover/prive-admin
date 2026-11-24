INSERT INTO `personnel` (`id`, `customer_id`, `type`)
SELECT lower(hex(randomblob(16))), `master_id`, 'master'
FROM `appointment`
GROUP BY `master_id`
ON CONFLICT (`customer_id`) DO NOTHING;
--> statement-breakpoint
INSERT INTO `personnel` (`id`, `customer_id`, `type`)
SELECT lower(hex(randomblob(16))), `appointment_personnel`.`personnel_id`, 'assistant'
FROM `appointment_personnel`
WHERE NOT EXISTS (
  SELECT 1
  FROM `personnel`
  WHERE `personnel`.`customer_id` = `appointment_personnel`.`personnel_id`
)
GROUP BY `appointment_personnel`.`personnel_id`;
