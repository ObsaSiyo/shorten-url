async function shortenUrl(url) {
  const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
  if (!res.ok) return url;
  return (await res.text()).trim();
}

module.exports = { shortenUrl };
