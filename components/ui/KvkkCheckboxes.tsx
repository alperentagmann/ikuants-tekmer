"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

interface KvkkCheckboxesProps {
    onComplete: (isComplete: boolean) => void;
    hidePhotoVideoConsent?: boolean;
}

const kvkkTexts = {
    kvkk1: {
        title: "İKÜANTS Teknoloji Geliştirme Merkezi Kişisel Verilerin İşlenmesi Aydınlatma Metni",
        content: `İKÜANTS Tekmer Teknoloji Geliştirme Merkezi Anonim Şirketi tarafından “Veri Sorumlusu” sıfatı ile kişisel verilerinizin hangi kapsamda işlenebileceği aşağıda açıklanmaktadır. Kişisel verileriniz, Veri Sorumlusu tarafından aşağıda açıklanan çerçevede ve her zaman 6698 sayılı Kişisel Verilerin Korunması Kanunu (“Kanun”) ile uyumlu olarak işlenmektedir.
İKÜANTS Tekmer Teknoloji Geliştirme Merkezi Anonim Şirketi (“TEKMER” yahut “Şirket” olarak anılacaktır), kişisel verilerin güvenliği hususuna azami hassasiyet göstermektedir. TEKMER tarafından kişisel verilerinizin hangi kapsamda işlenebileceği aşağıda detaylı olarak açıklanmaktadır.

KVKK'nun Aydınlatma Yükümlülüğünü düzenleyen 10’uncu maddesine göre veri sorumluları, kişisel verilerini işledikleri ilgili kişileri belirli konularda (Veri sorumlusunun kimliği, kişisel verilerin toplanma yöntemi ve hukuki sebebi, bu verilerin hangi amaçla işleneceği, kimlere ve hangi amaçla aktarılabileceği ve KVKK’nun 11. maddesinde sayılan ilgili kişinin hakları) bilgilendirmekle yükümlüdür. Bu aydınlatma metni de hukuki yükümlülüğün yerine getirilebilmesi amacıyla Kişisel Verileri Koruma Kurumu tarafından yayınlanan Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ'ine uygun olarak hazırlanmıştır.

TANIMLAR
6698 sayılı Kişisel Verilerin Korunması Kanunu'na göre:
• Kişisel veri, kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgiyi;
• Kişisel verilerin işlenmesi, kişisel verilerin tamamen veya kısmen otomatik olan ya da herhangi bir veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yollarla elde edilmesi, kaydedilmesi, depolanması, muhafaza edilmesi, değiştirilmesi, yeniden düzenlenmesi, açıklanması, aktarılması, devralınması, elde edilebilir hâle getirilmesi, sınıflandırılması ya da kullanılmasının engellenmesi gibi veriler üzerinde gerçekleştirilen her türlü işlemi;
• İlgili kişi, kişisel verisi işlenen gerçek kişiyi;
• Veri sorumlusu, kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen, veri kayıt sisteminin kurulmasından ve yönetilmesinden sorumlu olan gerçek veya tüzel kişiyi;
• Aydınlatma yükümlülüğü, kişisel verilerin elde edilmesi sırasında veri sorumlusu veya yetkilendirdiği kişinin, ilgili kişilere; veri sorumlusunun kimliği, kişisel verilerin hangi amaçla işleneceği, işlenen kişisel verilerin kimlere ve hangi amaçla aktarılabileceği, kişisel veri toplamanın yöntemi ve hukuki sebebi ve Kanun'un 11'inci maddesinde sayılan diğer hakları konusunda bilgi verme yükümlülüğünü;
ifade eder.

İLGİLİ KİŞİ
Kişisel verileri TEKMER tarafından işlenen siz, kurumumuz nezdinde “katılımcı” olarak tanımlanmakta ve Kanun tarafından da “İlgili Kişi” olarak kabul edilmektesiniz.

VERİ SORUMLUSU
Sizinle ilgili kişisel veriler konusunda kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen, veri kayıt sisteminin kurulmasından ve yönetilmesinden sorumlu olan İKÜANTS TEKMER veri sorumlusudur.

KİŞİSEL VERİLERİNİZİN ELDE EDİLMESİ
İKÜANTS TEKMER, 5237 Sayılı Türk Ceza Kanunu ve 6698 Sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) başta olmak üzere, ilgili mevzuattan kaynaklanan yasal yükümlülüklerini yerine getirmek ve ziyaretçilere İKÜANTS TEKMER ve/veya Üniversite bünyesinde düzenlenecek diğer etkinlikler hakkında bilgilendirme yapabilmek adına, bazı kişisel verilerinizi (ad soyad, iletişim bilgileri, e-posta ve/veya telefon numarası, yaş, cinsiyet, adres, eğitim durumu, üniversite bilgisi, bölümü, eğitim durumu, uzmanlık alanları, ilgi alanları, Takım ve Proje verileri, Görsel işitsel veriler, dijital veriler, IP Adresi, çevrimiçi form bilgileri, başvuru sırasında kullanılan cihaz bilgileri, LinkedIn Profili, portfolyo bağlantıları, mektup ve el yazısı bilgisi, görüntü ve ses kaydı, departman, meslek bilgisi, İş fikri açıklaması, iş modeli, iş planı, sunum dökümanları, şirket bilgisi, finansal tablolar, geri bildirimler) işleyebilmektedir. Söz konusu kişisel verileriniz işbu kişisel verilerin korunması bildiriminde belirtilen amaçlar ve kapsam dışında kullanılmamak kaydıyla halka açık olmayan bir ortamda işleyecek ve bu ortamda muhafaza edilecektir.

KİŞİSEL VERİLERİN İŞLENME AMACI
a) TEKMER’in tabi olduğu 5746 sayılı Araştırma, Geliştirme ve Tasarım Faaliyetlerinin Desteklenmesi Hakkında Kanun ile ilgili diğer mevzuattan kaynaklanan yasal yükümlülükleri çerçevesinde, kanunlar kapsamındaki söz konusu amaç ve yasal yükümlülüklerini yerine getirebilmek,
b) TEKMER bünyesinde faaliyet göstermek isteyen girişimci, yatırımcı vb. ile İKÜANTS TEKMER arasında yürütülecek ticari ve iş stratejilerinin belirlenmesi ve uygulanması, bu bağlamda, iş kapasitesinin ve Ar-Ge ekosisteminin geliştirilmesi amacıyla iş birliklerinin kurulması,
c) TEKMER tarafından yürütülen finans operasyonları, iletişim, pazar araştırması ve sosyal sorumluluk aktiviteleri, satın alma operasyonları (talep, teklif, değerlendirme, sipariş, bütçelendirme, sözleşme), İKÜANTS TEKMER ticari ve iş stratejilerinin belirlenmesi ve uygulanması, İKÜANTS TEKMER içi sistem ve uygulama yönetimi operasyonları, hukuki operasyonların yönetimi,
d) TEKMER ile iş ilişkisi içerisinde olan üçüncü gerçek veya tüzel kişiler ile yapılan sözleşmeler veya yürütülen faaliyetler çerçevesinde; hukuki ve ticari yükümlülüklerin gerçekleştirilmesi için, TEKMER tarafından iş ortağı/müşteri/tedarikçiler ile (yetkili veya çalışanlar) yapılan sözleşmelerden kaynaklanan yükümlülüklerin ifası, hak tesisi, hakların korunması, ticari ve hukuki değerlendirme süreçleri, hukuki ve ticari risk analizleri, hukuki uyum süreci ve mali işlerin yürütülmesi,
e) Jüri değerlendirme, ödül süreçleri ve kazananların belirlenmesi, etkinlik planlaması, organizasyonu, yürütülmesi ve sonuçlandırılması, katılımcılarla etkinlik süresince ve sonrasında iletişim kurulması, etkinliğe ilişkin raporlama, analiz, istatistiksel değerlendirmeler, Girişimcilik ve inovasyon programlarına yönelik duyuru ve bilgilendirmelerin yapılması, Etkinlik süresince fotoğraf ve video çekimleri yapılarak bu kayıtların kurumun sosyal medya hesaplarında, web sitesinde, basılı/dijital tanıtım materyallerinde kullanılabilmesi
f) Başvuruların alınması, değerlendirilmesi ve kaydının yapılması, katılımcı seçimi, proje değerlendirmesi, kabul süreçlerinin yürütülmesi, program süresince verilecek olan eğitim, mentörlük ve danışmanlık faaliyetlerinin sağlanması, Üniversite-sanayi iş birliklerinin geliştirilmesi, yatırımcı/mentör eşleştirilmelerinin yapılması, Gelecek dönem programları ve girişimcilik faaliyetleri hakkında bilgilendirme yapılması, Program çıktılarına ilişkin raporlama, analiz, istatistiksel değerlendirme ve arşivleme, Katılımcılarla iletişim kurulması, bilgilendirme yapılması,
g) TEKMER, inşaat, mekanik, tadilat, altyapı, bakım, onarım gibi mühendislik hizmetleri kapsamında 3. kişi kurum ve kuruluşlarla imzalamış olduğu sözleşmeler kapsamında iş yaptırdığı yüklenici ve alt yüklenicilerden, ihale dosyası ve hak ediş dosyasından elde edilen, İş Sağlığı ve Güvenliği Kanunu ve ilgili yönetmelikler kapsamındaki söz konusu yükümlülüklerini yerine getirebilmek, yüklenici ve alt yüklenicilerin işlerini ifa ettikleri esnada sigortalı çalışıp çalışmadıklarını tespit ve kontrol etmek,
ı) Katılım sağladığınız etkinliklerle ilgili etkinliği düzenleyen ve etkinlik paydaşı olan kuruluşlarla kişisel verilerinizin paylaşılabilmesi, gerekli güvenlik ve hukuki önlemler alınarak burada bahsedilen amaçların gerçekleştirilmesi,
i) Şirketimiz tarafından elde edilen kişisel verileriniz, özgeçmişleriniz, eğitim bilgileriniz ile Şirket tarafından sunulan hizmetlerin ilgili kişilerin beğeni, kullanım alışkanlıkları ve ihtiyaçlarına göre özelleştirilerek ilgili kişilere ve şirketlere önerilmesi ve tanıtılması için gerekli olan aktivitelerin planlanması ve icrası,
j) Şirket tarafından sunulan ürün ve hizmetlerden ilgili kişileri faydalandırmak için gerekli çalışmaların iş birimleri tarafından yapılması (listeleme, doğrulama, analiz, anket ve değerlendirmeler yapılması, istatistiki ve bilimsel bilgilerin üretilmesi, internet sitesi ve diğer iletişim kanallarımızı kullanım şeklinize ilişkin analizlerin yapılması ve sizlere özelleştirmelerde bulunulması gibi) ve ilgili iş süreçlerinin yürütülmesi amaçları ile kişisel veriler işlenmektedir.

KİŞİSEL VERİLERİN AKTARILMASI
TEKMER tarafından toplanan kişisel verileriniz; 6698 sayılı KVK Kanunu’nun 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları kapsamında ve işbu dokümanda belirtilmiş amaçlarla sınırlı olarak, KVK Kanunu’nun 8. ve 9. maddelerine uygun olmak suretiyle 3. kişi ve kurumlara aktarabilecektir.
Bu kişi ve Kurumlar TEKMER’in; iş ortakları ve paydaşları, tedarikçileri, danışmanları, hissedarları, şirket yetkilileri, hukuken bilgi almaya yetkili kamu kurum ve kuruluşları ve hukuken yetkili özel hukuk / kamu hukuk tüzel kişileridir. TEKMER’in hizmetlerinden faydalanmanız için gerekli çalışmaların ilgili iş birimleri tarafından yapılması, Şirketimizin ve Şirketimizle iş ilişkisi içerisinde olan kişilerin hukuki ve ticari güvenliğinin temini (TEKMER tarafından yürütülen iletişime yönelik idari operasyonlar, TEKMER’e ait lokasyonların fiziksel güvenliğini ve denetimini sağlamak, hukuki uyum süreci, mali işler v.b.), TEKMER’in ticari ve iş stratejilerinin belirlenmesi ve uygulanması, Şirketimizin insan kaynakları politikalarının yürütülmesi ile TEKMER’in tabi olduğu 5746 sayılı Araştırma, Geliştirme ve Tasarım Faaliyetlerinin Desteklenmesi Hakkında Kanun kapsamında TEKMER’de faaliyet gösteren firma çalışanlarının kişisel verilerini T.C Bilim, Sanayi ve Teknoloji Bakanlığı’na ve Şirket ortaklarına aktarmaktadır.
Veriler; gerekli güvenlik ve hukuki önlemler alınarak bu metnin amaçlarının gerçekleştirilmesi için bilgi işlem altyapılarına, bulut bilişim sistemlerine aktarılabilir, elektronik veya fiziki ortamlarda yasal yükümlülüklerin yerine getirilmesi amacıyla arşivlenebilir.

KİŞİSEL VERİLERİN TOPLANMA YÖNTEMİ VE HUKUKİ SEBEBİ
Kişisel verileriniz TEKMER tarafından sizlerin beyanları üzerine fiziki veya elektronik ortamda ve TEKMER ile sizler arasında bulunan ilişkisi çerçevesinde toplanmaktadır. Bu kapsamda kişisel verileriniz, Şirketimiz tarafından sağlanan hizmet ve Şirketimizin ticari faaliyetlerine bağlı olarak değişkenlik gösterebilmekle birlikte; otomatik ya da otomatik olmayan yöntemlerle, Onay ve/veya imzanızla tanzim edilen işlemlere ilişkin tüm sözleşmeler/bilgilendirme formları ve sair belgelerle, Şirketimiz birimleri ve bölümleri, TEKMER internet sitesi, kartlı geçiş sistemi, CCTV, SMS, elektronik posta, çerezler ve benzer takip teknolojileri, faks, posta, kargo ya da kurye hizmetleri, ziyaretçi kayıt işlemleri ilgili mevzuatın ve yapılan anlaşmaların izin verdiği ölçüde ve çizdiği sınırlar dahilinde, hukuken zorunlu olduğu durumlarda onayınız da alınarak çeşitli kurum ve kuruluşların veri tabanları aracılığıyla toplanmaktadır. Şirket hizmetlerini kullanmak amacıyla çağrı merkezlerimizi veya internet sayfamızı kullandığınızda, Şirketimizi veya internet sitemizi ziyaret ettiğinizde, Şirketimizin düzenlediği eğitim, seminer veya organizasyonlara katıldığınızda kişisel verileriniz işlenebilecektir.
TEKMER, bünyesinde faaliyet gösteren ve Araştırma Geliştirme (Ar-Ge) faaliyetleri ile uğraşan şirketlerin gerçek kişi imza yetkililerinin ve gerçek kişi şirket ortaklarının kişisel verilerini ve Ar-Ge faaliyetleri ile uğraşan şirketlerin bünyelerinde çalışan gerçek kişi personellerinin kişisel verilerini TEKMER’de faaliyet gösteren Kiracı konumundaki tüzel kişi şirketlerden talep etmekte ve işlemektedir.
TEKMER, yazılı/dijital başvurular, web sitesi, bina içerisinde internete bağlanma sırasında, sosyal medya, çağrı merkezi, e-posta, dijital veya basılı anket, matbu form, adli kayıtların taranması, SGK kayıtları, TEKMER’in sizlerle iletişime geçtiği veya ileride iletişime geçebileceği kanallar ve TEKMER içi ve dışı kapalı devre kamera izleme sistemi gibi sistemler aracılığıyla sözlü, yazılı veya elektronik ortamda kişisel verileriniz toplanıp yasal süresi boyunca saklanmaktadır.
TEKMER işe alım sürecinde, başvuru yapan kişilerin kendi açık rızaları ile özgeçmişlerini TEKMER İnsan Kaynakları Biriminin e-posta adresine yollamaları, mülakat esnasında sorulan soruları kendi rızaları ile yanıtlamaları ya da ilan yayınlama ve aday havuzu hizmetleri veren insan kaynakları yazılım programlarının (Kariyer.net, LinkedIn vb. gibi) sunduğu özgeçmiş görüntüleme yöntemleri ile başvuranların kişisel verilerini elde edilmektedir.
Bu yöntemlerle toplanan kişisel verileriniz 6698 sayılı Kanun’un 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları ve amaçları kapsamında işlenmektedir.

KİŞİSEL VERİLERİN SİLİNMESİ, YOK EDİLMESİ VEYA ANONİM HALE GETİRİLMESİ
KVK Kanunu’nun 7. maddesi uyarınca, kişisel verilerin ilgili mevzuata uygun olarak işlenmiş olmasına rağmen, işlenmesini gerektiren sebeplerin ortadan kalkması halinde kişisel veriler re’sen veya kişisel veri sahibinin talebi üzerine İKÜANTS TEKMER tarafından silinir, yok edilir veya anonim hale getirilir. Bu hususa ilişkin usul ve esaslar KVK Kanunu ve 28.10.2017 tarihli ve 30224 sayılı Resmi Gazete’de yayınlanan Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik’e göre yerine getirilecektir.
TEKMER’e başvurarak kişisel verilerinizin silinmesini veya yok edilmesini talep ettiğinizde;
a) Kişisel verileri işleme şartlarının tamamı ortadan kalkmışsa; talebe konu kişisel verilerinizi silinir, yok edilir veya anonim hale getirilir. Talebiniz en geç otuz gün içinde sonuçlandırılır ve tarafınıza bilgi verilir.
b) Kişisel verileri işleme şartlarının tamamı ortadan kalkmış ve talebe konu olan kişisel veriler üçüncü kişilere aktarılmışsa bu durum üçüncü kişilere bildirir; Yönetmelik kapsamında gerekli işlemlerin yapılması temin edilir.
c) Kişisel verileri işleme şartlarının tamamı ortadan kalkmamışsa, talebiniz KVK Kanunun 13üncü maddesinin üçüncü fıkrası uyarınca gerekçesi açıklanarak reddedilebilir ve ret cevabı tarafınıza en geç otuz (30) gün içinde yazılı olarak ya da elektronik ortamda bildirilir.

KİŞİSEL VERİLERİN KORUNMASI KANUNU’NDAN DOĞAN HAKLARINIZ
Kanun’un 11. Maddesine göre kişisel veri sahibi olarak ilgili kişiler;
• Kişisel veri işlenip işlenmediğini öğrenme,
• Kişisel veriler işlenmişse buna ilişkin bilgi talep etme,
• Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanıp kullanılmadığını öğrenme,
• Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,
• Kişisel verilerin eksik ya da yanlış işlenmiş olması halinde bunların düzeltilmesini isteme,
• Kişisel verilerin silinmesini, anonim hale getirilmesini veya yok edilmesini isteme,
• Düzeltilme, silinme, anonim hale getirme veya yok edilmesi halinde bunun üçüncü kişilere bildirilmesini isteme,
• İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,
• Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarar uğraması halinde zararın giderilmesini talep etme
haklarına sahiptir. Söz konusu haklarınız için veri sorumlusuna başvurunuzu internet sitesinde yer alan ve ayrıca aşağıda da belirtilmekte olan iletişim bilgileri (mail, noter veya posta kanalıyla vs.) kanalıyla yapabilirsiniz.
İnternet Sitesi: “www.iküantstekmer.com”
Adres: Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cadde No: 14/A Bakırköy/İSTANBUL
Kişisel olmayan bilgiler, şahsen tanımlanamayacağınız bilgilerdir. Bu bilgiler her türlü amaçla kullanılabilir ve üçüncü kişilerle de onay alınmaksızın paylaşılabilir. Başvuru yapılırken uyulması gereken usul ve esaslar hakkındaki daha detaylı bilgiye Kişisel Verileri Koruma Kurumu'nun Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'den ulaşabilirsiniz.
Kişisel verilerin işlenmesinden önce yukarıda yer alan bilgilendirmeyi okuduğumu, anladığımı ve kişisel verilerime ilişkin olarak bilgilendirildiğimi kabul ederim.

VERİ SAHİPLERİ TARAFINDAN HAKLARIN KULLANILMASI
Veri sahipleri, yukarıda bahsi geçen hakları kullanmak için “www.iküantstekmer.com” linkinde yer alan “Veri Sahibi Başvuru Formu”nu kullanabileceklerdir.
Başvurular, ilgili veri sahibinin kimliğini tespit edecek belgelerle birlikte, aşağıdaki yöntemlerden biri ile gerçekleştirilecektir:
Şirketimiz, Kanun’da öngörülmüş sınırlar çerçevesinde söz konusu hakları kullanmak isteyen veri sahiplerine, yine Kanun’da öngörülen şekilde azami otuz (30) gün içerisinde cevap vermektedir. Kişisel veri sahipleri adına üçüncü kişilerin başvuru talebinde bulunabilmesi için veri sahibi tarafından başvuruda bulunacak kişi adına noter kanalıyla düzenlenmiş özel vekâletname bulunmalıdır.
Veri sahibi başvuruları kural olarak ücretsiz olarak işleme alınmakla birlikte, Kişisel Verileri Koruma Kurulu tarafından öngörülen ücret tarifesi üzerinden ücretlendirme yapılabilecektir.
Şirket, başvuruda bulunan kişinin kişisel veri sahibi olup olmadığını tespit etmek adına ilgili kişiden bilgi talep edebilir, başvuruda belirtilen hususları netleştirmek adına, kişisel veri sahibine başvurusu ile ilgili soru yöneltebilir.
Veri İşleme Politikamız ile ilgili detaylı bilgiye “www.iküantstekmer.com.” adresinde yer alan ‘Kişisel Verilerin Korunması ve İşlenmesi Politikası’ başlığı altında inceleyebilirsiniz.

İKÜANTS TEKMER HİZMET BİNASI İÇERİSİNDE YER ALAN GÜVENLİK KAMERALARI HAKKINDA AYDINLATMA METNİ
Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanununun 10. maddesi ile Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında veri sorumlusu sıfatıyla TEKMER tarafından hazırlanmıştır.
İşbu “İKÜANTS TEKMER Hizmet Binası İçerisinde Yer Alan Güvenlik Kameraları Hakkında Aydınlatma Metni”, TEKMER tarafından yayınlanan “Kişisel Verilerin Korunması Hakkında Aydınlatma Metni” ile “Kişisel Verilerin Korunması ve İşlenmesi Politikası”nın ayrılmaz bir parçasıdır.
Hizmet binamız içerisindeki giriş kapıları, bina dış cephesi, yemekhane, kafeterya, ziyaretçi bekleme salonu, otopark, güvenlik kulübesi ve kat koridorları hizmet alanında bulunan güvenlik kameraları vasıtasıyla ve bina güvenliğinin sağlanması amacıyla görüntü kaydı yapılmakta ve kayıt işlemi güvenlik birimi tarafından denetlenmektedir.
Söz konusu kişisel veri, Kanunun 5. maddesinde yer alan “veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması” ve “ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması” “4691 Sayılı Teknoloji Bölgeleri Geliştirme Kanunu, 5188 sayılı Özel Güvenlik Hizmetlerine Dair Kanun ve ilgili mevzuat kapsamındaki yükümlülüklerinin yerine getirilmesi’’ hukuki sebebine dayanarak otomatik yolla işlenmektedir.`
    },
    kvkk2: {
        title: "İKÜANTS TEKMER Kişisel Verilerin Korunması Açık Rıza Formu",
        content: `Tarafımca okunan TEKMER “Kişisel Verilerin Korunması Aydınlatma Metni” ve “Kişisel Veri İşleme Politikası” çerçevesinde kişisel verilerimin veri İKÜANTS Teknoloji Geliştirme Merkezi Anonim Şirketi tarafından T.C. İstanbul Kültür Üniversitesi eğitim programları hakkında ön başvuru bilgisi alınabilmesi, buna ilişkin istatistiki verilerin toplanabilmesi, kimlik iletişim, proje ve etkinlik verilerimin işlenmesine, Etkinlik süresince çekilen fotoğraf ve videoların kurumun sosyal medya, web sitesi ve tanıtım materyallerinde kullanılmasına, Gelecek etkinlikler ve girişimcilik programları hakkında tarafıma bilgilendirme yapılmasına ve katılımcılarla bu hususta iletişime geçilebilmesi de dahil olmak üzere Aydınlatma Metninde belirtilen amaçlarla kişisel verilerimin işlenmesine, yurt içi veya yurt dışına aktarılmasına açıkça izin verdiğimi ve haklarım konusunda bilgilendirildiğimi kabul ve beyan ederim.`
    },
    kvkk3: {
        title: "İKÜANTS TEKMER Ticari Elektronik İleti Gönderilmesine İlişkin Onay Metni",
        content: `İKÜANTS TEKMER (“TEKMER”) tarafından gerçekleştirilecek aktivite, tanıtım, organizasyon ve İKÜANTS TEKMER ve T.C. İSTANBUL KÜLTÜR ÜNİVERSİTİNE bağlı birimlerin gerçekleştirdiği akademik, sosyal tüm etkinliklerden haberdar olmak için İKÜANTS TEKMER ve İSTANBUL KÜLTÜR ÜNİVERSİTESİ tarafından şahsınıza ticari elektronik ileti gönderilmesine onay vermeniz gerekmektedir.

İzin verdiğinizde; İKÜANTS TEKMER ve İSTANBUL KÜLTÜR ÜNİVERSİTESİ’nin, size aktivite ve tanıtımlarla ilgili bilgi sunmasını ve satış, pazarlama ve benzer amaçlı her türlü iletişim mesajlarını göndermesini, paylaşmış olduğunuz kişisel verilerinizi işleyerek, size telefon, kısa mesaj ve elektronik posta ile ulaşmasını ve elektronik iletilerin içeriğinin ve diğer kayıtların gerektiğinde ilgili Bakanlığa sunulmak üzere kayıt altına alınarak saklanmasını kabul etmektesiniz.

Bu bilgiler sadece iletilerinizin sağlıklı şekilde teslim edilmesi, telefon, sms ve/veya e-posta yoluyla bildirimlerimizin zamanında ulaştırılabilmesi amacıyla sözleşme ilişkisi içinde olduğumuz 3. kişilerle gerekli ölçüde paylaşılacaktır.

Dilediğiniz zaman, hiçbir gerekçe göstermeksizin bu kullanım şartları kapsamındaki elektronik iletileri almaktan vazgeçebilirsiniz. Bu talebinizi İKÜANTS TEKMER ve İSTANBUL KÜLTÜR ÜNİVERSİTESİ’ne çağrı veya iletide yer alan iletişim bilgilerini kullanarak veya Üniversitemiz ile İKÜANTS TEKMER bilgilerindeki iletişim adreslerine ücretsiz olarak iletebilirsiniz.`
    },
    kvkk4: {
        title: "Etkinlik Süresince Fotoğraf ve Video Çekimine İlişkin Onay Metni",
        content: `İKÜANTS TEKMER tarafından düzenlenen veya ev sahipliği yapılan etkinlik, program, eğitim ve organizasyonlar süresince fotoğraf ve video çekimleri gerçekleştirilebilmektedir.

İzin verdiğinizde; etkinlik süresince alınacak olan şahsınıza ait görsel ve işitsel kayıtların (fotoğraf, video vb.), kurumumuzun tanıtım faaliyetleri kapsamında İKÜANTS TEKMER'in kurumsal web sitesinde, resmi sosyal medya hesaplarında (LinkedIn, Instagram, Twitter vb.), basılı veya dijital bültenlerde, sunumlarda ve diğer tanıtım materyallerinde herhangi bir ticari amaç güdülmeksizin kullanılmasına onay vermiş olursunuz.`
    }
};

