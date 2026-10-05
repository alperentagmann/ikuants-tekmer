/**
 * News and announcements published on the original İKÜANTS TEKMER website.
 * Used once to import into the database (scripts/import-legacy-news.ts) and as a fallback
 * when the database is unreachable. After import, news are managed in Admin › Haberler.
 */
export interface LegacyNewsItem {
    id: number;
    title: string;
    excerpt: string;
    fullContent: string;
    date: string;
    category: string;
    image: string;
    gallery?: string[];
    registrationLink?: string;
    featured: boolean;
}

export const LEGACY_NEWS: LegacyNewsItem[] = [
    {
        id: -4,
        title: "ANTSPARK Demoday 2026 Gerçekleştirildi: Girişimcilik Ekosistemi, Yatırımcılar ve Paydaşlar İKÜANTS TEKMER Çatısı Altında Buluştu",
        excerpt: "İKÜANTS TEKMER tarafından yürütülen ANTSPARK Ön Kuluçka Programı kapsamında düzenlenen ANTSPARK Demoday 2026, girişimcilik ekosisteminin önemli paydaşlarını, yatırımcıları, mentörleri ve kamu temsilcilerini bir araya getirdi.",
        fullContent: `İKÜANTS TEKMER tarafından yürütülen ANTSPARK Ön Kuluçka Programı kapsamında düzenlenen ANTSPARK Demoday 2026, girişimcilik ekosisteminin önemli paydaşlarını, yatırımcıları, mentörleri ve kamu temsilcilerini bir araya getirdi. 18 Şubat 2026 Çarşamba günü gerçekleştirilen etkinlikte, program süresince eğitim ve mentörlük alan girişimciler projelerini jüri üyeleri ve yatırımcılar karşısında sunma fırsatı buldu.

ANTSPARK Demoday, networking oturumu ile başladı. Bu oturumda girişimciler; jüri üyeleri, yatırımcılar, mentörler ve ekosistem temsilcileriyle birebir iletişim kurarak projelerini tanıttı, potansiyel iş birlikleri ve yatırım süreçlerine yönelik ilk temaslarını gerçekleştirdi.

Etkinlik, açılış konuşmalarıyla devam etti. Açılışta; İstanbul Kültür Üniversitesi Rektörü Prof. Dr. Fadime Üney Yüksektepe, KOSGEB İkitelli Müdürü Duygu Yücesoy Manyaslı ve İKÜANTS TEKMER Yönetim Kurulu Başkan Vekili Gülce Öğrüç Ildız tarafından üniversite–kamu–girişimcilik ekosistemi iş birliklerinin önemi ile ön kuluçka programlarının girişimcilere sunduğu katkılar vurgulandı.

Açılış konuşmalarının ardından sahne, ANTSPARK Ön Kuluçka Programı kapsamında yer alan girişimcilere bırakıldı. Girişimciler, aylar süren eğitim ve mentörlük sürecinin çıktısı olan projelerini jüri üyeleri ve yatırımcıların katılımıyla sundular.

Etkinlik, ANTSPARK Ön Kuluçka Programı Koordinatörü Alperen Tağman’ın sunumlarıyla başarıyla yürütüldü. Sunumlar sırasında jüri üyeleri ve yatırımcılar; iş modeli, pazar stratejisi, ölçeklenebilirlik ve yatırım potansiyeli başlıklarında interaktif sorular yönelterek değerlendirmelerini gerçekleştirdi.

Girişimci sunumlarının tamamlanmasının ardından jüri değerlendirmeleri sona erdi. Değerlendirme sürecinin ardından jüri üyeleri kısa konuşmalar yaparak girişimcilere geri bildirimlerini paylaştı. Etkinliğe sundukları katkılar dolayısıyla jüri üyelerine, İKÜANTS TEKMER ekibi tarafından teşekkür edilerek hediyeleri takdim edildi.

Demoday etkinliği kapsamında gerçekleştirilen ödül töreninde, jüri değerlendirmeleri sonucunda dereceye giren girişimcilere nakit ödüller İKÜANTS TEKMER tarafından takdim edildi. Ayrıca, girişimcilik ekosistemine sunduğu değerli katkılarla öne çıkan AKINSOFT tarafından ilk üçe giren girişimcilere TaskPano ve CMS Yazılımı ödülleri sağlandı.

ANTSPARK Ön Kuluçka Programı süresince; girişimcilerin gelişimine önemli katkılar sunan Startup Centrum ve Malogra Danışmanlık ile gerçekleştirilen iş birlikleri, programın eğitim ve mentörlük yapısının güçlenmesine katkı sağladı.

Kapanış konuşmasında; programa katkı sunan yatırımcılara, mentörlere, jüri üyelerine ve tüm paydaşlara teşekkür edilerek, İKÜANTS TEKMER’in girişimcileri desteklemeye ve onları bir sonraki aşama olan kuluçka süreçlerine hazırlamaya devam edeceği vurgulandı.

ANTSPARK Demoday 2026, girişimcilerin projelerini yatırımcılarla buluşturduğu, güçlü iş birliklerinin kurulduğu ve girişimcilik ekosistemine değer katan bir organizasyon olarak başarıyla tamamlandı.`,
        date: "18 Şubat 2026",
        category: "Etkinlik",
        image: "/images/news/antspark-demoday-2026/05.jpg",
        gallery: [
            "/images/news/antspark-demoday-2026/01.jpg",
            "/images/news/antspark-demoday-2026/02.jpg",
            "/images/news/antspark-demoday-2026/03.jpg",
            "/images/news/antspark-demoday-2026/04.jpg",
            "/images/news/antspark-demoday-2026/05.jpg"
        ],
        featured: true
    },
    {
        id: -3,
        title: "ANTSPARK DEMODAY",
        excerpt: "ANTSPARK Ön Kuluçka Programı kapsamında yürütülen yoğun eğitim ve mentörlük sürecinin ardından, girişimler büyük final için sahneye çıkıyor. Aylar boyunca fikirlerini olgunlaştıran, iş modellerini netleştiren ve projelerini geliştiren girişimciler, ANTSPARK DEMODAY’de jüri ve davetliler karşısında sunumlarını gerçekleştirecek.",
        fullContent: `ANTSPARK Ön Kuluçka Programı kapsamında yürütülen yoğun eğitim ve mentörlük sürecinin ardından, girişimler büyük final için sahneye çıkıyor. Aylar boyunca fikirlerini olgunlaştıran, iş modellerini netleştiren ve projelerini geliştiren girişimciler, ANTSPARK DEMODAY’de jüri ve davetliler karşısında sunumlarını gerçekleştirecek.

ANTSPARK DEMODAY; 15 girişimin, 15 yenilikçi fikirle sahne aldığı; inovasyonun, rekabetin ve girişimcilik ruhunun aynı anda hissedildiği özel bir buluşma noktasıdır. Etkinlik boyunca gerçekleştirilecek sunumlar, jüri değerlendirmeleri ve geri bildirimlerle girişimciler için önemli bir gelişim ve görünürlük fırsatı sunulacaktır.

Program sonunda ise başarılı bulunan girişimler ödüllendirilerek, ANTSPARK Ön Kuluçka sürecinde ortaya konan emekler taçlandırılacaktır. ANTSPARK DEMODAY, yalnızca bir sunum etkinliği değil; yeni iş birliklerinin temellerinin atıldığı, girişimlerin bir sonraki aşamaya hazırlanmasına katkı sağlayan güçlü bir adımdır.

Etkinlik Bilgileri:

• Tarih: 18 Şubat 2026
• Saat: 12:30 – 16:00
• Yer: İstanbul Kültür Üniversitesi – İKÜANTS TEKMER

ANTSPARK DEMODAY ile girişimcilik sahnesinde geleceğe yön veren fikirler, yatırımcılar, mentorlar ve ekosistem paydaşlarıyla buluşuyor. Girişimciliğin enerjisini yakından hissetmek isteyen herkesi bu özel finale davet ediyoruz.`,
        date: "18 Şubat 2026",
        category: "Etkinlik",
        image: "/images/news/antspark-demoday/01.png",
        gallery: [
            "/images/news/antspark-demoday/01.png",
            "/images/news/antspark-demoday/02.png",
            "/images/news/antspark-demoday/03.png"
        ],
        featured: false
    },
    {
        id: -2,
        title: "İKÜANTS TEKMER Staj Başvuruları Açıldı",
        excerpt: "İKÜANTS TEKMER bünyesinde faaliyet gösteren girişimci firmaların stajyer talepleri ile staj yapmak isteyen öğrenciler için staj başvuruları, 05 Şubat 2025 Perşembe günü itibarıyla açıldı.",
        fullContent: `İKÜANTS TEKMER bünyesinde faaliyet gösteren girişimci firmaların stajyer talepleri ile staj yapmak isteyen öğrenciler için staj başvuruları, 05 Şubat 2025 Perşembe günü itibarıyla açıldı.

Bu kapsamda;

İKÜANTS TEKMER ekosistemi içerisinde stajyer talebinde bulunmak isteyen firmalar ile staj yeri arayışında olan öğrenciler, hazırlanan başvuru formları aracılığıyla sürece dahil olabilmektedir.

Başvurulara, ilgili sayfada yer alan QR kodun taratılması suretiyle erişilebilmekte olup; başvuru sahipleri öğrenci veya firma olmalarına göre kendilerine uygun olan formu doldurarak başvurularını gerçekleştirebilmektedir.

İlgili başvurular, İKÜANTS TEKMER koordinasyonunda değerlendirilecek; uygun görülen eşleştirmeler doğrultusunda taraflarla iletişime geçilecek.`,
        date: "05 Şubat 2025",
        category: "Duyuru",
        image: "/images/news/staj-basvurulari/01.jpg",
        gallery: [
            "/images/news/staj-basvurulari/01.jpg",
            "/images/news/staj-basvurulari/02.png"
        ],
        featured: false
    },
    {
        id: -1,
        title: "TÜBİTAK Proje Destekleri Eğitimi",
        excerpt: "İKÜANTS TEKMER koordinasyonunda; ATLAS TEKMER, İstanbul Ticaret Üniversitesi TTO, BTM TEKMER ve Maribor Mühendislik paydaşlığında, TÜBİTAK TEYDEB tarafından yürütülen 1501, 1507 ve 1707 Ar-Ge Destek Programları hakkında bilgilendirme amacıyla çevrim içi eğitim düzenlenecek.",
        fullContent: `İKÜANTS TEKMER koordinasyonunda; ATLAS TEKMER, İstanbul Ticaret Üniversitesi TTO, BTM TEKMER ve Maribor Mühendislik paydaşlığında, TÜBİTAK TEYDEB tarafından yürütülen 1501, 1507 ve 1707 Ar-Ge Destek Programları hakkında bilgilendirme amacıyla çevrim içi eğitim düzenlenecek.

Eğitim kapsamında; katılımcıların TÜBİTAK Ar-Ge destek mekanizmalarını doğru şekilde tanıması, proje fikirlerinin uygunluk değerlendirmesinin yapılması, proje kurgusu, iş paketleri, bütçe kalemleri ve hakem değerlendirme süreçlerine ilişkin temel yaklaşımlar ele alınacak.

Eğitim Bilgileri:

• Eğitmen: Mustafa Ercan ve Serhat Topaloğlu (Maribor Mühendislik)
• Tarih: 27 Ocak 2026
• Saat: 10.00 – 12.00
• Yer: MS Teams (Çevrim İçi)

Kayıt Linki: https://forms.gle/rCGsZPwatVXRCbqM7`,
        date: "27 Ocak 2026",
        category: "Duyuru",
        image: "/images/news/tubitak-egitim/01.png",
        registrationLink: "https://forms.gle/rCGsZPwatVXRCbqM7",
        gallery: [
            "/images/news/tubitak-egitim/01.png"
        ],
        featured: true
    },
    {
        id: 0,
        title: "ANTSPARK Ön Kuluçka Programı'nda Verimli Bir Haftayı Geride Bıraktık",
        excerpt: "İKÜANTS TEKMER tarafından yürütülen ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşmeye uzanan yolculuklarında ihtiyaç duydukları bilgi, beceri ve yetkinlikleri kazandırmaya devam ediyor.",
        fullContent: `İKÜANTS TEKMER tarafından yürütülen ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşmeye uzanan yolculuklarında ihtiyaç duydukları bilgi, beceri ve yetkinlikleri kazandırmaya devam ediyor. Program kapsamında geçtiğimiz hafta, hem mentörlük hem de tematik eğitimlerle dolu verimli bir süreç başarıyla tamamlandı.

07 Ocak 2026 Çarşamba günü gerçekleştirilen Mentörlük Oturumu – 4 kapsamında girişimcilerimiz, projelerini mentörleriyle birlikte değerlendirme ve birebir geri bildirim alma imkânı buldu.

08 Ocak 2026 Perşembe günü düzenlenen "Girişimciler için Sürdürülebilirlik Eğitimi", İstanbul Kültür Üniversitesi'nden Nazife Merve Hamzaoğlu tarafından gerçekleştirildi. Eğitimde; çevresel etki analizi, sürdürülebilir iş modelleri ve yeşil girişim yaklaşımları ele alınarak, girişimcilerin fikirlerini sürdürülebilirlik perspektifiyle yeniden kurgulamaları hedeflendi.

Haftaya ANTSPARK'ta Neler Var?

ANTSPARK Ön Kuluçka Programı kapsamında 12–15 Ocak 2026 haftasında girişimcileri dijital pazarlama ve psikolojik dayanıklılık odağında yoğun bir eğitim ve mentörlük takvimi bekliyor:

Pazartesi | 12.01.2026 | 15.00–18.00
Dijital Pazarlama: Sosyal Medya
Platform seçimi, içerik planlama ve sosyal medya stratejileri
Eğitmen: Müge Bezgin – Startup Centrum 

Salı | 13.01.2026 | 15.00–18.00
Dijital Pazarlama: SEO ve Görünürlük
Arama motoru optimizasyonu ve web sitesi görünürlüğü
Eğitmen: Haydar Özkömürcü – Cremicro Digital Marketing Agency 

Çarşamba | 14.01.2026 | 14.00–17.00
Girişimcilikte Psikolojik Dayanıklılık: Grup Mentörlüğü
Mentörler:
Dr. Öğr. Üyesi Meryem Demir Güdül – İstanbul Kültür Üniversitesi
Dr. İlker Çitli – İstanbul Medipol Üniversitesi

Perşembe | 15.01.2026 | 15.00–18.00
Dijital Pazarlama: Online Reklam
Reklam kampanyası planlama, hedefleme ve ölçümleme
Eğitmen: Haydar Özkömürcü – Cremicro Digital Marketing Agency 

İKÜANTS TEKMER, girişimcilere yalnızca teknik bilgi kazandırmayı değil; aynı zamanda pazar odaklı düşünme, dijital yetkinlikler ve psikolojik dayanıklılık gibi güçlü bir girişimcilik yolculuğu için kritik öneme sahip becerileri bütüncül bir yaklaşımla sunmayı amaçlamaktadır.

ANTSPARK Ön Kuluçka Programı, önümüzdeki haftalarda da eğitim ve mentörlük faaliyetleriyle girişimcilere destek olmaya devam edecektir.`,
        date: "08 Ocak 2026",
        category: "Program",
        image: "/images/news/antspark-verimli-hafta/01.jpg",
        gallery: [
            "/images/news/antspark-verimli-hafta/01.jpg",
            "/images/news/antspark-verimli-hafta/02.jpg"
        ],
        featured: false
    },
    {
        id: 1,
        title: "ANTSPARK MasterClass'ta Girişimcilik Ekosistemi Masaya Yatırıldı",
        excerpt: "İKÜANTS TEKMER tarafından 15 Aralık Pazartesi günü düzenlenen ANTSPARK MasterClass, girişimcilik ve inovasyon ekosisteminin önemli paydaşlarını bir araya getirdi.",
        fullContent: `İKÜANTS TEKMER tarafından 15 Aralık Pazartesi günü düzenlenen "ANTSPARK MasterClass", girişimcilik ve inovasyon ekosisteminin önemli paydaşlarını bir araya getirdi.

Program; girişimciler, öğrenciler, akademisyenler ve ekosistem paydaşlarının bir araya gelerek fikir alışverişinde bulunduğu networking oturumu ile başladı. Bu bölümde katılımcılar yeni iş birlikleri geliştirme, deneyim paylaşma ve ANTSPARK çatısı altında yürütülen çalışmalar hakkında doğrudan bilgi alma fırsatı buldu.

Programın açılışı, Rektör Yardımcımız & İKÜANTS TEKMER Yönetim Kurulu Başkan Vekili Prof. Dr. Gülce Öğrüç Ildız tarafından gerçekleştirildi. Açılış konuşmasında üniversite temelli girişimcilik ekosistemlerinin önemi, yenilikçi fikirlerin ticarileşme süreçleri ve genç girişimcilere sunulan destek mekanizmalarına değinildi.

Açılışın ardından, girişimcilik ekosisteminin duayen isimlerinden Ufuk Batum "Ekosistem ve Kahramanları" başlıklı "MasterClass" oturumuyla katılımcılarla buluştu. Oturumda; girişimcilik yolculuğunun dinamikleri, ekosistem aktörlerinin rolleri, sürdürülebilir başarı için kritik eşikler ve deneyim temelli içgörüler paylaşıldı.

Katılımcılar, hem ilham verici örnekler hem de pratik bakış açılarıyla zengin bir içerik deneyimi yaşadı.

ANTSPARK MasterClass, üniversite odaklı girişimcilik ekosisteminin güçlenmesine katkı sunan, bilgi paylaşımı ve etkileşimi odağına alan nitelikli bir buluşma olarak başarıyla tamamlandı.

İKÜANTS TEKMER olarak girişimcilik ekosisteminin geliştirilmesi ve güçlendirilmesi için bu tür etkinlikler düzenlemeye devam edeceğiz.`,
        date: "15 Aralık 2025",
        category: "Etkinlik",
        image: "/images/news/antspark-masterclass/05.jpg",
        gallery: [
            "/images/news/antspark-masterclass/01.jpg",
            "/images/news/antspark-masterclass/02.jpg",
            "/images/news/antspark-masterclass/03.jpg",
            "/images/news/antspark-masterclass/04.jpg",
            "/images/news/antspark-masterclass/05.jpg"
        ],
        featured: false
    },
    {
        id: 2,
        title: "ANTSPARK Ön Kuluçka Programı'nda Yoğun Bir Eğitim Haftası Geride Kaldı!",
        excerpt: "İKÜANTS TEKMER'in yürüttüğü ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşmeye uzanan yolculuklarında ihtiyaç duydukları yetkinlikleri kazandırmaya devam ediyor.",
        fullContent: `İKÜANTS TEKMER'in yürüttüğü ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşmeye uzanan yolculuklarında ihtiyaç duydukları yetkinlikleri kazandırmaya devam ediyor.

Bu hafta gerçekleştirilen eğitimler:

• 08 Aralık 2025'te "Girişimciler İçin Hukuki Çerçeve" eğitimi; Dr. Öğr. Üyesi Muharrem Tütüncü, Dr. Öğr. Üyesi Ender Demir ve Hukuk Müşavirimiz Av. İmren Öner Topaloğlu tarafından verildi.

• 09 Aralık 2025'te "Dijital Pazarlamaya Giriş" başlıklı eğitim, marketing alanında uzman Haydar Özkömürcü tarafından başarıyla gerçekleştirildi.

• 10 Aralık 2025'te tüm girişimcilerimiz birer saatlik birebir mentörlük aldılar.

• 11 Aralık 2025'te ise "Girişimcilikte Psikolojik Dayanıklılık: Esneklik Geliştirme Atölyesi-3", örgütsel psikoloji alanında uzman İlker Çitli tarafından başarıyla gerçekleştirildi.

Programın beşinci haftasında girişimcileri yine dopdolu bir takvim bekliyor:

• 15 Aralık 2025 & 13.00-18.00 "MasterClass ve Fikri Mülkiyet Oturumu"
• 16 Aralık 2025 & 15.00-18.00 "Fikir Değerlendirme Teknikleri" – Ufuk Batum (Mentör ve Yatırımcılar Ligi Kurucusu)
• 18 Aralık 2025 & 15.00-18.00 "Fikirden Ürüne Giden Yol: Startup'ta İlk 90 Gün" – Çağrı Temel (Hezarfen LLC Kurucu Ortağı)

İKÜANTS TEKMER; girişimcilere yalnızca teknik bilgiler kazandırmayı değil, aynı zamanda zihinsel dayanıklılık, pazar odaklı yaklaşım ve iş modeli geliştirme becerileri gibi güçlü bir girişim yolculuğu için gerekli tüm yetkinlikleri sunmayı amaçlıyor.

ANTSPARK Ön Kuluçka Programı, önümüzdeki haftalarda da kapsamlı eğitim ve mentorluklarla girişimcilere destek olmayı sürdürecek.

İKÜANTS TEKMER'i sosyal medya hesaplarından (@ikuantstekmer) takip ederek program hakkında duyurulara erişebilirsiniz.`,
        date: "8 Aralık 2025",
        category: "Program",
        image: "/images/news/antspark-egitim-haftasi/04.jpg",
        gallery: [
            "/images/news/antspark-egitim-haftasi/01.jpg",
            "/images/news/antspark-egitim-haftasi/02.jpg",
            "/images/news/antspark-egitim-haftasi/03.jpg",
            "/images/news/antspark-egitim-haftasi/04.jpg"
        ],
        featured: false
    },
    {
        id: 3,
        title: "ANTSPARK Ön Kuluçka Programı'nda Verimli Bir Eğitim Haftası Geride Kaldı!",
        excerpt: "İKÜANTS TEKMER'in yürüttüğü ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşme sürecine kadar olan yolculuklarında verimli bir hafta daha geçirdi.",
        fullContent: `İKÜANTS TEKMER'in yürüttüğü ANTSPARK Ön Kuluçka Programı, girişimcilerin fikir aşamasından ticarileşme sürecine kadar olan yolculuklarında verimli bir hafta daha geçirdi.

Program kapsamında girişimcilerimize iş geliştirme, pazarlama stratejileri ve finansal planlama konularında kapsamlı eğitimler verildi.

Bu hafta ele alınan konular:

• İş Modeli Geliştirme: Girişimciler, iş modellerini nasıl oluşturacakları ve optimize edecekleri konusunda detaylı bilgi edindi.

• Pazar Araştırması: Hedef kitle analizi ve pazar araştırması teknikleri üzerine uygulamalı çalışmalar yapıldı.

• Finansal Planlama: Bütçeleme, nakit akışı yönetimi ve yatırımcı sunumu hazırlama konuları işlendi.

• Mentörlük Seansları: Her girişimci, alanında uzman mentörlerle birebir görüşme fırsatı buldu.

İKÜANTS TEKMER olarak girişimcilerimizin başarılı bir şekilde ticarileşme süreçlerini tamamlamalarını desteklemeye devam ediyoruz.

ANTSPARK Ön Kuluçka Programı, girişimcilerin ihtiyaç duyduğu tüm yetkinlikleri kazandırmak için tasarlanmış kapsamlı bir programdır.

Sosyal medya hesaplarımızdan (@ikuantstekmer) bizi takip ederek güncel gelişmelerden haberdar olabilirsiniz.`,
        date: "1 Aralık 2025",
        category: "Program",
        image: "/images/news/antspark-verimli-hafta/01.jpg",
        gallery: [
            "/images/news/antspark-verimli-hafta/01.jpg",
            "/images/news/antspark-verimli-hafta/02.jpg",
            "/images/news/antspark-verimli-hafta/03.jpg"
        ],
        featured: false
    },
    {
        id: 4,
        title: "İKÜANTS TEKMER, ÜSİMP Organizasyonunda Yer Aldı",
        excerpt: "İKÜANTS TEKMER; ÜSİMP tarafından ODTÜ'de gerçekleştirilen Kongre – Sempozyum – Fuar organizasyonunda yer aldı. Etkinlikte uzmanımız Alperen Tağman'a 'RTTP' rozeti resmi olarak takdim edildi.",
        fullContent: `İKÜANTS Teknoloji Geliştirme Merkezi (TEKMER); Türkiye'nin üniversite–sanayi iş birliğinde en yetkin platformlarından olan Üniversite Sanayi İşbirliği Merkezleri Platformu (ÜSİMP) tarafından Orta Doğu Teknik Üniversitesi'nde (ODTÜ) gerçekleştirilen Kongre – Sempozyum – Fuar organizasyonunda yer aldı.

Türkiye'de teknoloji transferi, Ar-Ge kapasitesi, girişimcilik destek mekanizmaları ve üniversite–sanayi etkileşimlerinin ele alındığı bu geniş kapsamlı etkinlikte üniversitemizi temsil eden İKÜANTS TEKMER Uzmanı Alperen Tağman, ilgili paydaşlarla etkin iletişim kurdu ve ekosistemle alakalı bilgi alışverişinde bulundu.

Etkinlik süresince Tağman'a "Registered Technology Transfer Professional (RTTP)" rozeti resmi olarak takdim edildi. Bu unvan, uluslararası teknoloji transfer profesyonelliği standartlarını karşılayan kişiler için verilen prestijli bir rozet olup, merkezimizin uzmanlık kapasitesini ve profesyonel yetkinliğini bir kez daha tescilledi.

Kongre kapsamında gerçekleştirilen faaliyetler:

• ÜSİMP tarafından düzenlenen Teknoloji Transfer Ofisi ve TEKMER yöneticileri toplantısına katılım sağlandı.

• Üniversite–sanayi iş birliği modelleri, fikri mülkiyet süreçleri, teknoloji transfer süreçleri ve girişimcilik destek programları üzerine değerlendirmelerde bulunuldu.

• Fuar alanında gerçekleştirilen ziyaretler kapsamında çok yönlü networking faaliyetleri yürütüldü ve yeni iş birliği fırsatları değerlendirildi.

• Program kapsamında düzenlenen konferans ve sempozyum oturumlarına iştirak edilerek güncel gelişmeler ve politikalar takip edildi.

İKÜANTS TEKMER; Türkiye'nin girişimcilik ve teknoloji geliştirme ekosistemine katkı sunmak amacıyla, üniversite–sanayi iş birliği ve girişimcilik süreçlerinde aktif rol almaya ve ulusal platformlarda görünürlüğünü artırmaya devam etmektedir.`,
        date: "27-28 Kasım 2025",
        category: "Duyuru",
        image: "/images/news/usimp-organizasyon/03.jpg",
        gallery: [
            "/images/news/usimp-organizasyon/01.jpg",
            "/images/news/usimp-organizasyon/02.jpg",
            "/images/news/usimp-organizasyon/03.jpg",
            "/images/news/usimp-organizasyon/04.jpg",
            "/images/news/usimp-organizasyon/05.jpg"
        ],
        featured: true
    },
    {
        id: 5,
        title: "İKÜANTS TEKMER, E-Ticaret Haftası Etkinliğine Katıldı",
        excerpt: "İstanbul Kültür Üniversitesi İKÜANTS TEKMER, 21–22 Kasım 2025 tarihlerinde İstanbul Lütfi Kırdar Kongre Merkezi'nde gerçekleştirilen 'E-Ticaret Haftası' etkinliğine katıldı.",
        fullContent: `İstanbul Kültür Üniversitesi İKÜANTS TEKMER, 21–22 Kasım 2025 tarihlerinde İstanbul Lütfi Kırdar Kongre Merkezi'nde gerçekleştirilen "E-Ticaret Haftası" etkinliğine katıldı.

E-ticaret ekosisteminin öncü temsilcilerini, girişimleri ve teknoloji odaklı çözüm sağlayıcılarını buluşturan etkinlikte merkezimiz önemli görüşmeler gerçekleştirdi.

Etkinlikte ele alınan konular:

• İKÜANTS TEKMER'in girişimcilere sunduğu destekler hakkında bilgi verildi.

• Ar-Ge ve inovasyon altyapımız tanıtıldı.

• Teknoloji geliştirme ve ticarileştirme süreçlerimiz hakkında katılımcılara detaylı bilgi aktarıldı.

• E-ticaret alanında faaliyet gösteren girişimcilerle networking fırsatları değerlendirildi.

• Dijital dönüşüm ve e-ticaret trendleri üzerine panel ve sunumlara katılım sağlandı.

E-Ticaret Haftası, Türkiye'nin en büyük e-ticaret etkinliklerinden biri olup, sektörün önde gelen isimlerini bir araya getirmektedir.

İKÜANTS TEKMER olarak dijital girişimcilik alanındaki gelişmeleri yakından takip etmeye ve girişimcilerimize bu alanda destek sunmaya devam ediyoruz.

Etkinlik hakkında daha fazla bilgi için sosyal medya hesaplarımızı takip edebilirsiniz.`,
        date: "22 Kasım 2025",
        category: "Etkinlik",
        image: "/images/news/eticaret-haftasi/02.jpg",
        gallery: [
            "/images/news/eticaret-haftasi/01.jpg",
            "/images/news/eticaret-haftasi/02.jpg"
        ],
        featured: false
    }
];
