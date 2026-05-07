const cache = new Map();

async function getOrCreateWebhook(client, channel) {
  if (cache.has(channel.id)) return cache.get(channel.id);
  const webhooks = await channel.fetchWebhooks();
  let webhook = webhooks.find(w => w.owner?.id === client.user.id);
  if (!webhook) {
    webhook = await channel.createWebhook({ name: 'URL Shortener' });
  }
  cache.set(channel.id, webhook);
  return webhook;
}

module.exports = { getOrCreateWebhook };
