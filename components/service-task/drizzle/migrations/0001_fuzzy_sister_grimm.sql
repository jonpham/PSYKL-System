ALTER TABLE "tasks" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "server_updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
UPDATE "tasks" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "updated_at" SET NOT NULL;
