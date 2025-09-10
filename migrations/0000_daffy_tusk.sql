CREATE TABLE "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "estimations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar,
	"property_type" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"surface" integer NOT NULL,
	"rooms" integer NOT NULL,
	"estimated_value" numeric(10, 2) NOT NULL,
	"price_per_m2" numeric(8, 2) NOT NULL,
	"confidence" integer NOT NULL,
	"methodology" text,
	"comparable_properties" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"property_type" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"surface" integer,
	"rooms" integer,
	"bedrooms" integer,
	"bathrooms" integer,
	"has_garden" boolean DEFAULT false,
	"has_parking" boolean DEFAULT false,
	"has_balcony" boolean DEFAULT false,
	"construction_year" integer,
	"estimated_value" numeric(10, 2),
	"source" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "estimations" ADD CONSTRAINT "estimations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;