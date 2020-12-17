import net from 'net'
import { EventEmitter } from 'events'

export default class Server extends EventEmitter {
    server: net.Server
    constructor() {
        super()
        this.server = net.createServer({allowHalfOpen: true},(client) => {
            client.on('connection',() => {
                
            })
        })
    }
}