"use client";
import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Mail, Phone, Building2, Linkedin,
    UserCheck, Rocket, GraduationCap, Briefcase, Filter, Trash2,
    Shield, CheckCircle2, AlertCircle, X, ExternalLink, UserPlus, Building,
    Eye, EyeOff, Globe, MapPin, Calendar, FileText, ChevronDown, ChevronRight,
    Check, AlertTriangle, RefreshCw, Lock, Sparkles, UserCheck2, History
} from 'lucide-react';
import { Record360Drawer } from '@/components/admin/crm/Record360Drawer';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { EMPLOYMENT_TYPES, DEFAULT_SGK_STATUSES } from '@/lib/hr';

const BUSINESS_ROLES_OPTIONS = [
    { id: 'KURUCU', label: 'Kurucu / Girişimci Ortak' },
    { id: 'SIRKET_PERSONELI', label: 'Şirket Personeli' },
    { id: 'MENTOR', label: 'Mentör' },
    { id: 'EGITMEN', label: 'Eğitmen' },
    { id: 'AKADEMISYEN', label: 'Akademisyen / Araştırmacı' },
    { id: 'YATIRIMCI', label: 'Yatırımcı / Melek Ağ' },
    { id: 'PAYDAS', label: 'Dış Paydaş / Partner' },
    { id: 'PROGRAM_KATILIMCISI', label: 'Program Katılımcısı' },
    { id: 'FIRMA_TEMSILCISI', label: 'Firma Temsilcisi' },
    { id: 'FINANS_YETKILISI', label: 'Finans Yetkilisi' },
    { id: 'HUKUK_YETKILISI', label: 'Hukuk Yetkilisi' },
    { id: 'DIGER', label: 'Diğer / Misafir' },
];

const LEGAL_BASIS_OPTIONS = [
    { id: 'CONSENT', label: 'Açık Rıza (m. 5/1)' },
    { id: 'CONTRACT', label: 'Sözleşmenin Kurulması / İfası (m. 5/2-c)' },
    { id: 'LEGAL_OBLIGATION', label: 'Hukuki Yükümlülük (m. 5/2-ç)' },
    { id: 'RIGHT_PROTECTION', label: 'Bir Hakkın Tesisi / Korunması (m. 5/2-e)' },
    { id: 'LEGITIMATE_INTEREST', label: 'Meşru Menfaat (m. 5/2-f)' },
    { id: 'PUBLICIZED', label: 'İlgili Kişi Tarafından Alenileştirme (m. 5/2-d)' },
    { id: 'OTHER', label: 'Diğer Yasal Dayanak' },
];

const DATA_SOURCE_OPTIONS = [
    { id: 'MANUAL_ADMIN', label: 'Yönetici Tarafından Eklendi' },
    { id: 'PUBLIC_APPLICATION', label: 'Web Başvuru Formu' },
    { id: 'PROGRAM_APPLICATION', label: 'Program Başvurusu' },
    { id: 'RESERVATION', label: 'Alan / Etkinlik Rezervasyonu' },
    { id: 'EVENT', label: 'Etkinlik Katılımcı Kaydı' },
    { id: 'IMPORT', label: 'Toplu İçe Aktarma' },
    { id: 'REFERRAL', label: 'Referans / Tavsiye' },
    { id: 'OTHER', label: 'Diğer' },
];

function validateTcLocal(tc: string): { isValid: boolean; message: string } {
    if (!tc) return { isValid: true, message: '' };
    const clean = tc.trim();
    if (!/^[1-9][0-9]{10}$/.test(clean)) {
        return { isValid: false, message: '11 haneli ve yalnız rakamlardan oluşmalıdır (0 ile başlayamaz).' };
    }
    const d = clean.split('').map(Number);
    const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
    const evenSum = d[1] + d[3] + d[5] + d[7];
    const check10 = ((oddSum * 7) - evenSum) % 10;
    const mod10 = check10 < 0 ? check10 + 10 : check10;
    if (mod10 !== d[9]) {
        return { isValid: false, message: '10. hane algoritma checksum kuralı uyuşmuyor.' };
    }
    let sum10 = 0;
    for (let i = 0; i < 10; i++) sum10 += d[i];
    if (sum10 % 10 !== d[10]) {
        return { isValid: false, message: '11. hane algoritma checksum kuralı uyuşmuyor.' };
    }
    return { isValid: true, message: 'T.C. Kimlik biçim ve algoritma checksum kontrolü geçerli.' };
}

