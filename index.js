//Load Express for webserver functionality
var express = require('express');
var app = express();
var port = 3000;

//BigChainDB libs for seed and key generation
var driver = require('bigchaindb-driver')
var bip39 = require('bip39');

//Read .env config file, containing the environment specific salt
require('dotenv').config();

/**
 * Default route
 */
app.get('/', function(req, res) {
  res.json({
      'usage':{
          'GET': {
              '/generate/': 'Generates public - private keypair for current user',
              '/generate/<username>': 'Retrieves public key for specifiec user'
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
  var usernameFromHeader = req.header('X-Forwarded-Remote-User'); 

  console.log('Reading X-Forwarded-Remote-User from header: ' + usernameFromHeader);

  //Check currentuser given
  if ( ! usernameFromHeader ) {
      // We shield our clients from internal errors, but log them
      res.statusCode = 400;
      return res.json({
          errors: ['Invalid request, no X-Forwarded-Remote-User provided']
      });
  }

  var username = usernameFromHeader.slice(0,7);

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

  //Assemble mnemonic based on username and secret salt
  var mnemonic = username+' '+salt;

  console.log('Generating seed from: ' + mnemonic);

  //Generate a seed using the bip39 lib
  var seed = bip39.mnemonicToSeed(mnemonic);

  //Use the first 32 bytes to generate a Ed25519 keypair
  var keypair = new driver.Ed25519Keypair(seed.slice(0, 32));

  //Remove private key if this is a request for a public key
  if(private == false){
    delete keypair.privateKey;
  }

  //Assemble the response
  var response = {
  	'username' : username,
    'keypair' : keypair
  };

  //Send response
  res.send(response);

});

// Start the webserver
app.listen(port, () => console.log(`Server listing on :${port}`))
