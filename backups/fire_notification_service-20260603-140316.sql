--
-- PostgreSQL database dump
--

\restrict YLg9YNeiPTUSIkmoyYygdidlvQzeQCP5b86glzCmQ4a0WmZ9aY0PPHU6iizKmHp

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

ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY drizzle.__drizzle_migrations DROP CONSTRAINT IF EXISTS __drizzle_migrations_pkey;
ALTER TABLE IF EXISTS drizzle.__drizzle_migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS drizzle.__drizzle_migrations_id_seq;
DROP TABLE IF EXISTS drizzle.__drizzle_migrations;
DROP TYPE IF EXISTS public.notification_status;
DROP SCHEMA IF EXISTS drizzle;
--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

--
-- Name: notification_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_status AS ENUM (
    'sent',
    'skipped',
    'failed'
);


ALTER TYPE public.notification_status OWNER TO postgres;

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
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    type text NOT NULL,
    channel text DEFAULT 'email'::text NOT NULL,
    recipient text NOT NULL,
    subject text NOT NULL,
    status public.notification_status NOT NULL,
    error text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	a663bf6d5e34fbaab0539f2f0a117d4bb837f1a361c75a32adde81b6ffbc43fa	1780473206837
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, type, channel, recipient, subject, status, error, metadata, created_at) FROM stdin;
3EcTtQtZNVdftgmdPQ03jo0m9ZV	otp	email	ada.test@example.com	829734 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 10:57:51.4784
3EcTtWmBYiJtDVJGQrU2BQqRfQ8	welcome	email	ada.test@example.com	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 10:57:52.643762
3EcTv4YaX5Hmlea2ssfqFrX49Sa	login_alert	email	ada.test@example.com	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T08:58:03.647Z", "ipAddress": "::1"}	2026-06-03 10:58:04.784565
3EcTv8oLUvDPPfdErRjh9WEJqgt	account_deleted	email	ada.test@example.com	Your TZW Fire Safety account has been deleted	sent	\N	{"byAdmin": false}	2026-06-03 10:58:05.181659
3EcU4n2F0SCp32rDWL9gW7neqeT	otp	email	irere2050@gmail.com	100323 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 10:59:22.546053
3EcU4qEA2ktWZ3p9KfvX5cCYlDq	welcome	email	irere2050@gmail.com	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 10:59:22.997072
3EcWRdRwpJzkoppIuGwVxSPj79T	login_alert	email	irere2050@gmail.com	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T09:18:49.158Z", "ipAddress": "::1"}	2026-06-03 11:18:50.213217
3EcWViC7Vf8M1KbzdhXQbcUrcnT	otp	email	irere2050@gmail.com	089757 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:19:23.993153
3EcYYxv49f0LUnXUKhWYd6QmpMb	otp	email	fe.smoke.1780479373@example.com	939020 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:36:15.426069
3EcYYvGvLSnhw3GOiIN7nyBv546	welcome	email	fe.smoke.1780479373@example.com	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:36:15.919446
3EcYZDQNfOdyW1ndM7iZmoM7apB	account_deleted	email	fe.smoke.1780479373@example.com	Your TZW Fire Safety account has been deleted	sent	\N	{"byAdmin": false}	2026-06-03 11:36:17.196758
3EcZAYFks1A3ctn1B1FtNLrBh5F	otp	email	fe.rep.1780479673@example.com	518775 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:41:14.640539
3EcZAbl1iTn2PYaspfCibpcOLx7	welcome	email	fe.rep.1780479673@example.com	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:41:15.096045
3EcZAmMofX9bUJyHT2vZOXFCdFJ	account_deleted	email	fe.rep.1780479673@example.com	Your TZW Fire Safety account has been deleted	sent	\N	{"byAdmin": false}	2026-06-03 11:41:16.370943
3EcZKWpSoBDuZ2OE5t6AUUnVcqc	otp	email	fe.diag.1780479753@example.com	563827 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:42:34.889684
3EcZKgZ0nzJFFOtccpjxD0XLjDu	welcome	email	fe.diag.1780479753@example.com	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:42:35.282789
3EcZKqQH5Qw5Do8tzDqTZLQk7l2	account_deleted	email	fe.diag.1780479753@example.com	Your TZW Fire Safety account has been deleted	sent	\N	{"byAdmin": false}	2026-06-03 11:42:36.117695
3EcZbuKdmdSf27sRVaAGzrkdCH6	otp	email	fe.verify.1780479890@example.com	351685 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:44:52.352726
3EcZbs43klq9c9GtSMHlWQohGIn	welcome	email	fe.verify.1780479890@example.com	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:44:52.79379
3EcZc3goAsrvXl3itETjgzSy3UT	account_deleted	email	fe.verify.1780479890@example.com	Your TZW Fire Safety account has been deleted	sent	\N	{"byAdmin": false}	2026-06-03 11:44:53.542038
3EcZn8q17aDu73AKExVecRo62kB	otp	email	fe.final.1780479981@example.com	797873 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:46:22.693196
3EcZnIM0AqdVEtYhUgWfSQJungS	welcome	email	fe.final.1780479981@example.com	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:46:23.10593
3EcZnHVqoOuuWL42xvhJN2RKoXo	account_deleted	email	fe.final.1780479981@example.com	Your TZW Fire Safety account has been deleted	sent	\N	{"byAdmin": false}	2026-06-03 11:46:23.674357
3EcaOZ9IRzd6zkT1ond9mWeduuE	otp	email	fe.shape.1780480278@example.com	381167 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:51:19.342403
3EcaOhRXMGJWNPLvKe6J1CwDwIF	welcome	email	fe.shape.1780480278@example.com	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:51:20.444869
3EcaObYdH7jnmcwxRjSvvvppTJf	account_deleted	email	fe.shape.1780480278@example.com	Your TZW Fire Safety account has been deleted	sent	\N	{"byAdmin": false}	2026-06-03 11:51:20.791085
3EcaUrW1cl3j3i1QXaRKtK8ec7U	otp	email	fe.dash.1780480328@example.com	645099 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:52:09.401948
3EcaUl3T2mVhifrDyUbyyQJehCF	welcome	email	fe.dash.1780480328@example.com	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:52:09.942799
3EcaUynNBKKexoDkuHStUJzQZ6u	account_deleted	email	fe.dash.1780480328@example.com	Your TZW Fire Safety account has been deleted	sent	\N	{"byAdmin": false}	2026-06-03 11:52:10.468463
3EcbMDreGRS2lw9MD9s8KpLOoDU	otp	email	admin@tzw.test	319928 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:59:14.530389
3EcbMEgm5FAqZdFcITriv9fXVmd	welcome	email	admin@tzw.test	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:59:14.933547
3EcbMIGdWFqPwateZ37B7NYzzWZ	otp	email	inspector@tzw.test	867045 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:59:15.43398
3EcbMQOebBGtBceIJpT3iVrDoBA	otp	email	user@tzw.test	740764 is your TZW Fire Safety verification code	sent	\N	{"ttlMinutes": 10}	2026-06-03 11:59:16.106457
3EcbMRK7tPgcU1yhSC2TMfXf1jU	welcome	email	inspector@tzw.test	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:59:16.475588
3EcbMPdh2CjrAemB1b7aNxbqNf1	welcome	email	user@tzw.test	Welcome to TZW Fire Safety	sent	\N	\N	2026-06-03 11:59:16.506634
3EcbRbRgOvNAA94oP9kAhiNgJfx	login_alert	email	admin@tzw.test	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T09:59:56.324Z", "ipAddress": "::1"}	2026-06-03 11:59:57.124423
3EcblNxK8y5flN8BksxVTDWZzNH	login_alert	email	admin@tzw.test	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T10:02:32.056Z", "ipAddress": "::1"}	2026-06-03 12:02:34.082925
3EccAuugqHqMj6thkbNGvscudpr	logout_alert	email	irere2050@gmail.com	You were signed out of TZW Fire Safety	sent	\N	{"allDevices": false}	2026-06-03 12:05:57.645354
3EccEZbJQRHpJbugAAeqYs46WUg	login_alert	email	admin@tzw.test	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T10:06:26.002Z", "ipAddress": "::1"}	2026-06-03 12:06:27.650884
3EccNuICdrtb957FwRe9yg3bQyX	logout_alert	email	admin@tzw.test	You were signed out of TZW Fire Safety	sent	\N	{"allDevices": false}	2026-06-03 12:07:41.124694
3EccSgzzArZuTeRHMNHosd7Kna5	login_alert	email	admin@tzw.test	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T10:08:18.205Z", "ipAddress": "::1"}	2026-06-03 12:08:19.805109
3EcgImIgNubJhRAy7gOWjl1dGrh	logout_alert	email	admin@tzw.test	You were signed out of TZW Fire Safety	sent	\N	{"allDevices": false}	2026-06-03 12:39:53.973428
3EcgpTf4wHd0nUxDbVB1a2EBkTC	password_reset	email	irere2050@gmail.com	235285 is your TZW Fire Safety password reset code	sent	\N	{"ttlMinutes": 10}	2026-06-03 12:44:14.428592
3EchhqqGmWi79fJrrZjcM2emNG7	login_alert	email	irere2050@gmail.com	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T10:51:25.769Z", "ipAddress": "::1"}	2026-06-03 12:51:26.732052
3EchtvDC0uDI3l4lpwmlBP7q7de	logout_alert	email	irere2050@gmail.com	You were signed out of TZW Fire Safety	sent	\N	{"allDevices": false}	2026-06-03 12:53:02.170641
3EciIKOpKFEsm3mO2XtnOlXIsk6	password_reset	email	irere2050@gmail.com	092091 is your TZW Fire Safety password reset code	sent	\N	{"ttlMinutes": 10}	2026-06-03 12:56:17.544331
3EciQ3yxYmb2sl9bTiFElF1ElY8	login_alert	email	irere2050@gmail.com	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T10:57:17.621Z", "ipAddress": "::1"}	2026-06-03 12:57:18.41892
3EcibYqzraFxqeZSwJgH2uewKZ2	logout_alert	email	irere2050@gmail.com	You were signed out of TZW Fire Safety	sent	\N	{"allDevices": false}	2026-06-03 12:58:50.380995
3Ecid0JW7Vrhpr1vMZ0pvPNrG4V	login_alert	email	irere2050@gmail.com	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T10:59:01.070Z", "ipAddress": "::1"}	2026-06-03 12:59:01.81663
3EcidS3vNsvPfwi26FkMadWcvwf	logout_alert	email	irere2050@gmail.com	You were signed out of all TZW Fire Safety devices	sent	\N	{"allDevices": true}	2026-06-03 12:59:05.067398
3EciohwsQaIpAcuDNlce5d53RID	login_alert	email	inspector@tzw.test	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T11:00:33.276Z", "ipAddress": "::1"}	2026-06-03 13:00:34.041284
3Eckx4rGGin4hFyZEGwmJlrEBhl	logout_alert	email	inspector@tzw.test	You were signed out of TZW Fire Safety	sent	\N	{"allDevices": false}	2026-06-03 13:18:08.793804
3EclMy8cTkGdgDRs1NwrrGBCr6H	login_alert	email	admin@tzw.test	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T11:21:34.232Z", "ipAddress": "::1"}	2026-06-03 13:21:34.988163
3EcmAVZGyiCnViBGjrsyqj7S18m	password_reset	email	studiorevoks@gmail.com	016790 is your TZW Fire Safety password reset code	sent	\N	{"ttlMinutes": 10}	2026-06-03 13:28:08.195694
3Ecnr4s9ucpg576s2VQzjQIK77w	logout_alert	email	admin@tzw.test	You were signed out of TZW Fire Safety	sent	\N	{"allDevices": false}	2026-06-03 13:42:00.451775
3Eco7IVue9gWYZa0CtWyONW3QaV	login_alert	email	irere2050@gmail.com	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T11:44:06.955Z", "ipAddress": "::1"}	2026-06-03 13:44:09.194867
3Eco8AbVsz3Jt0VTkBdAG3SPjPj	logout_alert	email	irere2050@gmail.com	You were signed out of TZW Fire Safety	sent	\N	{"allDevices": false}	2026-06-03 13:44:16.636287
3EcoJhj6su3Bqrg9lNfNDquHqT2	login_alert	email	admin@tzw.test	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T11:45:47.492Z", "ipAddress": "::1"}	2026-06-03 13:45:48.19568
3EcoMOeDjlatS6NL2PslBZOf2v4	inspection_scheduled	email	admin@tzw.test	Inspection scheduled for extinguisher FE-002	sent	\N	{"date": "2026-06-10", "time": "16:45", "extinguisherSerial": "FE-002"}	2026-06-03 13:46:09.772159
3EcobqHYaiuWqHhgox161LNjQQl	logout_alert	email	admin@tzw.test	You were signed out of TZW Fire Safety	sent	\N	{"allDevices": false}	2026-06-03 13:48:12.282286
3EcpA2rQ7O9tU6hCrssqV3B6y9Y	login_alert	email	irere2050@gmail.com	New sign-in to your TZW Fire Safety account	sent	\N	{"time": "2026-06-03T11:52:43.469Z", "ipAddress": "::1"}	2026-06-03 13:52:44.701219
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
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict YLg9YNeiPTUSIkmoyYygdidlvQzeQCP5b86glzCmQ4a0WmZ9aY0PPHU6iizKmHp

