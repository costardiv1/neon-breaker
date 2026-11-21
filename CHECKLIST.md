# Checklist de testes

O que testar em cada versão, para conferir as novidades sem jogar tudo de novo. A versão mais nova fica no topo. Use o modo dev para pular de fase quando precisar.

## 1.9.8 (21/11/2026)

### Menu e mapa
- [ ] O menu inicial tem só JOGAR e BREAKERS.
- [ ] No mapa, o INFINITO fica numa rua lateral logo depois do portão do SENTINELA. Com cadeado antes de derrotar o SENTINELA (tocar mostra DERROTE O SENTINELA PARA LIBERAR); depois a rua acende e ele abre a partida.
- [ ] Depois de zerar, uma nave pousada (NEON FIGHTERS) aparece no fim do mapa, depois da torre, e abre o FIGHTERS. Antes de zerar, ela não aparece.
- [ ] O 1x1 fica ao lado do VOLTAR.
- [ ] No fim do 1x1 e na pausa dele, MAPA volta para o mapa.

### Blocos
- [ ] Os blocos de várias batidas perdem o brilho a cada batida, e os detalhes por dentro continuam mostrando quantas faltam. Os de 1 batida não mudam.

### Tutorial
- [ ] O primeiro cartão (BEM-VINDO) mostra só CONTINUAR. A partir do segundo aparecem ‹ PULAR TUTORIAL ›.

### NEON FIGHTERS
- [ ] Tocar na tela leva a nave até o dedo, e depois ela segue o arrasto.
- [ ] No PC, a nave segue o mouse sem segurar o clique.

## 1.9.7 (19/11/2026)

### Modo 1x1
- [ ] No menu, o ícone 1x1 (duas plataformas frente a frente) abre a partida. Você fica embaixo, a IA em cima, numa cor diferente, e os blocos no meio.
- [ ] Arraste para mover e solte para lançar. Quando a IA saca, ela lança sozinha depois de um segundo.
- [ ] O disco fica na cor de quem tocou por último, e os pontos de cada um aparecem embaixo do 1 × 1.
- [ ] Deixar o disco passar tira uma vida sua (os losangos à esquerda); fazer passar pela IA tira uma dela (à direita). Quem perdeu o ponto saca.
- [ ] A IA erra de vez em quando, mais quando o disco está rápido. A partida não fica fácil nem impossível.
- [ ] Limpando todos os blocos, aparece NOVA LEVA e a faixa volta.
- [ ] No fim, VITÓRIA ou DERROTA, com o placar de vidas e o total de vitórias e derrotas. JOGAR DE NOVO e MENU funcionam.
- [ ] A pausa (canto de cima à direita) tem CONTINUAR, RECOMEÇAR e MENU.

### O ACIONISTA
- [ ] Os olhos brilham, e uma linha tracejada piscando mostra onde os dois mega lasers vão cair. Dá tempo de sair da frente.
- [ ] Ficando no lugar, o laser acerta e a plataforma encolhe (ATINGIDO). Saindo da frente, não acontece nada.
- [ ] Na fúria vêm duas rajadas seguidas, a segunda mirando onde você está.
- [ ] Indo para o canto, a mesa para na moldura.

### Tutoriais
- [ ] No tutorial do começo, ‹ e › passam as dicas para frente e para trás, e PULAR TUTORIAL fica no meio. A seta ‹ fica apagada na primeira dica.
- [ ] No tutorial dos perks, ‹ PULAR ›; na última dica, ENTENDI.
- [ ] O INFINITO não mostra mais o tutorial BEM-VINDO.

### Outros
- [ ] O sino de novidades está na cor do tema.
- [ ] O disco acelera mais devagar: no capítulo 4 ainda está bem controlável.
- [ ] No mapa, o capítulo novo pisca como neon antes de acender, com um clarão.

## 1.9.6 (16/11/2026)

### O ACIONISTA
- [x] No final, quem sai correndo é um mini ACIONISTA: cabelo penteado, olhos de cifrão, cara de susto, terno, gravata e maleta. *(testado pelo Claude)*
- [x] A mesa é mais curta e anda junto com ele. Quando o disco passa por cima dela, ele volta a descer em poucos segundos. *(testado pelo Claude)*

