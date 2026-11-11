# Bastidores

Anotações internas do desenvolvimento do Neon Breaker.

Versão atual publicada: **1.5** (10/11/2026)

## Objetivos

- [ ] Finalizar o jogo com os 10 distritos e publicar na Play Store.

## Sugestões

Alterações pedidas e ainda não aplicadas. Quando a lista chegar a cerca de 10 itens, elas são aplicadas juntas e sobem numa versão nova.

<!-- Formato: - [ ] descrição curta da alteração (data do pedido) -->

_Nenhuma sugestão pendente._

## Histórico

### 1.5 (10/11/2026)

- [x] Modo dev refeito no estilo do Quebrabloco: painel flutuante com seções, controles deslizantes e ícones.
- [x] Modo dev: tocar numa cápsula faz ela cair em cima da plataforma.
- [x] Menu inicial: botões quadrados com ícones (paleta, engrenagem, troféu do PLACAR e estrela dos CRÉDITOS) e layout reorganizado.
- [x] Créditos com os arquivos dos chefões (reler o diário) e links para o repositório e o Instagram (em breve).
- [x] Placar acumula entre fases e distritos até o fim de jogo; pontos divididos por 10.
- [x] Tela de placar: melhores partidas do aparelho, GERAL e SEMANA online, apelido.
- [x] Placar online com Supabase pronto no código (desligado até criar o projeto).
- [x] ONDA DE CHOQUE mais fraca: centro fixo, 4/6/8 blocos e desvio do disco só perto da plataforma.
- [x] Anúncio do QUEBRABLOCO com cara de obra (faixas zebradas, muro de tijolos, escavadeira).

### 1.4 (10/11/2026)

- [x] Bug: disco preso entre portais alinhados (fase 5-2 GOTO).
- [x] Ícone novo do vírus (CONTÁGIO).
- [x] Ícone da cápsula LENTO (relógio) diferente do LASER.
- [x] Preços: moedas cerca de 40% mais baratos, chips cerca de 40% mais caros.
- [x] Anúncio opcional para dobrar as moedas, com anúncios de teste (QUEBRABLOCO, AURUM BANK, CAFÉ DA MADRUGADA).
- [x] Chefões dão moedas: 20 + 5 por distrito.
- [x] Diário com a fonte 1 pt maior.
- [x] Distritos 8 (RESISTÊNCIA, BLINDAGEM, O BLINDADO) e 9 (TORRE AURUM, SEGURANÇA, O CONSELHO), com músicas e as cápsulas REPULSÃO e DISCO SUMIDO.

### 1.3.1 (10/11/2026)

- [x] MEGA LASER trava o breaker enquanto carrega e dispara.

### 1.3 (10/11/2026)

- [x] Bug: vencer um chefão com míssil, laser ou perk tirava uma vida (e dava FIM DE JOGO na última).
- [x] Bug: MEGA LASER e ONDA DE CHOQUE acertavam blocos fora de fase.
- [x] Disco lançado sozinho depois de 10 s parado.
- [x] Brilho do rebote acompanha todos os formatos de plataforma.
- [x] Distritos 6 (VIRAL, CONTÁGIO, O ALGORITMO) e 7 (CENSURA, TARJA, O CENSOR).
- [x] Blocos destruídos pelos perks não recarregam mais o perk.
- [x] Ícone do jogo: o disco com rastro.
- [x] Progressão de cápsulas: uma boa e uma ruim por distrito; 4 cápsulas ruins novas.
- [x] Distritos com 4 fases cada, mais o chefão; progresso salvo convertido.
- [x] Portais com uma cor por par.

### 1.2.1 (09/11/2026)

- [x] Revisão e limpeza do código, do repositório e da documentação.

### 1.2 (06/11/2026)

- [x] ÍMÃ puxa de leve o disco para a plataforma.
- [x] Bug: botões de formato, cor e emblema do modo dev (e o formato voltando ao padrão com DESBLOQUEAR TUDO).
- [x] MÍSSIL vai direto no chefão quando não há bloco na frente.
- [x] Aceleração do disco de 1% por distrito (era 2%).
- [x] Modo dev: DESBLOQUEAR TUDO libera os perks no nível 3; painel troca ativo e passivo.
- [x] Aba PERKS em cartas, sem pré-requisito, dividida em ATIVOS e PASSIVOS (1 de cada).
- [x] Passivos novos: GRANA, RECARGA, SORTE, VIDA EXTRA e DISCO PESADO (combo mortal com o ÍMÃ).
- [x] Bug: laser e míssil acertavam blocos fora de fase (FASE).
- [x] Menu PLATAFORMA renomeado para BREAKERS; PODERES para PERKS.
- [x] Aviso (!) para perks e itens que dá para comprar e para formatos novos.
- [x] Sino de NOVIDADES no menu.
- [x] Pausa com botões EFEITOS e MÚSICA (agora independentes).
- [x] Botão BREAKERS na tela de distrito concluído.
- [x] Tutorial dos perks depois do primeiro chefão.

### 1.1 (05/11/2026)

- [x] História contada aos poucos: terminal após cada chefão.
- [x] Animação da PONTA mais discreta.
- [x] 2 formatos novos: ONDA e FUNIL.
- [x] 2 poderes novos (CÂMERA LENTA e RELÂMPAGO), mais caros; PLATAFORMA LARGA mais cara.
- [x] Aba PODERES como árvore de habilidades.
- [x] Abas do menu PLATAFORMA em 2 linhas.
- [x] Paleta padrão SISTEMA.
- [x] PULSO à venda por 20 moedas.
- [x] Ícones de mecânica no mapa com a mais nova primeiro.
- [x] Moedas caindo no fim da fase entram na conta.
- [x] Distrito 1 renomeado para SUBÚRBIO.
- [x] Nomes das fases dos distritos 1 e 2.
- [x] Bug: áudio tocando fora do jogo.

### Pendências conhecidas

- Falta a cápsula ruim (e a boa) do distrito 10.
- Os chefões dos distritos 7, 8 e 9 ainda não liberam formato novo: só existem 7 formatos.
- As capturas 03 a 17 da documentação são anteriores à 1.3 (numeração antiga das fases no topo da tela).
- Os anúncios são de teste; os de verdade dependem de uma conta de anúncios na Play Store.
- O placar online está desligado: falta criar o projeto no Supabase, rodar supabase/schema.sql e colocar a URL e a chave pública em www/js/online.js.
- O placar acumulado pode ser engordado rejogando fases fáceis sem morrer; vale rever quando o placar online estiver no ar.
