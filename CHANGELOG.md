# Changelog

Todas as mudanças do **Neon Breaker**. As versões 0.1 a 0.9 foram alphas; a 1.0 foi o primeiro lançamento oficial.

## [1.13.0] · 26/11/2026 · Blocos com ?: as cápsulas saem só deles

### Adicionado

- Blocos com ?: agora as cápsulas só caem deles. Cada fase tem de 3 a 6 (um a cada 6,5 blocos), espalhados da fileira da frente até a do fundo, e em lugares diferentes cada vez que a fase começa. Um ? solta um power-up, ou um debuff 1 vez em cada 4 (menos com o perk SORTE). Nas lutas com chefão há sempre um ? na faixa de blocos (dois na fúria): quebrado, outro aparece em outro bloco depois de 5 s, e um ? que ninguém pega pula para outro bloco a cada 12 s. No INFINITO, cada fileira nova tem 35% de chance de trazer um ?.
- 1x1 com blocos de ?: cada leva tem 4 (um na fileira de cada jogador e dois nas do meio), e só eles soltam cápsulas, que vão na direção de quem quebrou. Um ? quebrado volta em outro bloco 4 s depois.
- Modo dev: o painel flutuante ganhou desbloquear tudo (e perks) e resetar progresso (com um segundo toque para confirmar).
- OPÇÕES › RESETAR PROGRESSO, embaixo de CRÉDITOS: o primeiro toque mostra CONFIRMAR? por 3 s e o segundo zera fases, recorde, chips, moedas, perks e itens.

### Alterado

- O menu BREAKERS segue o estilo dos outros menus: as abas são retângulos com ícone em cima do nome (a aberta fica acesa), o COMPRAR tem o ícone da moeda, TRACEJADA e DETALHES viraram linhas com switch, e os botões dos perks (COMPRAR/EVOLUIR e EQUIPAR) ficaram maiores, com ícone.
- A tela CONFIG. DEV saiu das OPÇÕES: o que só existia nela foi para o painel flutuante do modo dev.
- A linha MODO DEV continua nas OPÇÕES depois de desligada, com o switch apagado, e liga de novo com um toque, sem precisar da senha. O DESATIVAR do menu secreto (5 toques na versão) tranca o modo dev de novo e tira a linha.
- As OPÇÕES ficam centralizadas na tela, entre o título e o VOLTAR.
- Os blocos comuns não soltam mais cápsulas ao acaso (eram 13%), e acertar o chefão também não (eram 20%): toda cápsula vem de um ?. No painel dev, o controle Cápsulas aleatórias começa em só ? e ainda liga a queda aleatória para testes.
- No PC (sem toque), o jogo tem sempre o formato de um celular, 720 × 1560: mudar o tamanho do navegador só aumenta ou diminui o jogo, com faixas escuras em volta. No celular ele continua enchendo a tela.

### Corrigido

- Ao desligar o modo dev (ou o desbloquear tudo), as peças da plataforma que o jogador não comprou nem liberou voltam para as gratuitas.
- BREAKERS: as bolinhas embaixo do nome seguem a ordem das setas, então a SISTEMA aparece em primeiro nas CORES; no RASTRO a ordem é PADRÃO, FAÍSCAS, PRISMA, PALETA, HÉLICE DUPLA, ECO e, por último, DESLIGADO.
- Os rastros PADRÃO, PRISMA e PALETA ficavam fracos com o brilho neon desligado ou baixo: agora ficam mais grossos e fortes nesse caso.

## [1.12.4] · 23/11/2026 · OPÇÕES em lista e cápsulas com ícone no 1x1

### Adicionado

- OPÇÕES › TUTORIAL agora diz VER e mostra só os cartões do tutorial, no meio da tela, sem entrar no jogo: as setas ‹ › passam os 7 cartões e o VOLTAR volta para as OPÇÕES.

### Alterado

- A numeração das versões foi corrigida daqui para frente: o segundo número muda quando entra algo grande e novo (modo, chefão, capítulo) e o terceiro nos ajustes. Recontando desde a 1.9, a 1.11.3 seria a 1.12.3, por isso esta versão é a 1.12.4.
- OPÇÕES em lista, uma linha embaixo da outra, com o ícone à esquerda do nome: EFEITOS, MÚSICA e VIBRAÇÃO têm um switch à direita; SENSIBILIDADE, QUALIDADE e NEON mostram o valor entre as setas ‹ ›; TUTORIAL e CRÉDITOS têm uma seta ›. SENSIBILIDADE, QUALIDADE, NEON e o modo dev ganharam ícones.
- O botão OPÇÕES do menu inicial voltou para a cor do tema, um pouco esmaecida.
- 1x1: as cápsulas mostram um ícone no lugar do nome, como as da campanha (MAIOR, MENOR, VELOZ, ESCUDO, +1 DISCO e INVERTE).

### Corrigido

- 1x1: as plataformas não atravessam mais a borda do campo, nem quando crescem encostadas na parede.

## [1.11.3] · 23/11/2026 · Todos os menus no estilo do menu inicial

### Alterado

- Todos os menus seguem o estilo do menu inicial: retângulos com o ícone em cima e o nome embaixo. As pausas (fases, 1x1 e FIGHTERS), o fim de jogo, o capítulo concluído, a recompensa e as telas finais do 1x1 e do FIGHTERS viraram uma lista, um botão embaixo do outro, com o primeiro um pouco maior.
- Os botões do rodapé (VOLTAR, CANCELAR, CONTINUAR e PULAR) ganharam ícone e o mesmo formato, em todas as telas.
- O sino (NOVIDADES) e o troféu (PLACAR) saíram do menu inicial. O placar do INFINITO continua no fim de jogo do INFINITO.
- A cor do tema saiu das OPÇÕES e virou um ícone redondo de paleta no canto superior direito do menu inicial. As OPÇÕES ficaram com EFEITOS, MÚSICA, VIBRAÇÃO, TUTORIAL e CRÉDITOS, também em retângulos.

## [1.11.2] · 23/11/2026 · Bipe da contagem no 1x1 e ícone do MINI DISCO

### Alterado

- 1x1: a contagem NOVA LEVA EM 3, 2, 1 ganhou um bipe próprio, bem mais audível que o clique dos botões: um bipe em cada número (inclusive no 3), mais agudo no 1, e o pulso quando os blocos voltam.
- Cápsula MINI DISCO com o ícone da mesma família do MEGA DISCO: um anel com um ponto no meio, só que pequeno.
- O 1x1 voltou para o menu inicial, ao lado do BREAKERS, e saiu do mapa (lá fica só o VOLTAR). No fim e na pausa do 1x1, o botão MAPA virou MENU.
- Menu inicial em lista: botões retangulares um embaixo do outro, cada um com o ícone em cima e o nome embaixo: JOGAR (um pouco maior), BREAKERS, 1x1 e OPÇÕES, este numa cor fixa (branco acinzentado) que não muda com o tema. A engrenagem saiu do canto; o troféu e o sino continuaram em cima.
- 1x1: o mesmo tempo para lançar dos dois lados. Quem está embaixo também tem 6 s para soltar o dedo; depois disso o disco sai sozinho, como já era com o jogador de cima no modo 2 jogadores. Vale também contra a IA.

