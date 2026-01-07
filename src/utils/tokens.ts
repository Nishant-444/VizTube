import jwt from 'jsonwebtoken';

export const generateAccessToken = (user: {
  id: number;
  email: string;
  username: string;
}) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } as any
  );
};

export const generateRefreshToken = (userId: number) => {
  return jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    } as any
  );
};
