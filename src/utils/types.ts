export type StaffAccount = {
  id: number;
  name: string;
  email: string;
  role: string;
  password: string;
};

export type Loans = {
  id: string;
  amount: string;
  maturityDate: string;
  status: string;
  applicant: {
    name: string;
    email: string;
    telephone: string;
    totalLoan: string;
  };
  createdAt: string;
};
