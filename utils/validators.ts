export const onlyDigits = (s: string) => (s || "").replace(/\D+/g, "");

export function isValidCPF(raw?: string | null): boolean {
  if (!raw) return false;
  const cpf = onlyDigits(raw);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0; for (let i=0;i<9;i++) sum += parseInt(cpf[i])*(10-i);
  let dv1 = 11 - (sum % 11); dv1 = dv1 >= 10 ? 0 : dv1;
  
  sum = 0; for (let i=0;i<10;i++) sum += parseInt(cpf[i])*(11-i);
  let dv2 = 11 - (sum % 11); dv2 = dv2 >= 10 ? 0 : dv2;
  
  return dv1 === parseInt(cpf[9]) && dv2 === parseInt(cpf[10]);
}

export function isValidPhoneBR(raw?: string | null): boolean {
  if (!raw) return false;
  const phone = onlyDigits(raw);

  if (phone.length === 10) return true;        
  if (phone.length === 11) return phone[2] === "9"; 
  return false;
}
