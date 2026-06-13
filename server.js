const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Define a pasta 'public' como a área liberada para acesso
app.use(express.static('public'));

// Gerencia a ponte de comunicação
io.on('connection', (socket) => {
    console.log('Dispositivo conectado ao Radar!');

    // Fica escutando as conexões enviadas pelos alunos
    socket.on('nova_ligacao', (dados) => {
        // Dispara o comando para desenhar a linha no seu telão
        io.emit('atualizar_mapa', dados);
    });
});

const PORTA = 3000;
server.listen(PORTA, () => {
    console.log(`Servidor no ar! Acesse no navegador: http://localhost:${PORTA}`);
});