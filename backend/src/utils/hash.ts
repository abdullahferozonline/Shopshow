import bcrypt from 'bcryptjs';

export function hashPassword(password: string): string {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

export function comparePassword(password: string, hashed: string): boolean {
  return bcrypt.compareSync(password, hashed);
}
