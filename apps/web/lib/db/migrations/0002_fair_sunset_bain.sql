CREATE TABLE IF NOT EXISTS "dashboard_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"user_id" text,
	"permission" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dashboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"layout" jsonb NOT NULL,
	"widgets" jsonb NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dashboard_permissions" ADD CONSTRAINT "dashboard_permissions_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dashboard_permissions_dashboard_id_idx" ON "dashboard_permissions" USING btree ("dashboard_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dashboard_permissions_user_id_idx" ON "dashboard_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dashboard_name_idx" ON "dashboards" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dashboard_is_default_idx" ON "dashboards" USING btree ("is_default");