### Menus com ícones
- [x] FIM DE JOGO (campanha e INFINITO): TENTAR DE NOVO é um ícone grande, com MAPA ou PLACAR e MENU menores embaixo. Os ícones entram com animação e a pontuação sobe até o total. *(testado pelo Claude)*
- [x] Capítulo concluído: PRÓXIMO CAPÍTULO grande, com MOEDAS ×2 (quando dá), BREAKERS e MAPA embaixo. *(testado pelo Claude)*
- [x] Tela de moedas (LIMPO, DERROTADO, FIM DO BÔNUS): CONTINUAR e MOEDAS ×2 viraram ícones. *(testado pelo Claude)*
- [x] OPÇÕES: EFEITOS, MÚSICA, VIBRAÇÃO, COR, TUTORIAL e CRÉDITOS são ícones; os três primeiros ligam e desligam (o ícone fica riscado e apagado). *(testado pelo Claude)*

### Créditos
- [x] Os arquivos dos chefões são quadrados com o desenho de cada chefão (5 por linha) e o nome embaixo. Os que você não derrotou mostram ?. Tocar num derrotado abre o diário. *(testado pelo Claude)*
- [x] Nada fica por cima do "Feito por". Os ícones do GitHub e do Instagram abrem os links. *(testado pelo Claude)*

### Perks e BREAKERS
- [x] Com o progresso resetado, abra BREAKERS > PERKS antes de derrotar o SENTINELA: o tutorial dos perks aparece e, no fim, ENTENDI volta para a aba. *(testado pelo Claude)*
- [x] O botão ? no canto da carta de perk mostra o tutorial de novo. *(testado pelo Claude)*
- [x] Depois de derrotar o SENTINELA (e ler o diário), aparece só um cartão PERKS LIBERADOS, com DEPOIS e PERSONALIZAR. *(conferido no código pelo Claude)*
- [x] Cores, emblemas, discos, rastros e perks estão em ordem de preço, do mais barato ao mais caro. *(conferido no código pelo Claude)*

### Diário
- [ ] No celular, o texto do diário está maior e nenhuma linha passa da borda.

### INFINITO
- [ ] Sem perks, o primeiro chefão cai bem mais rápido, e dá para passar dos 7 minutos.
- [x] Segure o disco na plataforma sem lançar: os blocos não descem. Ao lançar, voltam a descer. *(testado pelo Claude)*

### Mapa
- [x] Resete o progresso e derrote o SENTINELA: no mapa, o capítulo 2 acende piscando como neon. *(testado pelo Claude)*

## 1.9.5 (16/11/2026)

### PERFURAR
- [x] Com PERFURAR, o disco atravessa e quebra blocos comuns, de várias vidas e explosivos. *(testado pelo Claude)*
- [x] Muralhas (que não quebram), blocos blindados e vazamentos rebatem o disco mesmo com PERFURAR. *(testado pelo Claude)*
- [x] Nos chefões, a armadura e os escudos rebatem o disco mesmo com PERFURAR (o ponto fraco continua tirando vida). *(conferido no código pelo Claude)*
- [x] Na BARRICADA, o disco continua atravessando os blocos a fase inteira. *(testado pelo Claude)*

### Mapa
- [x] No mapa, a torre do capítulo 10 aparece inteira, sem nenhum prédio desenhado por cima dela. *(testado pelo Claude)*

## 1.9.4 (16/11/2026)

### O ACIONISTA (chefão final)
- [x] No mapa e na barra de vida, o chefão do capítulo 10 se chama O ACIONISTA, e o cartão dele fala da mesa. *(testado pelo Claude)*
- [x] Ele fica atrás de uma mesa larga (com a plaquinha O ACIONISTA), de cabelo penteado, olhos de cifrão, terno, gravata e punhos na mesa. Os olhos seguem o disco. *(testado pelo Claude)*
- [x] A mesa e o corpo rebatem o disco. Quando ele se inclina por cima da mesa, a boca abre com dentes e uma luz: acertar a boca tira vida. *(testado pelo Claude)*
- [x] Murro na mesa: a tela treme e velas pulam da mesa e caem como blocos. Acertada antes, a vela estoura (VENDIDO!). *(testado pelo Claude)*
- [x] Balões de frases de mercado, lasers em zigue-zague e a respiração que puxa o disco continuam. *(testado pelo Claude)*
- [x] Na fúria, o cabelo se desmancha, ele sua e solta atualizações. A barra BAIXANDO ATUALIZAÇÃO tem fundo escuro e dá para ler. *(testado pelo Claude)*
- [x] Ao derrotá-lo: o gráfico despenca, a mesa racha ao meio, ele encolhe e o bonequinho foge. Depois vem a tela DERROTADO e o falso travamento. *(testado pelo Claude)*

