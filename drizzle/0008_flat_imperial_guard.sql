ALTER TABLE "treatments" DROP CONSTRAINT "treatments_patient_id_patients_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatments" ADD CONSTRAINT "treatments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
