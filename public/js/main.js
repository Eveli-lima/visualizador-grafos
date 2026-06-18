const grafo = new Grafo();
let idRenderizacao = 0;

async function renderizarMapa() {
    idRenderizacao++;
    const renderAtual = idRenderizacao;

    limparTela();
    
    // Ler o valor atual do filtro de esquadrão
    const filtroTempo = parseInt(document.getElementById('filtro-peso').value) || 0;
    const pesoMinimoParaAparecer = 1 + filtroTempo; // Peso real da aresta
    
    const inDegrees = new Map();
    let totalArestasVisiveis = 0; 
    
    for (let id of grafo.nos.keys()) { inDegrees.set(id, 0); }
    
    // ANÁLISE 1: SOMA DO CAPITAL DE CONFIANÇA
    for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
        for (let vizinho of vizinhos) {
            // ANÁLISE 2: FILTRO DE ESQUADRÃO (Ignora arestas fracas)
            if (vizinho.peso >= pesoMinimoParaAparecer) {
                totalArestasVisiveis++;
                // Em vez de somar +1, soma os ANOS de conhecimento (+ vizinho.peso)
                inDegrees.set(vizinho.no, (inDegrees.get(vizinho.no) || 0) + vizinho.peso);
            }
        }
    }

    const talentosOcultos = Array.from(inDegrees.values()).filter(votos => votos === 0).length;
    const totalNos = grafo.nos.size;
    const maxArestas = totalNos * (totalNos - 1);
    const densidade = maxArestas > 0 ? ((totalArestasVisiveis / maxArestas) * 100).toFixed(1) : 0;

    let conexoesMutuasDouble = 0; 
    const desenhadas = new Set();
    
    for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
        const noOrigem = grafo.nos.get(origem);
        for (let vizinho of vizinhos) {
            
            // FILTRO VISUAL
            if (vizinho.peso < pesoMinimoParaAparecer) continue;

            const idAresta = `${origem}->${vizinho.no}`; 
            if (!desenhadas.has(idAresta)) {
                const noDestino = grafo.nos.get(vizinho.no);
                
                const escolhasDoDestino = grafo.adjacencias.get(vizinho.no);
                const reciprocidade = escolhasDoDestino ? escolhasDoDestino.some(v => v.no === origem && v.peso >= pesoMinimoParaAparecer) : false;

                if (reciprocidade) conexoesMutuasDouble++;

                desenharAresta(noOrigem.x, noOrigem.y, noDestino.x, noDestino.y, origem, vizinho.no, () => {}, vizinho.peso, 15, reciprocidade);
                desenhadas.add(idAresta);
            }
        }
    }
    
    const altaConfiancaReal = conexoesMutuasDouble / 2;

    const elDensidade = document.getElementById('metrica-densidade'); if (elDensidade) elDensidade.innerText = densidade + '%';
    const elMutuas = document.getElementById('metrica-mutuas'); if (elMutuas) elMutuas.innerText = altaConfiancaReal;
    const elOcultos = document.getElementById('metrica-ocultos'); if (elOcultos) elOcultos.innerText = talentosOcultos;

    const listaRanking = document.getElementById('lista-ranking');
    if (listaRanking) {
        listaRanking.innerHTML = ''; 
        const ranqueados = Array.from(inDegrees.entries())
            .filter(aluno => aluno[1] > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); 

        if (ranqueados.length === 0) {
            listaRanking.innerHTML = '<li class="aguardando">Aguardando telemetria...</li>';
        } else {
            ranqueados.forEach(([nome, capitalPeso], index) => {
                const li = document.createElement('li');
                // O número de Votos agora mostra a SOMA TOTAL DOS ANOS
                li.innerHTML = `<span><strong>${index + 1}º</strong> ${nome}</span> <span class="badge-votos" title="Anos acumulados de confiança">${capitalPeso} pts</span>`;
                listaRanking.appendChild(li);
            });
        }
    }

    for (let [id, coords] of grafo.nos.entries()) {
        if (renderAtual !== idRenderizacao) return;
        const capitalTotal = inDegrees.get(id) || 0;
        desenharNo(coords.x, coords.y, id, 15, capitalTotal);
        await new Promise(resolve => setTimeout(resolve, 80)); 
    }
    
    atualizarTabelaDados(pesoMinimoParaAparecer);
}