## 1.9.3 (16/11/2026)

### Fonte
- [ ] Com o celular em modo avião, abra o jogo já instalado: os textos continuam na fonte Orbitron.

### Final
- [x] Derrote O SISTEMA: depois do crash da bolsa aparece DERROTADO com as moedas e o botão de dobrar com anúncio. CONTINUAR leva ao falso travamento. *(testado pelo Claude)*

### Mapa e modo dev
- [x] O mapa continua igual, com o capítulo 10 e a torre no fim. *(testado pelo Claude)*
- [x] Modo dev, aba Capítulo e fase: os botões de 1 a 10 aparecem em duas linhas, e o 10 leva ao capítulo 10. *(testado pelo Claude)*

## 1.9.2 (16/11/2026)

### O SISTEMA (chefão final)
- [x] ~~O rosto está de terno: ombros com lapelas dos lados, uma gravata torta e cifrões nos olhos, que seguem o disco.~~ *(desatualizado: o rosto virou O ACIONISTA na 1.9.4)*
- [x] ~~Os ombros também rebatem o disco.~~ *(desatualizado: o rosto virou O ACIONISTA na 1.9.4)*
- [x] Os balões têm frases de mercado (COMPRE!, O MERCADO SE AUTORREGULA...), em duas linhas quando são longas e sem o texto sair do balão. *(testado pelo Claude)*
- [x] Quando o balão cai, ele vira três velas de gráfico (cheias e só com contorno) e depois blocos. *(testado pelo Claude)*
- [x] Os lasers dos olhos voam em zigue-zague, deixando uma linha de gráfico. *(conferido no código pelo Claude)*
- [x] Na fúria, as frases mudam (VENDAM TUDO!, CIRCUIT BREAKER!...). *(testado pelo Claude)*
- [x] Ao derrotá-lo: o gráfico sobe e despenca, as velas caem, o letreiro corre (PÂNICO NA BOLSA, -99,9%) e ele encolhe até virar um bonequinho que corre para fora da tela ("NÃO FOI CULPA MINHA!"). Depois vem o falso travamento. *(testado pelo Claude)*
- [x] No INFINITO, depois desse crash, o jogo continua normalmente. *(testado pelo Claude)*

### BARRICADA
- [x] Só blocos simples, sem as muralhas nas pontas. *(testado pelo Claude)*

## 1.9.1 (16/11/2026)

### BARRICADA
- [x] O cartão fala do PERFURAR. Na fase, o disco fica claro e atravessa os blocos e as muralhas desde o primeiro lançamento até o fim dos 30 s. *(testado pelo Claude; desde a 1.9.2 a BARRICADA não tem muralhas)*
- [x] Não há mais explosões correndo pela fileira. *(testado pelo Claude)*

### Mapa
- [x] Jogue uma fase de um capítulo antigo (por exemplo o 8) e volte: o mapa abre nesse capítulo. *(conferido no código pelo Claude)*
- [x] Role o mapa, volte ao menu e entre de novo: ele está onde você deixou. Feche e abra o jogo: continua lá. *(conferido no código pelo Claude)*
- [x] Libere uma fase nova: o mapa vai até ela. *(conferido no código pelo Claude)*

## 1.9 (16/11/2026)

### Fases bônus (chuva de moedas)
- [x] Entre numa fase bônus: não há mesa de pinball, e uma linha tracejada (o escudo) fica embaixo da plataforma. *(testado pelo Claude)*
- [x] Deixe o disco passar da plataforma: ele bate no escudo e volta. Se havia combo, aparece COMBO PERDIDO. *(testado pelo Claude)*
- [x] Quebre blocos sem deixar o disco tocar o escudo: o combo sobe (x2, x3, x4, com um som), aparece no topo e mais moedas caem. *(testado pelo Claude)*
- [x] Pegue as moedas com a plataforma. Quando o campo esvazia, aparece NOVA LEVA e os blocos voltam. *(testado pelo Claude)*
- [x] Depois de 30 s: FIM DO BÔNUS com o total de moedas, e o anúncio dobra as moedas. *(testado pelo Claude)*
- [x] Jogue de novo a mesma fase: caem bem menos moedas (até 10). *(conferido no código pelo Claude)*

