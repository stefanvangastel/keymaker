//Load Express
var express = require('express');
var app = express();
var port = 3000;

//BigChainDB key requirements
var driver = require('bigchaindb-driver')
var bip39 = require('bip39');

//Read .env
require('dotenv').config();

/**
 * Default route
 */
app.get('/', function(req, res) {
  res.json({
      'usage':{
          'GET': {
              '/generate/': 'Generates public - private keypair for current user',
              '/generate/<u-account>': 'Retrieves public key for specifiec user'
          }
      }
  });
});


/**
 * Genereer sleutel gebaseerd op seed en salt
 **/
app.get('/generate/:username?', function(req, res) {

  //Assume private key
  var private = true

  //Get forwarded remote user header, strip domain (use first 7 chars)
  var username = req.header('X-Forwarded-Remote-User').slice(0,7); 

  console.log('Reading X-Forwarded-Remote-User from header: ' + username);

  //Check currentuser given
  if ( ! username ) {
      // We shield our clients from internal errors, but log them
      res.statusCode = 400;
      return res.json({
          errors: ['Invalid request, no X-Forwarded-Remote-User provided']
      });
  }


  //Change to public mode if differentusername set
  if(req.params.username){
    
    private = false;
    username = req.params.username;

    console.log('Switching to public mode for user: '+username);
  }

  //Get Salt from ENV
  if(!process.env.SALT){
      // We shield our clients from internal errors, but log them
      res.statusCode = 500;
      return res.json({
          errors: ['No SALT configured']
      });
  }
  var salt = process.env.SALT;

  var mnemonic = username+' '+salt;

  console.log('Generating seed from: ' + mnemonic);

  var seed = bip39.mnemonicToSeed(mnemonic);

  var keypair = new driver.Ed25519Keypair(seed.slice(0, 32));

  //Remove private key
  if(private == false){
    delete keypair.privateKey;
  }

  var response = {
  	'username' : username,
    'keypair' : keypair
  };

  //Send response
  res.send(response);

});

app.listen(port, () => console.log(`Server listing on :${port}`))