export const KvkkCheckboxes: React.FC<KvkkCheckboxesProps> = ({ onComplete, hidePhotoVideoConsent = false }) => {
    const [checks, setChecks] = useState({ check1: false, check2: false, check3: false, check4: false });
    const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

    const handleCheck = (key: keyof typeof checks) => {
        const newChecks = { ...checks, [key]: !checks[key] };
        setChecks(newChecks);
        const isComplete = hidePhotoVideoConsent
            ? newChecks.check1 && newChecks.check2 && newChecks.check3
            : newChecks.check1 && newChecks.check2 && newChecks.check3 && newChecks.check4;
        onComplete(isComplete);
    };

    return (
        <div className="space-y-4 my-6 p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
            <h4 className="font-bold text-black dark:text-white mb-4">Lütfen aşağıdaki metinleri okuyup onaylayınız:</h4>

            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    id="kvkk1"
                    checked={checks.check1}
                    onChange={() => handleCheck('check1')}
                    className="mt-1 w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 outline-none"
                    required
                />
                <label htmlFor="kvkk1" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                    <button type="button" onClick={() => setModalContent(kvkkTexts.kvkk1)} className="text-primary hover:underline font-bold transition-all text-left">
                        {kvkkTexts.kvkk1.title}
                    </button>
                    'ni okudum ve kabul ediyorum. <span className="text-red-500">*</span>
                </label>
            </div>

            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    id="kvkk2"
                    checked={checks.check2}
                    onChange={() => handleCheck('check2')}
                    className="mt-1 w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 outline-none"
                    required
                />
                <label htmlFor="kvkk2" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                    <button type="button" onClick={() => setModalContent(kvkkTexts.kvkk2)} className="text-primary hover:underline font-bold transition-all text-left">
                        {kvkkTexts.kvkk2.title}
                    </button>
                    'nu okudum ve kabul ediyorum. <span className="text-red-500">*</span>
                </label>
            </div>

            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    id="kvkk3"
                    checked={checks.check3}
                    onChange={() => handleCheck('check3')}
                    className="mt-1 w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 outline-none"
                    required
                />
                <label htmlFor="kvkk3" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                    <button type="button" onClick={() => setModalContent(kvkkTexts.kvkk3)} className="text-primary hover:underline font-bold transition-all text-left">
                        {kvkkTexts.kvkk3.title}
                    </button>
                    'ni okudum ve kabul ediyorum. <span className="text-red-500">*</span>
                </label>
            </div>

            {!hidePhotoVideoConsent && (
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="kvkk4"
                        checked={checks.check4}
                        onChange={() => handleCheck('check4')}
                        className="mt-1 w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 outline-none"
                        required
                    />
                    <label htmlFor="kvkk4" className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        <button type="button" onClick={() => setModalContent(kvkkTexts.kvkk4)} className="text-primary hover:underline font-bold transition-all text-left">
                            {kvkkTexts.kvkk4.title}
                        </button>
                        'ni okudum ve onaylıyorum. <span className="text-red-500">*</span>
                    </label>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {modalContent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setModalContent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#0a0a0a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                                <h3 className="font-orbitron font-bold tracking-wider text-xl text-black dark:text-white">{modalContent.title}</h3>
                                <button
                                    onClick={() => setModalContent(null)}
                                    className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <div className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    {modalContent.content}
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
                                <button
                                    onClick={() => setModalContent(null)}
                                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center"
                                >
                                    Anladım, Kapat
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