### Capítulo 10 e ATUALIZAÇÃO
- [x] No mapa, o capítulo 10 tem as fases 10-1 a 10-4 e o chefão. A rua vai reta até a torre, que fica ao lado das últimas fases. *(testado pelo Claude)*
- [x] Na 10-1, o cartão da ATUALIZAÇÃO mostra a animação da barra. *(conferido no código pelo Claude)*
- [x] Depois do lançamento, aparece PRÓXIMA ATUALIZAÇÃO EM N s. Nos últimos 3 s, a barra BAIXANDO ATUALIZAÇÃO enche com o ícone e o nome. Então aparece ATUALIZADO e a mecânica troca (portais somem, entra a gravidade...). *(testado pelo Claude)*
- [x] KERNEL: com o VAZAMENTO, um bloco vira gota. Quando a mecânica troca, a gota volta a ser um bloco comum e a fase ainda pode ser limpa. *(testado pelo Claude)*
- [ ] A música do capítulo 10 é alegre e "engasga" no fim.

### Chefão final: O SISTEMA
- [x] ~~Um rosto de pixels sorrindo, que olha para o disco e pisca.~~ *(desatualizado: O SISTEMA virou O ACIONISTA na 1.9.4)*
- [x] ~~Quando a boca abre (dentes e uma luz branca), acertar entre as bochechas tira vida. Fechada, ela só rebate.~~ *(desatualizado: O SISTEMA virou O ACIONISTA na 1.9.4)*
- [x] ~~Ele fala em balões ("ACEITE OS TERMOS"...). O balão cai e vira blocos; acertado antes, estoura (CALADO!).~~ *(desatualizado: as frases viraram frases de mercado na 1.9.2; o CALADO! continua)*
- [x] Os olhos se acendem e disparam lasers. A boca vira um O e puxa o disco (ENGOLIDO), depois cospe de volta. *(conferido no código pelo Claude)*
- [x] ~~A cada acerto, pixels voam do rosto. Na fúria, ele dá defeito, fica bravo, muda as frases e solta atualizações (barra embaixo da vida).~~ *(desatualizado: O SISTEMA virou O ACIONISTA na 1.9.4)*
- [x] Ao derrotá-lo: falso travamento → CONTINUAR → registro 10 → "carregando NEON FIGHTERS..." → CONTINUAR. *(testado pelo Claude)*

### NEON FIGHTERS
- [x] Título NEON FIGHTERS, depois HORDA 1. A nave tem as cores e o emblema do seu breaker. *(testado pelo Claude)*
- [ ] Arraste: a nave segue o dedo sem ficar embaixo dele, e o tiro é automático.
- [x] Os dardos miram e mergulham, e os tanques atiram em leque. A cápsula P dá TIRO TRIPLO e depois TIRO RÁPIDO. *(conferido no código pelo Claude)*
- [x] Ao levar dano, a nave pisca e perde um escudo (são 3 no topo, à esquerda). *(conferido no código pelo Claude)*
- [x] Aos 2 min 30: ALERTA, e a nave-mãe A COLMEIA (barra de vida no topo, FÚRIA na metade). *(testado pelo Claude)*
- [x] Vencendo: NAVE-MÃE DERRUBADA · NEON FIGHTERS · EM BREVE, com pontos e recorde. Perdendo: FIM DA DEMO. *(testado pelo Claude)*
- [x] O pause (II) e trocar de app pausam a demo. No menu inicial aparece o botão FIGHTERS. *(conferido no código pelo Claude)*

### Breakers
- [x] Derrotar O CENSOR, O BLINDADO e O CONSELHO libera DEGRAU, ESCUDO e COROA. O ESCUDO fica mais largo na partida. *(conferido no código pelo Claude)*
- [x] Cada um tem a sua animação ao bater e a sua moldura do emblema. *(conferido no código pelo Claude)*

### INFINITO
- [x] Depois do CONSELHO, o próximo chefão é O SISTEMA. Ao derrotá-lo, o jogo continua normalmente. *(testado pelo Claude)*

