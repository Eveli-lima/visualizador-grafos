const svgMap = document.getElementById('mapa-svg');

function limparTela() {
    // Atualizamos a "seta-match" para a cor roxa-neon (#b026ff)
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
    
    // === A MÁGICA ANIMADA ===
    // Se as pessoas se escolheram mutuamente, adicionamos a classe CSS animada
    if (ehMutuo) {
        linha.classList.add("linha-match");
        linha.setAttribute("stroke-width", "5");
        linha.setAttribute("marker-end", "url(#seta-match)"); 
    } else {
        linha.setAttribute("stroke", "#666");
        linha.setAttribute("stroke-width", "4");
        linha.setAttribute("marker-end", "url(#seta)"); 
    }
    
    svgMap.appendChild(linha);
}

function desenharNo(x, y, id, raio = 12) {
    const circulo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circulo.setAttribute("cx", x);
    circulo.setAttribute("cy", y);
    circulo.setAttribute("r", raio); 
    circulo.setAttribute("fill", "#007acc");
    svgMap.appendChild(circulo);
    
    const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
    texto.setAttribute("x", x - 15);
    texto.setAttribute("y", y - (raio + 8)); 
    texto.setAttribute("fill", "white");
    texto.setAttribute("font-size", "14px");
    texto.textContent = id;
    svgMap.appendChild(texto);
}

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