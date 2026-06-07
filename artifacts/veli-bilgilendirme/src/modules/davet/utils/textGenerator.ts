import { ShowcasePost } from '@/modules/davet/types';

export const generateDavetMetni = (programTuru: string, formData?: any): string => {
  switch (programTuru) {
    case 'Veli Toplantısı':
      return 'Talebelerimizin gelişimi, eğitim süreci ve dönem planlaması hakkında siz kıymetli velilerimizle istişare etmek üzere düzenlediğimiz toplantımıza davetlisiniz.';
    case 'Yurt Tanıtımı':
      return 'Yurdumuzun eğitim ortamını, günlük programını ve talebelerimize sunduğumuz imkanları yakından görmek üzere sizleri tanıtım programımıza bekleriz.';
    case 'Yatılı Alıştırma Daveti':
      return 'Talebelerimizin yatılı ortama alışması ve yurt düzenini yakından tanıması için hazırladığımız programımıza siz kıymetli velilerimizi davet ediyoruz.';
    case 'Kahvaltı Programı':
      return 'Sizleri talebelerimizle birlikte samimi bir kahvaltı sofrasında ağırlayarak yurt ailemizi daha da güçlendirmek istiyoruz. Beklentilerimizi ve dönem planlarımızı paylaşacağımız bu keyifli buluşmayı kaçırmayın.';
    case 'Seminer':
      return 'Talebelerimizin gelişimine katkı sağlayacak bu değerli seminere siz kıymetli velilerimizi davet etmekten büyük mutluluk duyuyoruz.';
    case 'Tanışma Programı':
      return 'Yeni başlayan bu yurt yolculuğunda sizlerle tanışmak, beklentilerimizi paylaşmak ve birlikte güzel bir başlangıç yapmak için bu programı düzenliyoruz.';
    case 'Yaz Kampı Daveti':
      return 'Talebelerimizin unutulmaz bir yaz geçirmeleri için düzenlediğimiz kampa, siz kıymetli velilerimizi davet ediyoruz.';
    case 'Deneme Sınavı Daveti':
      return 'Talebelerimizin sınavlara hazırlık sürecini desteklemek amacıyla düzenlediğimiz bu sınav programına sizleri davet ediyoruz.';
    case 'Özel Davet':
      return 'Özel programımıza katılmanızı bekliyor, bu güzel buluşmayı birlikte yaşamamızı umuyoruz.';
    default:
      return '';
  }
};

export const substituteVariables = (template: string, variables: Record<string, string>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
};

export const generateShowcaseMetni = (post: ShowcasePost): string => {
  return `
Amacımız: ${post.amac}
Uygulama: ${post.talebelerNeYapti} ${post.uygulamaYontemi}
Kazanımlar: ${post.kazanim}
Sonuç: ${post.sonuc}
Diğer Kurumlara Önerimiz: ${post.digerYurtlarNasil}
  `.trim();
};