## 1.8.3 (13/11/2026)

### Fases bônus (mesa de pinball)
- [x] Entre numa fase bônus com um perk equipado: o botão do perk não aparece e o toque duplo não faz nada. *(testado pelo Claude)*
- [x] ~~Nenhum bloco solta cápsula nem moeda.~~ *(desatualizado: a chuva de moedas da 1.9 solta moedas)*
- [x] ~~Há 3 bumpers redondos no meio do campo: o disco bate, sai mais rápido e o bumper pisca com um "plim".~~ *(desatualizado: a mesa de pinball saiu na 1.9)*
- [x] ~~As letras B-Ô-N-U-S embaixo dos blocos acendem quando o disco bate. Com as cinco acesas: "BÔNUS! +3 NO POTE", elas piscam e apagam de novo.~~ *(desatualizado: a mesa de pinball saiu na 1.9)*
- [x] ~~No topo aparece "POTE N" e o combo (x2, x3...) sobe a cada batida na mesa; quando o disco toca a plataforma, o combo some. O pote para em 12 (CHEIO).~~ *(desatualizado: a mesa de pinball saiu na 1.9)*
- [x] ~~Limpe a fase: aparece "POTE +N MOEDAS" e o prêmio do bônus. Na tela de recompensa, o anúncio dobra tudo.~~ *(desatualizado: a mesa de pinball saiu na 1.9)*
- [x] ~~Deixe o disco cair com o pote cheio: FIM DO BÔNUS (O DISCO CAIU · FICA O POTE) e você recebe o pote. Com o pote vazio aparece SEM PRÊMIO.~~ *(desatualizado: a mesa de pinball saiu na 1.9)*
- [x] ~~Os textos dos cartões das três fases falam dos bumpers e das letras.~~ *(desatualizado: a mesa de pinball saiu na 1.9)*

### Modo dev
- [x] Abra o painel DEV: ele ocupa cerca de um terço da tela, é meio transparente e tem abas com ícones no topo (Jogo, Gráficos, Capítulo e fase, Breaker, Cápsulas), com uma seção por vez. *(testado pelo Claude)*
- [x] Arraste o painel pela barra de cima para outro canto; feche e abra o jogo de novo: ele volta no mesmo lugar e na mesma aba. *(conferido no código pelo Claude)*
- [x] O botão – recolhe o painel num botão pequeno 🛠️, que abre de novo. *(testado pelo Claude)*

### Menu e mapa
- [x] Menu inicial: o ícone do BREAKERS é só a curva do breaker ARCO. *(testado pelo Claude)*
- [x] Mapa, capítulo 8: a estrela BÔNUS · BARRICADA aparece ao lado da 8-3, dentro da tela, com o nome livre. *(testado pelo Claude)*
- [x] Mapa, capítulo 6: o coração de curtidas está na cor do tema. As luzinhas da CENSURA e da rádio da RESISTÊNCIA continuam vermelhas. *(testado pelo Claude)*
- [x] Mapa, capítulo 9: o banco AURUM é dourado em qualquer tema (teste no verde). *(testado pelo Claude)*

### Correções
- [x] ONDA DE CHOQUE: dispare e mova a plataforma; o arco fica parado onde começou. *(conferido no código pelo Claude)*
- [ ] MEGA LASER: o brilho de carga começa apagado e acende.
- [ ] Celular com o neon desligado: textos, botões e blocos com a mesma cara de antes.

## 1.8.2 (13/11/2026)

### Fases bônus
- [x] ~~Entre numa fase bônus: o relógio no topo marca 0:40 e só começa a correr quando você lança o disco. Nos últimos 10 s ele pisca.~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~Deixe o disco cair: aparece FIM DO BÔNUS (O DISCO CAIU · SEM PRÊMIO), você não perde vida, fica com as moedas que pegou e volta para o mapa.~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~Deixe o tempo acabar: FIM DO BÔNUS (TEMPO ESGOTADO · SEM PRÊMIO).~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~Limpe uma fase bônus pela primeira vez: o prêmio é 15 (LAG), 20 (FORK BOMB) ou 25 (BARRICADA). Na segunda vez é 3.~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~LAG: um míssil a cada 3 s. FORK BOMB: no máximo 8 discos. BARRICADA: a cada duas batidas, uma explosão corre pela fileira e destrói os blocos dos lados.~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~Os blocos são mais duros, algumas fileiras deslizam e as cápsulas ruins também caem.~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*