## [1.11.1] · 21/11/2026 · O disco da campanha no 1x1 e o INFINITO depois da 2-1

### Alterado

- 1x1 com o disco e o rastro do resto do jogo: os discos usam o desenho e o rastro escolhidos no BREAKERS, com os mesmos efeitos de batida da campanha (a luz na plataforma, as faíscas, os blocos se desfazendo em quadradinhos e os anéis). Cada disco continua na cor de quem tocou nele por último.
- Mapa: a rua do INFINITO agora sai depois da fase 2-1, e não logo depois do SENTINELA, para combinar com o caminho. O INFINITO é liberado ao vencer a 2-1.

## [1.11.0] · 21/11/2026 · 1x1 com 2 jogadores no mesmo celular

### Adicionado

- 1x1 com 2 jogadores: ao tocar no 1x1 no mapa, o jogador escolhe CONTRA A IA ou 2 JOGADORES. Com 2 jogadores, o celular fica deitado entre os dois e cada um arrasta na sua metade da tela; os dois podem mexer ao mesmo tempo, e cada um solta o dedo para lançar o seu disco. Os textos de quem está em cima (cápsulas, -1 VIDA, SOLTE PARA LANÇAR e quem venceu) aparecem virados para ele. No HUD os lados viram J1 (embaixo) e J2 (em cima). As partidas de 2 jogadores não contam nas vitórias e derrotas contra a IA.

## [1.10.1] · 21/11/2026 · 1x1 com o visual da campanha

### Adicionado

- Contagem regressiva antes da NOVA LEVA no 1x1: quando a faixa é limpa, aparece NOVA LEVA EM 3, 2, 1 no meio do campo, e depois os blocos acendem um de cada vez, em ordem aleatória. Os discos só batem nos blocos que já apareceram.

### Alterado

- O 1x1 ganhou o visual da campanha: os mesmos blocos das fases (com os detalhes de batidas e o brilho apagando a cada batida), o quadriculado do fundo e a moldura com os cantos arredondados. Cada metade do campo fica na cor do seu lado, com luzes correndo pelas bordas e um brilho quando um disco bate nelas.

### Corrigido

- A cápsula VELOZ deixava o disco rápido nas duas direções. Agora ele só fica mais rápido indo para o lado do adversário; voltando de um bloco ou do escudo, retoma a velocidade normal.

## [1.10.0] · 21/11/2026 · 1x1 com dois discos e cápsulas

### Adicionado

- 1x1 com dois discos: cada lado saca o seu, então sempre tem um vindo na sua direção. Deixar qualquer um passar tira uma vida, e o disco perdido volta para quem o deixou passar. São 7 vidas para cada um.
- Cápsulas no 1x1: às vezes um bloco quebrado solta uma cápsula, que vai na direção de quem quebrou o bloco. Quem pega fica com o efeito: MAIOR (plataforma maior), MENOR (a do outro encolhe), VELOZ (os discos que você rebate saem mais rápidos), ESCUDO (uma barreira que devolve um disco uma vez), +1 DISCO (sai mais um disco da sua plataforma) e INVERTE (o controle do outro fica invertido por 4 s). A IA também vai atrás das cápsulas dela. Os efeitos ativos aparecem perto de cada plataforma, com o tempo que falta.

### Alterado

- No 1x1, os discos começam mais lentos (500) e chegam no máximo a 740, para dar tempo de cuidar dos dois. A IA acompanha o próprio disco depois de rebater e reage mais rápido quando ele volta dos blocos.

## [1.9.9] · 21/11/2026 · Uma IA mais humana no 1x1

### Alterado

- A IA do 1x1 joga como uma pessoa: demora um pouco para reagir depois da sua rebatida (às vezes demora mais), acelera e freia em vez de deslizar reto, passa um pouco do ponto e corrige, e só acerta a leitura conforme o disco chega perto. De vez em quando ela vai para o lado errado quando o disco vai bater na parede, e erra mais com o disco rápido e em ângulo fechado. Com o disco longe, ela volta para o meio sem pressa. Ficou mais fácil de ganhar: nos testes, um jogador médio passou a vencer cerca de 6 em cada 10 partidas (antes eram 3 ou 4).

## [1.9.8] · 21/11/2026 · Os modos no mapa, blocos que apagam a cada batida

### Adicionado

- Os blocos perdem o brilho a cada batida, como no 1x1: o brilho cai conforme a vida que o bloco tinha no começo, e os detalhes por dentro continuam mostrando quantas batidas faltam.

### Alterado

- Os modos saíram do menu inicial e foram para o mapa, onde são liberados. O INFINITO fica numa rua lateral logo depois do portão do SENTINELA, com cadeado até ele ser derrotado. O NEON FIGHTERS virou um easter egg: depois de zerar, uma nave pousada aparece escondida depois da torre, no fim do mapa. O 1x1 fica num ícone ao lado do VOLTAR. O menu inicial ficou só com JOGAR e BREAKERS. No fim do 1x1 e na pausa, MAPA leva de volta ao mapa.
- Tutorial: o primeiro cartão, que aparece sozinho, mostra só CONTINUAR. A partir do segundo aparecem as setas ‹ › e PULAR TUTORIAL.
- NEON FIGHTERS: tocar na tela leva a nave até o dedo (um pouco acima dele), e depois ela segue o arrasto. No PC, a nave segue o mouse sem precisar segurar o clique.

## [1.9.7] · 19/11/2026 · Modo 1x1 contra a IA e os mega lasers do ACIONISTA

### Adicionado

- Modo 1x1 no menu inicial: frente a frente contra a IA. A sua plataforma fica embaixo, a da IA em cima e uma faixa de blocos no meio. Quem deixa o disco passar perde uma vida (3 para cada um). O disco fica na cor de quem tocou nele por último, os blocos dão pontos para essa pessoa e a faixa volta quando é limpa. Vitórias e derrotas ficam salvas.
- Tutoriais com setas: os cartões do tutorial e do tutorial dos perks têm botões redondos ‹ e › para voltar e passar as dicas, com PULAR no meio.

### Alterado

- O ACIONISTA: os lasers em zigue-zague viraram dois mega lasers que saem dos olhos. Antes, uma linha tracejada pisca mostrando onde eles vão cair, e dá tempo de sair da frente. Na fúria são duas rajadas seguidas.
- O disco acelera mais devagar ao longo da campanha: começa em 600 e ganha 5 por fase (845 na última). Antes chegava a 900 já no capítulo 4.
- O sino de novidades fica na cor do tema, como os outros ícones.

