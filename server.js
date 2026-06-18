const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// ==========================================
// MEMÓRIA VOLÁTIL (SEM BANCO DE DADOS)
// ==========================================
// Os dados ficam guardados apenas enquanto o servidor do Render estiver acordado
let historicoConexoes = []; 

io.on('connection', (socket) => {
    console.log(`Dispositivo conectado: ${socket.id}`);

    // ROTINA DE INICIALIZAÇÃO: Envia o histórico da memória para a tela que acabou de abrir
    socket.emit('carregar_historico', historicoConexoes);

    // INTERCEPTAÇÃO EM TEMPO REAL
    socket.on('nova_ligacao', (dados) => {
        
        // 1. Guarda na memória RAM
        historicoConexoes.push(dados);
        console.log(`Ligação registada na memória: ${dados.origem} -> ${dados.destino}`);

        // 2. Transmite para todos os ecrãs
        io.emit('atualizar_mapa', {
            origem: dados.origem,
            destino: dados.destino,
            peso: dados.peso
        });
    });

    socket.on('disconnect', () => {
        console.log(`Dispositivo desconectado: ${socket.id}`);
    });
});

http.listen(PORT, () => {
    console.log(`Servidor ativo na porta: ${PORT} (Modo Memória RAM)`);
});