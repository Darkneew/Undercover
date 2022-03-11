// CONSTANTS AND MODULES
const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
const server = http.createServer(app);
const io = require('socket.io')(server);
const params = require('./params.json');
var timeout = false;

// States
var games = {};
var players = {};

// Games manager
const CHARS = ['0','1','2','3','4','5','6','7','8','9','A','Z','E','R','T','Y','U','I','O','P','Q','S','D','F','G','H','J','K','L','M','W','X','C','V','B','N'];
const generateId = num => {
	let str = '';
	for (let i = 0; i < num; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}
	return str;
};
app.post('/', (req, res) => {
	let bestId = false;
	Object.keys(games).forEach(id => {
		if (games[id].status == 'waiting') return (bestId = id);
	});
	if (req.body.id) bestId = req.body.id;
	if (!bestId) {
		bestId = generateId(5);
		games[bestId] = {
			status: 'waiting',
			players: [],
			words: [undefined, undefined],
			porder: undefined,
			turn: undefined
		};
	}
	res.redirect(`/games/${bestId}`);
});

// REQUESTS
app.get('/games/:id', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/game/index.html'));
});

app.get('/', (req, res) => {
	res.redirect('/lobby/');
});
app.get('/lobby/:error', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/lobby/index.html'));
});

// Speaking phase
const speak = (gameId, n) => {
	// when n th player has to speak
	if (n >= games[gameId].porder.length) {
		games[gameId].turn = undefined;
		timeout = setTimeout(() => {
			timeout = false;
			vote(gameId);
		}, 2000);
		return;
	}
	io.to(games[gameId].porder[n]).emit('BeginTurn');
	io.to(gameId).emit('BeginTurnOf', players[games[gameId].porder[n]].name);
	timeout = setTimeout(() => {
		timeout = false;
		io.to(games[gameId].porder[n]).emit('EndTurn');
	}, 15000);
};
const vote = (gameId) => {
	// time to vote
	io.to(gameId).emit('BeginVote');
    games[gameId].status = 'voting';
	timeout = setTimeout(() => {
		timeout = false;
		transition(gameId);
	}, 15000);
};

const transition = (gameId) => {
    games[gameId].status = 'transitioning';
    io.to(gameId).emit('EndVote');
    timeout = setTimeout(() => {
		timeout = false;
		score(gameId);
	}, 3000);
};

const score = (gameId) => {
    games[gameId].status = 'scoring';
    let winner = false;
    let winscore = 0;
    games[gameId].players.forEach((id) => {
        if (players[id].voted == winscore) {
            winner = false;
        } else if (players[id].voted > winscore) {
            winner = id;
            winscore = players[id].voted;
        };
    });
    io.to(gameId).emit("results", [players[winner].name, winscore, players[winner].role == 0]);
}

// Initializing a game
const begin = gameId => {
	timeout = false;
	games[gameId].status = 'begining';
	let x =
		games[gameId].players[
			Math.floor(Math.random() * games[gameId].players.length)
		];
	games[gameId].words =
		params.words[Math.floor(Math.random() * params.words.length)];
	games[gameId].players.forEach(id => {
		if (id == x) {
			players[id].role = 0;
			players[id].word = games[gameId].words[1];
		} else {
			players[id].role = 1;
			players[id].word = games[gameId].words[0];
		}
		io.to(id).emit('begining', players[id].word);
		return;
	});
	games[gameId].porder = games[gameId].players;
	for (var i = games[gameId].porder.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = games[gameId].porder[i];
		games[gameId].porder[i] = games[gameId].porder[j];
		games[gameId].porder[j] = temp;
	}
	timeout = setTimeout(() => {
		timeout = false;
		games[gameId].turn = 0;
        games[gameId].status = 'speaking';
		speak(gameId, 0);
	}, 3000);
};

