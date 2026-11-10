# Bastidores

Anotações internas do desenvolvimento do Neon Breaker.

Versão atual publicada: **1.2.1** (09/11/2026)

## Objetivos

- [ ] Finalizar o jogo com os 10 distritos e publicar na Play Store.

## Sugestões

Alterações pedidas e ainda não aplicadas. Quando a lista chegar a cerca de 10 itens, elas são aplicadas juntas e sobem numa versão nova.

<!-- Formato: - [ ] descrição curta da alteração (data do pedido) -->

- [ ] Bug: ao vencer um chefão, o jogador perde uma vida (ou vai para FIM DE JOGO, sem a história e sem PRÓXIMO DISTRITO, se era a última). Causa: quando o chefão morre no meio do quadro (por míssil, laser ou perk), os discos são removidos e, no mesmo quadro, o jogo vê "nenhum disco em campo" e tira uma vida. Correção: parar a atualização assim que o chefão morre (08/11/2026)
- [ ] Bug: o MEGA LASER destrói blocos da mecânica FASE quando estão fora de fase. A ONDA DE CHOQUE também pode mirar neles (09/11/2026)
- [ ] Lançar o disco sozinho depois de 10 s parado na plataforma (09/11/2026)
- [ ] O arco que acende na plataforma quando o disco rebate está fora do padrão em todos os formatos, menos no ARCO (09/11/2026)
- [ ] Criar os distritos 6 (VIRAL) e 7 (CENSURA): fases, mecânicas novas e chefões (09/11/2026)
- [ ] MEGA LASER forte demais: os blocos que ele destrói recarregam o próprio perk, então dá para usar em sequência. Ideia: blocos destruídos por perks não carregam energia (08/11/2026)

## Histórico

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

- O formato FUNIL só libera com o chefão do distrito 6, que ainda não existe.
