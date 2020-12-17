export const START_FLAG = 0x3
export const COMPLICATED_START_FLAG = [0x7,0x9]
const SEQ_LENGTH = 4
const LEN_LENGTH = 4

// 单包结构
// start----seq----length----data
export default function Packet(data,seq) {
    const bufferData = Buffer.from(data,'utf-8')
    const head_length = Buffer.from([START_FLAG]).length + SEQ_LENGTH + LEN_LENGTH
    const packetHead = Buffer.allocUnsafe(head_length)
    packetHead.writeUIntBE(START_FLAG,0,1)
    packetHead.writeUInt16BE(seq || Seq(),1)
    packetHead.writeUInt16BE(head_length + bufferData.length)

    return Buffer.concat([packetHead,bufferData],bufferData.length + packetHead.length)
}

export function Seq() {

}