### Corrigido

- O INFINITO mostrava o tutorial BEM-VINDO toda vez, e CONTINUAR fechava tudo.
- O pisca-pisca dos capítulos no mapa quase não aparecia. Agora o neon pisca de verdade, com um clarão e um estalo.
- A ponta da mesa do ACIONISTA passava da moldura do campo quando ele ia para o canto.

## [1.9.6] · 16/11/2026 · Menus com ícones, créditos com os chefões e INFINITO mais justo

### Adicionado

- CRÉDITOS: os arquivos dos chefões viraram quadrados com o desenho de cada chefão (5 por linha), e os links do repositório e do Instagram viraram os ícones do GitHub e do Instagram.
- A aba PERKS ganhou um botão ? que mostra o tutorial dos perks a qualquer hora.

### Alterado

- O tutorial dos perks agora aparece na primeira vez que o jogador abre a aba PERKS, mesmo antes do SENTINELA. Depois do SENTINELA vem só um cartão perguntando se ele quer personalizar a plataforma.
- FIM DE JOGO, capítulo concluído e a tela de moedas ganharam ícones no lugar dos botões de texto, como a pausa. Os botões entram com uma animação e a pontuação conta até o total.
- OPÇÕES: efeitos, música, vibração, cor, tutorial e créditos viraram ícones; as configurações com valor continuam em linhas.
- BREAKERS: cores, emblemas, discos, rastros e perks aparecem em ordem de preço, do mais barato ao mais caro.
- O bonequinho que foge no final do ACIONISTA agora é um mini ACIONISTA: a mesma cabeça (cabelo, olhos de cifrão, cara de susto), terno, gravata e uma maleta.
- A mesa do ACIONISTA é mais curta e anda junto com ele, então o disco que passa por cima dela volta a descer rápido.
- INFINITO mais justo sem perks: os chefões vêm com 60% da vida (mais a cada volta), e a velocidade do disco, a descida dos blocos e a quantidade de blocos sobem mais devagar.
- O texto do diário está maior.

### Corrigido

- Com o disco esperando na plataforma, os blocos continuavam descendo e passavam da linha sem tirar vida. Agora eles esperam o lançamento (INFINITO e fases com PRESSÃO).
- Depois de resetar o progresso, o mapa não fazia de novo a animação de neon dos capítulos que já tinham acendido antes. Agora o reset zera isso também.

## [1.9.5] · 16/11/2026 · PERFURAR na medida e a torre no lugar

### Alterado

- PERFURAR agora atravessa só os blocos que quebram (comuns, de várias vidas e explosivos). Muralhas, blocos blindados, vazamentos e as armaduras e escudos dos chefões voltam a rebater o disco.

### Corrigido

- No mapa, a torre do capítulo 10 aparecia por cima de um dos prédios da frente. Agora ela é desenhada na ordem certa, e os prédios logo à frente ficam mais baixos para mostrar a base.

## [1.9.4] · 16/11/2026 · O ACIONISTA, o chefão final atrás da mesa

### Adicionado

- Chefão final novo, O ACIONISTA: um executivo grande atrás de uma mesa larga que ocupa o topo da tela, com cabelo penteado, olhos de cifrão, terno com ombros largos, gravata e os punhos na mesa. A mesa rebate o disco. Quando ele se inclina por cima dela para falar, a cabeça vem para a frente e a boca aberta é o ponto fraco.
- O ACIONISTA dá murros na mesa: a tela treme e velas de gráfico pulam dela e caem como blocos (acertar a vela antes faz ela estourar: VENDIDO!). Na fúria, o cabelo se desmancha e ele sua.

### Alterado

- O rosto de pixels saiu. As frases de mercado, as velas, os lasers em linha de gráfico, a respiração que puxa o disco e o bonequinho que foge no final continuam. No crash, a mesa racha ao meio antes de ele encolher e sair correndo.
- O capítulo 10 continua se chamando O SISTEMA; o chefão agora é O ACIONISTA.
- A barra BAIXANDO ATUALIZAÇÃO ganhou um fundo escuro, para dar para ler por cima do chefão.

## [1.9.3] · 16/11/2026 · Pendências: fonte embutida, documentação nova e moedas do final

### Adicionado

- A fonte Orbitron agora vem dentro do jogo (www/fonts, licença SIL OFL), então o texto não muda de fonte sem internet e o jogo não depende mais do Google Fonts.

### Alterado

- Documentação: capturas de tela novas (menu, mapa, fases, chefões, BREAKERS, final e o crash da bolsa) e diagramas de casos de uso, módulos e áudio atualizados.
- Removido o código dos capítulos "EM BREVE", que não era mais usado desde que o capítulo 10 ficou pronto.

### Corrigido

- Depois do chefão final, as moedas entravam na conta, mas a tela de dobrar com anúncio não aparecia. Agora ela aparece (DERROTADO) antes do falso travamento.

## [1.9.2] · 16/11/2026 · O SISTEMA do mercado financeiro

### Adicionado

- Ao ser derrotado, O SISTEMA tem um crash da bolsa: o gráfico despenca, as velas tombam e caem, um letreiro corre com PÂNICO NA BOLSA e -99,9%, e o chefão encolhe até virar um bonequinho de terno que sai correndo da tela ("NÃO FOI CULPA MINHA!"). Depois vem o falso travamento.

### Alterado

- O SISTEMA virou um executivo do mercado financeiro: terno com ombros e lapelas, gravata torta e cifrões no lugar das pupilas. Os balões têm frases de mercado (COMPRE!, O MERCADO SE AUTORREGULA, LUCRO RECORDE, RISCO ZERO; na fúria, VENDAM TUDO!, CIRCUIT BREAKER!...), em duas linhas quando são longas. Eles caem como velas de gráfico antes de virar blocos, e os lasers dos olhos voam em zigue-zague, como uma linha de gráfico.
- Fase bônus BARRICADA: só blocos simples, de uma batida, sem as muralhas.

## [1.9.1] · 16/11/2026 · BARRICADA perfurante e mapa que lembra a posição

### Alterado

- Fase bônus BARRICADA: em vez da explosão que corria pela fileira a cada duas batidas, o disco fica com PERFURAR a fase inteira e atravessa todos os blocos (e as muralhas).
- Mapa: guarda a posição da tela, também depois de fechar o jogo. Ao voltar de uma fase, ele abre no capítulo da fase jogada; só vai para a fase mais avançada quando uma fase nova é liberada.

## [1.9] · 16/11/2026 · O jogo completo: capítulo 10, o chefão final e o NEON FIGHTERS

### Adicionado

