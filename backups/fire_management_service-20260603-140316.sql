--
-- PostgreSQL database dump
--

\restrict e5ulASfzQH7f61zTxSfH1AwIFORGWCfeLxZtFne3j63BgCUwqQjgfgL5WP4eJYk

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_inspection_id_inspections_id_fk;
ALTER TABLE IF EXISTS ONLY public.maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_extinguisher_id_extinguishers_id_fk;
ALTER TABLE IF EXISTS ONLY public.inspections DROP CONSTRAINT IF EXISTS inspections_extinguisher_id_extinguishers_id_fk;
ALTER TABLE IF EXISTS ONLY public.maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.inspections DROP CONSTRAINT IF EXISTS inspections_pkey;
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS extinguishers_serial_number_unique;
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS extinguishers_pkey;
ALTER TABLE IF EXISTS ONLY drizzle.__drizzle_migrations DROP CONSTRAINT IF EXISTS __drizzle_migrations_pkey;
ALTER TABLE IF EXISTS drizzle.__drizzle_migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.maintenance_logs;
DROP TABLE IF EXISTS public.inspections;
DROP TABLE IF EXISTS public.extinguishers;
DROP SEQUENCE IF EXISTS drizzle.__drizzle_migrations_id_seq;
DROP TABLE IF EXISTS drizzle.__drizzle_migrations;
DROP TYPE IF EXISTS public.inspection_status;
DROP TYPE IF EXISTS public.inspection_result;
DROP TYPE IF EXISTS public.extinguisher_type;
DROP TYPE IF EXISTS public.extinguisher_status;
DROP TYPE IF EXISTS public.extinguisher_size;
DROP SCHEMA IF EXISTS drizzle;
--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

--
-- Name: extinguisher_size; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.extinguisher_size AS ENUM (
    '2.5lb',
    '5lb',
    '9lb',
    '12lb'
);


ALTER TYPE public.extinguisher_size OWNER TO postgres;

--
-- Name: extinguisher_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.extinguisher_status AS ENUM (
    'active',
    'maintenance',
    'expired',
    'decommissioned'
);


ALTER TYPE public.extinguisher_status OWNER TO postgres;

--
-- Name: extinguisher_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.extinguisher_type AS ENUM (
    'water',
    'co2',
    'foam',
    'dry_chemical'
);


ALTER TYPE public.extinguisher_type OWNER TO postgres;

--
-- Name: inspection_result; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inspection_result AS ENUM (
    'pass',
    'fail',
    'needs_maintenance'
);


ALTER TYPE public.inspection_result OWNER TO postgres;

--
-- Name: inspection_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inspection_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled'
);


