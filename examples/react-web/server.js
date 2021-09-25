import { Server, Origins } from 'boardgame.io/server';
import TicTacToe from './src/tic-tac-toe/game';

const server = Server({ games: [TicTacToe], origins: [Origins.LOCALHOST] });
const PORT = process.env.PORT || 8000;

server.run(PORT);
