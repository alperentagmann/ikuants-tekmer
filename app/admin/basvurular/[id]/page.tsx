'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Inbox, User, ShieldAlert, Eye, MessageSquare, History, Scale, FileText, CheckCircle2, Rocket, Building2, ListTodo, Mail, ClipboardList, ArrowRight } from 'lucide-react';
import { PageHeader, Button, Card, Badge, Alert, Skeleton, Tabs, Field, TextInput, TextArea, Select, Modal, KeyValue, EmptyState, SectionTitle, api, formatDateTime, formatDate } from '@/components/admin/ui';
import { applicantTypeLabel, applicationTypeLabel, normalizeFieldType } from '@/lib/forms/schema';

type Tab = 'overview' | 'answers' | 'evaluation' | 'documents' | 'notes' | 'timeline';

interface Stage { key: string; label: string; order: number; outcome?: string | null; isTerminal?: boolean }
interface AppDetail {
    id: string;
    applicationNumber: string;
    applicationType: string;
    applicantType: string;
    applicantName: string;
    companyName: string | null;
    email: string;
    phone: string | null;
    tcNumber: string | null;
    canRevealPii: boolean;
    status: string;
    createdAt: string;
    decidedAt: string | null;
    duplicateWarning: string | null;
    workflowStages: Stage[];
    program: { id: string; name: string } | null;
    campaign: { id: string; name: string; applicationType: string; requiredDocuments: string | null; program: { id: string; name: string } | null; evaluationTemplate: { id: string; name: string } | null } | null;
    person: { id: string; fullName: string; email: string | null } | null;
    organization: { id: string; name: string } | null;
    entrepreneur: { id: string; name: string; slug: string } | null;
    spaceAssignments: { id: string; status: string; unitLabel: string | null; startDate: string | null; facility: { id: string; title: string } }[];
    assignedTo: { id: string; name: string } | null;
    formVersion: { versionNumber: number; form: { id: string; title: string }; fields: { fieldKey: string; label: string; fieldType: string; stepNumber: number; stepTitle: string | null; sortOrder: number }[] };
    submission: { submissionNumber: string; answers: { fieldKey: string; fieldLabel: string; textValue: string | null; numValue: number | null; jsonValue: string | null }[] } | null;
    statusHistory: { id: string; fromStatus: string; toStatus: string; reason: string | null; changedByName: string | null; createdAt: string }[];
    notes: { id: string; noteText: string; authorName: string; createdAt: string }[];
    timeline: { id: string; title: string; description: string | null; actorName: string | null; createdAt: string }[];
    documents: { id: string; title: string; category: string; media: { originalName: string; publicUrl: string; fileSize: number } }[];
}

interface EvalData {
    template: { id: string; name: string; criteria: { id: string; name: string; description: string | null; maxScore: number; weight: number }[] } | null;
    evaluations: { id: string; evaluatorId: string; totalScore: number; isCompleted: boolean; finalComment: string | null; evaluator: { id: string; name: string }; scores: { criterionId: string; score: number; comment: string | null }[]; updatedAt: string }[];
    averageScore: number | null;
    currentUserId: string;
}

function answerValue(a: { textValue: string | null; numValue: number | null; jsonValue: string | null } | undefined): React.ReactNode {
    if (!a) return <span className="text-gray-600">Cevaplanmadı</span>;
    if (a.jsonValue) {
        try {
            const v = JSON.parse(a.jsonValue);
            return Array.isArray(v) ? v.join(', ') : String(v);
        } catch {
            return a.jsonValue;
        }
    }
    if (a.textValue === 'true') return 'Evet';
    if (a.textValue === 'false') return 'Hayır';
    return <span className="whitespace-pre-wrap">{a.textValue ?? a.numValue ?? ''}</span>;
}

