export const onlyDigits = (v: string) => v.replace(/\D+/g, '');
export const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
export const isCpf = (v: string) => onlyDigits(v).length === 11;
export const isPhone = (v: string) => {
  const d = onlyDigits(v);
  return d.length >= 10 && d.length <= 11;
};


const CPF_REGEX = /^(\d{3})\.(\d{3})\.(\d{3})-(\d{2})$/;