// === MOTOR DE SIMULAÇÃO FÍSICA ===
function organizarOrganicamente() {
    const nosIDs = Array.from(grafo.nos.keys());
    if (nosIDs.length === 0) return;

    const centroX = window.innerWidth / 2; const centroY = window.innerHeight / 2;
    nosIDs.forEach(id => {
        const no = grafo.nos.get(id);
        if (no.x === 0 && no.y === 0) { no.x = centroX + (Math.random() * 100 - 50); no.y = centroY + (Math.random() * 100 - 50); }
    });

    const iteracoes = 100; const constanteMola = 150; 
    for (let iter = 0; iter < iteracoes; iter++) {
        const forcas = new Map(); nosIDs.forEach(id => forcas.set(id, { dx: 0, dy: 0 }));

        for (let i = 0; i < nosIDs.length; i++) {
            for (let j = i + 1; j < nosIDs.length; j++) {
                const no1 = grafo.nos.get(nosIDs[i]); const no2 = grafo.nos.get(nosIDs[j]);
                let dx = no1.x - no2.x; let dy = no1.y - no2.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const forcaRepulsao = (constanteMola * constanteMola) / dist;
                const fx = (dx / dist) * forcaRepulsao; const fy = (dy / dist) * forcaRepulsao;
                forcas.get(nosIDs[i]).dx += fx; forcas.get(nosIDs[i]).dy += fy;
                forcas.get(nosIDs[j]).dx -= fx; forcas.get(nosIDs[j]).dy -= fy;
            }
        }

        for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
            const no1 = grafo.nos.get(origem);
            for (let vizinho of vizinhos) {
                const no2 = grafo.nos.get(vizinho.no);
                let dx = no1.x - no2.x; let dy = no1.y - no2.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const forcaAtracao = (dist * dist) / constanteMola;
                const fx = (dx / dist) * forcaAtracao; const fy = (dy / dist) * forcaAtracao;
                forcas.get(origem).dx -= fx; forcas.get(origem).dy -= fy;
                forcas.get(vizinho.no).dx += fx; forcas.get(vizinho.no).dy += fy;
            }
        }

        nosIDs.forEach(id => {
            const no = grafo.nos.get(id);
            const dx = centroX - no.x; const dy = centroY - no.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const gravidade = dist * 0.05; 
            forcas.get(id).dx += (dx / dist) * gravidade; forcas.get(id).dy += (dy / dist) * gravidade;
        });

        const temperatura = 15 * (1 - iter / iteracoes);
        nosIDs.forEach(id => {
            const no = grafo.nos.get(id); const f = forcas.get(id);
            let magnitude = Math.sqrt(f.dx * f.dx + f.dy * f.dy) || 1;
            no.x += (f.dx / magnitude) * Math.min(magnitude, temperatura); no.y += (f.dy / magnitude) * Math.min(magnitude, temperatura);
            no.x = Math.max(80, Math.min(window.innerWidth - 80, no.x)); no.y = Math.max(80, Math.min(window.innerHeight - 80, no.y));
        });
    }
}

function padronizarNome(nome) {
    if (!nome) return ""; let nomeLimpo = nome.trim().replace(/\s+/g, ' ').toLowerCase();
    return nomeLimpo.split(' ').map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1)).join(' ');
}

// === EVENTOS E INTEGRAÇÕES ===
const socket = io();

// === RECEBER O HISTÓRICO DO BANCO MONGODB ===
socket.on('carregar_historico', (historico) => {
    grafo.nos.clear();
    grafo.adjacencias.clear();

    if (historico && historico.length > 0) {
        historico.forEach(registro => {
            const origem = padronizarNome(registro.origem);
            const destino = padronizarNome(registro.destino);
            const peso = registro.peso || 1;

            if (!grafo.nos.has(origem)) grafo.adicionarNo(origem, 0, 0);
            if (!grafo.nos.has(destino)) grafo.adicionarNo(destino, 0, 0);

            grafo.adicionarAresta(origem, destino, peso);
        });

        organizarOrganicamente();
    }
    
    renderizarMapa();
});