export default function ApplicationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [app, setApp] = useState<AppDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ text: string; link?: { href: string; label: string } } | null>(null);
    const [tab, setTab] = useState<Tab>('overview');

    const [newStatus, setNewStatus] = useState('');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [revealed, setRevealed] = useState<string | null>(null);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

    const [evalData, setEvalData] = useState<EvalData | null>(null);
    const [myScores, setMyScores] = useState<Record<string, { score: string; comment: string }>>({});
    const [myComment, setMyComment] = useState('');

    const [programModal, setProgramModal] = useState(false);
    const [spaceModal, setSpaceModal] = useState(false);
    const [entSearch, setEntSearch] = useState('');
    const [entResults, setEntResults] = useState<{ id: string; name: string }[]>([]);
    const [entId, setEntId] = useState('');
    const [newEntName, setNewEntName] = useState('');
    const [cohort, setCohort] = useState('');
    const [facilities, setFacilities] = useState<{ id: string; title: string }[]>([]);
    const [orgSearch, setOrgSearch] = useState('');
    const [orgResults, setOrgResults] = useState<{ id: string; name: string }[]>([]);
    const [space, setSpace] = useState({ facilityId: '', organizationId: '', newOrganization: '', unitLabel: '', startDate: '', notes: '' });
    const [modalError, setModalError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api<{ application: AppDetail }>(`/api/admin/applications/${id}`);
            setApp(data.application);
            setNewStatus(data.application.status);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Başvuru yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadEval = useCallback(async () => {
        try {
            const data = await api<EvalData>(`/api/admin/applications/${id}/evaluations`);
            setEvalData(data);
            const mine = data.evaluations.find((e) => e.evaluatorId === data.currentUserId);
            if (mine) {
                setMyScores(Object.fromEntries(mine.scores.map((s) => [s.criterionId, { score: String(s.score), comment: s.comment || '' }])));
                setMyComment(mine.finalComment || '');
            }
        } catch {
            setEvalData(null);
        }
    }, [id]);

    useEffect(() => {
        load();
        loadEval();
        api<{ users: { id: string; name: string }[] }>('/api/admin/users').then((d) => setUsers(d.users || [])).catch(() => setUsers([]));
    }, [load, loadEval]);

    useEffect(() => {
        if (!programModal || entSearch.trim().length < 2) {
            setEntResults([]);
            return;
        }
        const t = setTimeout(() => {
            api<{ items: { id: string; name: string }[] }>(`/api/admin/entrepreneurs?search=${encodeURIComponent(entSearch)}&limit=10`).then((d) => setEntResults(d.items || [])).catch(() => setEntResults([]));
        }, 250);
        return () => clearTimeout(t);
    }, [entSearch, programModal]);

    useEffect(() => {
        if (!spaceModal) return;
        api<{ facilities: { id: string; title: string }[] }>('/api/admin/facilities').then((d) => setFacilities(d.facilities || [])).catch(() => setFacilities([]));
    }, [spaceModal]);

    useEffect(() => {
        if (!spaceModal || orgSearch.trim().length < 2) {
            setOrgResults([]);
            return;
        }
        const t = setTimeout(() => {
            api<{ items: { id: string; name: string }[] }>(`/api/admin/organizations?search=${encodeURIComponent(orgSearch)}&limit=10`).then((d) => setOrgResults(d.items || [])).catch(() => setOrgResults([]));
        }, 250);
        return () => clearTimeout(t);
    }, [orgSearch, spaceModal]);

    const stages = app?.workflowStages || [];
    const stageOf = (key: string) => stages.find((s) => s.key === key);
    const isAccepted = app ? app.status === 'ACCEPTED' || stageOf(app.status)?.outcome === 'ACCEPTED' : false;
    const programAssigned = Boolean(app?.entrepreneur);
    const answersByKey = useMemo(() => new Map((app?.submission?.answers || []).map((a) => [a.fieldKey, a])), [app]);
    const sections = useMemo(() => {
        if (!app) return [] as { step: number; title: string; fields: AppDetail['formVersion']['fields'] }[];
        const map = new Map<number, { step: number; title: string; fields: AppDetail['formVersion']['fields'] }>();
        [...app.formVersion.fields].sort((a, b) => a.sortOrder - b.sortOrder).forEach((f) => {
            if (['HEADING', 'DESCRIPTION', 'DIVIDER'].includes(normalizeFieldType(f.fieldType))) return;
            if (!map.has(f.stepNumber)) map.set(f.stepNumber, { step: f.stepNumber, title: f.stepTitle || `Bölüm ${f.stepNumber}`, fields: [] });
            map.get(f.stepNumber)!.fields.push(f);
        });
        return Array.from(map.values()).sort((a, b) => a.step - b.step);
    }, [app]);
    const requiredDocs: { key: string; label: string; required: boolean; requiredAtStage?: string | null; description?: string }[] = useMemo(() => {
        try {
            return app?.campaign?.requiredDocuments ? JSON.parse(app.campaign.requiredDocuments) : [];
        } catch {
            return [];
        }
    }, [app]);

    const patch = async (body: Record<string, unknown>, label: string) => {
        setBusy(label);
        setError(null);
        try {
            await api(`/api/admin/applications/${id}`, { method: 'PUT', json: body });
            await load();
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'İşlem başarısız');
            return false;
        } finally {
            setBusy(null);
        }
    };

    const reveal = async () => {
        setBusy('reveal');
        try {
            const data = await api<{ tcNumber: string }>(`/api/admin/applications/${id}/reveal-pii`, { method: 'POST', json: { reason: 'Başvuru değerlendirmesi' } });
            setRevealed(data.tcNumber);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Görüntülenemedi');
        } finally {
            setBusy(null);
        }
    };

    const saveEvaluation = async (isCompleted: boolean) => {
        if (!evalData?.template) return;
        setBusy(isCompleted ? 'evalDone' : 'evalDraft');
        setError(null);
        try {
            const scores = evalData.template.criteria.filter((c) => myScores[c.id]?.score !== undefined && myScores[c.id]?.score !== '').map((c) => ({ criterionId: c.id, score: Number(myScores[c.id].score), comment: myScores[c.id].comment }));
            const data = await api<{ message: string }>(`/api/admin/applications/${id}/evaluations`, { method: 'POST', json: { scores, finalComment: myComment, isCompleted } });
            setNotice({ text: data.message });
            loadEval();
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Değerlendirme kaydedilemedi');
        } finally {
            setBusy(null);
        }
    };

    const decide = async (body: Record<string, unknown>, close: () => void) => {
        setBusy('decision');
        setModalError(null);
        try {
            const data = await api<{ message: string; links?: Record<string, string> }>(`/api/admin/applications/${id}/decision`, { method: 'POST', json: body });
            close();
            const link = data.links?.entrepreneur ? { href: data.links.entrepreneur, label: 'Girişimi aç' } : data.links?.spaceAssignments ? { href: data.links.spaceAssignments, label: 'Alan tahsislerini aç' } : undefined;
            setNotice({ text: data.message, link });
            load();
        } catch (e) {
            setModalError(e instanceof Error ? e.message : 'İşlem tamamlanamadı');
        } finally {
            setBusy(null);
        }
    };

    if (loading && !app) return <Skeleton rows={8} />;
    if (!app) return <EmptyState icon={Inbox} title="Başvuru bulunamadı" description={error || undefined} action={<Link href="/admin/basvurular" className="text-primary">Başvuru Merkezine dön</Link>} />;

    const isTekmer = app.applicationType === 'TEKMER';
    const stageLabel = stageOf(app.status)?.label || app.status;

    return (
        <div>
            <PageHeader
                breadcrumb={[{ label: 'Başvuru Merkezi', href: '/admin/basvurular' }, { label: app.applicationNumber }]}
                title={app.applicantName}
                icon={Inbox}
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-gray-500">{app.applicationNumber}</span>
                        <Badge tone={isTekmer ? 'warning' : 'primary'}>{applicationTypeLabel(app.applicationType)}</Badge>
                        <Badge tone={isAccepted ? 'success' : app.status === 'REJECTED' ? 'danger' : 'info'}>{stageLabel}</Badge>
                        {app.campaign && <Link href={`/admin/basvuru-kampanyalari?campaignId=${app.campaign.id}`} className="text-xs text-gray-400 hover:text-primary">{app.campaign.name}</Link>}
                    </span>
                }
                actions={
                    <>
                        <Link href={`/admin/gorevler?action=create&applicationId=${app.id}&title=${encodeURIComponent(`${app.applicationNumber} — ${app.applicantName}`)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10"><ListTodo className="h-4 w-4" />Görev Oluştur</Link>
                        <Link href={`/admin/eposta-merkezi?to=${encodeURIComponent(app.email)}&name=${encodeURIComponent(app.applicantName)}&entityType=APPLICATION&entityId=${app.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10"><Mail className="h-4 w-4" />E-posta Hazırla</Link>
                    </>
                }
            />

            {notice && (
                <div className="mb-4">
                    <Alert tone="success" onClose={() => setNotice(null)}>
                        {notice.text} {notice.link && <Link href={notice.link.href} className="ml-1 underline">{notice.link.label}</Link>}
                    </Alert>
                </div>
            )}
            {error && <div className="mb-4"><Alert tone="danger" onClose={() => setError(null)}>{error}</Alert></div>}
            {app.duplicateWarning && <div className="mb-4"><Alert tone="warning">{app.duplicateWarning}</Alert></div>}

            {/* Status -> action */}
            {isAccepted && !isTekmer && !programAssigned && (
                <div className="mb-4">
                    <Alert tone="info" title="Başvuru kabul edildi — program ataması bekliyor">
                        Program ataması otomatik yapılmaz. <button type="button" className="underline" onClick={() => { setModalError(null); setNewEntName(app.companyName || app.applicantName); setProgramModal(true); }}>Programa Ata</button>
                    </Alert>
                </div>
            )}
            {isAccepted && isTekmer && app.spaceAssignments.length === 0 && (
                <div className="mb-4">
                    <Alert tone="info" title="TEKMER yer edinme başvurusu kabul edildi">
                        Alan tahsisi, sözleşme ve kira otomatik oluşturulmaz. <button type="button" className="underline" onClick={() => { setModalError(null); setSpace({ facilityId: '', organizationId: app.organization?.id || '', newOrganization: app.companyName || '', unitLabel: '', startDate: '', notes: '' }); setSpaceModal(true); }}>Alan Tahsis Sürecini Başlat</button>
                    </Alert>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                    <Tabs<Tab>
                        value={tab}
                        onChange={setTab}
                        tabs={[
                            { value: 'overview', label: 'Genel', icon: User },
                            { value: 'answers', label: 'Cevaplar', icon: ClipboardList },
                            { value: 'evaluation', label: 'Değerlendirme', icon: Scale, count: evalData?.evaluations.length ?? null },
                            { value: 'documents', label: 'Belgeler', icon: FileText, count: app.documents.length },
                            { value: 'notes', label: 'Notlar', icon: MessageSquare, count: app.notes.length },
                            { value: 'timeline', label: 'Zaman Çizelgesi', icon: History },
                        ]}
                    />

                    {tab === 'overview' && (
                        <div className="space-y-4">
                            <Card>
                                <SectionTitle>Başvuru sahibi</SectionTitle>
                                <KeyValue
                                    items={[
                                        { label: 'Ad Soyad', value: app.applicantName },
                                        { label: 'Başvuran türü', value: applicantTypeLabel(app.applicantType) },
                                        { label: 'Şirket / takım', value: app.companyName },
                                        { label: 'E-posta', value: <a href={`mailto:${app.email}`} className="text-primary hover:underline">{app.email}</a> },
                                        { label: 'Telefon', value: app.phone },
                                        {
                                            label: 'T.C. Kimlik No',
                                            value: app.tcNumber && app.tcNumber !== '***' ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="font-mono">{revealed || app.tcNumber}</span>
                                                    {!revealed && app.canRevealPii && <Button size="sm" icon={Eye} loading={busy === 'reveal'} onClick={reveal}>Göster (kayıt altına alınır)</Button>}
                                                    {!app.canRevealPii && <ShieldAlert className="h-4 w-4 text-amber-400" aria-label="Görüntüleme yetkiniz yok" />}
                                                </span>
                                            ) : null,
                                        },
                                    ]}
                                />
                            </Card>
                            <Card>
                                <SectionTitle hint="İlişkiler admin kararıyla kurulur; public başvuru otomatik CRM kaydı oluşturmaz.">İlişkili kayıtlar</SectionTitle>
                                <KeyValue
                                    items={[
                                        { label: 'Kampanya', value: app.campaign ? <Link className="text-primary hover:underline" href={`/admin/basvuru-kampanyalari?campaignId=${app.campaign.id}`}>{app.campaign.name}</Link> : 'Kampanyasız (eski kayıt)' },
                                        { label: 'Hedef', value: isTekmer ? 'TEKMER yer edinme (program hedefi yok)' : app.program?.name || app.campaign?.program?.name },
                                        { label: 'Form', value: <Link className="text-primary hover:underline" href={`/admin/form-builder/${app.formVersion.form.id}`}>{app.formVersion.form.title} · v{app.formVersion.versionNumber}</Link> },
                                        { label: 'Girişim', value: app.entrepreneur ? <Link className="text-primary hover:underline" href={`/admin/girisimciler/${app.entrepreneur.id}`}>{app.entrepreneur.name}</Link> : null },
                                        { label: 'Kurum', value: app.organization ? <Link className="text-primary hover:underline" href={`/admin/rehber?organizationId=${app.organization.id}`}>{app.organization.name}</Link> : null },
                                        { label: 'Kişi', value: app.person ? <Link className="text-primary hover:underline" href={`/admin/rehber?personId=${app.person.id}`}>{app.person.fullName}</Link> : null },
                                    ]}
                                />
                                {app.spaceAssignments.length > 0 && (
                                    <div className="mt-4 border-t border-white/10 pt-3">
                                        <p className="mb-2 text-xs font-semibold text-gray-300">Alan tahsisleri</p>
                                        <ul className="space-y-1 text-sm">
                                            {app.spaceAssignments.map((s) => (
                                                <li key={s.id} className="flex items-center justify-between">
                                                    <span className="text-gray-200">{s.facility.title}{s.unitLabel ? ` · ${s.unitLabel}` : ''}</span>
                                                    <span className="flex items-center gap-2"><Badge tone={s.status === 'ACTIVE' ? 'success' : 'info'}>{s.status === 'PLANNED' ? 'Planlandı' : s.status === 'ACTIVE' ? 'Aktif' : s.status}</Badge><span className="text-xs text-gray-500">{formatDate(s.startDate)}</span></span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Link href="/admin/alanlar?tab=tahsisler" className="mt-2 inline-flex items-center gap-1 text-xs text-primary">Tahsisleri yönet <ArrowRight className="h-3 w-3" /></Link>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {tab === 'answers' && (
                        <div className="space-y-4">
                            {sections.length === 0 && <EmptyState icon={ClipboardList} title="Bu başvuruda form cevabı yok." description="Manuel kaydedilen başvurularda yalnız temel bilgiler bulunur." />}
                            {sections.map((sec) => (
                                <Card key={sec.step}>
                                    <SectionTitle>{sec.title}</SectionTitle>
                                    <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {sec.fields.map((f) => (
                                            <div key={f.fieldKey} className={normalizeFieldType(f.fieldType) === 'TEXTAREA' ? 'md:col-span-2' : ''}>
                                                <dt className="text-xs text-gray-500">{f.label}</dt>
                                                <dd className="mt-0.5 text-sm text-gray-100">{answerValue(answersByKey.get(f.fieldKey))}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </Card>
                            ))}
                        </div>
                    )}

                    {tab === 'evaluation' && (
                        <div className="space-y-4">
                            {!evalData?.template ? (
                                <EmptyState icon={Scale} title="Kampanyaya değerlendirme şablonu bağlanmamış." description="Kampanya ayarlarının Değerlendirme sekmesinden bu kampanyaya özel kriterler tanımlayın." action={app.campaign ? <Link href={`/admin/basvuru-kampanyalari?campaignId=${app.campaign.id}`} className="text-sm text-primary">Kampanyayı aç</Link> : undefined} />
                            ) : (
                                <>
                                    <Card>
                                        <SectionTitle hint={`${evalData.template.name} · 100 üzerinden ağırlıklı puan`}>Benim değerlendirmem</SectionTitle>
                                        <div className="space-y-3">
                                            {evalData.template.criteria.map((c) => (
                                                <div key={c.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_1fr]">
                                                    <div>
                                                        <p className="text-sm text-gray-200">{c.name}</p>
                                                        <p className="text-[11px] text-gray-500">0–{c.maxScore} · ağırlık {c.weight}{c.description ? ` · ${c.description}` : ''}</p>
                                                    </div>
                                                    <TextInput aria-label={`${c.name} puanı`} type="number" min={0} max={c.maxScore} step="0.5" value={myScores[c.id]?.score ?? ''} onChange={(e) => setMyScores({ ...myScores, [c.id]: { score: e.target.value, comment: myScores[c.id]?.comment || '' } })} />
                                                    <TextInput aria-label={`${c.name} yorumu`} placeholder="Yorum (isteğe bağlı)" value={myScores[c.id]?.comment ?? ''} onChange={(e) => setMyScores({ ...myScores, [c.id]: { score: myScores[c.id]?.score || '', comment: e.target.value } })} />
                                                </div>
                                            ))}
                                            <Field label="Genel yorum" htmlFor="ev-comment"><TextArea id="ev-comment" value={myComment} onChange={(e) => setMyComment(e.target.value)} /></Field>
                                            <div className="flex gap-2">
                                                <Button loading={busy === 'evalDraft'} onClick={() => saveEvaluation(false)}>Taslak Kaydet</Button>
                                                <Button variant="primary" icon={CheckCircle2} loading={busy === 'evalDone'} onClick={() => saveEvaluation(true)}>Değerlendirmeyi Tamamla</Button>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card>
                                        <SectionTitle hint={evalData.averageScore !== null ? `Tamamlanan değerlendirmelerin ortalaması: ${evalData.averageScore}/100` : 'Henüz tamamlanan değerlendirme yok'}>Tüm değerlendirmeler</SectionTitle>
                                        {evalData.evaluations.length === 0 ? <p className="text-sm text-gray-500">Değerlendirme yok.</p> : (
                                            <ul className="divide-y divide-white/5">
                                                {evalData.evaluations.map((e) => (
                                                    <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                                                        <span className="text-gray-200">{e.evaluator.name}</span>
                                                        <span className="flex items-center gap-2">
                                                            <span className="font-semibold text-white">{e.totalScore}/100</span>
                                                            <Badge tone={e.isCompleted ? 'success' : 'neutral'}>{e.isCompleted ? 'Tamamlandı' : 'Taslak'}</Badge>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </Card>
                                </>
                            )}
                        </div>
                    )}

                    {tab === 'documents' && (
                        <div className="space-y-4">
                            {requiredDocs.length > 0 && (
                                <Card>
                                    <SectionTitle hint="Kampanya için tanımlı belge gereksinimleri">Belge kontrol listesi</SectionTitle>
                                    <ul className="space-y-2">
                                        {requiredDocs.map((d) => {
                                            const received = app.documents.some((doc) => doc.title.toLocaleLowerCase('tr').includes(d.label.toLocaleLowerCase('tr')));
                                            return (
                                                <li key={d.key} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-200">{d.label}{d.required && <span className="text-rose-400"> *</span>}{d.requiredAtStage ? <span className="ml-2 text-[11px] text-gray-500">({stageOf(d.requiredAtStage)?.label || d.requiredAtStage} aşamasında)</span> : null}</span>
                                                    <Badge tone={received ? 'success' : 'warning'}>{received ? 'Alındı' : 'Bekleniyor'}</Badge>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Card>
                            )}
                            <Card>
                                <SectionTitle actions={<Link href={`/admin/dokumanlar?entityType=Application&entityId=${app.id}`} className="text-xs text-primary">Belge Ekle</Link>}>Yüklenen belgeler</SectionTitle>
                                {app.documents.length === 0 ? <p className="text-sm text-gray-500">Henüz belge yok.</p> : (
                                    <ul className="space-y-1">
                                        {app.documents.map((d) => <li key={d.id}><a href={d.media.publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><FileText className="h-4 w-4" />{d.title} — {d.media.originalName}</a></li>)}
                                    </ul>
                                )}
                            </Card>
                        </div>
                    )}

                    {tab === 'notes' && (
                        <Card>
                            <form className="mb-4 space-y-2" onSubmit={async (e) => { e.preventDefault(); if (!noteText.trim()) return; if (await patch({ noteText }, 'note')) setNoteText(''); }}>
                                <TextArea aria-label="Not" placeholder="Dahili not ekleyin..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                                <Button type="submit" variant="primary" loading={busy === 'note'} disabled={!noteText.trim()}>Not Ekle</Button>
                            </form>
                            {app.notes.length === 0 ? <p className="text-sm text-gray-500">Not yok.</p> : (
                                <ul className="space-y-3">
                                    {app.notes.map((n) => <li key={n.id} className="rounded-lg border border-white/10 p-3"><p className="whitespace-pre-wrap text-sm text-gray-200">{n.noteText}</p><p className="mt-1 text-[11px] text-gray-500">{n.authorName} · {formatDateTime(n.createdAt)}</p></li>)}
                                </ul>
                            )}
                        </Card>
                    )}

                    {tab === 'timeline' && (
                        <Card>
                            {app.timeline.length === 0 ? <p className="text-sm text-gray-500">Kayıt yok.</p> : (
                                <ol className="relative space-y-4 border-l border-white/10 pl-5">
                                    {app.timeline.map((t) => (
                                        <li key={t.id}>
                                            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-[#0d0d17] bg-primary" aria-hidden="true" />
                                            <p className="text-sm text-gray-100">{t.title}</p>
                                            {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
                                            <p className="text-[11px] text-gray-500">{formatDateTime(t.createdAt)}{t.actorName ? ` · ${t.actorName}` : ''}</p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </Card>
                    )}
                </div>

                <div className="space-y-4">
                    <Card>
                        <SectionTitle hint={app.campaign ? 'Bu kampanyanın iş akışı' : 'Genel iş akışı'}>Aşama</SectionTitle>
                        <div className="space-y-2">
                            <Select aria-label="Yeni aşama" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} options={stages.map((s) => ({ value: s.key, label: s.label }))} />
                            <TextInput aria-label="Gerekçe" placeholder="Gerekçe (isteğe bağlı)" value={reason} onChange={(e) => setReason(e.target.value)} />
                            <Button variant="primary" className="w-full" loading={busy === 'status'} disabled={newStatus === app.status} onClick={async () => { if (await patch({ status: newStatus, reason }, 'status')) { setReason(''); setNotice({ text: `Aşama güncellendi: ${stageOf(newStatus)?.label || newStatus}` }); } }}>Aşamayı Güncelle</Button>
                        </div>
                    </Card>

                    <Card>
                        <SectionTitle>Sorumlu</SectionTitle>
                        <Select aria-label="Sorumlu" value={app.assignedTo?.id || ''} onChange={(e) => patch({ assignedToId: e.target.value || null }, 'assign')} placeholder="Atanmamış" options={users.map((u) => ({ value: u.id, label: u.name }))} />
                    </Card>

                    <Card>
                        <SectionTitle>Sonraki adım</SectionTitle>
                        {!isAccepted ? (
                            <p className="text-xs text-gray-400">Kabul kararından sonra {isTekmer ? 'alan tahsis süreci' : 'program ataması'} buradan başlatılır.</p>
                        ) : isTekmer ? (
                            <Button className="w-full" variant="primary" icon={Building2} onClick={() => { setModalError(null); setSpace({ facilityId: '', organizationId: app.organization?.id || '', newOrganization: app.companyName || '', unitLabel: '', startDate: '', notes: '' }); setSpaceModal(true); }}>Alan Tahsis Sürecini Başlat</Button>
                        ) : programAssigned ? (
                            <p className="text-sm text-emerald-300">Programa atandı. <Link href={`/admin/girisimciler/${app.entrepreneur!.id}`} className="underline">Girişimi aç</Link></p>
                        ) : (
                            <Button className="w-full" variant="primary" icon={Rocket} onClick={() => { setModalError(null); setNewEntName(app.companyName || app.applicantName); setProgramModal(true); }}>Programa Ata</Button>
                        )}
                    </Card>

                    <Card>
                        <SectionTitle>Aşama geçmişi</SectionTitle>
                        <ul className="space-y-2 text-xs">
                            {app.statusHistory.map((h) => (
                                <li key={h.id}>
                                    <span className="text-gray-300">{stageOf(h.fromStatus)?.label || h.fromStatus} → {stageOf(h.toStatus)?.label || h.toStatus}</span>
                                    <div className="text-gray-500">{formatDateTime(h.createdAt)}{h.changedByName ? ` · ${h.changedByName}` : ''}</div>
                                    {h.reason && <div className="text-gray-400">{h.reason}</div>}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>

            <Modal
                open={programModal}
                onClose={() => setProgramModal(false)}
                title="Programa Ata"
                description={`${app.campaign?.program?.name || app.program?.name || 'Program'} — mevcut bir girişimi seçin veya başvurudan yeni girişim kaydı oluşturun.`}
                footer={<><Button onClick={() => setProgramModal(false)}>Vazgeç</Button><Button variant="primary" loading={busy === 'decision'} disabled={!entId && !newEntName.trim()} onClick={() => decide({ action: 'assignProgram', entrepreneurId: entId || null, newEntrepreneur: entId ? null : { name: newEntName }, cohort: cohort || null }, () => setProgramModal(false))}>Programa Ata</Button></>}
            >
                <div className="space-y-4">
                    <Field label="Mevcut girişim ara" htmlFor="ent-search"><TextInput id="ent-search" value={entSearch} onChange={(e) => { setEntSearch(e.target.value); setEntId(''); }} placeholder="En az 2 karakter" /></Field>
                    {entResults.length > 0 && (
                        <ul className="max-h-40 space-y-1 overflow-y-auto">
                            {entResults.map((e) => <li key={e.id}><button type="button" onClick={() => setEntId(e.id)} className={`w-full rounded-lg border px-3 py-1.5 text-left text-sm ${entId === e.id ? 'border-primary bg-primary/10 text-white' : 'border-white/10 text-gray-300'}`}>{e.name}</button></li>)}
                        </ul>
                    )}
                    {!entId && <Field label="veya yeni girişim adı" htmlFor="ent-new" hint="Yeni girişim yayınlanmamış (iç) kayıt olarak oluşturulur."><TextInput id="ent-new" value={newEntName} onChange={(e) => setNewEntName(e.target.value)} /></Field>}
                    <Field label="Dönem (isteğe bağlı)" htmlFor="ent-cohort"><TextInput id="ent-cohort" value={cohort} onChange={(e) => setCohort(e.target.value)} placeholder="Örn: 1. Dönem" /></Field>
                    {modalError && <Alert tone="danger">{modalError}</Alert>}
                </div>
            </Modal>

            <Modal
                open={spaceModal}
                onClose={() => setSpaceModal(false)}
                title="Alan Tahsis Sürecini Başlat"
                description="Planlanmış bir alan tahsisi oluşturulur. Sözleşme, kira ve fatura ayrıca ve açıkça oluşturulur; programa otomatik üyelik yapılmaz."
                footer={<><Button onClick={() => setSpaceModal(false)}>Vazgeç</Button><Button variant="primary" loading={busy === 'decision'} disabled={!space.facilityId} onClick={() => decide({ action: 'startSpaceAssignment', facilityId: space.facilityId, organizationId: space.organizationId || null, newOrganization: space.organizationId ? null : space.newOrganization ? { name: space.newOrganization } : null, unitLabel: space.unitLabel, startDate: space.startDate || null, notes: space.notes }, () => setSpaceModal(false))}>Süreci Başlat</Button></>}
            >
                <div className="space-y-4">
                    <Field label="Alan" htmlFor="sp-fac" required><Select id="sp-fac" value={space.facilityId} onChange={(e) => setSpace({ ...space, facilityId: e.target.value })} placeholder="Alan seçin" options={facilities.map((f) => ({ value: f.id, label: f.title }))} /></Field>
                    <Field label="Masa / oda" htmlFor="sp-unit"><TextInput id="sp-unit" value={space.unitLabel} onChange={(e) => setSpace({ ...space, unitLabel: e.target.value })} /></Field>
                    <Field label="Planlanan başlangıç" htmlFor="sp-start"><TextInput id="sp-start" type="date" value={space.startDate} onChange={(e) => setSpace({ ...space, startDate: e.target.value })} /></Field>
                    <Field label="Mevcut kurum ara" htmlFor="sp-org"><TextInput id="sp-org" value={orgSearch} onChange={(e) => { setOrgSearch(e.target.value); setSpace({ ...space, organizationId: '' }); }} placeholder="En az 2 karakter" /></Field>
                    {orgResults.length > 0 && (
                        <ul className="max-h-40 space-y-1 overflow-y-auto">
                            {orgResults.map((o) => <li key={o.id}><button type="button" onClick={() => setSpace({ ...space, organizationId: o.id })} className={`w-full rounded-lg border px-3 py-1.5 text-left text-sm ${space.organizationId === o.id ? 'border-primary bg-primary/10 text-white' : 'border-white/10 text-gray-300'}`}>{o.name}</button></li>)}
                        </ul>
                    )}
                    {!space.organizationId && <Field label="veya yeni kurum adı" htmlFor="sp-neworg" hint="Boş bırakılırsa kurum bağlanmaz."><TextInput id="sp-neworg" value={space.newOrganization} onChange={(e) => setSpace({ ...space, newOrganization: e.target.value })} /></Field>}
                    <Field label="Not" htmlFor="sp-notes"><TextArea id="sp-notes" value={space.notes} onChange={(e) => setSpace({ ...space, notes: e.target.value })} /></Field>
                    {modalError && <Alert tone="danger">{modalError}</Alert>}
                </div>
            </Modal>
        </div>
    );
}
