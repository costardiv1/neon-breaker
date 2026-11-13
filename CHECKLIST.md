# Checklist de testes

O que testar em cada versão, para conferir as novidades sem jogar tudo de novo. A versão mais nova fica no topo. Use o modo dev para pular de fase quando precisar.

## 1.8.3 (13/11/2026)

### Fases bônus (mesa de pinball)
- [ ] Entre numa fase bônus com um perk equipado: o botão do perk não aparece e o toque duplo não faz nada.
- [ ] Nenhum bloco solta cápsula nem moeda.
- [ ] Há 3 bumpers redondos no meio do campo: o disco bate, sai mais rápido e o bumper pisca com um "plim".
- [ ] As letras B-Ô-N-U-S embaixo dos blocos acendem quando o disco bate. Com as cinco acesas: "BÔNUS! +3 NO POTE", elas piscam e apagam de novo.
- [ ] No topo aparece "POTE N" e o combo (x2, x3...) sobe a cada batida na mesa; quando o disco toca a plataforma, o combo some. O pote para em 12 (CHEIO).
- [ ] Limpe a fase: aparece "POTE +N MOEDAS" e o prêmio do bônus. Na tela de recompensa, o anúncio dobra tudo.
- [ ] Deixe o disco cair com o pote cheio: FIM DO BÔNUS (O DISCO CAIU · FICA O POTE) e você recebe o pote. Com o pote vazio aparece SEM PRÊMIO.
- [ ] Os textos dos cartões das três fases falam dos bumpers e das letras.

### Modo dev
- [ ] Abra o painel DEV: ele ocupa cerca de um terço da tela, é meio transparente e tem abas com ícones no topo (Jogo, Gráficos, Capítulo e fase, Breaker, Cápsulas), com uma seção por vez.
- [ ] Arraste o painel pela barra de cima para outro canto; feche e abra o jogo de novo: ele volta no mesmo lugar e na mesma aba.
- [ ] O botão – recolhe o painel num botão pequeno 🛠️, que abre de novo.

### Menu e mapa
- [ ] Menu inicial: o ícone do BREAKERS é só a curva do breaker ARCO.
- [ ] Mapa, capítulo 8: a estrela BÔNUS · BARRICADA aparece ao lado da 8-3, dentro da tela, com o nome livre.
- [ ] Mapa, capítulo 6: o coração de curtidas está na cor do tema. As luzinhas da CENSURA e da rádio da RESISTÊNCIA continuam vermelhas.
- [ ] Mapa, capítulo 9: o banco AURUM é dourado em qualquer tema (teste no verde).

### Correções
- [ ] ONDA DE CHOQUE: dispare e mova a plataforma; o arco fica parado onde começou.
- [ ] MEGA LASER: o brilho de carga começa apagado e acende.
- [ ] Celular com o neon desligado: textos, botões e blocos com a mesma cara de antes.

## 1.8.2 (13/11/2026)

### Fases bônus
- [ ] Entre numa fase bônus: o relógio no topo marca 0:40 e só começa a correr quando você lança o disco. Nos últimos 10 s ele pisca.
- [ ] Deixe o disco cair: aparece FIM DO BÔNUS (O DISCO CAIU · SEM PRÊMIO), você não perde vida, fica com as moedas que pegou e volta para o mapa.
- [ ] Deixe o tempo acabar: FIM DO BÔNUS (TEMPO ESGOTADO · SEM PRÊMIO).
- [ ] Limpe uma fase bônus pela primeira vez: o prêmio é 15 (LAG), 20 (FORK BOMB) ou 25 (BARRICADA). Na segunda vez é 3.
- [ ] LAG: um míssil a cada 3 s. FORK BOMB: no máximo 8 discos. BARRICADA: a cada duas batidas, uma explosão corre pela fileira e destrói os blocos dos lados.
- [ ] Os blocos são mais duros, algumas fileiras deslizam e as cápsulas ruins também caem.

### INFINITO
- [ ] Deixe os blocos chegarem na linha tracejada: um feixe sobe da linha e destrói as três fileiras de baixo, você perde uma vida e o disco volta para a plataforma.
- [ ] Aos 2:00, na chegada do chefão: um estrondo grave e um chiado curto, sem a sequência de sons de bloco quebrando.

### Menu, mapa e créditos
- [ ] Menu inicial: JOGAR (grande), BREAKERS e INFINITO são ícones com o nome embaixo. O BREAKERS tem o ícone novo (plataforma, disco e brilho).
- [ ] Mapa no topo: a rua sai de trás de um prédio.
- [ ] Os portões dos capítulos atravessam um trecho reto da rua, longe das esquinas.
- [ ] OPÇÕES > CRÉDITOS: aparece "© 2026 Vinícius Costardi. Todos os direitos reservados."

## 1.8.1 (13/11/2026)

