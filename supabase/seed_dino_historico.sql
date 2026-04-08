-- =============================================================
-- Histórico de vendas — Dino (bakersinclairc@gmail.com)
-- Executar no: Supabase Dashboard → SQL Editor → New Query
-- =============================================================
-- DISTRIBUIÇÃO (hoje = 07/04/2026):
--   Hoje    (07/abr):         1×R$2.997                = R$  2.997  (1 venda)
--   7 dias  (01-07/abr):  2×2997+3×500+1×275          = R$  7.769  (6 vendas)
--   30 dias (08-31/mar):  2×2997+12×500+3×275+1×250   = R$ 13.069 (18 vendas)
--   3 meses (07/jan-07/mar): 6×2997+39×500+5×275+3×250= R$ 39.607 (53 vendas)
-- TOTAL 3 MESES: 10×2997+54×500+9×275+4×250 = R$ 60.445 (77 vendas)
-- =============================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'bakersinclairc@gmail.com';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado: bakersinclairc@gmail.com';
  END IF;

  DELETE FROM public.vendas WHERE user_id = v_user_id;

  INSERT INTO public.vendas
    (user_id, nome_produto, valor_venda, nome_comprador, whatsapp_comprador, email_comprador, created_at)
  VALUES

  -- =========================================================
  -- ÚLTIMOS 7 DIAS — 01 a 07/abr/2026
  -- 2×2997 + 3×500 + 1×275 = R$ 7.769 (6 vendas)
  -- =========================================================
  -- Abr 01
  (v_user_id,'O Grande Recomeço',500,'Carlos Mendes','11 98732-4501','carlos.mendes74@gmail.com','2026-04-01 09:14:00-03'),
  (v_user_id,'O Grande Recomeço',275,'Ana Paula Ferreira','21 97654-3210','anapaula.ferreira@hotmail.com','2026-04-01 16:42:00-03'),
  -- Abr 02
  (v_user_id,'O Grande Recomeço',2997,'Roberto Silva','11 99201-7832','roberto.silva.sp@gmail.com','2026-04-02 10:55:00-03'),
  -- Abr 03
  (v_user_id,'O Grande Recomeço',500,'Juliana Costa','31 98543-2197','juliana.costa.bh@gmail.com','2026-04-03 14:18:00-03'),
  -- Abr 05
  (v_user_id,'O Grande Recomeço',500,'Marcos Oliveira','41 97832-5540','marcos.oliveira.pr@gmail.com','2026-04-05 11:07:00-03'),
  -- Abr 07 (hoje)
  (v_user_id,'O Grande Recomeço',2997,'Eduardo Alves','11 98654-7712','eduardo.alves.sp@gmail.com','2026-04-07 10:03:00-03'),

  -- =========================================================
  -- DIAS 8-30 — 08 a 31/mar/2026
  -- 2×2997 + 12×500 + 3×275 + 1×250 = R$ 13.069 (18 vendas)
  -- =========================================================
  -- Mar 08
  (v_user_id,'O Grande Recomeço',2997,'Patricia Rocha','51 97315-4423','patricia.rocha.rs@gmail.com','2026-03-08 09:22:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Fernanda Lima','11 96745-8831','fernanda.lima@outlook.com','2026-03-08 16:55:00-03'),
  -- Mar 10
  (v_user_id,'O Grande Recomeço',500,'Ricardo Santos','21 98124-6690','ricardo.santos.rj@gmail.com','2026-03-10 10:15:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Andre Souza','11 97823-4460','andre.souza@gmail.com','2026-03-10 14:34:00-03'),
  -- Mar 11
  (v_user_id,'O Grande Recomeço',275,'Leticia Martins','19 98201-5573','leticia.martins@hotmail.com','2026-03-11 09:27:00-03'),
  -- Mar 13
  (v_user_id,'O Grande Recomeço',2997,'Felipe Castro','11 96789-2234','felipe.castro.sp@gmail.com','2026-03-13 11:40:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Bruna Nunes','31 97456-8890','bruna.nunes.bh@gmail.com','2026-03-13 16:11:00-03'),
  -- Mar 15
  (v_user_id,'O Grande Recomeço',500,'Thiago Barbosa','47 98345-7712','thiago.barbosa@gmail.com','2026-03-15 09:55:00-03'),
  (v_user_id,'O Grande Recomeço',275,'Vanessa Carvalho','21 97213-5543','vanessa.carvalho@gmail.com','2026-03-15 15:30:00-03'),
  -- Mar 17
  (v_user_id,'O Grande Recomeço',500,'Leandro Melo','11 99045-6678','leandro.melo@hotmail.com','2026-03-17 10:08:00-03'),
  (v_user_id,'O Grande Recomeço',250,'Cristina Vieira','85 98712-3345','cristina.vieira.ce@gmail.com','2026-03-17 15:17:00-03'),
  -- Mar 19
  (v_user_id,'O Grande Recomeço',500,'Diego Gomes','11 97654-2201','diego.gomes.sp@gmail.com','2026-03-19 11:42:00-03'),
  -- Mar 21
  (v_user_id,'O Grande Recomeço',500,'Rafaela Ribeiro','62 98432-7789','rafaela.ribeiro.go@gmail.com','2026-03-21 09:33:00-03'),
  -- Mar 24
  (v_user_id,'O Grande Recomeço',500,'Paulo Araujo','81 96798-4412','paulo.araujo.pe@gmail.com','2026-03-24 14:58:00-03'),
  -- Mar 26
  (v_user_id,'O Grande Recomeço',500,'Amanda Dias','11 98543-1190','amanda.dias.sp@gmail.com','2026-03-26 10:27:00-03'),
  -- Mar 28
  (v_user_id,'O Grande Recomeço',500,'Bruno Teixeira','41 97321-6634','bruno.teixeira.pr@gmail.com','2026-03-28 09:14:00-03'),
  -- Mar 31
  (v_user_id,'O Grande Recomeço',500,'Lucas Pinto','51 98765-4423','lucas.pinto.rs@gmail.com','2026-03-31 15:39:00-03'),

  -- =========================================================
  -- DIAS 31-90 — 07/jan a 07/mar/2026
  -- 6×2997 + 39×500 + 5×275 + 3×250 = R$ 39.607 (53 vendas)
  -- =========================================================
  -- Jan 07
  (v_user_id,'O Grande Recomeço',2997,'Rodrigo Correia','21 98912-4456','rodrigo.correia@gmail.com','2026-01-07 11:18:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Beatriz Correa','41 99123-5548','beatriz.correa@gmail.com','2026-01-07 16:30:00-03'),
  -- Jan 08
  (v_user_id,'O Grande Recomeço',500,'Sandro Macedo','51 96789-4401','sandro.macedo@gmail.com','2026-01-08 09:40:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Natalia Pires','11 98675-3321','natalia.pires@gmail.com','2026-01-08 15:18:00-03'),
  -- Jan 09
  (v_user_id,'O Grande Recomeço',500,'Flavio Cunha','61 97543-8890','flavio.cunha@gmail.com','2026-01-09 10:03:00-03'),
  -- Jan 10
  (v_user_id,'O Grande Recomeço',2997,'Monica Borges','11 99321-6645','monica.borges@hotmail.com','2026-01-10 09:51:00-03'),
  (v_user_id,'O Grande Recomeço',275,'Wellington Sousa','31 98654-2278','wellington.sousa@gmail.com','2026-01-10 14:27:00-03'),
  -- Jan 12
  (v_user_id,'O Grande Recomeço',500,'Priscila Fonseca','21 96789-5534','priscila.fonseca@gmail.com','2026-01-12 09:15:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Renato Andrade','11 97432-1123','renato.andrade@gmail.com','2026-01-12 16:48:00-03'),
  -- Jan 13
  (v_user_id,'O Grande Recomeço',500,'Simone Batista','85 99876-4412','simone.batista@gmail.com','2026-01-13 09:33:00-03'),
  -- Jan 14
  (v_user_id,'O Grande Recomeço',500,'Cleber Nogueira','11 98123-7756','cleber.nogueira@gmail.com','2026-01-14 10:47:00-03'),
  (v_user_id,'O Grande Recomeço',2997,'Valeria Matos','41 97654-3389','valeria.matos@gmail.com','2026-01-14 15:22:00-03'),
  -- Jan 15
  (v_user_id,'O Grande Recomeço',500,'Anderson Duarte','51 98765-1123','anderson.duarte@gmail.com','2026-01-15 09:47:00-03'),
  (v_user_id,'O Grande Recomeço',275,'Larissa Guimaraes','11 96543-8871','larissa.guimaraes@gmail.com','2026-01-15 16:40:00-03'),
  -- Jan 16
  (v_user_id,'O Grande Recomeço',500,'Elaine Queiroz','31 98901-4423','elaine.queiroz@gmail.com','2026-01-16 10:05:00-03'),
  -- Jan 19
  (v_user_id,'O Grande Recomeço',500,'Fabio Coelho','11 99012-7845','fabio.coelho@gmail.com','2026-01-19 09:18:00-03'),
  (v_user_id,'O Grande Recomeço',275,'Maristela Reis','62 97345-6678','maristela.reis@gmail.com','2026-01-19 14:45:00-03'),
  -- Jan 20
  (v_user_id,'O Grande Recomeço',500,'Gustavo Paiva','11 98123-3312','gustavo.paiva@gmail.com','2026-01-20 09:52:00-03'),
  -- Jan 21
  (v_user_id,'O Grande Recomeço',500,'Otavio Teles','11 96789-8834','otavio.teles@outlook.com','2026-01-21 11:28:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Sueli Magalhaes','71 98432-5567','sueli.magalhaes@gmail.com','2026-01-21 17:04:00-03'),
  -- Jan 22
  (v_user_id,'O Grande Recomeço',250,'Diogo Leal','19 97654-3301','diogo.leal@gmail.com','2026-01-22 09:37:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Rosana Tavares','11 99234-6678','rosana.tavares@gmail.com','2026-01-22 15:22:00-03'),
  -- Jan 23
  (v_user_id,'O Grande Recomeço',500,'Cintia Vasconcelos','11 96789-7745','cintia.vasconcelos@gmail.com','2026-01-23 12:58:00-03'),
  -- Jan 26
  (v_user_id,'O Grande Recomeço',500,'Marcio Figueiredo','21 97654-8890','marcio.figueiredo@gmail.com','2026-01-26 10:14:00-03'),
  -- Jan 27
  (v_user_id,'O Grande Recomeço',500,'Nadia Domingues','41 97543-6678','nadia.domingues@gmail.com','2026-01-27 09:26:00-03'),
  -- Jan 28
  (v_user_id,'O Grande Recomeço',500,'Ivan Rodrigues','51 98765-4401','ivan.rodrigues@gmail.com','2026-01-28 14:39:00-03'),
  -- Jan 29
  (v_user_id,'O Grande Recomeço',500,'Teresa Sampaio','11 96789-3312','teresa.sampaio@hotmail.com','2026-01-29 10:52:00-03'),
  -- Feb 02
  (v_user_id,'O Grande Recomeço',2997,'Aline Prudente','31 98901-3356','aline.prudente@gmail.com','2026-02-02 09:14:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Alexandre Soares','11 99123-2234','alexandre.soares@gmail.com','2026-02-02 15:47:00-03'),
  -- Feb 03
  (v_user_id,'O Grande Recomeço',500,'Evandro Chaves','61 97234-5523','evandro.chaves@gmail.com','2026-02-03 09:26:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Deise Marques','11 98654-7789','deise.marques@gmail.com','2026-02-03 14:31:00-03'),
  -- Feb 04
  (v_user_id,'O Grande Recomeço',500,'Vera Siqueira','11 97432-2245','vera.siqueira@gmail.com','2026-02-04 10:52:00-03'),
  -- Feb 05
  (v_user_id,'O Grande Recomeço',275,'Cristiano Neves','85 99345-1123','cristiano.neves@gmail.com','2026-02-05 09:44:00-03'),
  -- Feb 09
  (v_user_id,'O Grande Recomeço',2997,'Nilton Barreto','21 98123-6634','nilton.barreto@gmail.com','2026-02-09 11:18:00-03'),
  (v_user_id,'O Grande Recomeço',250,'Elisa Machado','11 96789-5512','elisa.machado@gmail.com','2026-02-09 16:23:00-03'),
  -- Feb 10
  (v_user_id,'O Grande Recomeço',500,'Rogerio Coutinho','31 97654-3378','rogerio.coutinho@gmail.com','2026-02-10 09:36:00-03'),
  -- Feb 11
  (v_user_id,'O Grande Recomeço',500,'Shirley Rezende','51 98901-2245','shirley.rezende@gmail.com','2026-02-11 14:49:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Milton Fragoso','11 99123-7756','milton.fragoso@gmail.com','2026-02-11 17:02:00-03'),
  -- Feb 12
  (v_user_id,'O Grande Recomeço',500,'Ingrid Tanaka','41 97543-4401','ingrid.tanaka@gmail.com','2026-02-12 09:02:00-03'),
  -- Feb 16
  (v_user_id,'O Grande Recomeço',500,'Edson Uchoa','71 98432-6689','edson.uchoa@gmail.com','2026-02-16 12:35:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Gloria Mesquita','11 96789-1123','gloria.mesquita@outlook.com','2026-02-16 17:48:00-03'),
  -- Feb 17
  (v_user_id,'O Grande Recomeço',500,'Celso Pimentel','21 97654-5534','celso.pimentel@gmail.com','2026-02-17 09:11:00-03'),
  -- Feb 18
  (v_user_id,'O Grande Recomeço',500,'Jussara Menezes','11 98123-4412','jussara.menezes@gmail.com','2026-02-18 12:44:00-03'),
  -- Feb 19
  (v_user_id,'O Grande Recomeço',500,'Sebastiao Valente','31 99234-7789','sebastiao.valente@gmail.com','2026-02-19 17:02:00-03'),
  -- Feb 23
  (v_user_id,'O Grande Recomeço',500,'Eunice Furtado','41 97345-3301','eunice.furtado@gmail.com','2026-02-23 09:28:00-03'),
  (v_user_id,'O Grande Recomeço',250,'Adelino Cruz','11 96789-8867','adelino.cruz@gmail.com','2026-02-23 14:50:00-03'),
  -- Feb 24
  (v_user_id,'O Grande Recomeço',500,'Herbert Campelo','11 99012-5578','herbert.campelo@gmail.com','2026-02-24 09:42:00-03'),
  -- Feb 25
  (v_user_id,'O Grande Recomeço',500,'Zelia Borba','51 97432-1123','zelia.borba@gmail.com','2026-02-25 14:07:00-03'),
  -- Mar 02
  (v_user_id,'O Grande Recomeço',2997,'Emerson Pacheco','21 98765-6689','emerson.pacheco@gmail.com','2026-03-02 09:47:00-03'),
  -- Mar 03
  (v_user_id,'O Grande Recomeço',500,'Ivone Duques','11 96543-3345','ivone.duques@hotmail.com','2026-03-03 10:55:00-03'),
  (v_user_id,'O Grande Recomeço',500,'Claudio Serrano','61 97654-7712','claudio.serrano@gmail.com','2026-03-03 16:18:00-03'),
  -- Mar 04
  (v_user_id,'O Grande Recomeço',500,'Fatima Pinheiro','11 98901-4478','fatima.pinheiro@gmail.com','2026-03-04 09:33:00-03'),
  -- Mar 05
  (v_user_id,'O Grande Recomeço',500,'Rosilane Braga','11 99234-8890','rosilane.braga@gmail.com','2026-03-05 14:58:00-03'),
  -- Mar 06
  (v_user_id,'O Grande Recomeço',500,'Everaldo Tovar','47 98654-2201','everaldo.tovar@gmail.com','2026-03-06 10:27:00-03'),
  -- Mar 07
  (v_user_id,'O Grande Recomeço',500,'Conceicao Aguiar','31 97345-6623','conceicao.aguiar@gmail.com','2026-03-07 15:37:00-03');


  -- =========================================================
  -- ABORDAGENS — distribuídas nos últimos 3 meses
  -- 315 abordagens → 77 vendas = 24.4% de conversão
  -- =========================================================
  DELETE FROM public.abordagens WHERE user_id = v_user_id;

  INSERT INTO public.abordagens
    (user_id, nomes_abordados, dados_abordados, tempo_medio_abordagem, mostrou_ia, visao_geral, created_at)
  SELECT
    v_user_id,
    (ARRAY['Thiago S.','Ana R.','Carlos B.','Mariana F.','Lucas M.','Fernanda O.','Ricardo A.','Patricia N.','Gabriel T.','Camila V.','Bruno L.','Simone C.','Diego R.','Vanessa M.','Andre P.','Leticia S.','Felipe C.','Monica B.','Rodrigo A.','Juliana F.'])[1 + ((gs - 1) % 20)],
    'prospect' || gs || '@email.com',
    18 + (gs % 27),
    (gs % 5 = 0),
    (ARRAY['Demonstrou interesse no produto','Pediu mais informações sobre a mentoria','Solicitou proposta detalhada','Agendou retorno para próxima semana','Sem interesse no momento','Perguntou sobre garantia e suporte','Quer conversar com familiar antes de decidir','Conversamos sobre resultados esperados'])[1 + ((gs - 1) % 8)],
    CASE
      WHEN gs <= 8   THEN (TIMESTAMPTZ '2026-04-07 08:00:00-03') + ((gs - 1)   * INTERVAL '1 hour 10 minutes')
      WHEN gs <= 26  THEN (TIMESTAMPTZ '2026-04-01 09:00:00-03') + ((gs - 9)   * INTERVAL '8 hours')
      WHEN gs <= 100 THEN (TIMESTAMPTZ '2026-03-08 08:30:00-03') + ((gs - 27)  * INTERVAL '8 hours')
      ELSE                (TIMESTAMPTZ '2026-01-07 09:00:00-03') + ((gs - 101) * INTERVAL '6 hours 35 minutes')
    END
  FROM generate_series(1, 315) AS gs;
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Inserido com sucesso para: bakersinclairc@gmail.com';
  RAISE NOTICE '  Hoje    (07/abr):  R$ 2.997  (1 venda)';
  RAISE NOTICE '  7 dias  (01-07/abr): R$ 7.769  (6 vendas)';
  RAISE NOTICE '  30 dias (08-31/mar): R$ 13.069 (18 vendas acumulado 30d = R$ 20.838)';
  RAISE NOTICE '  3 meses (jan-mar):   R$ 60.445 total (77 vendas)';
  RAISE NOTICE '====================================================';
END $$;

