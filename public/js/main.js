const grafo = new Grafo();

// Variável de controle para proteger a animação assíncrona contra múltiplos votos simultâneos
let idRenderizacao = 0;

// Transformado em função assíncrona
async function renderizarMapa() {
    idRenderizacao++;
    const renderAtual = idRenderizacao;

    limparTela();
    
    // 1. Mapeia o Grau de Entrada (In-Degree) e Conta Arestas Totais
    const inDegrees = new Map();
    let totalArestas = 0; 
    
    for (let id of grafo.nos.keys()) {
        inDegrees.set(id, 0);
    }
    
    for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
        totalArestas += vizinhos.length;
        for (let vizinho of vizinhos) {
            inDegrees.set(vizinho.no, (inDegrees.get(vizinho.no) || 0) + 1);
        }
    }

    // === CÁLCULO DAS 3 MÉTRICAS EXECUTIVAS ===
    const talentosOcultos = Array.from(inDegrees.values()).filter(votos => votos === 0).length;

    const totalNos = grafo.nos.size;
    const maxArestas = totalNos * (totalNos - 1);
    const densidade = maxArestas > 0 ? ((totalArestas / maxArestas) * 100).toFixed(1) : 0;

    let conexoesMutuasDouble = 0; 

    // 2. Desenha as setas indicativas
    const desenhadas = new Set();
    for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
        const noOrigem = grafo.nos.get(origem);
        for (let vizinho of vizinhos) {
            const idAresta = `${origem}->${vizinho.no}`; 
            if (!desenhadas.has(idAresta)) {
                const noDestino = grafo.nos.get(vizinho.no);
                const raioFixado = 15; 

                const escolhasDoDestino = grafo.adjacencias.get(vizinho.no);
                const reciprocidade = escolhasDoDestino ? escolhasDoDestino.some(v => v.no === origem) : false;

                if (reciprocidade) conexoesMutuasDouble++;

                desenharAresta(noOrigem.x, noOrigem.y, noDestino.x, noDestino.y, origem, vizinho.no, () => {}, vizinho.peso, raioFixado, reciprocidade);
                desenhadas.add(idAresta);
            }
        }
    }
    
    const altaConfiancaReal = conexoesMutuasDouble / 2;

    // === ATUALIZAR OS CARDS NA TELA ===
    const elDensidade = document.getElementById('metrica-densidade');
    if (elDensidade) elDensidade.innerText = densidade + '%';
    
    const elMutuas = document.getElementById('metrica-mutuas');
    if (elMutuas) elMutuas.innerText = altaConfiancaReal;

    const elOcultos = document.getElementById('metrica-ocultos');
    if (elOcultos) elOcultos.innerText = talentosOcultos;

    // === ATUALIZAR O RANKING DE MAIS VOTADOS ===
    const listaRanking = document.getElementById('lista-ranking');
    if (listaRanking) {
        listaRanking.innerHTML = ''; 
        const ranqueados = Array.from(inDegrees.entries())
            .filter(aluno => aluno[1] > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); 

        if (ranqueados.length === 0) {
            listaRanking.innerHTML = '<li style="color: #666; font-size: 12px;">Aguardando conexões...</li>';
        } else {
            ranqueados.forEach(([nome, votos], index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span><strong>${index + 1}º</strong> ${nome}</span> <span class="badge-votos">${votos}</span>`;
                listaRanking.appendChild(li);
            });
        }
    }

    // 3. Desenha os nós um a um 
    for (let [id, coords] of grafo.nos.entries()) {
        if (renderAtual !== idRenderizacao) return;

        const totalRecebido = inDegrees.get(id) || 0;
        const raioFixado = 15; 
        
        desenharNo(coords.x, coords.y, id, raioFixado, totalRecebido);
        
        await new Promise(resolve => setTimeout(resolve, 80)); 
    }
}

// === MOTOR DE LAYOUT ORGÂNICO (SIMULAÇÃO FÍSICA FORCE-DIRECTED) ===
function organizarOrganicamente() {
    const nosIDs = Array.from(grafo.nos.keys());
    if (nosIDs.length === 0) return;

    const centroX = window.innerWidth / 2;
    const centroY = window.innerHeight / 2;

    nosIDs.forEach(id => {
        const no = grafo.nos.get(id);
        if (no.x === 0 && no.y === 0) {
            no.x = centroX + (Math.random() * 100 - 50);
            no.y = centroY + (Math.random() * 100 - 50);
        }
    });

    const iteracoes = 100; 
    const constanteMola = 150; 

    for (let iter = 0; iter < iteracoes; iter++) {
        const forcas = new Map();
        nosIDs.forEach(id => forcas.set(id, { dx: 0, dy: 0 }));

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

        nosIDs.forEach(id => {
            const no = grafo.nos.get(id);
            const dx = centroX - no.x;
            const dy = centroY - no.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const gravidade = dist * 0.05; 
            forcas.get(id).dx += (dx / dist) * gravidade;
            forcas.get(id).dy += (dy / dist) * gravidade;
        });

        const temperatura = 15 * (1 - iter / iteracoes);
        nosIDs.forEach(id => {
            const no = grafo.nos.get(id);
            const f = forcas.get(id);
            let magnitude = Math.sqrt(f.dx * f.dx + f.dy * f.dy) || 1;
            no.x += (f.dx / magnitude) * Math.min(magnitude, temperatura);
            no.y += (f.dy / magnitude) * Math.min(magnitude, temperatura);
            no.x = Math.max(80, Math.min(window.innerWidth - 80, no.x));
            no.y = Math.max(80, Math.min(window.innerHeight - 80, no.y));
        });
    }
}

// === MOTOR DE SANITIZAÇÃO ===
function padronizarNome(nome) {
    if (!nome) return "";
    let nomeLimpo = nome.trim().replace(/\s+/g, ' ').toLowerCase();
    return nomeLimpo.split(' ').map(palavra => {
        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    }).join(' ');
}

// === SOCKET EM TEMPO REAL ===
const socket = io();

socket.on('atualizar_mapa', (dados) => {
    const origem = padronizarNome(dados.origem);
    const destino = padronizarNome(dados.destino);

    if (!grafo.nos.has(origem)) grafo.adicionarNo(origem, 0, 0);
    if (!grafo.nos.has(destino)) grafo.adicionarNo(destino, 0, 0);

    grafo.adicionarAresta(origem, destino, 1);

    organizarOrganicamente();
    renderizarMapa();
});

document.getElementById('btn-limpar').addEventListener('click', () => {
    grafo.nos.clear();
    grafo.adjacencias.clear();
    renderizarMapa();
});

document.getElementById('btn-votar').addEventListener('click', () => {
    window.open('/aluno.html', '_blank');
});

renderizarMapa();

// === LÓGICA DO MENU MOBILE (SANDUÍCHE) ===
const btnMenu = document.getElementById('btn-menu-mobile');
const hudContainer = document.querySelector('.hud-container');

if (btnMenu && hudContainer) {
    btnMenu.addEventListener('click', () => {
        // A função toggle liga e desliga a classe alternadamente a cada clique
        hudContainer.classList.toggle('painel-aberto');
    });
}