### INFINITO
- [x] Deixe os blocos chegarem na linha tracejada: um feixe sobe da linha e destrói as três fileiras de baixo, você perde uma vida e o disco volta para a plataforma. *(testado pelo Claude)*
- [ ] Aos 2:00, na chegada do chefão: um estrondo grave e um chiado curto, sem a sequência de sons de bloco quebrando.

### Menu, mapa e créditos
- [x] ~~Menu inicial: JOGAR (grande), BREAKERS e INFINITO são ícones com o nome embaixo. O BREAKERS tem o ícone novo (plataforma, disco e brilho).~~ *(desatualizado: o ícone do BREAKERS virou a curva do ARCO na 1.8.3)*
- [x] Mapa no topo: a rua sai de trás de um prédio. *(testado pelo Claude)*
- [x] Os portões dos capítulos atravessam um trecho reto da rua, longe das esquinas. *(testado pelo Claude)*
- [x] OPÇÕES > CRÉDITOS: aparece "© 2026 Vinícius Costardi. Todos os direitos reservados." *(testado pelo Claude)*

## 1.8.1 (13/11/2026)

### Mapa
- [x] A rua das fases é feita só de retas e não se cruza. As ruas das fases bônus também são retas e não passam por cima dos prédios. *(testado pelo Claude)*
- [x] Nada dourado nas ruas, nas estrelas das bônus nem nos parques (tudo na cor do tema). Só o banco AU do capítulo 9 é dourado. *(testado pelo Claude)*
- [x] A fase do chefão tem o olho e o nome do chefão em cima. *(testado pelo Claude)*
- [x] Embaixo do mapa há uma faixa fixa com CAPÍTULO, nome, chefão e mecânicas. Role o mapa: ela muda de capítulo. No topo mostra o capítulo 1 e no fim o capítulo 10 (O SISTEMA, EM BREVE). Os fechados aparecem como BLOQUEADO. *(testado pelo Claude; o capítulo 10 é jogável desde a 1.9, sem EM BREVE)*

### Capítulos
- [x] Em lugar nenhum aparece mais DISTRITO: cartões de mecânica e chefão, tela de capítulo concluído (PRÓXIMO CAPÍTULO), diário dos chefões e mapa. *(conferido no código pelo Claude)*

### Menu e pausa
- [x] Menu inicial: JOGAR, BREAKERS e INFINITO no meio; engrenagem e troféu nos cantos de cima, junto do sino. *(testado pelo Claude)*
- [x] OPÇÕES tem COR DO JOGO e CRÉDITOS. O VOLTAR dessas duas telas volta para as OPÇÕES. *(testado pelo Claude)*
- [x] Pausa: CONTINUAR grande, MAPA (ou RECOMEÇAR) e MENU embaixo; EFEITOS, MÚSICA e GUIA pequenos no canto de cima. A bolinha do ? do GUIA é da cor do tema. *(testado pelo Claude)*

### INFINITO
- [x] Aos 2:00 os blocos estouram um atrás do outro, o disco volta sozinho para a plataforma (não dá para lançar durante isso) e o chefão entra com uma explosão. *(testado pelo Claude)*
- [x] Depois de derrotar o chefão não aparece aviso; os blocos voltam com poucos por fileira e vão enchendo. *(conferido no código pelo Claude)*

## 1.8 (13/11/2026)

### Mapa
- [x] ~~A rua das fases faz curvas e voltas e não se cruza. Role o mapa inteiro.~~ *(desatualizado: a rua é só de retas desde a 1.8.1)*
- [x] Cada distrito tem um parque (árvores verdes), uma praça com chafariz (a água se mexe) e um marco: caixa d'água (1), telão com um bichinho de pixel (2), gráfico da META (3), torre do relógio com o ponteiro andando (4), placa </> piscando (5), coração batendo com contador (6), outdoor CENSURADO (7), torre de rádio com ondas (8) e banco dourado AU (9, com o distrito todo dourado). *(testado pelo Claude)*
- [x] ~~O hexágono de cada chefão mostra a miniatura dele no lugar do olho.~~ *(desatualizado: desde a 1.8.1 o chefão tem o olho e o nome em cima)*
- [x] ~~Só o distrito em foco mostra a caixa com o nome e as mecânicas, num canto que não cobre nenhuma fase. Ela some e volta quando o foco muda de distrito.~~ *(desatualizado: virou a faixa fixa embaixo do mapa na 1.8.1)*
- [x] Com o mapa no topo, o distrito 1 fica em foco. Os liberados fora de foco estão mais apagados que antes. *(testado pelo Claude)*
- [x] Nos distritos 2, 5 e 8 sai uma rua lateral até uma estrela dourada (BÔNUS). Ela fica tracejada até você passar da 2ª fase do distrito. *(testado pelo Claude; a estrela é da cor do tema desde a 1.8.1)*

