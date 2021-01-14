const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
secretKey = ""

const no_auth_header = (res) =>
{
  res.status(403)
         .json({error:true,message:"Authorization header not found"});
}

const authorize = (req,res,next) =>
{
    next();
    return;
    const authorization = req.headers.authorization;
    let token = null;
    if(authorization && authorization.split(" ").length === 2)
    {
      token = authorization.split(" ")[1];
    } 
    else
    {
      return no_auth_header(res);
    }
    try {
      const decode = jwt.verify(token,secretKey);
      if(decode.exp < Date.now())
      {
        return no_auth_header(res);
      }
      next();
    }
    catch(e)
    {
      no_auth_header(res);
    }
}

const send_token = (res,payload) =>
{
    const expires_in = 60 * 60 * 24;
    const exp = Date.now() * expires_in * 1000;
    const token = jwt.sign({payload,exp},secretKey);
    res.status(200)
        .json({token_type: "Bearer",token,expires_in});
}

module.exports = {
    authorize: authorize,
    token: send_token
};