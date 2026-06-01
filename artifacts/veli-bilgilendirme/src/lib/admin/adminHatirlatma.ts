export function hatirlatmaMesaji(u: {
  name?: string;
  email?: string;
  institutionName?: string;
  district?: string;
}): string {
  const hitap = u.name?.trim() ? u.name.trim().split(" ")[0] : "Hocam";
  return [
    `Hocam selamünaleyküm ${hitap}.`,
    "Nehari Veli Bilgilendirme hesabınız aktif görünüyor ancak son günlerde giriş yapılmamış. Veli bilgilendirme afişlerinizi sistem üzerinden kolayca hazırlayabilirsiniz.",
    "",
    u.email ? `Giriş e-postanız: ${u.email}` : "",
    u.institutionName || u.district
      ? `Kurum: ${[u.institutionName, u.district].filter(Boolean).join(" / ")}`
      : "",
    "",
    "Herhangi bir sorun yaşarsanız bize ulaşabilirsiniz.",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

export function yurtHatirlatmaMesaji(yurt: {
  institutionName: string;
  gun?: number;
}): string {
  const gun = yurt.gun ?? 7;
  return `Hocam selamünaleyküm. Nehari Veli Bilgilendirme kullanım raporunda ${yurt.institutionName} için son ${gun} gündür giriş görünmüyor. Veli bilgilendirme afişlerini sistem üzerinden kolayca hazırlayabilirsiniz. Bir sorun varsa bize ulaşabilirsiniz.`;
}

