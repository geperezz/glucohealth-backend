CREATE TABLE IF NOT EXISTS "medicaments_presentations" (
	"medicament_id" integer NOT NULL,
	"presentation" text NOT NULL,
	CONSTRAINT "medicaments_presentations_medicament_id_presentation_pk" PRIMARY KEY("medicament_id","presentation")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "medicaments_side_effects" (
	"medicament_id" integer NOT NULL,
	"side_effect" text NOT NULL,
	CONSTRAINT "medicaments_side_effects_medicament_id_side_effect_pk" PRIMARY KEY("medicament_id","side_effect")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "medicaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeName" text,
	"genericName" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "medicaments_tradeName_genericName_unique" UNIQUE NULLS NOT DISTINCT("tradeName","genericName")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medicaments_presentations" ADD CONSTRAINT "medicaments_presentations_medicament_id_medicaments_id_fk" FOREIGN KEY ("medicament_id") REFERENCES "medicaments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medicaments_side_effects" ADD CONSTRAINT "medicaments_side_effects_medicament_id_medicaments_id_fk" FOREIGN KEY ("medicament_id") REFERENCES "medicaments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
