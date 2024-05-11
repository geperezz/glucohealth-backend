DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('admin', 'nurse', 'patient');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text,
	"email" text NOT NULL,
	"phone_number" text,
	"national_id" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_national_id_unique" UNIQUE("national_id")
);
--> statement-breakpoint
DROP TABLE "nurses";--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_email_unique";--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_national_id_unique";--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "patients" ADD CONSTRAINT "patients_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN IF EXISTS "full_name";--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN IF EXISTS "email";--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN IF EXISTS "phone_number";--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN IF EXISTS "national_id";--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN IF EXISTS "password";