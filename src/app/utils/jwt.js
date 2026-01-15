import jwt from 'jsonwebtoken'

export const generateToken = (payload, secret, expiresIn) => {
  const token = jwt.sign(payload, secret, {
    expiresIn,
  });

  return token
};

export const verifyToken = (token, secret) => {
    const verify = jwt.verify(token, secret)

    return verify
}