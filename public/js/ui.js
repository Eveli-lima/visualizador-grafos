const svgMap = document.getElementById('mapa-svg');

function limparTela() {
    svgMap.innerHTML = `
        <defs>
            <marker id="seta" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#aaaaaa" />
            </marker>
            <marker id="seta-match" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#b026ff" />
            </marker>
        </defs>
    `;
}

function desenharAresta(x1, y1, x2, y2, idOrigem, idDestino, onClickCallback, pesoAtual, raioDestino = 12, ehMutuo = false) {
    const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distancia = Math.sqrt(dx * dx + dy * dy) || 1;
    
    const x2Recuado = x2 - (raioDestino * dx) / distancia;
    const y2Recuado = y2 - (raioDestino * dy) / distancia;

    linha.setAttribute("x1", x1);
    linha.setAttribute("y1", y1);
    linha.setAttribute("x2", x2Recuado);
    linha.setAttribute("y2", y2Recuado);
    
    // === MISTURA DE EFEITOS: Neon Mútuo + Traço Dinâmico ===
    if (ehMutuo) {
        linha.classList.add("linha-match");
        linha.setAttribute("stroke-width", "5");
        linha.setAttribute("marker-end", "url(#seta-match)"); 
    } else {
        linha.setAttribute("stroke", "#666");
        linha.setAttribute("stroke-width", "4");
        linha.setAttribute("marker-end", "url(#seta)"); 
        
        // Efeito: A linha é desenhada progressivamente na tela
        const comprimento = Math.sqrt(Math.pow(x2Recuado - x1, 2) + Math.pow(y2Recuado - y1, 2));
        linha.style.strokeDasharray = comprimento;
        linha.style.strokeDashoffset = comprimento;
        linha.style.transition = "stroke-dashoffset 0.6s ease-in-out";
        setTimeout(() => { linha.style.strokeDashoffset = "0"; }, 10);
    }
    
    svgMap.appendChild(linha);
}

// O parâmetro totalRecebido entra aqui no final da função
function desenharNo(x, y, id, raio = 15, totalRecebido = 0) {
    const circulo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circulo.setAttribute("cx", x);
    circulo.setAttribute("cy", y);
    circulo.setAttribute("r", raio); // O raio agora é sempre o fixo que veio do main.js
 
    // LÓGICA DE HEATMAP (Mapa de Calor em Roxo)
    let cor = "#4a148c"; // 0 votos: Roxo escuro/base (quase invisível no brilho)
    if (totalRecebido >= 5) cor = "#df73ff"; // 5+ votos: Roxo super claro e brilhante
    else if (totalRecebido >= 3) cor = "#b026ff"; // 3 a 4 votos: Roxo Neon Vibrante
    else if (totalRecebido >= 1) cor = "#8a2be2"; // 1 a 2 votos: Roxo Médio

    circulo.setAttribute("fill", cor);
    circulo.style.filter = `drop-shadow(0 0 12px ${cor})`;

    // EFEITO POP-IN (Mantém a animação de entrada, mas vai parar no tamanho fixo)
    circulo.style.transformOrigin = `${x}px ${y}px`;
    circulo.style.opacity = "0";
    circulo.style.transform = "scale(0)";
    circulo.style.transition = "opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    
    svgMap.appendChild(circulo);
    
    setTimeout(() => {
        circulo.style.opacity = "1";
        circulo.style.transform = "scale(1)";
    }, 50);
    
    const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
    texto.setAttribute("x", x);
    texto.setAttribute("y", y - (raio + 12)); 
    texto.setAttribute("text-anchor", "middle"); 
    texto.setAttribute("fill", "white");
    texto.setAttribute("font-size", "14px");
    texto.textContent = id;
    
    texto.style.opacity = "0";
    texto.style.transition = "opacity 0.4s ease 0.2s";
    svgMap.appendChild(texto);
    
    setTimeout(() => { texto.style.opacity = "1"; }, 50);
} // <--- A chave única e correta que encerra a função desenharNo

function destacarCaminho(grafo, caminho) {
    for (let i = 0; i < caminho.length - 1; i++) {
        const n1 = grafo.nos.get(caminho[i]);
        const n2 = grafo.nos.get(caminho[i+1]);
        const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");
        linha.setAttribute("x1", n1.x);
        linha.setAttribute("y1", n1.y);
        linha.setAttribute("x2", n2.x);
        linha.setAttribute("y2", n2.y);
        linha.setAttribute("stroke", "#00ff00");
        linha.setAttribute("stroke-width", "4");
        linha.style.pointerEvents = "none"; 
        svgMap.appendChild(linha);
    }
}