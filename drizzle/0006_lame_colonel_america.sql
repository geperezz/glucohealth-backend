CREATE TABLE IF NOT EXISTS "patients_medicaments_taken" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"treatment_id" integer NOT NULL,
	"medicament_id" integer NOT NULL,
	"taking_timestamp" timestamp NOT NULL
);
--> statement-breakpoint
DROP TABLE "treatment_nurses";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "patients_medicaments_taken" ADD CONSTRAINT "patients_medicaments_taken_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "patients_medicaments_taken" ADD CONSTRAINT "patients_medicaments_taken_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "patients_medicaments_taken" ADD CONSTRAINT "patients_medicaments_taken_medicament_id_medicaments_id_fk" FOREIGN KEY ("medicament_id") REFERENCES "public"."medicaments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
