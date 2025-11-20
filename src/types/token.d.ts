declare interface ICreateTokenArgs {
  userId: string;
  tokenType: TokenType;
  characterType: 'numeric' | 'alphanumeric';
  expiration: number;
  length: number;
  deleteExistingTokens: boolean;
}