// SOCKET.IO
io.on('connection', socket => {
	// On joining console
	socket.on('joining', infos => {
		if (!infos[1]) {
			socket.emit('refused', '0');
			return 0;
		}
		if (!games[infos[0]]) {
			socket.emit('refused', '1');
			return 0;
		}
		if (games[infos[0]].players.length >= params.max_people) {
			socket.emit('refused', '2');
			return 0;
		}
		if (
			games[infos[0]].status != 'waiting' &&
			games[infos[0]].status != 'launching'
		) {
			socket.emit('refused', '4');
			return 0;
		}
		if (players[socket.id]) {
			socket.emit('refused', '5');
			return 0;
		}
		let b = false;
		games[infos[0]].players.forEach(player => {
			if (players[player].name == infos[1]) {
				socket.emit('refused', '3');
				b = true;
			}
		});
		if (b) return 0;
		socket.join(infos[0]);
		if (games[infos[0]].status == 'launching') {
			socket.to(infos[0]).emit('cancel_launching');
			if (timeout) {
				clearTimeout(timeout);
				timeout = false;
			}
			games[infos[0]].status = 'waiting';
		}
		games[infos[0]].players.push(socket.id);
		players[socket.id] = {
			name: infos[1],
			game: infos[0],
			avatar: infos[2],
			ready: false,
			role: undefined,
			word: undefined,
            vote: undefined,
            voted: 0,
			score: 0
		};
		games[infos[0]].players.forEach(player => {
			if (player == socket.id) return;
			socket.emit('addPlayer', [
				players[player].name,
				params.min_people - games[infos[0]].players.length,
				players[player].avatar
			]);
			if (players[player].ready) socket.emit('ready', players[player].name);
		});
		socket.emit('newMessage', [
			'Undercover',
			JSON.stringify(
				'Welcome to the chat of Undercover. Please be respectful toward other players, and follow basic social rules'
			)
		]);
		socket
			.to(infos[0])
			.emit('addPlayer', [
				infos[1],
				params.min_people - games[players[socket.id].game].players.length,
				infos[2]
			]);
		if (games[infos[0]].players.length >= params.max_people) {
			games[players[socket.id].game].status = 'launching';
			io.to(players[socket.id].game).emit('launching');
			timeout = setTimeout(() => {
				begin(players[socket.id].game);
			}, 10000);
		}
	});

	// On disconnect
	socket.on('disconnect', () => {
		if (!players[socket.id]) return;
		socket
			.to(players[socket.id].game)
			.emit('removePlayer', [
				players[socket.id].name,
				params.min_people - games[players[socket.id].game].players.length + 1
			]);
		if (
			games[players[socket.id].game].status == 'launching' &&
			games[players[socket.id].game].players.length < params.min_people
		) {
			socket.to(players[socket.id].game).emit('cancel_launching');
			if (timeout) {
				clearTimeout(timeout);
				timeout = false;
			}
			games[players[socket.id].game].status = 'waiting';
		}
		let i = games[players[socket.id].game].players.indexOf(socket.id);
		if (i != -1) games[players[socket.id].game].players.splice(i, 1);
		delete players[socket.id];
	});

	// On message
	socket.on('newMessage', msg => {
		socket
			.to(players[socket.id].game)
			.emit('newMessage', [players[socket.id].name, msg]);
	});

	// On ready / not ready
	socket.on('ready', () => {
		if (players[socket.id].ready) return;
		players[socket.id].ready = true;
		socket.to(players[socket.id].game).emit('ready', players[socket.id].name);
		if (games[players[socket.id].game].players.length < params.min_people)
			return;
		let b = false;
		games[players[socket.id].game].players.forEach(p => {
			if (!players[p].ready) return (b = true);
		});
		if (b) return;
		games[players[socket.id].game].status = 'launching';
		io.to(players[socket.id].game).emit('launching');
		timeout = setTimeout(() => {
			begin(players[socket.id].game);
		}, 10000);
	});
	socket.on('not_ready', () => {
		if (!players[socket.id]) return;
		if (!players[socket.id].ready) return;
		players[socket.id].ready = false;
		socket
			.to(players[socket.id].game)
			.emit('not_ready', players[socket.id].name);
		if (
			games[players[socket.id].game].status == 'launching' &&
			games[players[socket.id].game].players.length < params.max_people
		) {
			io.to(players[socket.id].game).emit('cancel_launching');
			if (timeout) {
				clearTimeout(timeout);
				timeout = false;
			}
			games[players[socket.id].game].status = 'waiting';
		}
	});

	// When player send msg
	socket.on('wordinput', word => {
		let n = games[players[socket.id].game].turn;
		if (
			players[socket.id].name !=
			players[games[players[socket.id].game].porder[n]].name
		)
			return;
		if (timeout) {
			clearTimeout(timeout);
			timeout = false;
		}
		io.to(players[socket.id].game).emit('EndTurnOf', players[socket.id].name);
		io.to(players[socket.id].game).emit(
			'newWord',
			word,
			players[socket.id].name
		);
		games[players[socket.id].game].turn = n + 1;
		speak(players[socket.id].game, n + 1);
	});

    socket.on('ivote', name => {
        if (games[players[socket.id].game].status != 'transitioning') return;
        players[socket.id].vote = name;
        if (!name) return;
        games[players[socket.id].game].players.forEach((id) => {
            if (name ==  players[id].name) players[id].voted += 1;
        });
    });
});

// LISTENING
server.listen(3000, () => {
	console.log('server started');
});
