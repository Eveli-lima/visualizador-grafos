const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose'); // 1. Importa o tradutor do banco

const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIGURAÇÃO E CONEXÃO DA BASE DE DADOS
// ==========================================

// Tenta ligar à variável secreta que configurou no Render
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error("ERRO CRÍTICO: A variável MONGO_URI não foi detetada nas variáveis de ambiente!");
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log("Camada de persistência conectada com sucesso ao MongoDB Atlas."))
        .catch(err => console.error("Falha crítica na conexão com o banco de dados:", err));
}

// 2. Definição do Schema (A estrutura da tabela na nuvem)
const ConexaoSchema = new mongoose.Schema({
    origem: { type: String, required: true },
    destino: { type: String, required: true },
    peso: { type: Number, required: true, default: 1 },
    timestamp: { type: Date, default: Date.now }
});

// Cria o modelo transacional baseado no Schema
const Conexao = mongoose.model('Conexao', ConexaoSchema);

// Middleware para servir os ficheiros estáticos da pasta public
app.use(express.static('public'));

// ==========================================
// PIPELINE DE EVENTOS (WEBSOCKETS + BANCO)
// ==========================================

io.on('connection', async (socket) => {
    console.log(`Dispositivo conectado à rede: ${socket.id}`);

    // ROTINA DE INICIALIZAÇÃO: Assim que a tela principal abre, ela recebe o passado
    try {
        const historico = await Conexao.find(); // Procura tudo o que está guardado
        socket.emit('carregar_historico', historico); // Envia o bloco histórico apenas para quem entrou
    } catch (error) {
        console.error("Erro ao extrair dados históricos do banco:", error);
    }

    // INTERCEPTAÇÃO EM TEMPO REAL: Quando um aluno envia uma nova ligação pelo telemóvel
    socket.on('nova_ligacao', async (dados) => {
        try {
            // Passo A: Instancia o dado recebido no formato do Schema
            const novaAresta = new Conexao({
                origem: dados.origem,
                destino: dados.destino,
                peso: dados.peso
            });

            // Passo B: Gravação Física Sem Bloqueio (Persistência assíncrona)
            // O código aguarda a confirmação de escrita em disco na nuvem
            await novaAresta.save();
            console.log(`Persistência concluída: ${dados.origem} -> ${dados.destino}`);

            // Passo C: Transmissão Geral
            // Só emite para os ecrãs depois de garantir que o dado está 100% salvo
            io.emit('atualizar_mapa', {
                origem: dados.origem,
                destino: dados.destino,
                peso: dados.peso
            });

        } catch (error) {
            console.error("Falha na cadeia de eventos. O dado não foi transmitido:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Dispositivo desconectado: ${socket.id}`);
    });
});

// Inicialização do servidor físico
http.listen(PORT, () => {
    console.log(`Servidor ativo na porta de comunicação: ${PORT}`);
});