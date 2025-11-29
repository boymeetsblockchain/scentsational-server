export interface initializeTransactionData {
  amount: number;
  email: string;
}

export interface initializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}
