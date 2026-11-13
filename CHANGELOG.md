# Changelog

Todas as mudanças do **Neon Breaker**. As versões 0.1 a 0.9 foram alphas; a 1.0 foi o primeiro lançamento oficial.

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