- Capítulo 10, O SISTEMA, no topo da Torre AURUM: 4 fases (FIREWALL, BACKUP, KERNEL e ROOT) e música própria, uma musiquinha de espera alegre que vive dando defeito.
- Mecânica ATUALIZAÇÃO (capítulo 10): a cada 15 s O SISTEMA troca a mecânica da fase no meio da partida, entre as de cada fase (portais, gravidade, deslize, fase, segurança, contágio, vazamento, blindagem e pressão). Antes de trocar, uma barra "BAIXANDO ATUALIZAÇÃO" enche no topo por 3 s com o ícone e o nome da próxima.
- Chefão final novo, O SISTEMA: um rosto gigante de pixels, o "mascote" sorridente da empresa. O ponto fraco é a boca, entre as bochechas, quando ela abre. Ele fala frases corporativas em balões que caem e viram blocos (acertar o balão antes faz ele estourar), dispara lasers pelos olhos e respira fundo para puxar o disco e cuspi-lo de volta. Cada acerto arranca pixels do rosto; na fúria ele dá defeito, muda as frases e começa a soltar atualizações que trocam a mecânica do campo.
- Registro 10 do diário, depois do falso travamento.
- NEON FIGHTERS: depois de zerar, o terminal carrega a primeira fase do próximo jogo. É uma nave vista de cima, com as asas na curva do breaker ARCO e as cores e o emblema do jogador. O tiro é automático e o jogador arrasta para mover. São uns 2 min 30 de hordas (drones, dardos que mergulham e tanques que atiram), cápsulas P de tiro triplo e tiro rápido, e no fim a nave-mãe A COLMEIA. O jogador tem 3 escudos, e o recorde fica salvo.
- Menu inicial: botão FIGHTERS ao lado de BREAKERS e INFINITO, depois de zerar.
- 3 formatos de breaker novos, liberados pelos chefões dos capítulos 7, 8 e 9: DEGRAU (três ângulos), ESCUDO (mais largo, com ângulos mais suaves) e COROA (três pontas, imprevisível). O chefão final não libera formato.

### Alterado

- Fases bônus viraram uma chuva de moedas. Sai a mesa de pinball: um escudo embaixo da plataforma segura o disco, que não cai mais. São 30 s quebrando blocos, que soltam moedas para pegar com a plataforma. Um combo de até x4 sobe a cada 4 blocos seguidos sem o disco tocar o escudo e aumenta a chance de moeda. O campo se enche de novo quando esvazia. São até 30 moedas na primeira vez e até 10 nas outras. LAG, FORK BOMB e BARRICADA continuam com o míssil, os discos e a explosão.
- Mapa: o capítulo 10 tem fases, e a rua corre reta até a torre no fim, que fica ao lado das últimas fases.
- INFINITO: O SISTEMA entra no rodízio dos chefões, depois do CONSELHO.
- O SUPERVISOR (capítulo 3) ficou com a pirâmide só para ele.

## [1.8.3] · 13/11/2026 · Fases bônus de pinball e modo dev compacto

### Adicionado

- Fases bônus viraram uma mesa de pinball: 3 bumpers que chutam o disco mais rápido e 5 alvos com as letras B-Ô-N-U-S, que acendem quando atingidos; com as cinco acesas o pote ganha 3 moedas e elas apagam de novo.
- Fases bônus: pote de moedas no topo da tela. Cada bumper soma moeda no pote, vezes um combo (x2 a x5) que sobe a cada batida na mesa e zera quando o disco toca a plataforma. O pote enche até 12 moedas e é pago no final: quem limpa a fase recebe o pote e o prêmio; quem falha recebe só o pote.

### Alterado

- Fases bônus sem perks (o ativo e o passivo ficam desligados), sem cápsulas e sem moedas caindo dos blocos.
- Modo dev compacto: painel com cerca de um terço da tela e meio transparente, com uma fileira de abas com ícones no topo (uma seção por vez); dá para arrastar pela barra de cima e recolher num botão pequeno, e ele lembra a posição, a aba e se estava recolhido.
- Ícone do BREAKERS no menu: só a curva do breaker ARCO, sem o disco e sem o brilho.
- Mapa: o coração de curtidas do capítulo 6 ficou na cor do tema (era vermelho).
- Com o neon desligado (padrão no celular), textos e contornos neon são desenhados uma vez só, em vez de duas ou três, sem mudar o visual.
- Revisão do código: removidos uma função sem uso, um botão que nunca aparecia, restos das cores antigas do mapa e comentários desatualizados.

### Corrigido

- O bônus do capítulo 8 (BARRICADA) ficava fora da tela, à esquerda do mapa. Agora a rua dele sai de um ponto do capítulo com espaço livre, ao lado da 8-3, e o nome não encosta em nenhuma fase.
- O banco AURUM do mapa misturava a cor do tema com o dourado (ficava esverdeado no tema verde); agora é dourado puro.
- A ONDA DE CHOQUE era desenhada seguindo a plataforma, mas acertava os blocos de onde tinha começado; agora o desenho fica parado no lugar certo.
- O brilho de carga do MEGA LASER começava já meio aceso.
- Modo dev: "Limpar blocos" contava o bloco do VAZAMENTO e deixava a contagem de blocos errada.

## [1.8.2] · 13/11/2026 · Fases bônus de verdade e INFINITO sem empurrão

### Adicionado

- INFINITO: quando os blocos chegam na linha, um feixe sobe da linha e destrói as três fileiras de baixo (o jogador continua perdendo uma vida). Antes os blocos eram empurrados para cima.
- Fases bônus: relógio de 40 s no topo, que começa no primeiro lançamento e pisca nos últimos 10 s.
- Créditos: linha "© 2026 Vinícius Costardi. Todos os direitos reservados."

### Alterado

- Fases bônus rebalanceadas: uma chance só (se o disco cair, a fase acaba sem tirar vida e o jogador fica com as moedas que pegou) e 40 s para limpar; prêmio de 15, 20 e 25 moedas na primeira vez (eram 40, 60 e 80) e 3 nas outras (eram 10); os blocos soltam 1,5x moedas (era 3x); as cápsulas ruins voltaram.
- LAG: um míssil a cada 3 s (era 1,5 s). FORK BOMB: até 8 discos (eram 20). BARRICADA: a cada duas batidas, uma explosão corre pela fileira e destrói os blocos dos lados (antes toda batida explodia em volta).
- Fases bônus com blocos mais duros (de 3 e 4 batidas) e fileiras deslizando.
- INFINITO: a chegada do chefão tem um estrondo grave e um chiado curto de estilhaços no lugar do som de bloco quebrado repetido.
- Menu inicial: JOGAR, BREAKERS e INFINITO viraram ícones com o nome embaixo, como na pausa; o BREAKERS ganhou um ícone novo (a plataforma com o disco e um brilho).
- Mapa: a rua agora começa atrás de um prédio, no topo do mapa.

