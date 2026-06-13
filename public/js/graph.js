class Grafo {
    constructor() {
        this.nos = new Map(); 
        this.adjacencias = new Map(); 
    }

    adicionarNo(id, x, y) {
        this.nos.set(id, { x, y });
        if (!this.adjacencias.has(id)) {
            this.adjacencias.set(id, []);
        }
    }

    adicionarAresta(origem, destino, peso) {
        if (this.adjacencias.has(origem) && this.adjacencias.has(destino)) {
            // Agora adiciona APENAS a ida (Unidirecional)
            this.adjacencias.get(origem).push({ no: destino, peso: peso });
        }
    }

    alterarPeso(origem, destino, novoPeso) {
        const adjOrigem = this.adjacencias.get(origem).find(a => a.no === destino);
        if (adjOrigem) adjOrigem.peso = novoPeso;
        
        const adjDestino = this.adjacencias.get(destino).find(a => a.no === origem);
        if (adjDestino) adjDestino.peso = novoPeso;
    }
}