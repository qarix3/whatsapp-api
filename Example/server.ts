import {
    WAConnection,
    MessageType,
    Presence,
    MessageOptions,
    Mimetype,
    WALocationMessage,
    WA_MESSAGE_STUB_TYPES,
    ReconnectMode,
    ProxyAgent,
    waChatKey,
} from '../src/WAConnection/WAConnection'
import * as fs from 'fs'
import express, { json, response } from 'express'
import { disconnect } from 'process';

const app = express(); // create express app
const port = 8080; // default port to listen
const conn = new WAConnection() // create whatsapp connection

async function connect(){
    conn.autoReconnect = ReconnectMode.onConnectionLost // only automatically reconnect when the connection breaks
    conn.connectOptions.maxRetries = 10 // attempt to reconnect at most 10 times in a row
    conn.chatOrderingKey = waChatKey(true) // order chats such that pinned chats are on top
}

async function getQR() {
    const conn = new WAConnection()
    conn.on('qr', qr => { 
        app.get("/connect", (req, res) => {
            res.send(qr)
        });
    })
}
  
    // start the Express server
    app.listen(port, () => {
        console.log(`server started at http://localhost:${port}`);
    });
    conn.on ('credentials-updated', () => {
        // save credentials whenever updated
        console.log (`credentials updated`)
        const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
        fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo, null, '\t')) // save this info to a file
    })

    // loads the auth file credentials if present
    fs.existsSync('./auth_info.json') && conn.loadAuthInfo ('./auth_info.json')
    await conn.connect() 
}

async function batterylevel() {
//example of custom functionality for tracking battery
// registerCallback(['action', null, 'battery'], json => {
 const batteryLevelStr = json[2][0][1].value
const batterylevel = parseInt(batteryLevelStr)
console.log('battery level: ' + batterylevel)
}

/* Sending Messages */
async function sendMessage(id, messages, type) {
// send a simple text
// send a location
// send a contact
// send a gif/video + some metadata & caption
// send a image + some metadata & caption
// send a document + some metadata & caption
// conn.sendMessage(param1,param2,param3)
}

/* Forward Messages */
async function forwardMessage() {
    const messages = await conn.loadConversation ('1234@s.whatsapp.net', 1)
    const message = messages[0] // get the last message from this conversation
    await conn.forwardMessage ('455@s.whatsapp.net', message) // WA forward the message!
}

/* Reading Messages */
async function readMessage() {
    const id = '1234-123@g.us'
    const messageID = 'AHASHH123123AHGA' // id of the message you want to read
    await conn.sendReadReceipt (id) // mark all messages in chat as read
    await conn.sendReadReceipt(id, messageID, 1) // mark the mentioned message as read
    await conn.sendReadReceipt(id, null, -2) // mark the chat as unread
}

/* Delete Messages */
// async function tesdt() {
//     const jid = '1234@s.whatsapp.net' // can also be a group
//     const response = await conn.sendMessage (jid, 'hello!', MessageType.text)  // send a message
//     await conn.deleteMessage (jid, {id: response.messageID, remoteJid: jid, fromMe: true}) // will delete the sent message for everyone!
//     await conn.clearMessage (jid, {id: Response.messageID, remoteJid: jid, fromMe: true}) // will delete the sent message for only you!
// }

/* Modifiying Chats */
// async function name() {
//     const jid = '1234@s.whatsapp.net' // can also be a group
//     await conn.modifyChat (jid, ChatModification.archive) // archive chat
//     await conn.modifyChat (jid, ChatModification.unarchive) // unarchive chat
//     const response = await conn.modifyChat (jid, ChatModification.pin) // pin the chat
//     await conn.modifyChat (jid, ChatModification.unpin) // unpin it
//     await conn.modifyChat (jid, ChatModification.mute, 8*60*60*1000) // mute for 8 hours
    
//     setTimeout (() => {
//         conn.modifyChat (jid, ChatModification.unmute)
//     }, 5000) // unmute after 5 seconds
//     await conn.deleteChat (jid) // will delete the chat (can be a group or broadcast list as well)
// }


/* Download Media Messages */
async function downloadMedia() {
    // import { MessageType } from '@adiwajshing/baileys'
    conn.on ('message-new', async m => {
    if (!m.message) return // if there is no text or media message
        const messageType = Object.keys (m.message)[0]// get what type of message it is -- text, image, video
        
    if (messageType !== MessageType.text && messageType !== MessageType.extendedText) { // if the message is not a text message
        const buffer = await conn.downloadMediaMessage(m) // to decrypt & use as a buffer
        const savedFilename = await conn.downloadAndSaveMediaMessage (m) // to decrypt & save to file
        console.log(m.key.remoteJid + " sent media, saved at: " + savedFilename)
    }})
}

/* Online Status */
async function statusUser() {
    const id = '1234-123@g.us'
    export enum Presence {
        available = 'available', // "online"        
        composing = 'composing', // "typing..."
        recording = 'recording', // "recording..."
    }
    // import { Presence } from '@adiwajshing/baileys'
    await conn.updatePresence(id, Presence.available) 
}

/* Whatsapps Account Checker */
async function checkUser() {
    const id = 'xyz@s.whatsapp.net'
    const exists = await conn.isOnWhatsApp (id)
    console.log (`${id} ${exists ? " exists " : " does not exist"} on WhatsApp`)
}