### Corrigido

- Os portões dos capítulos caíam nas esquinas e ficavam ao longo da rua. Agora a rua tem um trecho reto entre o chefão e o capítulo seguinte e o portão atravessa esse trecho; a torre do SISTEMA ficou mais longe do último portão.

## [1.8.1] · 13/11/2026 · Capítulos, mapa em retas e menus mais leves

### Adicionado

- Mapa: faixa fixa embaixo com o nome, o chefão e as mecânicas do capítulo no meio da tela; ela muda conforme a rolagem (no topo mostra o primeiro e no fim o último).
- INFINITO: quando o chefão chega, os blocos estouram em sequência, o disco volta sozinho para a plataforma e o chefão entra numa explosão.

### Alterado

- DISTRITO passa a se chamar CAPÍTULO em todo o jogo.
- Mapa: a rua das fases e as ruas das fases bônus voltaram a ser só retas, seguindo a grade da cidade, e só na cor do tema (sem dourado). Os parques também ficaram na cor do tema; só o banco da TORRE AURUM continua dourado.
- Mapa: o olho voltou na fase do chefão, com o nome dele em cima.
- Menu inicial: só JOGAR, BREAKERS e INFINITO no meio; OPÇÕES e PLACAR viraram ícones redondos nos cantos de cima, junto do sino, e COR e CRÉDITOS foram para dentro das OPÇÕES.
- Pausa: CONTINUAR grande com MAPA (ou RECOMEÇAR) e MENU embaixo; EFEITOS, MÚSICA e GUIA viraram ícones pequenos no canto de cima.
- INFINITO: depois de derrotar o chefão não aparece aviso, e as fileiras voltam com poucos blocos, enchendo de novo com o tempo.
- BARRICADA sem as muralhas do meio, que escondiam blocos.

### Corrigido

- A bolinha do ícone do GUIA era branca; agora é da cor do tema.

## [1.8] · 13/11/2026 · Cidade nova, fases bônus e ícones

### Adicionado

