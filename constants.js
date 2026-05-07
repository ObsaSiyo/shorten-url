URL_REGEX=/https?:\/\/(?!(?:[\w-]+\.)*(?:cdn\.discordapp\.com|media\.discordapp\.net|tenor\.com|giphy\.com|c\.tenor\.com|i\.giphy\.com)(?:\/|\s|$))(?:[\w-]+\.)+[\w-]+(?:\/[^\s<>"']*)?/gi
const MIN_LENGTH = 23;
module.exports = { URL_REGEX, MIN_LENGTH };