ALTER TYPE public.inspection_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: extinguishers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extinguishers (
    id text NOT NULL,
    serial_number text NOT NULL,
    location text NOT NULL,
    type public.extinguisher_type NOT NULL,
    size public.extinguisher_size NOT NULL,
    installation_date date NOT NULL,
    expiry_date date NOT NULL,
    status public.extinguisher_status DEFAULT 'active'::public.extinguisher_status NOT NULL,
    created_by text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.extinguishers OWNER TO postgres;

--
-- Name: inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspections (
    id text NOT NULL,
    extinguisher_id text NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time text,
    status public.inspection_status DEFAULT 'scheduled'::public.inspection_status NOT NULL,
    result public.inspection_result,
    notes text,
    scheduled_by text,
    inspector_id text,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inspections OWNER TO postgres;

--
-- Name: maintenance_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_logs (
    id text NOT NULL,
    extinguisher_id text NOT NULL,
    inspection_id text,
    action_taken text NOT NULL,
    maintenance_date date NOT NULL,
    issues_identified text,
    notes text,
    inspector_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.maintenance_logs OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	ddae560d512ef7c796b960079a0c38e3e63eee15ab32d6bdc0bbeb3746ab1588	1780473205963
\.


--
-- Data for Name: extinguishers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extinguishers (id, serial_number, location, type, size, installation_date, expiry_date, status, created_by, created_at, updated_at) FROM stdin;
seed-ext-001	FE-001	Building A — Lobby	co2	5lb	2025-06-01	2027-06-01	active	\N	2026-06-03 12:03:48.823631	2026-06-03 12:03:48.823631
seed-ext-002	FE-002	Building A — Floor 2	water	9lb	2024-03-15	2026-06-20	active	\N	2026-06-03 12:03:48.823631	2026-06-03 12:03:48.823631
seed-ext-003	FE-003	Building B — Kitchen	dry_chemical	5lb	2023-01-10	2026-05-01	expired	\N	2026-06-03 12:03:48.823631	2026-06-03 12:03:48.823631
seed-ext-004	FE-004	Building B — Garage	foam	12lb	2025-02-20	2027-02-20	active	\N	2026-06-03 12:03:48.823631	2026-06-03 12:03:48.823631
seed-ext-005	FE-005	Warehouse — Bay 1	co2	2.5lb	2024-11-05	2026-07-01	active	\N	2026-06-03 12:03:48.823631	2026-06-03 12:03:48.823631
seed-ext-006	FE-006	Warehouse — Bay 2	dry_chemical	9lb	2022-08-08	2026-04-15	expired	\N	2026-06-03 12:03:48.823631	2026-06-03 12:03:48.823631
seed-ext-007	FE-007	Server Room	co2	5lb	2025-05-01	2027-05-01	maintenance	\N	2026-06-03 12:03:48.823631	2026-06-03 12:03:48.823631
3EckI6KGKOd9txRPZNd6vtHR6MS	4356	rwanda	co2	5lb	2026-06-10	2027-11-10	active	3EcbMFM39OnXsf7miW5Ex2sJJcN	2026-06-03 13:12:43.011203	2026-06-03 11:13:06.806
\.


--
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspections (id, extinguisher_id, scheduled_date, scheduled_time, status, result, notes, scheduled_by, inspector_id, completed_at, created_at, updated_at) FROM stdin;
seed-insp-001	seed-ext-001	2026-06-15	10:00	scheduled	\N	Quarterly check	\N	\N	\N	2026-06-03 12:03:48.824053	2026-06-03 12:03:48.824053
seed-insp-002	seed-ext-002	2026-05-20	09:30	scheduled	\N	Annual inspection (overdue)	\N	\N	\N	2026-06-03 12:03:48.824053	2026-06-03 12:03:48.824053
seed-insp-003	seed-ext-004	2026-05-10	14:00	completed	pass	All good	\N	\N	2026-05-10 14:30:00	2026-06-03 12:03:48.824053	2026-06-03 12:03:48.824053
seed-insp-004	seed-ext-003	2026-05-02	11:00	completed	needs_maintenance	Low pressure	\N	\N	2026-05-02 11:20:00	2026-06-03 12:03:48.824053	2026-06-03 12:03:48.824053
3EcoMOy5jRwR4SFgpqp6VtyYLLj	seed-ext-002	2026-06-10	16:45	scheduled	\N	checking the functionality	3EcbLxJccRp4gduJ9GuL2I8XnDF	\N	\N	2026-06-03 13:46:09.105197	2026-06-03 13:46:09.105197
\.


--
-- Data for Name: maintenance_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_logs (id, extinguisher_id, inspection_id, action_taken, maintenance_date, issues_identified, notes, inspector_id, created_at) FROM stdin;
seed-mnt-001	seed-ext-003	seed-insp-004	Recharged and replaced seal	2026-05-03	Low pressure found during inspection	Returned to service pending re-test	\N	2026-06-03 12:03:48.824432
seed-mnt-002	seed-ext-007	\N	Annual pressure test	2026-05-15	\N	Unit offline for testing	\N	2026-06-03 12:03:48.824432
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: extinguishers extinguishers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_pkey PRIMARY KEY (id);


--
-- Name: extinguishers extinguishers_serial_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_serial_number_unique UNIQUE (serial_number);


--
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- Name: maintenance_logs maintenance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_pkey PRIMARY KEY (id);


--
-- Name: inspections inspections_extinguisher_id_extinguishers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_extinguisher_id_extinguishers_id_fk FOREIGN KEY (extinguisher_id) REFERENCES public.extinguishers(id) ON DELETE CASCADE;


--
-- Name: maintenance_logs maintenance_logs_extinguisher_id_extinguishers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_extinguisher_id_extinguishers_id_fk FOREIGN KEY (extinguisher_id) REFERENCES public.extinguishers(id) ON DELETE CASCADE;


--
-- Name: maintenance_logs maintenance_logs_inspection_id_inspections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_inspection_id_inspections_id_fk FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict e5ulASfzQH7f61zTxSfH1AwIFORGWCfeLxZtFne3j63BgCUwqQjgfgL5WP4eJYk

