const { customAlphabet } = require("nanoid");

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nano = customAlphabet(alphabet, 6);

const generateTicketId = () => `CFX-${nano()}`;

module.exports = generateTicketId;
