require('dotenv').config();

const verifyKeys = (req, res, next) => {

    console.log("here we go verif;y keys")
  // Extract the secret and public keys from the headers (or query params)
  const secretKeyFromHeader = req.headers['x-secret-key'];
  const publicKeyFromHeader = req.headers['x-public-key'];

  if (! secretKeyFromHeader || !publicKeyFromHeader) {
    return res.status(403).json({ message: 'Forbidden: keys REquried' });


  }

  console.log (secretKeyFromHeader ,"!==", process.env.SecretKey ,"||", publicKeyFromHeader ,"!==", process.env.PublicKey) 

  // Check if both the SecretKey and PublicKey match the environment variables
  if (secretKeyFromHeader !== process.env.SecretKey || publicKeyFromHeader !== process.env.PublicKey) {
    return res.status(403).json({ message: 'Forbidden: Invalid keys' });
  }

  // If both keys match, move to the next middleware or route handler
  next();
};

module.exports = verifyKeys;
