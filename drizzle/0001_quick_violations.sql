CREATE TABLE IF NOT EXISTS "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text,
	"email" text NOT NULL,
	"phone_number" text,
	"national_id" text NOT NULL,
	"age" integer,
	"weight_in_kg" integer,
	"height_in_cm" integer,
	"password" text NOT NULL,
	CONSTRAINT "patients_email_unique" UNIQUE("email"),
	CONSTRAINT "patients_national_id_unique" UNIQUE("national_id")
);
--> statement-breakpoint
ALTER TABLE "nurses" ADD CONSTRAINT "nurses_email_unique" UNIQUE("email");