function encontrarCaminhoCurto(grafo, inicio, fim) {
    const distancias = new Map();
    const anteriores = new Map();
    const naoVisitados = new Set(grafo.nos.keys());

    for (let no of grafo.nos.keys()) {
        distancias.set(no, Infinity);
        anteriores.set(no, null);
    }
    distancias.set(inicio, 0);

    while (naoVisitados.size > 0) {
        let noAtual = null;
        let menorDistancia = Infinity;

        for (let no of naoVisitados) {
            if (distancias.get(no) < menorDistancia) {
                menorDistancia = distancias.get(no);
                noAtual = no;
            }
        }

        if (noAtual === null || noAtual === fim) break;
        naoVisitados.delete(noAtual);

        let vizinhos = grafo.adjacencias.get(noAtual) || [];
        for (let vizinho of vizinhos) {
            if (naoVisitados.has(vizinho.no)) {
                // A MAGIA: 1 dividido pelo peso. Quantos mais anos, menor a "distância" matemática.
                let pesoInvertido = 1 / vizinho.peso; 
                let novaDist = distancias.get(noAtual) + pesoInvertido;
                
                if (novaDist < distancias.get(vizinho.no)) {
                    distancias.set(vizinho.no, novaDist);
                    anteriores.set(vizinho.no, noAtual);
                }
            }
        }
    }

    const caminho = [];
    let atual = fim;
    while (atual !== null) {
        caminho.unshift(atual);
        atual = anteriores.get(atual);
    }
    
    return caminho[0] === inicio ? caminho : [];
}