### Fases bônus
- [x] Na primeira vez, um cartão explica a fase. *(conferido no código pelo Claude)*
- [x] ~~LAG (distrito 2): a plataforma solta um míssil a cada 1,5 s enquanto o disco está em jogo.~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~FORK BOMB (distrito 5): cada bloco quebrado solta mais um disco (até 20).~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~BARRICADA (distrito 8): toda batida do disco explode os blocos em volta.~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~Só caem cápsulas boas e caem mais moedas.~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~Limpe a fase: aparece "BÔNUS +40/60/80 MOEDAS", a tela de moedas e depois o mapa, com a estrela marcada. Na segunda vez o prêmio é 10.~~ *(desatualizado: as fases bônus viraram chuva de moedas na 1.9)*
- [x] ~~Perca todas as vidas numa fase bônus: TENTAR DE NOVO recomeça a mesma fase bônus.~~ *(desatualizado: na chuva de moedas o escudo segura o disco)*

### Pausa e menu
- [x] ~~Menu inicial: BREAKERS, JOGAR (maior) e INFINITO são ícones com o nome pequeno embaixo; o INFINITO fica apagado até derrotar o SENTINELA.~~ *(desatualizado: o menu mudou na 1.8.1)*
- [x] ~~Pausa: MAPA (ou RECOMEÇAR no INFINITO), CONTINUAR (maior) e MENU em cima; EFEITOS, MÚSICA e GUIA numa fileira embaixo. Desligar efeitos ou música risca o ícone.~~ *(desatualizado: a pausa mudou na 1.8.1)*

### INFINITO
- [x] O começo tem poucos blocos por fileira e elas vão enchendo com o tempo. *(conferido no código pelo Claude)*
- [x] O primeiro chefão vem aos 2:00 e é o SENTINELA; depois vêm em ordem, um a cada 2 minutos. *(testado pelo Claude)*
- [x] Nos últimos 5 s antes do chefão aparece uma contagem grande na tela. *(testado pelo Claude)*
- [x] PERFURAR dura uns 3 s e atravessa quantos blocos der. *(você testou na 1.7.2)*

### Jogo
- [ ] Lute com o SENTINELA: caem bem menos cápsulas que antes.
- [x] MEGA LASER: a plataforma fica travada um pouco menos. *(conferido no código pelo Claude)*
- [x] Com PRESSÃO (fase 3-3 ou INFINITO), a MURALHA se desfaz um pouco antes de chegar na linha tracejada. *(testado pelo Claude)*
- [x] MÍSSIL: ele passa pela MURALHA e acerta os blocos atrás dela. *(conferido no código pelo Claude)*
- [x] Perca vidas até ficar com 1: o +1 VIDA aparece com mais frequência. *(conferido no código pelo Claude)*
- [x] Perca a última vida: a tela de FIM DE JOGO fica parada (sem tremer) e a partida do INFINITO aparece uma vez só no PLACAR. *(conferido no código pelo Claude)*

## 1.7.2 (12/11/2026)

### INFINITO
- [x] Na primeira partida do INFINITO aparece um cartão só, explicando o modo. Na segunda partida ele não aparece.
- [x] Durante a partida não aparece nenhum cartão: quando entra uma mecânica, só o nome aparece no topo.
- [x] O começo tem só 2 fileiras de blocos.
- [x] Pegue um PERFURAR: ele dura uns 3 s e atravessa os blocos comuns, sem limite de blocos (desde a 1.8). Muralhas e blocos blindados ainda rebatem o disco (desde a 1.9.5).
- [x] Na pausa, o botão GUIA ? tem um ! quando há coisa nova. Ele abre as mecânicas em jogo e as cápsulas com animação, e as setas passam de uma para outra. As novas vêm primeiro, com NOVO. VOLTAR volta para a pausa.
- [x] O GUIA também funciona na pausa da campanha (as mecânicas da fase e as cápsulas do distrito).

