const fs = require("fs");
const path = require("path");

const {
  JWKS: { KeyStore },
} = require("jose");

const keystore = new KeyStore();

Promise.all([
  keystore.generate("RSA", 2048, { use: "sig" }),
  keystore.generate("RSA", 2048, { use: "enc" }),
]).then(function () {
  const jwks = keystore.toJWKS(true);

  fs.writeFileSync(
    path.resolve(__dirname, "./dist/jwks.json"),
    JSON.stringify(jwks, null, 2)
  );
});