### Mapa
- [ ] A rua das fases é feita só de retas e não se cruza. As ruas das fases bônus também são retas e não passam por cima dos prédios.
- [ ] Nada dourado nas ruas, nas estrelas das bônus nem nos parques (tudo na cor do tema). Só o banco AU do capítulo 9 é dourado.
- [ ] A fase do chefão tem o olho e o nome do chefão em cima.
- [ ] Embaixo do mapa há uma faixa fixa com CAPÍTULO, nome, chefão e mecânicas. Role o mapa: ela muda de capítulo. No topo mostra o capítulo 1 e no fim o capítulo 10 (O SISTEMA, EM BREVE). Os fechados aparecem como BLOQUEADO.

### Capítulos
- [ ] Em lugar nenhum aparece mais DISTRITO: cartões de mecânica e chefão, tela de capítulo concluído (PRÓXIMO CAPÍTULO), diário dos chefões e mapa.

### Menu e pausa
- [ ] Menu inicial: JOGAR, BREAKERS e INFINITO no meio; engrenagem e troféu nos cantos de cima, junto do sino.
- [ ] OPÇÕES tem COR DO JOGO e CRÉDITOS. O VOLTAR dessas duas telas volta para as OPÇÕES.
- [ ] Pausa: CONTINUAR grande, MAPA (ou RECOMEÇAR) e MENU embaixo; EFEITOS, MÚSICA e GUIA pequenos no canto de cima. A bolinha do ? do GUIA é da cor do tema.

### INFINITO
- [ ] Aos 2:00 os blocos estouram um atrás do outro, o disco volta sozinho para a plataforma (não dá para lançar durante isso) e o chefão entra com uma explosão.
- [ ] Depois de derrotar o chefão não aparece aviso; os blocos voltam com poucos por fileira e vão enchendo.

## 1.8 (13/11/2026)

### Mapa
- [ ] A rua das fases faz curvas e voltas e não se cruza. Role o mapa inteiro.
- [ ] Cada distrito tem um parque (árvores verdes), uma praça com chafariz (a água se mexe) e um marco: caixa d'água (1), telão com um bichinho de pixel (2), gráfico da META (3), torre do relógio com o ponteiro andando (4), placa </> piscando (5), coração batendo com contador (6), outdoor CENSURADO (7), torre de rádio com ondas (8) e banco dourado AU (9, com o distrito todo dourado).
- [ ] O hexágono de cada chefão mostra a miniatura dele no lugar do olho.
- [ ] Só o distrito em foco mostra a caixa com o nome e as mecânicas, num canto que não cobre nenhuma fase. Ela some e volta quando o foco muda de distrito.
- [ ] Com o mapa no topo, o distrito 1 fica em foco. Os liberados fora de foco estão mais apagados que antes.
- [ ] Nos distritos 2, 5 e 8 sai uma rua lateral até uma estrela dourada (BÔNUS). Ela fica tracejada até você passar da 2ª fase do distrito.

### Fases bônus
- [ ] Na primeira vez, um cartão explica a fase.
- [ ] LAG (distrito 2): a plataforma solta um míssil a cada 1,5 s enquanto o disco está em jogo.
- [ ] FORK BOMB (distrito 5): cada bloco quebrado solta mais um disco (até 20).
- [ ] BARRICADA (distrito 8): toda batida do disco explode os blocos em volta.
- [ ] Só caem cápsulas boas e caem mais moedas.
- [ ] Limpe a fase: aparece "BÔNUS +40/60/80 MOEDAS", a tela de moedas e depois o mapa, com a estrela marcada. Na segunda vez o prêmio é 10.
- [ ] Perca todas as vidas numa fase bônus: TENTAR DE NOVO recomeça a mesma fase bônus.

### Pausa e menu
- [ ] Menu inicial: BREAKERS, JOGAR (maior) e INFINITO são ícones com o nome pequeno embaixo; o INFINITO fica apagado até derrotar o SENTINELA.
- [ ] Pausa: MAPA (ou RECOMEÇAR no INFINITO), CONTINUAR (maior) e MENU em cima; EFEITOS, MÚSICA e GUIA numa fileira embaixo. Desligar efeitos ou música risca o ícone.

### INFINITO
- [ ] O começo tem poucos blocos por fileira e elas vão enchendo com o tempo.
- [ ] O primeiro chefão vem aos 2:00 e é o SENTINELA; depois vêm em ordem, um a cada 2 minutos.
- [ ] Nos últimos 5 s antes do chefão aparece uma contagem grande na tela.
- [ ] PERFURAR dura uns 3 s e atravessa quantos blocos der.

### Jogo
- [ ] Lute com o SENTINELA: caem bem menos cápsulas que antes.
- [ ] MEGA LASER: a plataforma fica travada um pouco menos.
- [ ] Com PRESSÃO (fase 3-3 ou INFINITO), a MURALHA se desfaz um pouco antes de chegar na linha tracejada.
- [ ] MÍSSIL: ele passa pela MURALHA e acerta os blocos atrás dela.
- [ ] Perca vidas até ficar com 1: o +1 VIDA aparece com mais frequência.
- [ ] Perca a última vida: a tela de FIM DE JOGO fica parada (sem tremer) e a partida do INFINITO aparece uma vez só no PLACAR.

