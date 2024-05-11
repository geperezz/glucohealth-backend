ALTER TABLE "medicaments_presentations" DROP CONSTRAINT "medicaments_presentations_medicament_id_medicaments_id_fk";
--> statement-breakpoint
ALTER TABLE "medicaments_side_effects" DROP CONSTRAINT "medicaments_side_effects_medicament_id_medicaments_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medicaments_presentations" ADD CONSTRAINT "medicaments_presentations_medicament_id_medicaments_id_fk" FOREIGN KEY ("medicament_id") REFERENCES "public"."medicaments"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medicaments_side_effects" ADD CONSTRAINT "medicaments_side_effects_medicament_id_medicaments_id_fk" FOREIGN KEY ("medicament_id") REFERENCES "public"."medicaments"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
