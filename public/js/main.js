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

    // 2. Desenha as setas indicativas (Arestas Direcionadas)
    const desenhadas = new Set();
    for (let [origem, vizinhos] of grafo.adjacencias.entries()) {
        const noOrigem = grafo.nos.get(origem);
        for (let vizinho of vizinhos) {
            const idAresta = `${origem}->${vizinho.no}`; 
            if (!desenhadas.has(idAresta)) {
                const noDestino = grafo.nos.get(vizinho.no);
                
                // Calcula o raio do destino para a seta saber onde parar
                const totalRecebidoDestino = inDegrees.get(vizinho.no) || 0;
                const raioDestino = 12 + (totalRecebidoDestino * 6);

                desenharAresta(noOrigem.x, noOrigem.y, noDestino.x, noDestino.y, origem, vizinho.no, () => {}, vizinho.peso, raioDestino);
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

// === MOTOR DE LAYOUT GEOMÉTRICO CIRCULAR ===
function organizarEmCirculo() {
    const nosIDs = Array.from(grafo.nos.keys());
    const total = nosIDs.length;
    if (total === 0) return;

    const centroX = window.innerWidth / 2;
    const centroY = window.innerHeight / 2;
    const raio = Math.min(centroX, centroY) - 120; 

    nosIDs.forEach((id, index) => {
        const angulo = (index / total) * Math.PI * 2;
        const x = centroX + raio * Math.cos(angulo);
        const y = centroY + raio * Math.sin(angulo);
        grafo.nos.set(id, { x, y });
    });
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
    const origen = padronizarNome(dados.origem);
    const destino = padronizarNome(dados.destino);

    if (!grafo.nos.has(origen)) grafo.adicionarNo(origen, 0, 0);
    if (!grafo.nos.has(destino)) grafo.adicionarNo(destino, 0, 0);

    grafo.adicionarAresta(origen, destino, 1);

    // EFEITO DEBUGGER
    console.clear();
    console.log("%c=== DEBUGGER: DIGRAFO (LISTA DE ADJACÊNCIAS DIRECONADA) ===", "color: #007acc; font-weight: bold;");
    for (let [no, vizinhos] of grafo.adjacencias.entries()) {
        const conexoes = vizinhos.map(v => v.no).join(", ");
        console.log(`%c[ ${no} ] %cescolheu -> %c${conexoes || "Ninguém"}`, "color: #28a745;", "color: #eee;", "color: #ffc107;");
    }

    organizarEmCirculo();
    renderizarMapa();
});

// Botão Limpar
document.getElementById('btn-limpar').addEventListener('click', () => {
    grafo.nos.clear();
    grafo.adjacencias.clear();
    console.clear();
    renderizarMapa();
});

// Inicialização
renderizarMapa();