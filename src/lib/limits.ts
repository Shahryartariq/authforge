/**
 * Input limits shared by the forms (src/lib/validation.ts) and the server
 * (src/lib/auth.ts). Kept free of imports so both sides can use it.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 80;
