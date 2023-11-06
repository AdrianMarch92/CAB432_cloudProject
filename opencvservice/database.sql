CREATE SCHEMA public AUTHORIZATION pg_database_owner;

CREATE TABLE public.camera_config (
	cameraid int4 NOT NULL,
	status bool NULL DEFAULT false,
	CONSTRAINT camera_config_un UNIQUE (cameraid)
);
CREATE TABLE public.traffic_volume (
	recorded_timestamp timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	cameraid int4 NOT NULL,
	cars int4 NULL,
	buses int4 NULL,
	trucks int4 NULL,
	motorbikes int4 NULL
);
