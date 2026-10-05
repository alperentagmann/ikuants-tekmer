/**
 * Original support (teşvik) texts of the public site, including the example scenarios.
 * Used as the page fallback and by scripts/restore-support-examples.ts to refill
 * example scenarios that were lost from the database. Editable in admin afterwards.
 */
export interface SupportDefault {
    id: string;
    title: string;
    description: string;
    exampleScenario: string;
    iconName: string;
    colorGradient: string;
}

export const SUPPORT_DEFAULTS: SupportDefault[] = [
    {
        id: "01",
        title: "AR-GE VE TASARIM İNDİRİMİ",
        description: "5746 sayılı Kanun kapsamında, Teknoloji Geliştirme Bölgelerinde (TGB) ve TEKMER'lerde yürütülen Ar-Ge, yenilik ve tasarım projeleri kapsamında yapılan harcamaların tamamı (%100'ü), Kurumlar Vergisi matrahının tespitinde indirim konusu yapılır. Bu, firmanızın vergi yükünü doğrudan azaltarak elde ettiğiniz karı tekrar Ar-Ge'ye yatırmanıza olanak tanır.",
        exampleScenario: "Örneğin; firmanızın yıl içinde 500.000 TL tutarında onaylı bir Ar-Ge harcaması yaptığını varsayalım. Yıl sonunda 1.000.000 TL kar elde ettiğinizde, vergi matrahınız 1.000.000 TL değil, Ar-Ge indirimi düşüldükten sonra 500.000 TL olarak hesaplanır. Bu sayede ödeyeceğiniz Kurumlar Vergisi yarı yarıya düşer.",
        iconName: 'FileCheck',
        colorGradient: 'from-blue-500 to-cyan-500'
    },
    {
        id: "02",
        title: "GELİR VERGİSİ STOPAJI TEŞVİKİ",
        description: "Bölgede çalışan Ar-Ge, tasarım ve destek personelinin bu görevleri ile ilgili ücretleri üzerinden hesaplanan gelir vergisinin; doktoralı olanlar için %95'i, yüksek lisanslı olanlar için %90'ı ve diğerleri için %80'i vergiden müstesnadır. Bu teşvik, nitelikli personel istihdamını işveren için çok daha az maliyetli hale getirir.",
        exampleScenario: "Örneğin; brüt maaşı 30.000 TL olan bir yazılım mühendisi istihdam ettiğinizi düşünelim. Normal şartlarda devlete ödenmesi gereken gelir vergisi stopajının %80 ile %95'i (eğitim durumuna göre) devlet tarafından terkin edilir yani alınmaz. Bu durum işverenin personel maliyetini aylık bazda binlerce lira düşürür.",
        iconName: 'DollarSign',
        colorGradient: 'from-green-500 to-emerald-500'
    },
    {
        id: "03",
        title: "SİGORTA PRİMİ DESTEĞİ",
        description: "Kanun kapsamında çalışan Ar-Ge, tasarım ve destek personeli için hesaplanan sigorta primi işveren hissesinin %50'si, Hazine ve Maliye Bakanlığı tarafından karşılanır. Bu destek 5 yıl süreyle (bazı durumlarda projenin süresine bağlı olarak) uygulanır.",
        exampleScenario: "Örneğin; Ar-Ge personeliniz için ödemeniz gereken aylık SGK işveren payı 5.000 TL ise, bunun 2.500 TL'si devlet tarafından karşılanır. 10 kişilik bir Ar-Ge ekibinde bu destek yıllık bazda çok ciddi bir tasarruf sağlar.",
        iconName: 'Shield',
        colorGradient: 'from-purple-500 to-pink-500'
    },
    {
        id: "04",
        title: "DAMGA VERGİSİ İSTİSNASI",
        description: "Ar-Ge ve yenilik faaliyetleri ile ilgili olarak düzenlenen her türlü kağıt (sözleşme, taahhütname, ihale kararları vb.) ve yapılan işlemler damga vergisinden muaftır. Özellikle yüksek tutarlı sözleşmelerde ve personel maaş bordrolarında damga vergisi maliyeti oluşmaz.",
        exampleScenario: "Örneğin; projeniz kapsamında 1.000.000 TL değerinde bir danışmanlık veya hizmet alım sözleşmesi imzaladığınızda, normalde ödemeniz gereken (binde 9,48 oranında) yaklaşık 9.480 TL tutarındaki damga vergisini ödemezsiniz.",
        iconName: 'FileCheck',
        colorGradient: 'from-red-500 to-orange-500'
    },
    {
        id: "05",
        title: "GÜMRÜK VERGİSİ İSTİSNASI",
        description: "Ar-Ge, yenilik ve tasarım projeleri kapsamında kullanmak üzere yurt dışından ithal edeceğiniz eşya, makine, teçhizat ve yazılımlar; gümrük vergisinden, her türlü fondan ve bu işlemler için düzenlenen kağıtlar damga vergisinden istisnadır.",
        exampleScenario: "Örneğin; projenizdeki bir prototip geliştirme aşaması için yurt dışından 20.000 Euro değerinde özel bir test cihazı getirmeniz gerekiyor. Bu istisna sayesinde cihazı gümrük vergisi ödemeden, sadece KDV (bazı durumlarda KDV istisnası da olabilir) ile ithal edebilirsiniz.",
        iconName: 'Globe',
        colorGradient: 'from-indigo-500 to-blue-600'
    },
    {
        id: "06",
        title: "TEMEL BİLİMLER DESTEĞİ",
        description: "En az lisans derecesine sahip Temel Bilimler (Matematik, Fizik, Kimya, Biyoloji) mezunu Ar-Ge personeli istihdam eden firmalara, bu personelin her biri için aylık brüt asgari ücret tutarı kadar maaş desteği sağlanır. Bu destek iki yıl süreyle Bakanlık bütçesinden hibe olarak verilir.",
        exampleScenario: "Örneğin; Ar-Ge projenizde bir Matematikçi istihdam ettiniz. Bu personele ödediğiniz maaşın, o yılki brüt asgari ücret kadarlık kısmı (örneğin 20.002 TL) devlet tarafından şirketinize hibe olarak geri ödenir.",
        iconName: 'GraduationCap',
        colorGradient: 'from-yellow-400 to-orange-500'
    }
];
