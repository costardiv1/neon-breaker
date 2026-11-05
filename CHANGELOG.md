# Changelog

Todas as mudanças do **Neon Breaker**. As versões 0.1 a 0.9 foram alphas; a 1.0 é o primeiro lançamento oficial.

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
