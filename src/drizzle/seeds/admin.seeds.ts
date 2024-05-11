import { UserCreation } from 'src/user/user.repository';

export const adminSeeds: (UserCreation & { role: 'admin' })[] = [
  {
    fullName: 'John Doe',
    email: 'johndoe@gmail.com',
    nationalId: '0',
    password: 'johndoe',
    role: 'admin',
  },
];
