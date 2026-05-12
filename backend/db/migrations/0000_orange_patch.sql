CREATE TABLE IF NOT EXISTS `rate_limits` (
	`ip` text NOT NULL,
	`attempted_at` integer NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_rate_limits_ip` ON `rate_limits` (`ip`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_rate_limits_blocked` ON `rate_limits` (`blocked_until`);