### Mapa
- [x] Os distritos liberados estão acesos como antes. Role o mapa: o distrito do meio da tela fica mais claro, com a rua mais forte, e os outros liberados ficam um pouco apagados. *(testado pelo Claude)*
- [x] Os fechados continuam escuros e o distrito novo ainda acende quando você derrota um chefão. *(testado pelo Claude)*

## 1.7.1 (12/11/2026)

- [x] INFINITO: quebre todos os blocos (ou use LIMPAR BLOCOS no modo dev): fileiras novas entram rápido e o jogo segue.
- [x] INFINITO: espere aparecer a MURALHA (blocos riscados) e deixe ela descer até a linha tracejada: ela se desfaz e você não perde vida.
- [x] Campanha, fase 3-3 (CORTE DE GASTOS): deixe as muralhas chegarem na linha: elas se desfazem sem tirar vida; os blocos normais na linha continuam tirando. *(testado pelo Claude)*
- [x] Os blocos da REAÇÃO têm um X (no INFINITO, depois que a REAÇÃO entra; ou com o modo dev).

## 1.7 (12/11/2026)

### Mapa
- [x] Os distritos fechados aparecem escuros e o distrito 10 (O SISTEMA) também.
- [x] Derrote um chefão e abra o mapa: o distrito novo acende em uns 2 segundos, piscando como um neon ligando. *(testado pelo Claude)*
- [x] Abra o mapa de novo: o distrito continua aceso e não acende outra vez. *(testado pelo Claude)*
- [x] Role o mapa inteiro: nenhuma caixa de distrito fica em cima de uma fase. Olhe com atenção os distritos 4, 6 e 8.

### Tutoriais
- [x] Reset de progresso (OPÇÕES) e comece do zero: os cartões BEM-VINDO, MOVER, LANÇAR, BLOCOS, ÂNGULO e CÁPSULAS têm texto curto e uma animação.
- [x] Entre na primeira fase do distrito 2: o cartão da GRAVIDADE tem animação e mostra as cápsulas novas (LASER e RÁPIDO) com o desenho de cada uma.
- [x] Depois do SENTINELA, o tutorial dos perks tem 5 cartões curtos, cada um com animação.
- [x] BREAKERS > PERKS: cada carta mostra o perk em ação no lugar do ícone grande (ativos e passivos).
- [x] Os textos não passam da borda dos cartões.

### INFINITO
- [x] Embaixo do relógio aparece "N PONTOS · CHEFÃO EM m:ss".
- [x] No fim de jogo aparecem o tempo, os pontos e o recorde.
- [x] PLACAR > AQUI: as partidas novas mostram os pontos.
- [x] Jogue uns 3 minutos e compare com antes: caem bem menos moedas, e o chefão dá 10.
- [x] Com o progresso só até o distrito 2 ou 3, jogue até cair uma cápsula de um distrito mais adiante (APAGÃO, INVERTIDO, BOMBA...): aparece um cartão "CÁPSULA NOVA" explicando. Na segunda vez que ela cai, não aparece mais.

### Cápsulas
- [x] Jogue umas 3 ou 4 fases do distrito 1 sem modo dev: a mesma cápsula não cai muitas vezes seguidas e não vêm 3 ruins seguidas.
- [x] Com 4 discos ou mais em campo, o MULTI não cai.

### Chips
- [x] Durante a partida, os chips da conta aparecem ao lado das moedas, no canto de cima à esquerda.
- [x] Na tela LIMPO (fase com moedas), embaixo das moedas aparece "+N CHIPS".
- [x] Na tela de distrito concluído também aparecem os chips.

### Barra de status do celular
- [x] No celular, comece uma fase e faça a barra de status aparecer e sumir (puxe de cima, ou saia e volte para o jogo): os blocos acompanham a moldura e a primeira fileira não encosta na borda.
- [x] Repita no meio de uma fase com GRAVIDADE, PORTAIS ou VAZAMENTO: os núcleos, os portais e as tarjas também acompanham.
