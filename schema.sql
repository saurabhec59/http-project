--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    age integer,
    city character varying(100),
    role character varying(50)
);

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;

--
-- Name: customer_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_credentials (
    customer_id integer NOT NULL,
    password_hash text NOT NULL,
    password_salt text NOT NULL
);

--
-- Name: customer_refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_refresh_tokens (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: customer_refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: customer_refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_refresh_tokens_id_seq OWNED BY public.customer_refresh_tokens.id;

--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);

--
-- Name: customer_refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.customer_refresh_tokens_id_seq'::regclass);

--
-- Name: customer_credentials customer_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_credentials
    ADD CONSTRAINT customer_credentials_pkey PRIMARY KEY (customer_id);

--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);

--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

--
-- Name: customer_refresh_tokens customer_refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_refresh_tokens
    ADD CONSTRAINT customer_refresh_tokens_pkey PRIMARY KEY (id);

--
-- Name: customer_refresh_tokens customer_refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_refresh_tokens
    ADD CONSTRAINT customer_refresh_tokens_token_hash_key UNIQUE (token_hash);

--
-- Name: customer_credentials customer_credentials_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_credentials
    ADD CONSTRAINT customer_credentials_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

--
-- Name: customer_refresh_tokens customer_refresh_tokens_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_refresh_tokens
    ADD CONSTRAINT customer_refresh_tokens_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

--
-- PostgreSQL database dump complete
--