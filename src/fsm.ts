import { START_FLAG } from './packet';

const MAX_BUFFER_CAPACITY = 200000
enum FSM_STATE {
    INIT,
    CHECK,
    HANDLE,
    END,
    ERR,
    WAIT_MORE,
    WAIT
}

type TStatusResolve = (...datas:any[]) => Array<any>
type TFSM = {
    [k in FSM_STATE]: TStatusResolve
}

export class FSM {
    currentState: FSM_STATE = FSM_STATE.WAIT
    buffer: Buffer = Buffer.allocUnsafe(MAX_BUFFER_CAPACITY)
    bufferLength: number = 0
    onHandle: Function
    onError: Function
    constructor(handle:Function,error ?: Function) {
        this.onHandle = handle
        this.onError = error
    }

    [FSM_STATE.INIT](data:Buffer) {
        if(data[0] != START_FLAG) {
            let index:number
            if(!~(index = data.indexOf(START_FLAG))) {
                this.currentState = FSM_STATE.ERR
                return [FSM_STATE.ERR]
            }
            else data = data.slice(index)
        }
        this.currentState = FSM_STATE.CHECK
    }

    [FSM_STATE.CHECK](data:Buffer,length:number) {
        if(data.length != length) {
            this.currentState = FSM_STATE.WAIT_MORE
            return [FSM_STATE.WAIT_MORE,length - data.length]
        }

        this.currentState = FSM_STATE.HANDLE
        return [FSM_STATE.HANDLE,data]
    }

    [FSM_STATE.WAIT_MORE](data:Buffer, length:number) {
        this.currentState = FSM_STATE.WAIT_MORE
        if(data.length < length) {
            return [FSM_STATE.WAIT_MORE, data, length - data.length]
        } else if(data.length === length) {
            this.currentState = FSM_STATE.HANDLE
            return [FSM_STATE.HANDLE, data]
        } else {
            this.currentState = FSM_STATE.HANDLE
            this.buffer.fill(data.slice(data.length - length),this.bufferLength,this.bufferLength + data.length - length)
            this.bufferLength += data.length - length
            return [FSM_STATE.HANDLE, data]
        }
    }

    [FSM_STATE.HANDLE](data:Buffer) {
        this.currentState = FSM_STATE.HANDLE
        try {
            this.onHandle(data)
        } catch(e) {
            this.currentState = FSM_STATE.ERR
            return [FSM_STATE.ERR,e]
        }
        this.currentState = FSM_STATE.ERR
        return [FSM_STATE.END]
    }

    [FSM_STATE.ERR](err) {
        this.onError && this.onError(err)
        this.currentState = FSM_STATE.END
    }

    [FSM_STATE.END]() {
        if(this.buffer) {
            this.currentState = FSM_STATE.INIT
            return [FSM_STATE.INIT,this.buffer]
        }
        this.currentState = FSM_STATE.WAIT_MORE
        return [FSM_STATE.WAIT_MORE]
    }

    [FSM_STATE.WAIT](data:Buffer) {
        if(data) {
            this.currentState = FSM_STATE.INIT
            return [FSM_STATE.INIT,data]
        } else return [null]
    }

    run(data:Buffer) {
        let state:FSM_STATE,
            params:Array<any> = [data]
        do {
            [state,...params] = (this[this.currentState] as any)(...params)
        } while(state)
    }
}