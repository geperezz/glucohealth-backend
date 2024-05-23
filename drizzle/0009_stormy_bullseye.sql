ALTER TABLE "patients" ADD COLUMN "birthdate" timestamp;--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN IF EXISTS "age";