## 1.7.2 (12/11/2026)

### INFINITO
- [ ] Na primeira partida do INFINITO aparece um cartão só, explicando o modo. Na segunda partida ele não aparece.
- [ ] Durante a partida não aparece nenhum cartão: quando entra uma mecânica, só o nome aparece no topo.
- [ ] O começo tem só 2 fileiras de blocos.
- [ ] Pegue um PERFURAR: ele dura uns 4 s ou acaba antes, depois de atravessar 10 blocos.
- [ ] Na pausa, o botão GUIA ? tem um ! quando há coisa nova. Ele abre as mecânicas em jogo e as cápsulas com animação, e as setas passam de uma para outra. As novas vêm primeiro, com NOVO. VOLTAR volta para a pausa.
- [ ] O GUIA também funciona na pausa da campanha (as mecânicas da fase e as cápsulas do distrito).

### Mapa
- [ ] Os distritos liberados estão acesos como antes. Role o mapa: o distrito do meio da tela fica mais claro, com a rua mais forte, e os outros liberados ficam um pouco apagados.
- [ ] Os fechados continuam escuros e o distrito novo ainda acende quando você derrota um chefão.

## 1.7.1 (12/11/2026)

- [ ] INFINITO: quebre todos os blocos (ou use LIMPAR BLOCOS no modo dev): fileiras novas entram rápido e o jogo segue.
- [ ] INFINITO: espere aparecer a MURALHA (blocos riscados) e deixe ela descer até a linha tracejada: ela se desfaz e você não perde vida.
- [ ] Campanha, fase 3-3 (CORTE DE GASTOS): deixe as muralhas chegarem na linha: elas se desfazem sem tirar vida; os blocos normais na linha continuam tirando.
- [ ] Os blocos da REAÇÃO têm um X (no INFINITO, depois que a REAÇÃO entra; ou com o modo dev).

## 1.7 (12/11/2026)

### Mapa
- [ ] Os distritos fechados aparecem escuros e o distrito 10 (O SISTEMA) também.
- [ ] Derrote um chefão e abra o mapa: o distrito novo acende em uns 2 segundos, piscando como um neon ligando.
- [ ] Abra o mapa de novo: o distrito continua aceso e não acende outra vez.
- [ ] Role o mapa inteiro: nenhuma caixa de distrito fica em cima de uma fase. Olhe com atenção os distritos 4, 6 e 8.

### Tutoriais
- [ ] Reset de progresso (OPÇÕES) e comece do zero: os cartões BEM-VINDO, MOVER, LANÇAR, BLOCOS, ÂNGULO e CÁPSULAS têm texto curto e uma animação.
- [ ] Entre na primeira fase do distrito 2: o cartão da GRAVIDADE tem animação e mostra as cápsulas novas (LASER e RÁPIDO) com o desenho de cada uma.
- [ ] Depois do SENTINELA, o tutorial dos perks tem 5 cartões curtos, cada um com animação.
- [ ] BREAKERS > PERKS: cada carta mostra o perk em ação no lugar do ícone grande (ativos e passivos).
- [ ] Os textos não passam da borda dos cartões.

### INFINITO
- [ ] Embaixo do relógio aparece "N PONTOS · CHEFÃO EM m:ss".
- [ ] No fim de jogo aparecem o tempo, os pontos e o recorde.
- [ ] PLACAR > AQUI: as partidas novas mostram os pontos.
- [ ] Jogue uns 3 minutos e compare com antes: caem bem menos moedas, e o chefão dá 10.
- [ ] Com o progresso só até o distrito 2 ou 3, jogue até cair uma cápsula de um distrito mais adiante (APAGÃO, INVERTIDO, BOMBA...): aparece um cartão "CÁPSULA NOVA" explicando. Na segunda vez que ela cai, não aparece mais.

### Cápsulas
- [ ] Jogue umas 3 ou 4 fases do distrito 1 sem modo dev: a mesma cápsula não cai muitas vezes seguidas e não vêm 3 ruins seguidas.
- [ ] Com 4 discos ou mais em campo, o MULTI não cai.

### Chips
- [ ] Durante a partida, os chips da conta aparecem ao lado das moedas, no canto de cima à esquerda.
- [ ] Na tela LIMPO (fase com moedas), embaixo das moedas aparece "+N CHIPS".
- [ ] Na tela de distrito concluído também aparecem os chips.

### Barra de status do celular
- [ ] No celular, comece uma fase e faça a barra de status aparecer e sumir (puxe de cima, ou saia e volte para o jogo): os blocos acompanham a moldura e a primeira fileira não encosta na borda.
- [ ] Repita no meio de uma fase com GRAVIDADE, PORTAIS ou VAZAMENTO: os núcleos, os portais e as tarjas também acompanham.