- Fases bônus nos distritos 2, 5 e 8, numa rua que se bifurca no mapa: LAG (míssil a cada 1,5 s), FORK BOMB (cada bloco quebrado solta mais um disco) e BARRICADA (toda batida explode). Só cápsulas boas, o triplo de moedas e 40, 60 e 80 moedas por limpar (10 nas outras vezes).
- Mapa refeito: rua com curvas e voltas, um parque e uma praça com chafariz em cada distrito e um marco próprio em cada um (caixa d'água, telão, gráfico da META, torre do relógio, placa </>, coração de curtidas, outdoor CENSURADO, torre de rádio e banco dourado).
- Mapa: miniatura do chefão no lugar do ícone de olho.
- INFINITO: contagem grande nos últimos 5 s antes do chefão.

### Alterado

- Pausa e menu inicial só com ícones, cada um com o nome pequeno embaixo; JOGAR e CONTINUAR são os maiores, e EFEITOS, MÚSICA e GUIA ficam numa fileira só.
- Mapa: só o distrito em foco mostra a caixa de informações, num canto que não cobre fases; os liberados fora de foco ficam mais apagados; com o mapa no topo, o foco é o distrito 1.
- INFINITO: chefão a cada 2 min (era 3 min 30 s), em ordem; depois do último eles voltam com o dobro de vida.
- INFINITO: o começo tem poucos blocos por fileira e elas vão enchendo nos primeiros 3 minutos.
- INFINITO: PERFURAR dura 3 s, sem limite de blocos.
- Chefões soltam menos cápsulas: os blocos da luta voltaram aos 13% normais (eram 30%), cada acerto no chefão solta 20% (eram 35%) e LASER e MÍSSIL vêm 2 vezes mais (eram 3,5).
- MEGA LASER trava a plataforma por menos tempo.
- A MURALHA se desfaz um pouco antes da linha da PRESSÃO.
- MÍSSIL atravessa a MURALHA.
- +1 VIDA vem com o dobro da chance quando o jogador está com 1 vida.

### Corrigido

- A tela tremia sem parar no FIM DE JOGO.
- Uma partida do INFINITO podia entrar duas vezes no PLACAR quando a vida acabava duas vezes no mesmo instante.
- No INFINITO, o SENTINELA nunca aparecia como chefão (quando era sorteado, a luta não começava).

## [1.7.2] · 12/11/2026 · GUIA na pausa e mapa com foco

### Adicionado

- GUIA na pausa (botão GUIA ?): as mecânicas em jogo e as cápsulas, cada uma com animação; as que o jogador ainda não conhece vêm primeiro, marcadas como NOVO.
- INFINITO: um cartão só, na primeira partida, explicando o modo.

### Alterado

- INFINITO: sem cartões de mecânica ou cápsula no meio da partida.
- INFINITO começa com 2 fileiras de blocos (eram 4).
- PERFURAR no INFINITO: 4 s e no máximo 10 blocos (na campanha continua 8 s).
- Mapa: os distritos liberados voltaram a ficar acesos; o que está no meio da tela fica em destaque, com a rua mais forte, e os outros um pouco apagados. Os fechados continuam escuros e o distrito novo continua acendendo.

## [1.7.1] · 12/11/2026 · Correções do INFINITO e da PRESSÃO

### Corrigido

- INFINITO travava sem blocos novos quando o jogador quebrava todos: agora as fileiras entram bem mais rápido com o campo vazio.
- Com a PRESSÃO, a MURALHA e o bloco da gota do VAZAMENTO chegavam à linha de alerta e tiravam vida sem ter como quebrá-los (no INFINITO, para sempre; na campanha, nas fases 3-3, 3-4, 4-3, 5-3 e 6-4). Agora eles se desfazem ao chegar na linha.
- O bloco da REAÇÃO ganhou o X que o cartão da mecânica descreve.

## [1.7] · 12/11/2026 · Tutoriais animados, mapa aceso e INFINITO revisto

### Adicionado

- Tutoriais com texto curto e uma animação em cada cartão: tutorial inicial, mecânicas novas, perks (no tutorial e na aba PERKS) e cápsulas.
- O mapa deixa escuros os distritos fechados e acende cada um quando ele é liberado.
- INFINITO: pontos da partida embaixo do relógio, na tela de fim de jogo e na aba AQUI do placar.
- INFINITO: cartão na primeira vez que cai uma cápsula que o jogador ainda não conhece.
- Chips ganhos na fase, embaixo das moedas, nas telas de fase limpa e de distrito concluído; chips da conta ao lado das moedas durante a partida.
- Arquivo CHECKLIST.md com o que testar em cada versão.

### Alterado

- INFINITO dá bem menos moedas: 30% da chance normal nos blocos e 10 por chefão.
- Sorteio das cápsulas com memória: a que acabou de cair fica menos provável, nunca 3 ruins seguidas, MULTI não cai com 4 discos ou mais em campo; MULTI e PLATAFORMA + um pouco mais raras e PLATAFORMA + em dobro só em 20% das vezes.

### Corrigido

- Quando a barra de status do celular aparecia ou sumia no meio da fase, a moldura mudava de lugar e os blocos não: a primeira fileira encostava na borda.
- A caixa de alguns distritos no mapa (4, 6 e 8) ficava em cima das fases.

## [1.6.1] · 12/11/2026 · Pontos x10, botões limpos e bola de demolição

### Alterado

- Os pontos voltaram à escala antiga (x10); os recordes das fases salvos na 1.6 foram convertidos.
- Os risquinhos soltos em volta dos botões saíram.
- Anúncio de teste do QUEBRABLOCO: uma bola de demolição presa num guindaste balança e abre um buraco no muro de tijolos.

## [1.6] · 11/11/2026 · Modo INFINITO, VAZAMENTO e cápsulas revistas

### Adicionado

- Modo INFINITO: uma fase só, com blocos descendo sem parar, mecânicas que entram a cada 40 s e se revezam (no máximo 4 ao mesmo tempo) e um chefão aleatório a cada 3 min 30 s. O placar passa a ser deste modo, pelo tempo sobrevivido.
- Mecânica VAZAMENTO no lugar da TARJA (distrito 7): as tarjas rebatem o disco, e acertar o bloco com a gota derruba todas por 6 s. O CENSOR também usa.
- Cápsula BOMBA: o próximo bloco acertado explode em área.
- Recorde de pontos de cada fase, mostrado embaixo dela no mapa.
- Links do Instagram nos créditos e do Quebrabloco no anúncio de teste.

### Alterado

- As mecânicas não se acumulam mais todas: cada fase usa a do distrito e, no máximo, uma ou duas antigas.
- Cápsulas de 18 para 13, todas até o distrito 6. Saíram LENTO, FANTASMA, INSTÁVEL, PLATAFORMA LENTA, REPULSÃO e DISCO SUMIDO; o PERFURAR agora também atravessa muralhas, blindagens e escudos de chefão.
- A pontuação da campanha voltou a ser por fase.
- O ! de novidade ficou menor e sem brilho.

## [1.5] · 10/11/2026 · Menu com ícones, placar e modo dev novo

### Adicionado

- Botão PLACAR (troféu) no menu, com as abas AQUI (melhores partidas no aparelho), GERAL e SEMANA (placar online) e a escolha de um apelido.
- Placar online pronto no código (Supabase), ainda desligado: partidas com modo dev não entram e o servidor recusa pontuações impossíveis.
- Tela de créditos com os arquivos dos chefões: toque num chefão derrotado para reler o diário. Links para o repositório e, em breve, o Instagram.
- Modo dev: tocar numa cápsula faz ela cair em cima da plataforma, para ver qual é.

### Alterado

- Menu inicial: COR e OPÇÕES viraram botões quadrados com ícones (paleta e engrenagem), ao lado dos novos PLACAR (troféu) e CRÉDITOS (estrela).
- Os pontos acumulam de fase em fase e de distrito em distrito até o fim de jogo, quando zeram.
- Pontos divididos por 10 (o recorde salvo foi convertido).
- Modo dev refeito no estilo do Quebrabloco: painel flutuante com seções, controles deslizantes e ícones.
- ONDA DE CHOQUE mais fraca: sai de onde a plataforma estava e não acompanha o dedo, acerta 4, 6 ou 8 blocos (eram 6, 8 e 10) e só desvia o disco perto da plataforma.
- Anúncio de teste do QUEBRABLOCO com cara de obra: faixas zebradas, muro de tijolos e escavadeira.

## [1.4] · 10/11/2026 · Distritos 8 e 9, anúncios e preços novos

### Adicionado

- Distrito 8, RESISTÊNCIA: mecânica BLINDAGEM (blocos blindados por baixo), 4 fases e o chefão O BLINDADO, cujo escudo gira para encarar o disco.
- Distrito 9, TORRE AURUM: mecânica SEGURANÇA (feixes que ligam e desligam e rebatem o disco), 4 fases e o chefão O CONSELHO, em que só a cadeira com a coroa leva dano.
- Cápsulas ruins novas: REPULSÃO (distrito 8) e DISCO SUMIDO (distrito 9).
- Anúncio opcional para dobrar as moedas da fase vencida ou do chefão. Até a Play Store, os anúncios são de teste: QUEBRABLOCO, AURUM BANK e CAFÉ DA MADRUGADA.
- Chefões dão moedas ao serem derrotados: 20, mais 5 por distrito.
- Músicas dos distritos 8 e 9.

### Alterado

- Itens comprados com moedas cerca de 40% mais baratos; perks comprados com chips cerca de 40% mais caros.
- Ícone novo do vírus (CONTÁGIO) nos blocos e no mapa.
- A cápsula LENTO agora tem um relógio, para não se confundir com o LASER.
- Texto do diário 1 pt maior.
- No mapa, distritos com 8 mecânicas ou mais mostram os ícones em duas linhas.

### Corrigido

- O disco podia ficar preso pulando entre portais alinhados (por exemplo, na fase 5-2 GOTO). Agora, no 3º pulo seguido sem bater em nada, ele sai um pouco de lado.

## [1.3.1] · 10/11/2026 · MEGA LASER com a plataforma travada

### Alterado

- MEGA LASER: a plataforma fica travada enquanto o perk carrega e dispara, e o feixe não varre mais a tela inteira.

## [1.3] · 10/11/2026 · Distritos 6 e 7, cápsulas por distrito e ícone

### Adicionado

- Distrito 6, VIRAL: mecânica CONTÁGIO (blocos infectados criam blocos novos), 4 fases e o chefão O ALGORITMO.
- Distrito 7, CENSURA: mecânica TARJA (barras pretas escondem parte do campo), 4 fases e o chefão O CENSOR.
- Uma quarta fase em cada um dos distritos 1 a 5: PONTO FINAL, CORUJÃO, BANCO DE HORAS, CAFÉ FRIO e DEPLOY. O progresso salvo é convertido para a numeração nova.
- Progressão de cápsulas: cada distrito traz uma cápsula boa e uma ruim. Quatro cápsulas ruins novas: APAGÃO, INVERTIDO, INSTÁVEL e PLATAFORMA LENTA.
- Ícone do jogo (o disco com rastro) na aba do navegador e na tela inicial do celular, e manifesto para instalar o jogo como app.
- O disco é lançado sozinho depois de 10 s parado na plataforma, com contagem nos últimos 5 s.
- Músicas dos distritos 6 e 7.

### Alterado

- Portais: os dois portais de um par têm a mesma cor, e cada par tem a sua.
- O brilho da plataforma quando o disco rebate acompanha a linha e a animação de todos os formatos.
- Blocos destruídos pelos perks ativos (MEGA LASER, ONDA DE CHOQUE, RELÂMPAGO) não recarregam mais o perk.
- O formato FUNIL passa a ser liberado por O ALGORITMO.

### Corrigido

- Vencer um chefão com míssil, laser ou perk tirava uma vida; na última vida, o jogo ia para FIM DE JOGO sem a história e sem o botão PRÓXIMO DISTRITO.
- MEGA LASER e ONDA DE CHOQUE acertavam blocos da mecânica FASE quando estavam fora de fase.

## [1.2.1] · 09/11/2026 · Revisão e limpeza do código

### Alterado

- Código revisado: removidas constantes, importações e exportações sem uso, e renomeados os restos da antiga loja e da árvore de habilidades.
- Removidos do repositório um PDF antigo da documentação e uma captura de tela sem uso.
- Documentação e diagramas atualizados com os perks ativos e passivos.

## [1.2] · 06/11/2026 · BREAKERS, perks ativos e passivos e novidades

### Adicionado

- Perks passivos: GRANA, RECARGA, SORTE, VIDA EXTRA e DISCO PESADO, além da PLATAFORMA LARGA. O jogador equipa 1 ativo e 1 passivo.
- Aba PERKS em cartas (uma por vez, com setas ou deslizando), dividida em ATIVOS e PASSIVOS, sem pré-requisito.
- Aviso (!) no botão BREAKERS, nas abas e nos itens quando há formato novo ou algo que dá para comprar.
- Sino de NOVIDADES no menu, com tudo o que está disponível.
- Botão BREAKERS na tela de distrito concluído.
- Botões EFEITOS e MÚSICA no menu de pausa; efeitos e música agora são independentes.
- Tutorial dos perks depois do primeiro chefão.
- Modo dev: DESBLOQUEAR TUDO libera todos os perks no nível 3; o painel da partida troca o perk ativo e o passivo.

### Alterado

- Menu PLATAFORMA renomeado para BREAKERS e PODERES para PERKS.
- ÍMÃ também puxa de leve o disco para a plataforma.
- MÍSSIL vai direto no chefão quando não há bloco na frente.
- O disco acelera 1% por distrito, em vez de 2%.

### Corrigido

- Modo dev: os botões de formato, cor e emblema do painel da partida não funcionavam.
- Modo dev: o formato escolhido voltava ao padrão ao abrir o jogo com DESBLOQUEAR TUDO.
- Laser e míssil acertavam blocos da mecânica FASE quando estavam fora de fase.

## [1.1] · 05/11/2026 · História, árvore de poderes e novos formatos

### Adicionado

- História contada aos poucos: a cada chefão derrotado, um terminal digita um trecho do diário do protagonista (com botão PULAR).
- Formatos de plataforma ONDA (ondulado, liberado pela PATENTE) e FUNIL (centraliza o disco, liberado pelo chefão do distrito 6).
- Poderes CÂMERA LENTA (o disco anda na metade da velocidade) e RELÂMPAGO (raio que salta de bloco em bloco).
- Aba PODERES em forma de árvore de habilidades: cada poder exige o anterior no nível 1.
- Nomes das fases dos distritos 1 (QUINTAL, RUA DE TERRA, LAJE) e 2 (HORA AVULSA, PING ALTO, ÚLTIMA PARTIDA).
- Moedas que ainda estão caindo quando a fase termina entram direto na conta do jogador.
- Botão TESTAR HISTÓRIA no painel dev.
- Link para jogar no navegador pelo GitHub Pages.

### Alterado

- Distrito 1 renomeado de PERIFERIA para SUBÚRBIO.
- Animação da PONTA ao bater mais discreta.
- Abas do menu PLATAFORMA em duas linhas.
- Paleta padrão da plataforma agora é SISTEMA; PULSO passa a custar 20 moedas.
- PLATAFORMA LARGA mais cara (140, 280 e 480 chips).
- Ícones de mecânica no mapa em ordem invertida: a mais nova primeiro.

### Corrigido

- O áudio continuava tocando com o jogo fora da tela (tela bloqueada, outro app ou outra aba).

## [1.0] · 04/11/2026 · Lançamento oficial

### Adicionado

- Distrito 4 MADRUGADA: mecânica FASE (blocos tracejados fora de fase que o disco atravessa, alternando a cada 2,8 s), fases INSÔNIA, TELA ACESA e TRÊS DA MANHÃ.
- Chefão O RELÓGIO DE PONTO: ponteiros giratórios que rebatem o disco, aro tracejado atravessável, 4 marcadores das horas, ataques ALARME, BATEU O PONTO e onda de desvio.
- Distrito 5 CÓDIGO-FONTE: mecânica PORTAIS (o disco entra num portal e sai pelo par, na mesma direção), fases HELLO WORLD, GOTO e COMMIT.
- Chefão A PATENTE: cadeado com fechadura como ponto fraco, ataques © REGISTRADO (blocos viram indestrutíveis por 6 s), PORTAL PRIVADO (devolve o disco) e PROCESSADO (captura).
- Trilhas novas: MADRUGADA (breakbeat com tique-taque, 152/160 BPM) e CÓDIGO-FONTE (onda quadrada e arpejo glitch, 154/162 BPM).
- Opção de linha principal tracejada e opção de ligar/desligar os detalhes de cada formato (aba FORMATO).
- Moldura ao redor do emblema no estilo de cada formato (arcos, colchetes, losango, ferradura, asas).
- Rastro DESLIGADO (grátis).
- Contador de moedas abaixo das vidas durante a partida.
- Número da versão no canto do menu principal.
- Documentação do jogo, changelog e repositório no GitHub.
- Tela CRÉDITOS nas opções, com autoria e assets de terceiros.
- Acesso secreto ao modo dev: tocar 5 vezes na versão, no canto do menu, e digitar a senha.
- Confirmação em dois toques e mensagem PROGRESSO RESETADO ao resetar o progresso.
- Uma última linha no final do jogo.

### Alterado

- Animação da PONTA ao bater invertida: ela fica mais pontuda e volta.
- Botão DEV movido para a direita, embaixo da pausa, para dar lugar às moedas.
- Ícones de mecânica no mapa ficam mais compactos quando o distrito acumula muitas mecânicas.
- Animações da plataforma mais suaves e mais longas; emblemas com movimento mais calmo e prévia a cada 3,2 s.
- Textos de mecânica nova e de chefão reduzidos a uma frase.
- Resetar o progresso agora também zera chips, moedas, poderes e itens comprados.
- O botão MODO DEV saiu das opções (só aparece para desligar, quando ativo).

## [0.9-alpha] · 04/11/2026 · Toque, animações e fantasma

### Adicionado

- Tocar na tela leva a plataforma rapidamente até o dedo; depois o arrasto continua como antes.
- Animação ao bater o disco, diferente por formato: ARCO salta, LÂMINA pisca, PONTA amassa, FERRADURA balança, ASA bate as asas.
- Detalhes tracejados próprios em cada formato (arco extra, aberturas, eco em V, chifres, penas).
- Prévia da animação de batida na aba FORMATO.

### Alterado

- Tutorial reescrito com uma frase curta por cartão.
- FANTASMA: o disco também some ao se aproximar dos blocos e reaparece ao voltar para o jogador.

## [0.8-alpha] · 04/11/2026 · Desempenho, gráficos e menu PLATAFORMA

### Adicionado

- Ícones das mecânicas embaixo do nome de cada distrito no mapa.
- Configurações gráficas: brilho do neon, resolução, partículas, rastro e textura da grade.
- Aba VISUAL no painel dev e controles deslizantes no lugar dos botões + e −.
- Opções QUALIDADE (ALTA, MÉDIA, BAIXA) e NEON (DESLIGADO a ALTO) no menu de opções.
- Padrões automáticos: PC com tudo no máximo; celular com tudo no máximo, neon desligado e textura em 150%.
- Moedas: caem de 7% dos blocos e precisam ser pegas com a plataforma.
- Cores e emblemas comprados com moedas; emblemas são os itens mais caros.
- 7 discos (NÚCLEO, ANEL, ESTRELA, HÉLICE, HEXA, ÁTOMO, PLASMA) e 6 rastros (PADRÃO, FAÍSCAS, PRISMA, PALETA, HÉLICE DUPLA, ECO).
- Formatos de plataforma liberados por progressão: cada chefão derrotado libera um formato.

### Alterado

- A oficina saiu do menu principal: o menu PLATAFORMA ganhou abas (FORMATO, CORES, EMBLEMA, DISCO, RASTRO, PODERES) e é onde se compra e equipa tudo.
- Curva de BPM achatada: as músicas param de acelerar a partir do distrito 4 (o distrito 10 fica em 165 BPM).
- Borda neon do campo pré-desenhada e rastro sem gradientes por segmento: bem menos travamento no celular.
- Carros de luz do mapa passam por trás dos prédios.

### Corrigido

- Brilho excessivo e travamentos no celular.

## [0.7-alpha] · 04/11/2026 · Evolução da plataforma e a história dos distritos

### Adicionado

- Oficina EVOLUIR com chips ganhos jogando: MEGA LASER, ONDA DE CHOQUE, ESCUDO e ÍMÃ (3 níveis cada) e PLATAFORMA LARGA.
- Energia do poder carregada quebrando blocos; uso com toque duplo, botão na tela ou tecla E.
- 10 distritos cujos nomes contam a história de um jovem que derrubou o sistema com o próprio jogo.
- Distrito 3 HORA EXTRA com 3 fases, a mecânica PRESSÃO (blocos descem até a linha de alerta) e o chefão O SUPERVISOR.
- Trilha da HORA EXTRA: quatro por quatro frenético com baixo ácido (150/158 BPM).

### Alterado

- “Bairro” passou a se chamar “distrito” em todo o jogo.

## [0.6-alpha] · 04/11/2026 · Cidade isométrica e O SISTEMA

### Adicionado

- Mapa em cidade 3D isométrica: o caminho das fases é uma rua, com cercas de neon nos portões guardados pelos chefões e a torre AURUM no fim.
- Chefe final O SISTEMA e o falso travamento do jogo como final, com uma crítica anticapitalista escondida.
- Músicas mais rápidas e frenéticas a cada mundo.
- Velocidade do disco +2% por mundo.

### Alterado

- MEGA DISCO causa 2x de dano e MINI DISCO 0,5x.
- Experimento de mapa como placa-mãe com chefões de computador, substituído pela cidade isométrica.
- SENTINELA e SINGULARIDADE restaurados.

### Corrigido

- Nomes de distrito sobrepostos às linhas do mapa.

## [0.5-alpha] · 04/11/2026 · Ajustes de poderes e cidade cibernética

### Adicionado

- Poder FANTASMA: o disco atravessa blocos indestrutíveis.
- Míssil teleguiado que busca o bloco mais próximo.
- Mapa como cidade cibernética com carros de luz e fronteiras guardadas pelos chefões.
- O som é silenciado quando a janela perde o foco.

### Alterado

- LASER com 7 tiros.
- PLATAFORMA + e − acumulam até 4 níveis e às vezes caem em dobro.
- Chefões mais fáceis, com mais blocos comuns na arena e mais chance de laser e míssil.

## [0.4-alpha] · 04/11/2026 · Mundos, chefões e poderes

### Adicionado

- Mapa de mundos; cada mundo tem uma mecânica própria, acumulada nos mundos seguintes.
- Mundo 1 (DESLIZE) e mundo 2 (GRAVIDADE), com 4 fases cada, borda e música próprias.
- Chefões SENTINELA e SINGULARIDADE: ponto fraco, poderes que desviam e capturam o disco, 2 vidas e MODO FÚRIA.
- Poderes LASER, MÍSSIL, MEGA DISCO e MINI DISCO; pulso translúcido onde o disco toca a plataforma.
- Painel dev dentro da partida, separado por categorias.
- Botão PULAR TUTORIAL.

### Alterado

- Mais chance de cair poderes.

## [0.3-alpha] · 04/11/2026 · Tutorial, personalização e modo dev

### Adicionado

- Tutorial em etapas na primeira partida, pausando até o jogador tocar em continuar.
- Personalização da plataforma: formato, cores que transitam e emblema.
- Formatos diferentes mudam o ângulo do disco.
- Modo dev: vidas infinitas, todos os mapas, poderes, velocidade e sensibilidade.

### Alterado

- Borda do campo pulsa quando o disco bate.
- Plataformas redesenhadas.

## [0.2-alpha] · 04/11/2026 · Estilo Tron

### Adicionado

- Menu COR para escolher a cor única do jogo.
- Símbolos e mais linhas nas plataformas, com neon em movimento.
- Efeitos sonoros sintetizados inspirados em Tron.

### Alterado

- Visual com uma cor só e borda de cantos arredondados ao redor do campo.
- Disco maior e rastro reto mais longo.

## [0.1-alpha] · 04/11/2026 · Protótipo

### Adicionado

- Brick breaker em modo retrato para celular, com servidor local para testes.
- Visual minimalista: fundo preto e linhas neon com cores complementares.
- Disco com rastro, plataforma em arco, blocos retangulares que pedem várias batidas.
- Poderes e desvantagens raros que caem dos blocos.
