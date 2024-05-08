CREATE TABLE IF NOT EXISTS "nurses" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text NOT NULL,
	"national_id" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "nurses_national_id_unique" UNIQUE("national_id")
);
