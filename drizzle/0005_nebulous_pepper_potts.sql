CREATE TABLE IF NOT EXISTS "treatment_medicaments" (
	"treatment_id" integer NOT NULL,
	"medicament_id" integer NOT NULL,
	"taking_schedule" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_medicaments_treatment_id_medicament_id_pk" PRIMARY KEY("treatment_id","medicament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "treatment_nurses" (
	"treatment_id" integer NOT NULL,
	"nurse_id" integer NOT NULL,
	CONSTRAINT "treatment_nurses_treatment_id_nurse_id_pk" PRIMARY KEY("treatment_id","nurse_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "treatments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatment_medicaments" ADD CONSTRAINT "treatment_medicaments_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatment_medicaments" ADD CONSTRAINT "treatment_medicaments_medicament_id_medicaments_id_fk" FOREIGN KEY ("medicament_id") REFERENCES "public"."medicaments"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatment_nurses" ADD CONSTRAINT "treatment_nurses_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatment_nurses" ADD CONSTRAINT "treatment_nurses_nurse_id_users_id_fk" FOREIGN KEY ("nurse_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatments" ADD CONSTRAINT "treatments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
