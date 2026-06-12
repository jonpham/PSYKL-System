ALTER TABLE "idempotency" ALTER COLUMN "status_code" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "idempotency" ALTER COLUMN "response_body" DROP NOT NULL;
