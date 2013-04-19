var https = require('https');
var fs = require('fs');
var mysql = require('mysql');
var express = require('express');

var c = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  database: 'blob_vault',
  user: 'blobby',
  password: '57umtSMG4Fyv5ary'
});
c.connect();

var app = express();
app.use(express.bodyParser());

app.get('/:key', function (req, res) {
  console.log("app.get");
  
  try{
  res.set({
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*'
  });
  
  c.query(
    "SELECT v FROM blobs WHERE k = ? LIMIT 1",
    [req.params.key],
    function (err, qres) {
      res.send(qres.length ? qres[0].v : "");
    }
  );
  } catch(e) {
    console.log("Exception: "+e);
    c.connect(); 
  }
  
});

var sjcl = require('sjcl');
function verifies(pubKey, sig, data) {
 
    var curve = sjcl.ecc.curves.c192,
        pubBits = sjcl.codec.base64.toBits(pubKey),
        pubKey = new sjcl.ecc.ecdsa.publicKey(curve, pubBits),
        sigBits = sjcl.codec.base64.toBits(sig);

    return pubKey.verify(sjcl.hash.sha256.hash(data), sigBits);
 
}

function insert_blob(req) {
  c.query(
    "INSERT INTO blobs(k, v, pub_key, updated, ip_last_updated_from) VALUES (?, ?, ?, NOW(), INET_ATON(?)) \
      ON DUPLICATE KEY UPDATE v = VALUES(v), \
                              pub_key = VALUES(pub_key), \
                              updated = NOW(), \
                              ip_last_updated_from = VALUES(ip_last_updated_from)",
    [req.params.key, req.body.blob, req.body.new_pub || "", req.ip]
  );
}

app.post('/:key', function (req, res) {
  try{
  res.set({
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*'
  });

  c.query(
    "SELECT pub_key FROM blobs WHERE k = ? LIMIT 1",
    [req.params.key],
    function (err, qres) {
      if (qres.length && qres[0].pub_key) {
        verifies(qres[0].pub_key, req.body.sig, req.body.blob) && insert_blob(req);
      } else {
        insert_blob(req);
      }
      res.send();
    }
  )
  } catch(e)  {
    console.log("Exception: "+e);
    c.connect(); 
  }
});

app.listen(80);

try {
  var https = https.createServer({
    key: fs.readFileSync(__dirname + '/blobvault.key'),
    ca: fs.readFileSync(__dirname + '/intermediate.crt'),
    cert: fs.readFileSync(__dirname + '/blobvault.crt')
  }, app);
  https.listen(443);
} catch (e) {
  console.log("Could not launch SSL server: " + (e.stack ? e.stack : e.toString()));
}
