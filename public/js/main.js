// Cria o grafo vazio para começar a apresentação
const grafo = new Grafo();

function renderizarMapa() {
    limparTela();
    
    // 1. Mapeia o Grau de Entrada (In-Degree) de cada aluno
    const inDegrees = new Map();
    for (let id of grafo.nos.keys()) {
        inDegrees.set(id, 0);
    }
    for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
        for (let vizinho of vizinhos) {
            inDegrees.set(vizinho.no, (inDegrees.get(vizinho.no) || 0) + 1);
        }
    }

    // === ATUALIZA O PAINEL DE RANKING EM TEMPO REAL ===
    const listaRanking = document.getElementById('lista-ranking');
    if (listaRanking) {
        listaRanking.innerHTML = ''; // Limpa a lista atual

        // Converte o mapa para Array, filtra quem tem pelo menos 1 indicação, e ordena (Maior para Menor)
        const ranqueados = Array.from(inDegrees.entries())
            .filter(aluno => aluno[1] > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Mostra apenas o Top 5 da turma

        if (ranqueados.length === 0) {
            listaRanking.innerHTML = '<li style="color: #aaa; font-size: 12px;">Aguardar conexões...</li>';
        } else {
            ranqueados.forEach(([nome, votos], index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span><strong>${index + 1}º</strong> ${nome}</span> <span class="badge-votos">${votos}</span>`;
                listaRanking.appendChild(li);
            });
        }
    }

    // 2. Desenha as setas indicativas (Arestas Direcionadas)
    const desenhadas = new Set();
    for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
        const noOrigem = grafo.nos.get(origem);
        for (let vizinho of vizinhos) {
            const idAresta = `${origem}->${vizinho.no}`; 
            if (!desenhadas.has(idAresta)) {
                const noDestino = grafo.nos.get(vizinho.no);
                
                const totalRecebidoDestino = inDegrees.get(vizinho.no) || 0;
                const raioDestino = 12 + (totalRecebidoDestino * 6);

                // === A LÓGICA DO MATCH ===
                const escolhasDoDestino = grafo.adjacencias.get(vizinho.no);
                const reciprocidade = escolhasDoDestino ? escolhasDoDestino.some(v => v.no === origem) : false;

                desenharAresta(noOrigem.x, noOrigem.y, noDestino.x, noDestino.y, origem, vizinho.no, () => {}, vizinho.peso, raioDestino, reciprocidade);
                
                desenhadas.add(idAresta);
            }
        }
    }

    // 3. Desenha os nós com tamanho proporcional às indicações RECEBIDAS
    for (let [id, coords] of grafo.nos.entries()) {
        const totalRecebido = inDegrees.get(id) || 0;
        const raioDinamico = 12 + (totalRecebido * 6);
        desenharNo(coords.x, coords.y, id, raioDinamico);
    }
}

// === MOTOR DE LAYOUT ORGÂNICO (SIMULAÇÃO FÍSICA FORCE-DIRECTED) ===
function organizarOrganicamente() {
    const nosIDs = Array.from(grafo.nos.keys());
    if (nosIDs.length === 0) return;

    const centroX = window.innerWidth / 2;
    const centroY = window.innerHeight / 2;

    // Coloca os novatos levemente embaralhados no centro para a física atuar
    nosIDs.forEach(id => {
        const no = grafo.nos.get(id);
        if (no.x === 0 && no.y === 0) {
            no.x = centroX + (Math.random() * 100 - 50);
            no.y = centroY + (Math.random() * 100 - 50);
        }
    });

    const iteracoes = 100; // O número de "frames" que a simulação vai calcular invisivelmente
    const constanteMola = 150; // Distância ideal que a mola tenta manter entre os conectados

    for (let iter = 0; iter < iteracoes; iter++) {
        const forcas = new Map();
        nosIDs.forEach(id => forcas.set(id, { dx: 0, dy: 0 }));

        // 1. FORÇA DE REPULSÃO (Todos contra Todos)
        for (let i = 0; i < nosIDs.length; i++) {
            for (let j = i + 1; j < nosIDs.length; j++) {
                const no1 = grafo.nos.get(nosIDs[i]);
                const no2 = grafo.nos.get(nosIDs[j]);
                
                let dx = no1.x - no2.x;
                let dy = no1.y - no2.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;

                const forcaRepulsao = (constanteMola * constanteMola) / dist;
                const fx = (dx / dist) * forcaRepulsao;
                const fy = (dy / dist) * forcaRepulsao;

                forcas.get(nosIDs[i]).dx += fx;
                forcas.get(nosIDs[i]).dy += fy;
                forcas.get(nosIDs[j]).dx -= fx;
                forcas.get(nosIDs[j]).dy -= fy;
            }
        }

        // 2. FORÇA DE ATRAÇÃO (Apenas os conectados pela Lista de Adjacências)
        for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
            const no1 = grafo.nos.get(origem);
            for (let vizinho of vizinhos) {
                const no2 = grafo.nos.get(vizinho.no);
                
                let dx = no1.x - no2.x;
                let dy = no1.y - no2.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;

                const forcaAtracao = (dist * dist) / constanteMola;
                const fx = (dx / dist) * forcaAtracao;
                const fy = (dy / dist) * forcaAtracao;

                forcas.get(origem).dx -= fx;
                forcas.get(origem).dy -= fy;
                forcas.get(vizinho.no).dx += fx;
                forcas.get(vizinho.no).dy += fy;
            }
        }

        // 3. FORÇA DA GRAVIDADE (Puxa gentilmente para o meio do ecrã)
        nosIDs.forEach(id => {
            const no = grafo.nos.get(id);
            const dx = centroX - no.x;
            const dy = centroY - no.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const gravidade = dist * 0.05; 
            forcas.get(id).dx += (dx / dist) * gravidade;
            forcas.get(id).dy += (dy / dist) * gravidade;
        });

        // 4. APLICAR FORÇAS (Arrefecimento térmico para parar o movimento)
        const temperatura = 15 * (1 - iter / iteracoes);
        nosIDs.forEach(id => {
            const no = grafo.nos.get(id);
            const f = forcas.get(id);
            let magnitude = Math.sqrt(f.dx * f.dx + f.dy * f.dy) || 1;
            
            no.x += (f.dx / magnitude) * Math.min(magnitude, temperatura);
            no.y += (f.dy / magnitude) * Math.min(magnitude, temperatura);
            
            // Paredes invisíveis para não sair do monitor
            no.x = Math.max(80, Math.min(window.innerWidth - 80, no.x));
            no.y = Math.max(80, Math.min(window.innerHeight - 80, no.y));
        });
    }
}

// === MOTOR DE SANITIZAÇÃO DE DADOS ===
function padronizarNome(nome) {
    if (!nome) return "";
    let nomeLimpo = nome.trim().replace(/\s+/g, ' ').toLowerCase();
    return nomeLimpo.split(' ').map(palavra => {
        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    }).join(' ');
}

// === CONEXÃO EM TEMPO REAL COM OS ALUNOS ===
const socket = io();

socket.on('atualizar_mapa', (dados) => {
    const origem = padronizarNome(dados.origem);
    const destino = padronizarNome(dados.destino);

    if (!grafo.nos.has(origem)) grafo.adicionarNo(origem, 0, 0);
    if (!grafo.nos.has(destino)) grafo.adicionarNo(destino, 0, 0);

    grafo.adicionarAresta(origem, destino, 1);

    // EFEITO DEBUGGER
    console.clear();
    console.log("%c=== DEBUGGER: DIGRAFO (LISTA DE ADJACÊNCIAS DIRECIONADA) ===", "color: #007acc; font-weight: bold;");
    for (let [no, vizinhos] of grafo.adjacencias.entries()) {
        const conexoes = vizinhos.map(v => v.no).join(", ");
        console.log(`%c[ ${no} ] %cescolheu -> %c${conexoes || "Ninguém"}`, "color: #28a745;", "color: #eee;", "color: #ffc107;");
    }

    organizarOrganicamente();
    renderizarMapa();
});

// Botão Limpar
document.getElementById('btn-limpar').addEventListener('click', () => {
    grafo.nos.clear();
    grafo.adjacencias.clear();
    console.clear();
    renderizarMapa();
});

// Botão para abrir a tela do aluno
document.getElementById('btn-votar').addEventListener('click', () => {
    window.open('/aluno.html', '_blank');
});

// Inicialização
renderizarMapa();