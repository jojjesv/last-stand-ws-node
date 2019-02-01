"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = __importDefault(require("ws"));
var uuid_1 = __importDefault(require("uuid"));
var colors_1 = require("./colors");
var server = new ws_1.default.Server({
    port: 8086
}, function () {
    console.log("Server up and running on :" + server.address().port);
});
var clients = {};
var latest;
server.on('connection', function (ws, req) {
    var usernameMatches = /username=(.+)/.exec(req.url);
    if (usernameMatches.length < 1) {
        ws.close(1000, JSON.stringify({ error: "No username provided." }));
        return;
    }
    var clientId = uuid_1.default();
    var username = usernameMatches[1];
    var color;
    do {
        color = colors_1.colors[Math.floor(Math.random() * colors_1.colors.length)];
    } while (!isUniqueColor(color));
    clients[clientId] = {
        ws: ws,
        username: username,
        color: color
    };
    ws.on('close', function () {
        delete clients[clientId];
    });
    ws.on('message', function (data) {
        if (typeof data == "string") {
            data = JSON.parse(data);
        }
        switch (data.intent) {
            case 'click':
                latest = {
                    color: color,
                    username: username,
                    date: new Date()
                };
                delete data.intent;
                //  Broadcast to all
                for (var _i = 0, _a = Object.keys(clients); _i < _a.length; _i++) {
                    var clientId_1 = _a[_i];
                    try {
                        clients[clientId_1].ws.send(JSON.stringify(__assign({ type: 'latest' }, latest, data, { imageUrl: colors_1.colorImageUrls[color] })));
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                break;
            default:
                ws.send(JSON.stringify({ error: "Unknown intent: " + data.intent }));
                break;
        }
    });
    ws.send(JSON.stringify(__assign({ type: 'latest' }, latest)));
});
function isUniqueColor(c) {
    for (var _i = 0, _a = Object.keys(clients); _i < _a.length; _i++) {
        var clientId = _a[_i];
        if (clients[clientId].color == c) {
            return false;
        }
    }
    return true;
}