socket.on('atualizar_mapa', (dados) => {
    const origem = padronizarNome(dados.origem); const destino = padronizarNome(dados.destino);
    const pesoRecebido = dados.peso || 1; 

    if (!grafo.nos.has(origem)) grafo.adicionarNo(origem, 0, 0);
    if (!grafo.nos.has(destino)) grafo.adicionarNo(destino, 0, 0);

    grafo.adicionarAresta(origem, destino, pesoRecebido);
    organizarOrganicamente(); renderizarMapa();
});

document.getElementById('btn-limpar').addEventListener('click', () => {
    grafo.nos.clear(); grafo.adjacencias.clear(); renderizarMapa();
});

// EVENTO: Atualizar Filtro (Slider)
document.getElementById('filtro-peso').addEventListener('input', (e) => {
    document.getElementById('label-filtro').innerText = `Mostrar laços acima de: ${e.target.value} Anos`;
    renderizarMapa(); // Re-renderiza instantaneamente ao arrastar
});

// EVENTO: Algoritmo de Dijkstra
document.getElementById('btn-rota').addEventListener('click', () => {
    const origem = padronizarNome(document.getElementById('rota-origem').value);
    const destino = padronizarNome(document.getElementById('rota-destino').value);
    
    if(!origem || !destino) return alert("Preencha a Origem e o Destino!");
    if(!grafo.nos.has(origem) || !grafo.nos.has(destino)) return alert("Os utilizadores não existem na rede atual.");

    // Traça a rota matemática
    const caminho = encontrarCaminhoCurto(grafo, origem, destino);
    
    // Redesenha a tela limpa e por cima desenha o coração
    renderizarMapa().then(() => {
        if(caminho.length > 0) destacarCaminho(grafo, caminho);
        else alert("Nenhuma ponte de confiança encontrada entre estas pessoas!");
    });
});

// EVENTO: Menu Mobile Sanduíche
const btnMenu = document.getElementById('btn-menu-mobile');
const hudContainer = document.querySelector('.hud-container');
if (btnMenu && hudContainer) { btnMenu.addEventListener('click', () => hudContainer.classList.toggle('painel-aberto')); }

renderizarMapa();

// EVENTO: Abrir tela de votação do aluno
const btnVotar = document.getElementById('btn-votar');
if (btnVotar) {
    btnVotar.addEventListener('click', () => {
        window.open('/aluno.html', '_blank');
    });
}

// === GAVETA DE DADOS (TABLE DRAWER) ===
const dataDrawer = document.getElementById('data-drawer');
const drawerHandle = document.getElementById('drawer-handle');

if (drawerHandle && dataDrawer) {
    drawerHandle.addEventListener('click', () => {
        dataDrawer.classList.toggle('gaveta-aberta');
    });
}

function atualizarTabelaDados(pesoMinimoParaAparecer) {
    const corpoTabela = document.getElementById('corpo-tabela');
    if (!corpoTabela) return;
    
    corpoTabela.innerHTML = ''; 
    
    if (grafo.adjacencias.size === 0) {
        corpoTabela.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#666; padding: 20px;">Nenhuma telemetria capturada na rede.</td></tr>';
        return;
    }

    for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
        for (let vizinho of vizinhos) {
            if (vizinho.peso < pesoMinimoParaAparecer) continue;

            const tr = document.createElement('tr');
            
            const destinoEscolhas = grafo.adjacencias.get(vizinho.no);
            const isMutuo = destinoEscolhas ? destinoEscolhas.some(v => v.no === origem && v.peso >= pesoMinimoParaAparecer) : false;
            
            const statusText = isMutuo ? '⇄ Recíproco (Match)' : '→ Unidirecional';
            const statusClass = isMutuo ? 'td-mutuo' : 'td-unidirecional';

            const anosConexao = vizinho.peso - 1; 

            tr.innerHTML = `
                <td>${origem}</td>
                <td>${vizinho.no}</td>
                <td><strong>${anosConexao}</strong> Anos</td>
                <td class="${statusClass}">${statusText}</td>
            `;
            corpoTabela.appendChild(tr);
        }
    }
}