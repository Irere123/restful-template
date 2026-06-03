--
-- PostgreSQL database dump
--

\restrict BJRfJKaWADzy57DRxAw2VzfvDfdbQNEcfyD70Xd2INQIk4wDWcbIhJEKIOyglAi

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

ALTER TABLE IF EXISTS ONLY public.password_reset_codes DROP CONSTRAINT IF EXISTS password_reset_codes_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.email_verification_codes DROP CONSTRAINT IF EXISTS email_verification_codes_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.password_reset_codes DROP CONSTRAINT IF EXISTS password_reset_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.email_verification_codes DROP CONSTRAINT IF EXISTS email_verification_codes_pkey;
ALTER TABLE IF EXISTS ONLY drizzle.__drizzle_migrations DROP CONSTRAINT IF EXISTS __drizzle_migrations_pkey;
ALTER TABLE IF EXISTS drizzle.__drizzle_migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.password_reset_codes;
DROP TABLE IF EXISTS public.email_verification_codes;
DROP SEQUENCE IF EXISTS drizzle.__drizzle_migrations_id_seq;
DROP TABLE IF EXISTS drizzle.__drizzle_migrations;
DROP TYPE IF EXISTS public.user_role;
DROP SCHEMA IF EXISTS drizzle;
--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'inspector',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

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
-- Name: email_verification_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verification_codes (
    id text NOT NULL,
    user_id text NOT NULL,
    code_hash text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_verification_codes OWNER TO postgres;

--
-- Name: password_reset_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_codes (
    id text NOT NULL,
    user_id text NOT NULL,
    code_hash text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_codes OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text,
    display_name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    email_verified timestamp without time zone,
    refresh_token_version integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	0be7abc43800f4378b48a9d6338855b299b11e1ac45004799b58b82e3adeecff	1780473205069
2	aa3eb2df0dfedfc24f5ffc9e5a257b33cdd4af5b3ba086be98f69f5e3972f0f0	1780476805975
\.


--
-- Data for Name: email_verification_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_verification_codes (id, user_id, code_hash, attempts, expires_at, created_at) FROM stdin;
3EcbM7pWnoYgxAN5SIUi8larcIA	3EcbLxJccRp4gduJ9GuL2I8XnDF	15f62c75b4b3a5a73e231e655156e2172a2aa72e4e702f27ffa29fdbd38fab34	0	2026-06-03 10:09:13.144	2026-06-03 11:59:13.145524
3EcbMDd3OU5rjEkS74ljhlgPqy9	3EcbMFM39OnXsf7miW5Ex2sJJcN	b7973fd2225fe1e2aff22054299a30bfd35e8930aa3252ee025ff9243368b614	0	2026-06-03 10:09:14.779	2026-06-03 11:59:14.780073
3EcbMKUkeuIgMXnwUyuTWi2gvdU	3EcbMO9ci40FZG2yGx54xoYGkTf	821bb3ab7a079356f08914ab865de2c5b715ceee1692b478e3c00048a7620314	0	2026-06-03 10:09:15.701	2026-06-03 11:59:15.702179
\.


--
-- Data for Name: password_reset_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_codes (id, user_id, code_hash, attempts, expires_at, created_at) FROM stdin;
3EcmASbeDMc6qX8iJApPaHynKv0	3EcmALoZAJubK7xTSzItawT32mx	279aa72ccdb2cbc11ccd00f039c234e849cba999b6d5e82d4d910a7bb2ebe9f7	0	2026-06-03 11:38:07.403	2026-06-03 13:28:07.414176
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, display_name, email, password, role, email_verified, refresh_token_version, created_at, updated_at, first_name, last_name) FROM stdin;
3EcbMFM39OnXsf7miW5Ex2sJJcN	\N	Ian Inspector	inspector@tzw.test	$2b$12$HJJ.Ck4K3qhnHgqBLg2ZWukqlPVT.RPXG0e2HAcwPyM3IS43L9LVO	inspector	2026-06-03 12:03:48.787545	1	2026-06-03 11:59:14.779015	2026-06-03 12:03:48.787545	Ian	Inspector
3EcbMO9ci40FZG2yGx54xoYGkTf	\N	Uma User	user@tzw.test	$2b$12$HJJ.Ck4K3qhnHgqBLg2ZWukqlPVT.RPXG0e2HAcwPyM3IS43L9LVO	user	2026-06-03 12:03:48.787545	1	2026-06-03 11:59:15.700205	2026-06-03 12:03:48.787545	Uma	User
3EcbLxJccRp4gduJ9GuL2I8XnDF	\N	Ada Lovelace	admin@tzw.test	$2b$12$HJJ.Ck4K3qhnHgqBLg2ZWukqlPVT.RPXG0e2HAcwPyM3IS43L9LVO	admin	2026-06-03 12:03:48.787545	1	2026-06-03 11:59:13.142107	2026-06-03 10:11:40.068	Ada	Lovelace
3EcU4fLlRk3JHvI1h9l7OjUVXJk	irere123	Irere Emmanuel	irere2050@gmail.com	$2b$12$6qjmAmo7eBwqj1upXTMjPO6Y4hvZ0N6C556plRK5W6/thrVERtCBy	user	2026-06-03 09:19:35.053	4	2026-06-03 10:59:21.770942	2026-06-03 10:57:08.169	Irere	Emmanuel
3EcmALoZAJubK7xTSzItawT32mx	\N	Regis Yizerwe	studiorevoks@gmail.com	$2b$12$Y6lgRpG1egBs05QrZJVzdOgldgP3FVo1sbXycx4C1HEoIoq9F4hzG	inspector	2026-06-03 11:28:07.396	1	2026-06-03 13:28:07.407939	2026-06-03 13:28:07.407939	Regis	Yizerwe
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 2, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: email_verification_codes email_verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_codes
    ADD CONSTRAINT email_verification_codes_pkey PRIMARY KEY (id);


--
-- Name: password_reset_codes password_reset_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: email_verification_codes email_verification_codes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_codes
    ADD CONSTRAINT email_verification_codes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_codes password_reset_codes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_codes
    ADD CONSTRAINT password_reset_codes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict BJRfJKaWADzy57DRxAw2VzfvDfdbQNEcfyD70Xd2INQIk4wDWcbIhJEKIOyglAi

