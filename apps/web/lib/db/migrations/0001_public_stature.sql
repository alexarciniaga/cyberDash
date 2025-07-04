CREATE TABLE IF NOT EXISTS "data_ingestion_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"last_successful_run" timestamp,
	"last_modified_timestamp" timestamp,
	"last_record_id" text,
	"configuration_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "data_ingestion_state_source_unique" UNIQUE("source")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingestion_state_source_idx" ON "data_ingestion_state" USING btree ("source");