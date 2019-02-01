import ws, { AddressInfo } from 'ws';
import uuid from 'uuid';
import LatestData from './ClientData';
import {colors, colorImageUrls} from './colors';

const server = new ws.Server({
  port: 8086
}, () => {
  console.log("Server up and running on :" + (server.address() as AddressInfo).port)
})

let clients = {} as any

let latest: LatestData

server.on('connection', (ws, req) => {
  let usernameMatches = /username=(.+)/.exec(req.url)
  
  if (usernameMatches.length < 1) {
    ws.close(1000, JSON.stringify({ error: "No username provided." }))
    return
  }

  let clientId = uuid();

  let username = usernameMatches[1]

  let color: string

  do {
    color = colors[Math.floor(Math.random() * colors.length)]
  } while (
    !isUniqueColor(color)
  );


  clients[clientId] = {
    ws,
    username,
    color
  };

  ws.on('close', () => {
    delete clients[clientId]
  })

  ws.on('message',  (data: any) => {
    if (typeof data == "string") {
      data = JSON.parse(data)
    }

    switch (data.intent) {
      case 'click':
      latest = {
        color: color,
        username: username,
        date: new Date()
      }

      delete data.intent

      //  Broadcast to all
      for (let clientId of Object.keys(clients)) {
        try {
          clients[clientId].ws.send(JSON.stringify({
            type: 'latest', ...latest, ...data, 
            imageUrl: colorImageUrls[color] as any
        }))
        } catch (e) {
          console.log(e)
        }
      }

      break;

      default:
      ws.send(JSON.stringify({ error: "Unknown intent: " + data.intent }))
      break;
    }
  })

  ws.send(JSON.stringify({ type: 'latest', ...latest }))
});

function isUniqueColor(c: string) {
  for (let clientId of Object.keys(clients)) {
    if (clients[clientId].color == c) {
      return false
    }
  }

  return true
}