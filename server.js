const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const TOKEN = process.env.EITAA_BOT_TOKEN;
if(!TOKEN){
  console.error("ERROR: EITAA_BOT_TOKEN environment variable is not set.");
  process.exit(1);
}

async function getChatMember(chatIdentifier, userId){
  const apiBase = `https://api.telegram.org/bot${TOKEN}`;
  const url = `${apiBase}/getChatMember?chat_id=${encodeURIComponent(chatIdentifier)}&user_id=${userId}`;
  const res = await fetch(url);
  return res.json();
}

app.post('/api/check-membership', async (req, res) => {
  try {
    const { user_id, channels } = req.body;
    if(!user_id || !channels) return res.status(400).json({ error: 'missing user_id or channels' });
    const missing = [];
    for(const ch of channels){
      const apiResp = await getChatMember(ch, user_id);
      if(!apiResp || !apiResp.ok){
        missing.push(ch);
        continue;
      }
      const status = apiResp.result && apiResp.result.status;
      if(status !== 'member' && status !== 'administrator' && status !== 'creator'){
        missing.push(ch);
      }
    }
    res.json({ all_members: missing.length === 0, missing });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
