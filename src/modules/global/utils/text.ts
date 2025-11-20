import * as lodash from 'lodash';
export const generateRandomString = (
  characterType: 'alphanumeric' | 'numeric',
  tokenLength: number = 10,
) => {
  // character mapping
  const characters = {
    alphanumeric:
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    numeric: '0123456789',
  };

  // token creation
  const chars = characters[characterType];
  let token = '';

  // create token if value is not manually passed in
  for (let i = 0; i < tokenLength; i++) {
    const randomIndex = lodash.random(chars.length - 1);
    token += chars[randomIndex];
  }

  return token;
};