export default function UnifiedDirectoryPage() {
    const [currentTab, setCurrentTab] = useState<'people' | 'companies' | 'mentors' | 'stakeholders'>('people');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
    const [view360, setView360] = useState<{ type: 'Person' | 'Organization'; id: string } | null>(null);

    // Deep links: /admin/rehber?personId=... or ?organizationId=... open the 360° view
    useEffect(() => {
        const qp = new URLSearchParams(window.location.search);
        const personId = qp.get('personId');
        const organizationId = qp.get('organizationId');
        const t = setTimeout(() => {
            if (personId) setView360({ type: 'Person', id: personId });
            else if (organizationId) {
                setCurrentTab('companies');
                setView360({ type: 'Organization', id: organizationId });
            }
        }, 0);
        return () => clearTimeout(t);
    }, []);

    // Organizations list for dropdown
    const [organizations, setOrganizations] = useState<any[]>([]);

    // Create / Edit Person Modal
    const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
    const [isEditingPerson, setIsEditingPerson] = useState(false);
    const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
    const [personModalMode, setPersonModalMode] = useState<'QUICK' | 'FULL'>('QUICK');
    const [activeSection, setActiveSection] = useState<'BASIC' | 'CONTACT' | 'COMPANY' | 'ROLES' | 'KVKK'>('BASIC');

    // Duplicate warning state
    const [tcDuplicateWarning, setTcDuplicateWarning] = useState<{ found: boolean; message?: string } | null>(null);

    // Revealed TC Kimlik state
    const [revealedTcMap, setRevealedTcMap] = useState<Record<string, string>>({});
    const [revealingTc, setRevealingTc] = useState<string | null>(null);

    // Person Form State
    const defaultPersonForm = {
        firstName: '',
        lastName: '',
        salutation: '',
        title: '',
        avatarUrl: '',
        birthDate: '',
        nationality: 'TC',
        isTurkishCitizen: true,
        tcNumber: '',
        workEmail: '',
        personalEmail: '',
        primaryEmailType: 'WORK',
        email: '',
        workPhone: '',
        extension: '',
        phone: '',
        secondaryPhone: '',
        linkedin: '',
        websiteUrl: '',
        country: 'Türkiye',
        city: 'İstanbul',
        state: '',
        address: '',
        postalCode: '',
        notes: '',
        businessRoles: ['SIRKET_PERSONELI'],
        status: 'ACTIVE',
        dataSource: 'MANUAL_ADMIN',

        // Company link
        companyLinkMode: 'EXISTING', // 'EXISTING' | 'NEW' | 'NONE'
        organizationId: '',
        newOrgDisplayName: '',
        newOrgLegalName: '',
        newOrgType: 'COMPANY',
        newOrgSector: 'Yazılım / Teknoloji',
        newOrgTaxNumber: '',
        newOrgTaxOffice: '',
        membershipRole: 'EMPLOYEE',
        membershipDepartment: '',
        membershipPosition: '',
        isPrimaryContact: true,
        isFinanceContact: false,
        isLegalContact: false,
        isAuthorizedSignatory: false,
        employmentType: '',
        sgkStatus: '',
        isRdStaff: false,

        // Contextual profiles
        createMentorProfile: false,
        mentorTitle: '',

        // KVKK & Consent
        informationNoticeProvided: true,
        informationNoticeVersion: 'v2.0',
        explicitConsentGiven: true,
        explicitConsentRequired: true,
        legalBasis: 'CONSENT',
        emailPermission: true,
        smsPermission: true,
        callPermission: false,
        privacyNotes: '',
    };

    const [personForm, setPersonForm] = useState(defaultPersonForm);
    const [sgkStatuses, setSgkStatuses] = useState<string[]>(DEFAULT_SGK_STATUSES);
    const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
    useEffect(() => {
        let alive = true;
        fetch('/api/admin/hr').then((r) => r.json()).then((d) => { if (alive && Array.isArray(d.sgkStatuses)) setSgkStatuses(d.sgkStatuses); }).catch(() => undefined);
        return () => { alive = false; };
    }, []);

    // Create Organization Modal
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
    const [orgForm, setOrgForm] = useState({
        displayName: '',
        legalName: '',
        organizationType: 'COMPANY',
        sector: 'Yazılım / Teknoloji',
        email: '',
        phone: '',
        taxNumber: '',
        taxOffice: '',
        city: 'İstanbul',
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('tab', currentTab);
            if (search) params.append('search', search);

            const res = await fetch(`/api/admin/directory?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setItems(data.items || []);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Rehber verileri yüklenirken bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const res = await fetch('/api/admin/directory?tab=companies&limit=200');
            const data = await res.json();
            if (data.success && Array.isArray(data.items)) {
                setOrganizations(data.items);
            }
        } catch {
            // silent fallback
        }
    };

    useEffect(() => {
        fetchData();
        fetchOrganizations();
    }, [currentTab, search]);

    // Handle TC Input Change & Duplicate Check
    const handleTcChange = async (val: string) => {
        setPersonForm(prev => ({ ...prev, tcNumber: val }));
        setTcDuplicateWarning(null);

        if (val.trim().length === 11) {
            const check = validateTcLocal(val);
            if (check.isValid) {
                try {
                    const res = await fetch('/api/admin/persons/check-duplicate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tcNumber: val,
                            excludeId: editingPersonId || undefined,
                        }),
                    });
                    const d = await res.json();
                    if (d.success && d.hasMatches && d.matches.length > 0) {
                        const m = d.matches[0];
                        setTcDuplicateWarning({
                            found: true,
                            message: `Bu kimlik bilgisiyle eşleşen mevcut bir kişi kaydı bulunuyor: ${m.fullName} (${m.tcNumberMasked || 'Maskeli'})`,
                        });
                    }
                } catch {
                    // silent fallback
                }
            }
        }
    };

    const openCreateModal = () => {
        setIsEditingPerson(false);
        setEditingPersonId(null);
        setPersonForm(defaultPersonForm);
        setPersonModalMode('QUICK');
        setActiveSection('BASIC');
        setTcDuplicateWarning(null);
        setIsPersonModalOpen(true);
    };

    const openEditModal = async (person: any) => {
        setIsEditingPerson(true);
        setEditingPersonId(person.id);
        setPersonModalMode('FULL');
        setActiveSection('BASIC');
        setTcDuplicateWarning(null);

        // Fetch 360 detail
        try {
            const res = await fetch(`/api/admin/persons/${person.id}`);
            const data = await res.json();
            const p = data.item || person;

            let parsedRoles: string[] = ['SIRKET_PERSONELI'];
            try {
                if (p.businessRoles) parsedRoles = JSON.parse(p.businessRoles);
            } catch {
                parsedRoles = ['SIRKET_PERSONELI'];
            }

            let privacyData: any = {};
            try {
                if (p.privacyConsents) privacyData = JSON.parse(p.privacyConsents);
            } catch {
                privacyData = {};
            }

            const primaryMembership = p.memberships?.[0];

            setPersonForm({
                ...defaultPersonForm,
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                salutation: p.salutation || '',
                title: p.title || '',
                avatarUrl: p.avatarUrl || '',
                birthDate: p.birthDate ? p.birthDate.slice(0, 10) : '',
                nationality: p.nationality || 'TC',
                isTurkishCitizen: p.isTurkishCitizen !== undefined ? p.isTurkishCitizen : true,
                tcNumber: p.tcNumberMasked || '',
                workEmail: p.workEmail || '',
                personalEmail: p.personalEmail || '',
                primaryEmailType: p.primaryEmailType || 'WORK',
                email: p.email || '',
                workPhone: p.workPhone || '',
                extension: p.extension || '',
                phone: p.phone || '',
                secondaryPhone: p.secondaryPhone || '',
                linkedin: p.linkedin || '',
                websiteUrl: p.websiteUrl || '',
                country: p.country || 'Türkiye',
                city: p.city || 'İstanbul',
                state: p.state || '',
                address: p.address || '',
                postalCode: p.postalCode || '',
                notes: p.notes || '',
                businessRoles: parsedRoles,
                status: p.status || 'ACTIVE',
                dataSource: p.dataSource || 'MANUAL_ADMIN',

                companyLinkMode: primaryMembership ? 'EXISTING' : 'NONE',
                organizationId: primaryMembership?.organizationId || '',
                newOrgDisplayName: '',
                newOrgLegalName: '',
                newOrgType: 'COMPANY',
                newOrgSector: 'Yazılım / Teknoloji',
                newOrgTaxNumber: '',
                newOrgTaxOffice: '',
                membershipRole: primaryMembership?.role || 'EMPLOYEE',
                membershipDepartment: primaryMembership?.department || '',
                membershipPosition: primaryMembership?.position || '',
                isPrimaryContact: primaryMembership?.isPrimaryContact !== undefined ? primaryMembership.isPrimaryContact : true,
                isFinanceContact: Boolean(primaryMembership?.isFinanceContact),
                isLegalContact: Boolean(primaryMembership?.isLegalContact),
                isAuthorizedSignatory: Boolean(primaryMembership?.isAuthorizedSignatory),
                employmentType: primaryMembership?.employmentType || '',
                sgkStatus: primaryMembership?.sgkStatus || '',
                isRdStaff: Boolean(primaryMembership?.isRdStaff),

                createMentorProfile: p.mentors && p.mentors.length > 0,
                mentorTitle: p.mentors?.[0]?.title || '',

                informationNoticeProvided: privacyData.informationNoticeProvided !== undefined ? privacyData.informationNoticeProvided : true,
                informationNoticeVersion: privacyData.informationNoticeVersion || 'v2.0',
                explicitConsentGiven: privacyData.explicitConsentGiven !== undefined ? privacyData.explicitConsentGiven : true,
                explicitConsentRequired: privacyData.explicitConsentRequired !== undefined ? privacyData.explicitConsentRequired : true,
                legalBasis: privacyData.legalBasis || 'CONSENT',
                emailPermission: privacyData.emailPermission !== undefined ? privacyData.emailPermission : true,
                smsPermission: privacyData.smsPermission !== undefined ? privacyData.smsPermission : true,
                callPermission: Boolean(privacyData.callPermission),
                privacyNotes: privacyData.notes || '',
            });

            setIsPersonModalOpen(true);
        } catch {
            setFeedback({ type: 'error', message: 'Kişi detayları yüklenemedi.' });
        }
    };

    const handleSavePerson = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Validate TC if provided
            if (personForm.tcNumber && !personForm.tcNumber.includes('*')) {
                const tcCheck = validateTcLocal(personForm.tcNumber);
                if (!tcCheck.isValid) {
                    throw new Error(tcCheck.message);
                }
            }

            const payload: any = {
                firstName: personForm.firstName.trim(),
                lastName: personForm.lastName.trim(),
                salutation: personForm.salutation || null,
                title: personForm.title || null,
                avatarUrl: personForm.avatarUrl || null,
                birthDate: personForm.birthDate || null,
                nationality: personForm.nationality,
                isTurkishCitizen: personForm.isTurkishCitizen,
                workEmail: personForm.workEmail || null,
                personalEmail: personForm.personalEmail || null,
                primaryEmailType: personForm.primaryEmailType,
                email: personForm.email || null,
                workPhone: personForm.workPhone || null,
                extension: personForm.extension || null,
                phone: personForm.phone || null,
                secondaryPhone: personForm.secondaryPhone || null,
                linkedin: personForm.linkedin || null,
                websiteUrl: personForm.websiteUrl || null,
                country: personForm.country,
                city: personForm.city || null,
                state: personForm.state || null,
                address: personForm.address || null,
                postalCode: personForm.postalCode || null,
                notes: personForm.notes || null,
                businessRoles: personForm.businessRoles,
                status: personForm.status,
                dataSource: personForm.dataSource,
            };

            // Only pass tcNumber if plain (not masked)
            if (personForm.tcNumber && !personForm.tcNumber.includes('*')) {
                payload.tcNumber = personForm.tcNumber.trim();
            }

            // Company relation
            if (personForm.companyLinkMode === 'EXISTING' && personForm.organizationId) {
                payload.organizationId = personForm.organizationId;
                payload.membership = {
                    role: personForm.membershipRole,
                    department: personForm.membershipDepartment,
                    position: personForm.membershipPosition || personForm.title,
                    isPrimaryContact: personForm.isPrimaryContact,
                    isFinanceContact: personForm.isFinanceContact,
                    isLegalContact: personForm.isLegalContact,
                    isAuthorizedSignatory: personForm.isAuthorizedSignatory,
                    employmentType: personForm.employmentType || null,
                    sgkStatus: personForm.sgkStatus || null,
                    isRdStaff: personForm.isRdStaff,
                };
            } else if (personForm.companyLinkMode === 'NEW' && personForm.newOrgDisplayName) {
                payload.newOrganization = {
                    displayName: personForm.newOrgDisplayName,
                    legalName: personForm.newOrgLegalName || personForm.newOrgDisplayName,
                    orgType: personForm.newOrgType,
                    sector: personForm.newOrgSector,
                    taxNumber: personForm.newOrgTaxNumber,
                    taxOffice: personForm.newOrgTaxOffice,
                    city: personForm.city,
                };
                payload.membership = {
                    role: personForm.membershipRole,
                    department: personForm.membershipDepartment,
                    position: personForm.membershipPosition || personForm.title,
                    isPrimaryContact: personForm.isPrimaryContact,
                    isFinanceContact: personForm.isFinanceContact,
                    isLegalContact: personForm.isLegalContact,
                    isAuthorizedSignatory: personForm.isAuthorizedSignatory,
                    employmentType: personForm.employmentType || null,
                    sgkStatus: personForm.sgkStatus || null,
                    isRdStaff: personForm.isRdStaff,
                };
            }

            // Contextual mentor
            if (personForm.createMentorProfile) {
                payload.createMentorProfile = true;
                payload.mentorTitle = personForm.mentorTitle;
            }

            // KVKK details
            payload.privacy = {
                informationNoticeProvided: personForm.informationNoticeProvided,
                informationNoticeVersion: personForm.informationNoticeVersion,
                explicitConsentGiven: personForm.explicitConsentGiven,
                explicitConsentRequired: personForm.explicitConsentRequired,
                legalBasis: personForm.legalBasis,
                emailPermission: personForm.emailPermission,
                smsPermission: personForm.smsPermission,
                callPermission: personForm.callPermission,
                notes: personForm.privacyNotes,
            };

            const url = isEditingPerson ? `/api/admin/persons/${editingPersonId}` : '/api/admin/persons';
            const method = isEditingPerson ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Kişi kaydı işlenemedi');
            }

            const pName = data.item?.fullName || data.person?.fullName || `${personForm.firstName} ${personForm.lastName}`;
            setFeedback({
                type: 'success',
                message: isEditingPerson
                    ? `${pName} başarıyla güncellendi.`
                    : `${pName} kurumsal rehbere başarıyla eklendi.`
            });

            setIsPersonModalOpen(false);
            fetchData();
            fetchOrganizations();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    const handleRevealTc = async (personId: string) => {
        setRevealingTc(personId);
        try {
            const res = await fetch(`/api/admin/persons/${personId}/reveal-identity`, {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Yetki kontrolü başarısız.');
            }
            if (data.tcNumber) {
                setRevealedTcMap(prev => ({ ...prev, [personId]: data.tcNumber }));
                setFeedback({ type: 'success', message: 'T.C. Kimlik No yetkiniz doğrulanarak görüntülendi ve denetim loguna kaydedildi.' });
            } else {
                setFeedback({ type: 'warning', message: data.message || 'Kayıtlı kimlik numarası bulunmuyor.' });
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setRevealingTc(null);
        }
    };

    const handleRevokeConsent = async (personId: string) => {
        if (!confirm('İlgili kişinin iletişim iznini (Opt-out) geri çekmek istediğinizden emin misiniz? Bu işlem geçmiş rıza kaydını koruyarak durumu REVOKED yapacaktır.')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/persons/${personId}/revoke-consent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Admin panelinden kullanıcı/kişi talebiyle izin geri çekildi.' }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'İzin geri çekme başarısız.');
            }

            setFeedback({ type: 'success', message: 'İletişim izni başarıyla geri çekildi (REVOKED). Sistem toplu gönderimlerde bu tercihe uyacaktır.' });
            fetchData();
            if (isPersonModalOpen && editingPersonId === personId) {
                setPersonForm(prev => ({
                    ...prev,
                    emailPermission: false,
                    smsPermission: false,
                    callPermission: false,
                }));
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orgForm)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Kurum kaydı oluşturulamadı');
            }

            const orgName = data.organization?.displayName || data.item?.displayName || orgForm.displayName;
            setFeedback({ type: 'success', message: `${orgName} başarıyla rehbere eklendi.` });
            setIsOrgModalOpen(false);
            setOrgForm({ displayName: '', legalName: '', organizationType: 'COMPANY', sector: 'Yazılım / Teknoloji', email: '', phone: '', taxNumber: '', taxOffice: '', city: 'İstanbul', notes: '' });
            fetchData();
            fetchOrganizations();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    const toggleRole = (roleId: string) => {
        setPersonForm(prev => {
            const exists = prev.businessRoles.includes(roleId);
            const updated = exists ? prev.businessRoles.filter(r => r !== roleId) : [...prev.businessRoles, roleId];
            return {
                ...prev,
                businessRoles: updated,
                createMentorProfile: roleId === 'MENTOR' ? !exists : prev.createMentorProfile,
            };
        });
    };

    const tcValidation = validateTcLocal(personForm.tcNumber);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                        <Users className="w-4 h-4" />
                        <span>Kurumsal İKÜANTS TEKMER CRM & Rehber</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Kişi & Kurum Rehberi</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Merkezi paydaş, personel, mentör, girişimci ve kurumsal ilişki ağı (360° Paydaş Görünümü)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button data-intent="create-org"
                        id="open-create-org-btn"
                        onClick={() => setIsOrgModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition shadow-sm"
                    >
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <span>+ Yeni Kurum / Şirket</span>
                    </button>
                    <button
                        id="add-person-btn"
                        data-intent="create-person"
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/25 transition cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>+ Yeni Kişi Ekle</span>
                    </button>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedback && (
                <div className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
                    feedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                    feedback.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                    'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
            )}

            {/* Tabs & Search Filter */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                    {[
                        { id: 'people', label: 'Kişiler', icon: Users },
                        { id: 'companies', label: 'Kurumlar & Şirketler', icon: Building2 },
                        { id: 'mentors', label: 'Mentörler', icon: GraduationCap },
                        { id: 'stakeholders', label: 'Paydaşlar', icon: Briefcase },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                id={`tab-${tab.id}`}
                                onClick={() => setCurrentTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                                    active
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            id="directory-search-input"
                            type="text"
                            placeholder="İsim, unvan, e-posta, telefon..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                        />
                    </div>
                </div>
            </div>

            {/* List / Cards */}
            {loading ? (
                <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                    <span>Rehber kayıtları yükleniyor...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base">Henüz kayıt bulunmuyor</h3>
                        <p className="text-slate-400 text-xs mt-1">Arama kriterlerinizi değiştirebilir veya yeni kişi / kurum ekleyebilirsiniz.</p>
                    </div>
                    <div className="flex justify-center gap-3 pt-2">
                        <button onClick={openCreateModal} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md">
                            + Yeni Kişi Ekle
                        </button>
                        <button onClick={() => setIsOrgModalOpen(true)} className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700">
                            + Yeni Kurum Ekle
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => {
                        const isPerson = currentTab === 'people';
                        const primaryMembership = item.memberships?.[0];
                        const org = primaryMembership?.organization;
                        const isTcRevealed = revealedTcMap[item.id];

                        let businessRolesArr: string[] = [];
                        try {
                            if (item.businessRoles) businessRolesArr = JSON.parse(item.businessRoles);
                        } catch {
                            businessRolesArr = [];
                        }

                        return (
                            <div
                                key={item.id}
                                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-lg hover:shadow-xl"
                            >
                                <div className="space-y-3">
                                    {/* Header / Avatar */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-indigo-500/20 border border-primary/30 text-white font-bold flex items-center justify-center text-base">
                                                {item.avatarUrl ? (
                                                    <img src={item.avatarUrl} alt={item.fullName || item.displayName || item.name} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <span>{(item.fullName || item.displayName || item.name || 'K').slice(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-base leading-tight">
                                                    {item.salutation ? <span className="text-slate-400 font-normal text-xs mr-1">{item.salutation}</span> : null}
                                                    {item.fullName || item.displayName || item.name}
                                                </h3>
                                                <p className="text-xs text-primary font-medium mt-0.5">
                                                    {item.title || item.sector || (isPerson ? 'Rehber Kişisi' : item.orgType || 'Kurum')}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                                            item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {item.status || 'AKTİF'}
                                        </span>
                                    </div>

                                    {/* Primary Company Badge */}
                                    {org && (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs">
                                            <Building2 className="w-3.5 h-3.5 text-primary" />
                                            <span className="font-semibold text-white">{org.name}</span>
                                            {primaryMembership?.role && (
                                                <span className="text-slate-400 text-[11px]">({primaryMembership.role})</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Business Roles Chips */}
                                    {businessRolesArr.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {businessRolesArr.map((r: string) => {
                                                const opt = BUSINESS_ROLES_OPTIONS.find(o => o.id === r);
                                                return (
                                                    <span key={r} className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                                                        {opt?.label || r}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Contact Details */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-xs text-slate-300">
                                        {item.email && (
                                            <div className="flex items-center gap-2 truncate">
                                                <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                <a href={`mailto:${item.email}`} className="hover:text-primary transition truncate">{item.email}</a>
                                            </div>
                                        )}
                                        {item.phone && (
                                            <div className="flex items-center gap-2 truncate">
                                                <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                <span>{item.phone}</span>
                                            </div>
                                        )}
                                        {item.city && (
                                            <div className="flex items-center gap-2 truncate">
                                                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                <span>{item.city} {item.country ? `• ${item.country}` : ''}</span>
                                            </div>
                                        )}

                                        {/* T.C. Kimlik Section (Never full in list; strictly masked with reveal capability) */}
                                        {isPerson && item.tcNumberMasked && (
                                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40 text-[11px] font-mono">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Lock className="w-3 h-3 text-amber-400/80" />
                                                    <span>T.C.:</span>
                                                    <span className="text-white font-semibold tracking-wider">
                                                        {isTcRevealed || item.tcNumberMasked}
                                                    </span>
                                                </div>
                                                {!isTcRevealed ? (
                                                    <button
                                                        onClick={() => handleRevealTc(item.id)}
                                                        disabled={revealingTc === item.id}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans transition cursor-pointer"
                                                        title="Yetkiniz varsa T.C. Kimlik numarasını görüntüleyin (Denetim loguna kaydedilir)"
                                                    >
                                                        {revealingTc === item.id ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Eye className="w-2.5 h-2.5 text-primary" />}
                                                        <span>Göster</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-emerald-400 text-[9px] font-sans font-bold flex items-center gap-1">
                                                        <Check className="w-2.5 h-2.5" /> Doğrulandı
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                                    {isPerson ? (
                                        <>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                                                >
                                                    Detay & Düzenle
                                                </button>
                                                <button
                                                    onClick={() => setView360({ type: 'Person', id: item.id })}
                                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                                                >
                                                    360°
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeConsent(item.id)}
                                                className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 text-[11px] font-medium transition"
                                                title="İletişim İznini Geri Çek (Opt-out)"
                                            >
                                                İzni Geri Çek
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-slate-400 text-xs">
                                                {item.sector || item.orgType}
                                            </div>
                                            {currentTab === 'companies' && (
                                                <button
                                                    onClick={() => setView360({ type: 'Organization', id: item.id })}
                                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                                                >
                                                    360° Görünüm
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========================================================================= */}
            {/* ENTERPRISE PERSON CREATE & EDIT MODAL (QUICK vs FULL MODES) */}
            {/* ========================================================================= */}
            {isPersonModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                                        {isEditingPerson ? 'Kişi Düzenleme & CRM 360°' : 'Rehbere Yeni Kişi Ekle'}
                                    </span>
                                    {isEditingPerson && (
                                        <span className="text-xs text-slate-400">ID: {editingPersonId?.slice(0, 8)}...</span>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-white mt-1">
                                    {isEditingPerson ? `${personForm.firstName} ${personForm.lastName}` : 'Kurumsal Kişi / Paydaş Kaydı'}
                                </h2>
                            </div>

                            {/* Mode Switcher */}
                            <div className="flex items-center gap-3">
                                <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setPersonModalMode('QUICK')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                            personModalMode === 'QUICK' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        ⚡ Hızlı Kayıt
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPersonModalMode('FULL')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                            personModalMode === 'FULL' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        📋 Kapsamlı Kayıt
                                    </button>
                                </div>
                                <button
                                    onClick={() => setIsPersonModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs (Only in FULL mode) */}
                        {personModalMode === 'FULL' && (
                            <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 overflow-x-auto text-xs">
                                {[
                                    { id: 'BASIC', label: '1. Temel Bilgiler & Kimlik' },
                                    { id: 'CONTACT', label: '2. İletişim & Adres' },
                                    { id: 'COMPANY', label: '3. Şirket & Görev' },
                                    { id: 'ROLES', label: '4. Roller & Profiller' },
                                    { id: 'KVKK', label: '5. KVKK & İletişim İzinleri' },
                                ].map((sec) => (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => setActiveSection(sec.id as any)}
                                        className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                                            activeSection === sec.id
                                                ? 'bg-slate-800 text-primary border border-slate-700'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {sec.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Form Body */}
                        <form onSubmit={handleSavePerson} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                            {/* Duplicate Warning Banner */}
                            {tcDuplicateWarning?.found && (
                                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-xs">{tcDuplicateWarning.message}</p>
                                        <p className="text-[11px] text-amber-400/80 mt-0.5">
                                            Mükerrer kişi kaydı oluşturmak yerine mevcut kaydı güncelleyebilir veya ilgili şirkete bağlayabilirsiniz.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* SECTION 1: TEMEL BİLGİLER & KİMLİK */}
                            {/* ========================================================= */}
                            {(personModalMode === 'QUICK' || activeSection === 'BASIC') && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                            <Users className="w-4 h-4 text-primary" />
                                            <span>Temel Kişisel Bilgiler & Kimlik</span>
                                        </h3>
                                        <span className="text-[11px] text-slate-500">* Zorunlu alanlar</span>
                                    </div>

                                    {/* Photo */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                                            {personForm.avatarUrl ? <img src={personForm.avatarUrl} alt="" className="h-full w-full object-cover" /> : <Users className="m-auto mt-4 h-8 w-8 text-slate-600" />}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={() => setPhotoPickerOpen(true)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-primary">{personForm.avatarUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}</button>
                                            {personForm.avatarUrl && <button type="button" onClick={() => setPersonForm({ ...personForm, avatarUrl: '' })} className="rounded-xl px-3 py-1.5 text-[11px] text-slate-400 hover:text-rose-300">Kaldır</button>}
                                        </div>
                                        <MediaPickerModal isOpen={photoPickerOpen} onClose={() => setPhotoPickerOpen(false)} onSelect={(url) => { setPersonForm({ ...personForm, avatarUrl: url }); setPhotoPickerOpen(false); }} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Hitap / Unvan</label>
                                            <input
                                                type="text"
                                                value={personForm.salutation}
                                                onChange={(e) => setPersonForm({ ...personForm, salutation: e.target.value })}
                                                placeholder="Örn: Prof. Dr., Av., Sayın"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Ad *</label>
                                            <input
                                                id="person-first-name"
                                                type="text"
                                                required
                                                value={personForm.firstName}
                                                onChange={(e) => setPersonForm({ ...personForm, firstName: e.target.value })}
                                                placeholder="Ad"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Soyad *</label>
                                            <input
                                                id="person-last-name"
                                                type="text"
                                                required
                                                value={personForm.lastName}
                                                onChange={(e) => setPersonForm({ ...personForm, lastName: e.target.value })}
                                                placeholder="Soyad"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Mesleki Pozisyon / Unvan</label>
                                            <input
                                                id="person-title"
                                                type="text"
                                                value={personForm.title}
                                                onChange={(e) => setPersonForm({ ...personForm, title: e.target.value })}
                                                placeholder="Örn: Kurucu Ortak, Başyazılımcı, Danışman"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Durum</label>
                                            <select
                                                value={personForm.status}
                                                onChange={(e) => setPersonForm({ ...personForm, status: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                            >
                                                <option value="ACTIVE">Aktif (Aktif Operasyonda)</option>
                                                <option value="PASSIVE">Pasif (Geçici Olarak Etkin Değil)</option>
                                                <option value="ARCHIVED">Arşiv (Ayrılmış / Eski)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Citizenship & TC Kimlik No */}
                                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={personForm.isTurkishCitizen}
                                                    onChange={(e) => setPersonForm({ ...personForm, isTurkishCitizen: e.target.checked })}
                                                    className="rounded border-slate-700 text-primary"
                                                />
                                                <span>T.C. Vatandaşı</span>
                                            </label>
                                            <span className="text-[11px] text-slate-500">Opsiyonel hassas alan</span>
                                        </div>

                                        {personForm.isTurkishCitizen ? (
                                            <div>
                                                <label className="block text-slate-300 font-semibold mb-1">
                                                    T.C. Kimlik No (11 Haneli)
                                                </label>
                                                <input
                                                    id="person-tc-number"
                                                    type="text"
                                                    maxLength={11}
                                                    value={personForm.tcNumber}
                                                    onChange={(e) => handleTcChange(e.target.value)}
                                                    placeholder="11 haneli T.C. Kimlik No"
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono tracking-wider focus:outline-none focus:border-primary"
                                                />
                                                {personForm.tcNumber && (
                                                    <p className={`text-[11px] mt-1 ${tcValidation.isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {tcValidation.message}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-slate-500 mt-1">
                                                    🔒 Kimlik numaraları veritabanında AES-256-GCM ile şifrelenir ve maskelenerek saklanır. Yalnızca yetkili denetçi/yönetici tarafından görüntülenebilir.
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-slate-300 font-semibold mb-1">Uyruk (Ülke)</label>
                                                <input
                                                    type="text"
                                                    value={personForm.nationality}
                                                    onChange={(e) => setPersonForm({ ...personForm, nationality: e.target.value })}
                                                    placeholder="Örn: Almanya, ABD, Azerbaycan..."
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* SECTION 2: İLETİŞİM & ADRES */}
                            {/* ========================================================= */}
                            {(personModalMode === 'QUICK' || activeSection === 'CONTACT') && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-emerald-400" />
                                            <span>İletişim & Adres Bilgileri</span>
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">E-Posta (Birincil)</label>
                                            <input
                                                id="person-email"
                                                type="email"
                                                value={personForm.email}
                                                onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })}
                                                placeholder="ornek@alanadi.com"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Kurumsal E-Posta</label>
                                            <input
                                                id="person-work-email"
                                                type="email"
                                                value={personForm.workEmail}
                                                onChange={(e) => setPersonForm({ ...personForm, workEmail: e.target.value })}
                                                placeholder="ad.soyad@sirket.com"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Kişisel E-Posta</label>
                                            <input
                                                id="person-personal-email"
                                                type="email"
                                                value={personForm.personalEmail}
                                                onChange={(e) => setPersonForm({ ...personForm, personalEmail: e.target.value })}
                                                placeholder="ornek@gmail.com"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Cep Telefonu</label>
                                            <input
                                                id="person-phone"
                                                type="tel"
                                                value={personForm.phone}
                                                onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })}
                                                placeholder="0532 000 0000"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">İş Telefonu</label>
                                            <input
                                                type="tel"
                                                value={personForm.workPhone}
                                                onChange={(e) => setPersonForm({ ...personForm, workPhone: e.target.value })}
                                                placeholder="0212 000 0000"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Dahili No</label>
                                            <input
                                                type="text"
                                                value={personForm.extension}
                                                onChange={(e) => setPersonForm({ ...personForm, extension: e.target.value })}
                                                placeholder="104"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">LinkedIn Profili</label>
                                            <input
                                                id="person-linkedin"
                                                type="url"
                                                value={personForm.linkedin}
                                                onChange={(e) => setPersonForm({ ...personForm, linkedin: e.target.value })}
                                                placeholder="https://linkedin.com/in/..."
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Web / Profil URL</label>
                                            <input
                                                type="url"
                                                value={personForm.websiteUrl}
                                                onChange={(e) => setPersonForm({ ...personForm, websiteUrl: e.target.value })}
                                                placeholder="https://..."
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {personModalMode === 'FULL' && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-slate-300 font-semibold mb-1">İl</label>
                                                <input
                                                    type="text"
                                                    value={personForm.city}
                                                    onChange={(e) => setPersonForm({ ...personForm, city: e.target.value })}
                                                    placeholder="İstanbul"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-300 font-semibold mb-1">İlçe</label>
                                                <input
                                                    type="text"
                                                    value={personForm.state}
                                                    onChange={(e) => setPersonForm({ ...personForm, state: e.target.value })}
                                                    placeholder="Bakırköy"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-300 font-semibold mb-1">Ülke</label>
                                                <input
                                                    type="text"
                                                    value={personForm.country}
                                                    onChange={(e) => setPersonForm({ ...personForm, country: e.target.value })}
                                                    placeholder="Türkiye"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* SECTION 3: ŞİRKET & GÖREV */}
                            {/* ========================================================= */}
                            {(personModalMode === 'QUICK' || activeSection === 'COMPANY') && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-indigo-400" />
                                            <span>Şirket / Kurum İlişkisi</span>
                                        </h3>
                                        <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => setPersonForm({ ...personForm, companyLinkMode: 'EXISTING' })}
                                                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                                    personForm.companyLinkMode === 'EXISTING' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                                                }`}
                                            >
                                                Mevcut Kurumu Seç
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPersonForm({ ...personForm, companyLinkMode: 'NEW' })}
                                                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                                    personForm.companyLinkMode === 'NEW' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                                                }`}
                                            >
                                                + Yeni Kurum Oluştur
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPersonForm({ ...personForm, companyLinkMode: 'NONE' })}
                                                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                                    personForm.companyLinkMode === 'NONE' ? 'bg-slate-700 text-white' : 'text-slate-400'
                                                }`}
                                            >
                                                Bağlantı Yok
                                            </button>
                                        </div>
                                    </div>

                                    {personForm.companyLinkMode === 'EXISTING' && (
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Kurum / Şirket Seçin</label>
                                            <select
                                                id="person-org-select"
                                                value={personForm.organizationId}
                                                onChange={(e) => setPersonForm({ ...personForm, organizationId: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                            >
                                                <option value="">-- Kurum Seçin (İsteğe Bağlı) --</option>
                                                {organizations.map(org => (
                                                    <option key={org.id} value={org.id}>{org.name || org.displayName} ({org.orgType || 'Şirket'})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {personForm.companyLinkMode === 'NEW' && (
                                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-900/40 space-y-3">
                                            <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>Yeni Kurum Bilgileri (Otomatik Oluşturulacak)</span>
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-slate-300 font-semibold mb-1">Kurum / Şirket Adı *</label>
                                                    <input
                                                        type="text"
                                                        value={personForm.newOrgDisplayName}
                                                        onChange={(e) => setPersonForm({ ...personForm, newOrgDisplayName: e.target.value })}
                                                        placeholder="Örn: ABC Teknoloji"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-300 font-semibold mb-1">Resmi Unvan</label>
                                                    <input
                                                        type="text"
                                                        value={personForm.newOrgLegalName}
                                                        onChange={(e) => setPersonForm({ ...personForm, newOrgLegalName: e.target.value })}
                                                        placeholder="Örn: ABC Teknoloji A.Ş."
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-slate-300 font-semibold mb-1">Tür</label>
                                                    <select
                                                        value={personForm.newOrgType}
                                                        onChange={(e) => setPersonForm({ ...personForm, newOrgType: e.target.value })}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none"
                                                    >
                                                        <option value="COMPANY">Şirket (A.Ş. / Ltd.)</option>
                                                        <option value="UNIVERSITY">Üniversite</option>
                                                        <option value="INVESTOR">Yatırım Fonu</option>
                                                        <option value="NGO">STK / Dernek</option>
                                                        <option value="PARTNER">Paydaş</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-slate-300 font-semibold mb-1">Vergi No</label>
                                                    <input
                                                        type="text"
                                                        value={personForm.newOrgTaxNumber}
                                                        onChange={(e) => setPersonForm({ ...personForm, newOrgTaxNumber: e.target.value })}
                                                        placeholder="1234567890"
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-300 font-semibold mb-1">Sektör</label>
                                                    <input
                                                        type="text"
                                                        value={personForm.newOrgSector}
                                                        onChange={(e) => setPersonForm({ ...personForm, newOrgSector: e.target.value })}
                                                        placeholder="Yazılım, AI..."
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {personForm.companyLinkMode !== 'NONE' && (
                                        <div className="space-y-3 pt-2">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-slate-300 font-semibold mb-1">Kurumdaki Rolü</label>
                                                    <select
                                                        value={personForm.membershipRole}
                                                        onChange={(e) => setPersonForm({ ...personForm, membershipRole: e.target.value })}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                                    >
                                                        <option value="FOUNDER">Kurucu / Ortak</option>
                                                        <option value="CO_FOUNDER">Kurucu Ortak</option>
                                                        <option value="CEO">CEO / Genel Müdür</option>
                                                        <option value="CTO">CTO / Teknoloji Lideri</option>
                                                        <option value="EMPLOYEE">Şirket Personeli / Uzman</option>
                                                        <option value="FINANCE_CONTACT">Finans / Muhasebe Sorumlusu</option>
                                                        <option value="LEGAL_CONTACT">Hukuk Müşaviri</option>
                                                        <option value="AUTHORIZED_PERSON">Yetkili Temsilci</option>
                                                        <option value="OTHER">Diğer</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-slate-300 font-semibold mb-1">Departman</label>
                                                    <input
                                                        type="text"
                                                        value={personForm.membershipDepartment}
                                                        onChange={(e) => setPersonForm({ ...personForm, membershipDepartment: e.target.value })}
                                                        placeholder="Örn: Ar-Ge, Yönetim, Pazarlama"
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-300 font-semibold mb-1">Pozisyon Başlığı</label>
                                                    <input
                                                        type="text"
                                                        value={personForm.membershipPosition}
                                                        onChange={(e) => setPersonForm({ ...personForm, membershipPosition: e.target.value })}
                                                        placeholder="Örn: Kıdemli AI Araştırmacısı"
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Contact Capabilities Toggles */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={personForm.isPrimaryContact}
                                                        onChange={(e) => setPersonForm({ ...personForm, isPrimaryContact: e.target.checked })}
                                                        className="rounded border-slate-700 text-primary"
                                                    />
                                                    <span className="text-slate-300 text-[11px] font-semibold">Birincil Kontak</span>
                                                </label>
                                                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={personForm.isFinanceContact}
                                                        onChange={(e) => setPersonForm({ ...personForm, isFinanceContact: e.target.checked })}
                                                        className="rounded border-slate-700 text-primary"
                                                    />
                                                    <span className="text-slate-300 text-[11px] font-semibold">Finans Yetkilisi</span>
                                                </label>
                                                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={personForm.isLegalContact}
                                                        onChange={(e) => setPersonForm({ ...personForm, isLegalContact: e.target.checked })}
                                                        className="rounded border-slate-700 text-primary"
                                                    />
                                                    <span className="text-slate-300 text-[11px] font-semibold">Hukuk Yetkilisi</span>
                                                </label>
                                                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={personForm.isAuthorizedSignatory}
                                                        onChange={(e) => setPersonForm({ ...personForm, isAuthorizedSignatory: e.target.checked })}
                                                        className="rounded border-slate-700 text-primary"
                                                    />
                                                    <span className="text-slate-300 text-[11px] font-semibold">İmza Yetkilisi</span>
                                                </label>
                                            </div>

                                            {/* Staff profile: employment type, SGK status (as a definition), R&D staff */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                                <div>
                                                    <label className="block text-slate-300 font-semibold mb-1">Çalışma Türü</label>
                                                    <select value={personForm.employmentType} onChange={(e) => setPersonForm({ ...personForm, employmentType: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none">
                                                        <option value="">Belirtilmedi</option>
                                                        {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-slate-300 font-semibold mb-1">SGK Durumu (tanım)</label>
                                                    <select value={personForm.sgkStatus} onChange={(e) => setPersonForm({ ...personForm, sgkStatus: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none">
                                                        <option value="">Belirtilmedi</option>
                                                        {Array.from(new Set([...(personForm.sgkStatus ? [personForm.sgkStatus] : []), ...sgkStatuses])).map((s) => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer md:col-span-3">
                                                    <input type="checkbox" checked={personForm.isRdStaff} onChange={(e) => setPersonForm({ ...personForm, isRdStaff: e.target.checked })} className="rounded border-slate-700 text-primary" />
                                                    <span className="text-slate-300 text-[11px] font-semibold">Ar-Ge / tasarım personeli (5746 kapsamı takibi)</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* SECTION 4: ROLLER & PROFİLLER */}
                            {/* ========================================================= */}
                            {personModalMode === 'FULL' && activeSection === 'ROLES' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-amber-400" />
                                            <span>Kişinin Sistemdeki Rolleri (Person Business Roles)</span>
                                        </h3>
                                        <span className="text-[11px] text-slate-500">Kullanıcı giriş rolü (RBAC) ile karıştırılmaz</span>
                                    </div>

                                    <p className="text-slate-400 text-xs">
                                        Kişinin TEKMER ekosistemindeki tüm iş rollerini seçin. Birden fazla rol atanabilir.
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {BUSINESS_ROLES_OPTIONS.map((opt) => {
                                            const selected = personForm.businessRoles.includes(opt.id);
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => toggleRole(opt.id)}
                                                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                                                        selected
                                                            ? 'bg-primary/20 border-primary text-white font-bold'
                                                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <span>{opt.label}</span>
                                                    {selected && <Check className="w-4 h-4 text-primary" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Contextual Mentor Profile */}
                                    {personForm.businessRoles.includes('MENTOR') && (
                                        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-indigo-400" />
                                                <h4 className="font-bold text-white text-xs">Bağlı Mentör Profili Oluşturma</h4>
                                            </div>
                                            <p className="text-slate-400 text-xs">
                                                Bu kişi için ayrı bir Person kaydı çoğaltılmadan doğrudan Mentörlük modülünde profil oluşturulacaktır.
                                            </p>
                                            <div>
                                                <label className="block text-slate-300 font-semibold mb-1">Mentör Uzmanlık / Başlık</label>
                                                <input
                                                    type="text"
                                                    value={personForm.mentorTitle}
                                                    onChange={(e) => setPersonForm({ ...personForm, mentorTitle: e.target.value })}
                                                    placeholder="Örn: Fintek & B2B SaaS Büyüme Mentörü"
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* SECTION 5: KVKK & İLETİŞİM İZİNLERİ */}
                            {/* ========================================================= */}
                            {personModalMode === 'FULL' && activeSection === 'KVKK' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-emerald-400" />
                                            <span>KVKK Uyum & İletişim İzinleri</span>
                                        </h3>
                                        <span className="text-[11px] text-slate-500">6698 Sayılı KVKK Uyum Yönetimi</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Aydınlatma & Dayanak */}
                                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                                            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-primary" />
                                                <span>Aydınlatma & Hukuki İşleme Sebebi</span>
                                            </h4>

                                            <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={personForm.informationNoticeProvided}
                                                    onChange={(e) => setPersonForm({ ...personForm, informationNoticeProvided: e.target.checked })}
                                                    className="rounded border-slate-700 text-primary"
                                                />
                                                <span>Aydınlatma Metni Sunuldu</span>
                                            </label>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-slate-400 text-[11px] mb-1">Metin Versiyonu</label>
                                                    <input
                                                        type="text"
                                                        value={personForm.informationNoticeVersion}
                                                        onChange={(e) => setPersonForm({ ...personForm, informationNoticeVersion: e.target.value })}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-400 text-[11px] mb-1">Hukuki Dayanak</label>
                                                    <select
                                                        value={personForm.legalBasis}
                                                        onChange={(e) => setPersonForm({ ...personForm, legalBasis: e.target.value })}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                                                    >
                                                        {LEGAL_BASIS_OPTIONS.map(opt => (
                                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer pt-2">
                                                <input
                                                    type="checkbox"
                                                    checked={personForm.explicitConsentGiven}
                                                    onChange={(e) => setPersonForm({ ...personForm, explicitConsentGiven: e.target.checked })}
                                                    className="rounded border-slate-700 text-primary"
                                                />
                                                <span>Açık Rıza Alındı</span>
                                            </label>
                                        </div>

                                        {/* İletişim İzinleri */}
                                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                                            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Elektronik İleti İzinleri (Opt-in)</span>
                                            </h4>

                                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={personForm.emailPermission}
                                                    onChange={(e) => setPersonForm({ ...personForm, emailPermission: e.target.checked })}
                                                    className="rounded border-slate-700 text-emerald-500"
                                                />
                                                <span>E-Posta İletişim İzni</span>
                                            </label>

                                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={personForm.smsPermission}
                                                    onChange={(e) => setPersonForm({ ...personForm, smsPermission: e.target.checked })}
                                                    className="rounded border-slate-700 text-emerald-500"
                                                />
                                                <span>SMS / WhatsApp İletişim İzni</span>
                                            </label>

                                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={personForm.callPermission}
                                                    onChange={(e) => setPersonForm({ ...personForm, callPermission: e.target.checked })}
                                                    className="rounded border-slate-700 text-emerald-500"
                                                />
                                                <span>Telefon Araması İletişim İzni</span>
                                            </label>

                                            <div className="pt-2">
                                                <label className="block text-slate-400 text-[11px] mb-1">Veri Kaynağı (Provenance)</label>
                                                <select
                                                    value={personForm.dataSource}
                                                    onChange={(e) => setPersonForm({ ...personForm, dataSource: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                                                >
                                                    {DATA_SOURCE_OPTIONS.map(opt => (
                                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer Buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsPersonModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                                >
                                    İptal
                                </button>
                                <div className="flex items-center gap-3">
                                    {isEditingPerson && (
                                        <button
                                            type="button"
                                            onClick={() => handleRevokeConsent(editingPersonId!)}
                                            className="px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-semibold"
                                        >
                                            İletişim İznini Geri Çek
                                        </button>
                                    )}
                                    <button
                                        id="submit-person-btn"
                                        type="submit"
                                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 transition cursor-pointer flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>{isEditingPerson ? 'Değişiklikleri Kaydet' : 'Kişiyi Rehbere Kaydet'}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* CREATE ORGANIZATION MODAL */}
            {/* ========================================================================= */}
            {isOrgModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-white text-base">Rehbere Yeni Kurum / Şirket Ekle</h3>
                            <button onClick={() => setIsOrgModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Kurum / Şirket Adı *</label>
                                <input
                                    id="org-display-name"
                                    type="text"
                                    required
                                    value={orgForm.displayName}
                                    onChange={(e) => setOrgForm({ ...orgForm, displayName: e.target.value })}
                                    placeholder="Örn: ABC Teknoloji"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Resmi Ticari Unvan</label>
                                <input
                                    type="text"
                                    value={orgForm.legalName}
                                    onChange={(e) => setOrgForm({ ...orgForm, legalName: e.target.value })}
                                    placeholder="Örn: ABC Teknoloji ve Yazılım A.Ş."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Kurum Türü</label>
                                    <select
                                        value={orgForm.organizationType}
                                        onChange={(e) => setOrgForm({ ...orgForm, organizationType: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                    >
                                        <option value="COMPANY">Şirket (A.Ş. / Ltd.)</option>
                                        <option value="UNIVERSITY">Üniversite / Enstitü</option>
                                        <option value="PUBLIC_INSTITUTION">Kamu Kurumu</option>
                                        <option value="INVESTOR">Yatırım Fonu / Melek Ağ</option>
                                        <option value="NGO">STK / Dernek</option>
                                        <option value="PARTNER">Paydaş / Partner</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Sektör</label>
                                    <input
                                        type="text"
                                        value={orgForm.sector}
                                        onChange={(e) => setOrgForm({ ...orgForm, sector: e.target.value })}
                                        placeholder="Yazılım, AI, Biyoteknoloji..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Vergi No</label>
                                    <input
                                        type="text"
                                        value={orgForm.taxNumber}
                                        onChange={(e) => setOrgForm({ ...orgForm, taxNumber: e.target.value })}
                                        placeholder="1234567890"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Vergi Dairesi</label>
                                    <input
                                        type="text"
                                        value={orgForm.taxOffice}
                                        onChange={(e) => setOrgForm({ ...orgForm, taxOffice: e.target.value })}
                                        placeholder="Kadıköy VD"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsOrgModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                                >
                                    İptal
                                </button>
                                <button
                                    id="submit-org-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 cursor-pointer"
                                >
                                    Kurumu Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Record360Drawer target={view360} onClose={() => setView360(null)} />
        </div>
    );
}
