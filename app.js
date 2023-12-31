const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const util = require("util");
const { useMultiFileAuthState, jidDecode, makeInMemoryStore, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const logger = require("@whiskeysockets/baileys/lib/Utils/logger").default;
const pino = require("pino");
const gp = ["254739168811"];
const fs = require("fs");
const figlet = require("figlet");
const chalk = require("chalk");
const os = require("os");
const speed = require("performance-now");
const timestampe = speed();
const dreadedspeed = speed() - timestampe;

const spinnies = new (require('spinnies'))();

const { Boom } = require("@hapi/boom");
const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

const makeWASocket = require("@whiskeysockets/baileys").default;

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  console.log(
    color(
      figlet.textSync("MICROBOT46", {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
        whitespaceBreak: false,
      }),
      "orange"
    )
  );

  const sock = makeWASocket({
    logger: pino({
      level: 'silent'
    }),
    printQRInTerminal: true,
    browser: ['Dreaded Active', 'safari', '1.0.0'],
    auth: state,
    qrTimeout: 20000000,
  });

  sock.ev.on('messages.upsert', async chatUpdate => {
    m = chatUpdate.messages[0];
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.sender = sock.decodeJid((m.fromMe && sock.user.id) || m.participant || m.key.participant || m.chat);

    const groupMetadata = m.isGroup ? await sock.groupMetadata(m.chat).catch((e) => {}) : "";
    const groupName = m.isGroup ? groupMetadata.subject : "";

    if (!m.message) return;

    if (m.chat.endsWith('@s.whatsapp.net')) {
      sock.sendPresenceUpdate('recording', m.chat)
    } if (m.chat.endsWith('broadcast')) {
      sock.readMessages([m.key]);
      const status = '𝗚𝗿𝗮𝗽𝗵𝗶𝗰𝘀 𝗗𝗲𝘀𝗶𝗴𝗻🎨 || </𝗙𝗿𝗼𝗻𝘁-𝗲𝗻𝗱 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗺𝗲𝗻𝘁>👨‍💻'
      await sock.updateProfileStatus(status);
    }
  });
  
  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  sock.ev.on('connection.update', async (update) => {
    const {
      connection,
      lastDisconnect,
      qr
    } = update;
    if (lastDisconnect == 'undefined' && qr != 'undefined') {
      qrcode.generate(qr, {
        small: true
      });
    }
    if (connection === 'connecting') {
      spinnies.add('start', {
        text: 'Connecting Now. . .'
      });
    } else if (connection === 'open') {
      spinnies.succeed('start', {
        text: `Successfully Connected. You have logged in as ${sock.user.name}`
      });
    } else if (connection === 'close') {
      if (lastDisconnect.error?.output?.statusCode === 401) {
        spinnies.fail('start', {
          text: `Can't connect!`
        });

        process.exit(0);
      } else {
        main().catch(() => main());
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

main();
