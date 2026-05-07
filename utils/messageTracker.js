const history = new Map();

function trackMessage(channelId, userId, messageId) {
  const key = `${channelId}:${userId}`;
  if (!history.has(key)) history.set(key, []);
  history.get(key).push(messageId);
}

function popLastMessage(channelId, userId) {
  const key = `${channelId}:${userId}`;
  const msgs = history.get(key);
  if (!msgs?.length) return null;
  return msgs.pop();
}

module.exports = { trackMessage, popLastMessage };
