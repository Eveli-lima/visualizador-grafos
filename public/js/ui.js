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
            
            <filter id="brilho-borrado" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" /> <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    `;
}

function desenharAresta(x1, y1, x2, y2, idOrigem, idDestino, onClickCallback, pesoAtual, raioDestino = 15, ehMutuo = false) {
    const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");
    
    const dx = x2 - x1; const dy = y2 - y1;
    const distancia = Math.sqrt(dx * dx + dy * dy) || 1;
    
    const x2Recuado = x2 - (raioDestino * dx) / distancia;
    const y2Recuado = y2 - (raioDestino * dy) / distancia;

    linha.setAttribute("x1", x1); linha.setAttribute("y1", y1);
    linha.setAttribute("x2", x2Recuado); linha.setAttribute("y2", y2Recuado);
    
    const espessura = Math.min(1 + (pesoAtual * 0.8), 8);
    
    if (ehMutuo) {
        linha.classList.add("linha-match");
        linha.setAttribute("stroke-width", espessura + 1);
        linha.setAttribute("marker-end", "url(#seta-match)"); 
    } else {
        linha.setAttribute("stroke", "rgba(100, 100, 100, 0.6)");
        linha.setAttribute("stroke-width", espessura);
        linha.setAttribute("marker-end", "url(#seta)"); 
        
        const comprimento = Math.sqrt(Math.pow(x2Recuado - x1, 2) + Math.pow(y2Recuado - y1, 2));
        linha.style.strokeDasharray = comprimento; linha.style.strokeDashoffset = comprimento;
        linha.style.transition = "stroke-dashoffset 0.6s ease-in-out";
        setTimeout(() => { linha.style.strokeDashoffset = "0"; }, 10);
    }
    
    svgMap.appendChild(linha);
}

function desenharNo(x, y, id, raio = 15, totalRecebido = 0) {
    const circulo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circulo.setAttribute("cx", x); circulo.setAttribute("cy", y); circulo.setAttribute("r", raio); 
 
    let cor = "#4a148c"; 
    if (totalRecebido >= 15) cor = "#df73ff"; 
    else if (totalRecebido >= 5) cor = "#b026ff"; 
    else if (totalRecebido >= 1) cor = "#8a2be2"; 

    circulo.setAttribute("fill", cor);
    circulo.style.filter = `drop-shadow(0 0 12px ${cor})`;

    circulo.style.transformOrigin = `${x}px ${y}px`;
    circulo.style.opacity = "0"; circulo.style.transform = "scale(0)";
    circulo.style.transition = "opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    
    svgMap.appendChild(circulo);
    
    setTimeout(() => { circulo.style.opacity = "1"; circulo.style.transform = "scale(1)"; }, 50);
    
    const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
    texto.setAttribute("x", x); texto.setAttribute("y", y - (raio + 12)); 
    texto.setAttribute("text-anchor", "middle"); texto.setAttribute("fill", "white");
    texto.setAttribute("font-size", "14px"); texto.textContent = id;
    
    texto.style.opacity = "0"; texto.style.transition = "opacity 0.4s ease 0.2s";
    svgMap.appendChild(texto);
    setTimeout(() => { texto.style.opacity = "1"; }, 50);
}

function destacarCaminho(grafo, caminho) {
    if (!caminho || caminho.length < 2) return;

    // 1. Variável para "costurar" o trajeto (M = Move To, L = Line To)
    const primeiroNo = grafo.nos.get(caminho[0]);
    let trilhaContinua = `M ${primeiroNo.x},${primeiroNo.y}`;

    for (let i = 0; i < caminho.length - 1; i++) {
        const n1 = grafo.nos.get(caminho[i]);
        const n2 = grafo.nos.get(caminho[i+1]);
        
        // Desenha a linha vermelha fixa do caminho
        const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");
        linha.setAttribute("x1", n1.x); linha.setAttribute("y1", n1.y);
        linha.setAttribute("x2", n2.x); linha.setAttribute("y2", n2.y);
        linha.setAttribute("stroke", "#ff0055");
        linha.setAttribute("stroke-width", "2");
        linha.style.filter = "drop-shadow(0 0 5px #ff0055)"; 
        linha.style.pointerEvents = "none"; 
        
        // A linha vermelha vai aparecendo aos poucos
        linha.style.opacity = "0";
        linha.style.transition = "opacity 0.3s ease";
        svgMap.appendChild(linha);
        setTimeout(() => { linha.style.opacity = "0.6"; }, i * 200);

        // Adiciona a próxima coordenada à trilha invisível
        trilhaContinua += ` L ${n2.x},${n2.y}`;
    }

    // 2. Cria UM ÚNICO coração viajante
    const coracao = document.createElementNS("http://www.w3.org/2000/svg", "text");
    coracao.textContent = "♥";
    coracao.setAttribute("text-anchor", "middle");
    coracao.setAttribute("dominant-baseline", "central");
    coracao.setAttribute("font-size", "36px"); // Tamanho maior para destacar bem
    coracao.classList.add("coracao-viajante"); // Puxa o efeito de desfoque e brilho vermelho do seu CSS
    
    // 3. O Motor de Movimento (AnimateMotion)
    const animacao = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
    animacao.setAttribute("path", trilhaContinua); // Diz ao coração para seguir a linha que costuramos
    
    // O tempo total de viagem é dinâmico (1 segundo por cada pessoa pulada)
    const tempoViagem = (caminho.length - 1) * 1; 
    animacao.setAttribute("dur", `${tempoViagem}s`); 
    animacao.setAttribute("repeatCount", "indefinite"); // Fica a repetir o trajeto eternamente
    
    coracao.appendChild(animacao);
    
    // Coloca o coração na tela com suavidade
    coracao.style.opacity = "0";
    svgMap.appendChild(coracao);
    
    // Mostra o coração só depois que as linhas vermelhas estiverem desenhadas
    setTimeout(() => { coracao.style.opacity = "1"; }, 300);
}