CREATE TABLE IF NOT EXISTS "treatments_medicaments_taking_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"treatment_medicament_id" integer NOT NULL,
	"taking_schedule" text NOT NULL,
	CONSTRAINT "treatment_medicament_taking_schedule_natural_primary_key" UNIQUE("treatment_medicament_id","taking_schedule")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "treatments_medicaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"treatment_id" integer NOT NULL,
	"medicament_id" integer NOT NULL,
	"taking_schedule_starting_timestamp" timestamp NOT NULL,
	"taking_schedule_ending_timestamp" timestamp DEFAULT NULL,
	"deleted_at" timestamp DEFAULT NULL,
	CONSTRAINT "treatment_medicament_natural_primary_key" UNIQUE NULLS NOT DISTINCT("treatment_id","medicament_id","deleted_at")
);
--> statement-breakpoint
DROP TABLE "treatment_medicaments";--> statement-breakpoint
ALTER TABLE "treatments" ADD COLUMN "deleted_at" timestamp DEFAULT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatments_medicaments_taking_schedules" ADD CONSTRAINT "treatments_medicaments_taking_schedules_treatment_medicament_id_treatments_medicaments_id_fk" FOREIGN KEY ("treatment_medicament_id") REFERENCES "public"."treatments_medicaments"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatments_medicaments" ADD CONSTRAINT "treatments_medicaments_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatments_medicaments" ADD CONSTRAINT "treatments_medicaments_medicament_id_medicaments_id_fk" FOREIGN KEY ("medicament_id") REFERENCES "public"."medicaments"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "treatments" DROP COLUMN IF EXISTS "created_at";