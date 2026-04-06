import jwt from 'jsonwebtoken';

const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  const expire = process.env.JWT_EXPIRE || '7d';

  if (!secret) throw new Error('JWT_SECRET not defined');

  return jwt.sign({ id: id.toString() }, secret, { expiresIn: expire } as jwt.SignOptions);
};

export default generateToken;
