const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const port = 3000;

const baseUrl = 'https://api.cloudflare.com/client/v4/zones';
const apiToken = 'Bearer zXPn81Do2-8r416ahJb6pCTjnz0i865wIQ_cTMdk';

app.post('/purgeDomain', async (req, res) => {
  const resp = {};
  const domains = req.body;
  console.log('Body ==========>> ', domains);
  try {
    for (const domain of domains) {
      const zoneId = await getZoneId(domain);
      if (zoneId != undefined) {
        const res = purgeDomainPerform(zoneId);
        resp[domain] = true;
      } else {
        resp[domain] = 'Invalid domain, can not get ZONE id';
      }
      console.log(`Zone ID ${domain} ======>>> `, zoneId);
    }
  } catch (error) {
    resp[domain] = error;
  }
  console.log('Response ================>>', resp);
  res.status(200).json(resp);
});

app.post('/purgeUrl', async (req, res) => {
  const resp = {};
  const domains = req.body;
  console.log('Body ==========>> ', domains);
  try {
    for (const domain of domains) {
      const zoneId = await getZoneId(domain);
      if (zoneId != undefined) {
        const res = purgeUrlPerform(zoneId, domain);
        resp[domain] = true;
      } else {
        resp[domain] = 'Invalid domain, can not get ZONE id';
      }
      console.log(`Zone ID ${domain} ======>>> `, zoneId);
    }
  } catch (error) {
    console.error(error);
  }
  console.log('Response ================>>', resp);
  res.status(200).json(resp);
});

app.listen(port, () => {
  console.log(`CF Cache Purger App listening at http://localhost:${port}`);
});

const getZoneId = async (domainName) => {
  domainName.replace('cug-', '');
  domainName.replace('cug.', '');
  let url = domainName;
  if (url.startsWith('http:/')) {
    if (!url.includes('http://')) {
      url = url.replaceAll('http:/', 'http://');
    }
  }
  if (url.startsWith('https:/')) {
    if (!url.includes('https://')) {
      url = url.replaceAll('https:/', 'https://');
    }
  } else {
    url = 'http://' + url;
  }
  let domain = new URL(url);

  // console.log('Domains ===================> ', domain);

  try {
    let response = await axios({
      method: 'get',
      url: baseUrl + '?name=' + domain.hostname,
      headers: { Authorization: apiToken, 'Content-Type': 'application/json' },
    });
    if (response.data.result.length == 1) {
      return response.data.result[0].id;
    } else throw 'Invalid domain, can not get ZONE id';
  } catch (error) {
    console.log('error-data == ', error);
  }
};

const purgeDomainPerform = async (zoneId) => {
  try {
    let response = await axios({
      method: 'post',
      url: baseUrl + '/' + zoneId + '/purge_cache',
      data: { purge_everything: true },
      headers: { Authorization: apiToken, 'Content-Type': 'application/json' },
    });
    console.log('Purge Success ====>> ', response.data);
    if (response.data.success) return true;
    else return false;
  } catch (error) {
    console.log('error-data == ' + error);
  }
};

const purgeUrlPerform = async (zoneId, url) => {
  let dataJson = `{
    "files": [
        {
            "url": "${url}",
            "headers": {
                "Origin": "https://www.cloudflare.com",
                "CF-IPCountry": "US",
                "CF-Device-Type": "desktop"
            }
        }
    ]
}`;
  const jsonObj = JSON.parse(dataJson);
  console.log('Json OBJ ================>> ', jsonObj);
  try {
    let response = await axios({
      method: 'post',
      url: baseUrl + '/' + zoneId + '/purge_cache',
      data: jsonObj,
      headers: { Authorization: apiToken, 'Content-Type': 'application/json' },
    });
    console.log('Purge Success ====>> ', response.data);
    if (response.data.success) return true;
    else return false;
  } catch (error) {
    console.log('error-data == ', error);
  }
};
