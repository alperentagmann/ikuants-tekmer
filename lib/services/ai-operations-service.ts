import { prisma } from '@/lib/prisma';
import { AI_ACTION_REGISTRY, RiskLevel } from './ai-action-registry';
import { logAuditEvent } from '@/lib/audit';

export interface AiChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachmentUrl?: string;
    attachmentType?: string;
    actionResult?: any;
    changeSetId?: string;
    requiresConfirmation?: boolean;
    confirmationPayload?: any;
}

export interface ParseDailyWorkResult {
    summary: string;
    activities: Array<{
        title: string;
        category: string;
        description: string;
    }>;
    interactions: Array<{
        contactName: string;
        organizationName?: string;
        subject: string;
        notes: string;
        followUpDate?: string;
    }>;
    tasks: Array<{
        title: string;
        description?: string;
        dueDate?: string;
        priority: string;
    }>;
}

export const AiOperationsService = {
    /**
     * Natural language intent resolution and domain parameter extraction.
     */
    async processUserPrompt(
        prompt: string,
        actor: { id: string; email: string; name: string; isSuperAdmin: boolean },
        context?: {
            currentRoute?: string;
            selectedEntityId?: string;
            selectedEntityType?: string;
            attachmentUrl?: string;
            attachmentType?: string;
        }
    ): Promise<AiChatMessage> {
        const lower = prompt.toLowerCase();

        // 1. BANNER / HOMEPAGE CREATION
        if (lower.includes('banner') || lower.includes('hero') || (context?.attachmentUrl && (lower.includes('ana sayfa') || lower.includes('ekle')))) {
            if (!actor.isSuperAdmin) {
                return {
                    role: 'assistant',
                    content: 'Ana sayfa banner ve içerik yönetimi yetkiniz bulunmamaktadır. Bu işlem için Super Admin yetkisi gereklidir.',
                };
            }

            // Extract title from prompt
            let title = 'Yeni Dönem Girişimcilik Programları';
            const titleMatch = prompt.match(/başlığı\s*['"‘“]?([^'"‘”\n]+)['"’”]?/i) ||
                               prompt.match(/başlık\s*['"‘“]?([^'"‘”\n]+)['"’”]?/i);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1].trim();
            } else if (prompt.includes(':')) {
                title = prompt.split(':')[1].trim();
            }

            const mediaUrl = context?.attachmentUrl || '/images/hero/hero-slide-1.webp';

            return {
                role: 'assistant',
                content: `Ana sayfaya yeni banner ekleme isteğinizi algıladım.\n\n• **Başlık:** ${title}\n• **Görsel:** ${context?.attachmentUrl ? 'Eklenen Görsel Dosyası' : 'Varsayılan Hero Görseli'}\n• **Hedef:** /basvuru\n\nBu değişikliği ana sayfada yayına almak istiyor musunuz?`,
                requiresConfirmation: true,
                confirmationPayload: {
                    actionId: 'cms.banner.create',
                    params: {
                        title,
                        mediaUrl,
                        primaryCtaText: 'HEMEN BAŞVUR',
                        primaryCtaLink: '/basvuru',
                    },
                },
            };
        }

        // 2. USER CREATION / INVITE
        if (lower.includes('kullanıcı') || lower.includes('user') || lower.includes('davet')) {
            if (!actor.isSuperAdmin) {
                return {
                    role: 'assistant',
                    content: 'Kullanıcı oluşturma veya yetki verme işlemleri için Super Admin yetkisi gerekmektedir.',
                };
            }

            const emailMatch = prompt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            if (!emailMatch) {
                return {
                    role: 'assistant',
                    content: 'Yeni kullanıcı oluşturmak için lütfen geçerli bir e-posta adresi belirtin (Örn: "Ayşe Demir için ayse@ikuantstekmer.com adresli kullanıcı oluştur").',
                };
            }

            const email = emailMatch[1];
            
            // Check existing
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return {
                    role: 'assistant',
                    content: `"${email}" e-posta adresine sahip bir kullanıcı sistemde zaten kayıtlıdır.`,
                };
            }

            // Extract name
            let name = 'Yeni Kullanıcı';
            const nameMatch = prompt.match(/adı\s*['"‘“]?([^'"‘”\n,]+)['"’”]?/i) ||
                              prompt.match(/isimli\s*['"‘“]?([^'"‘”\n,]+)['"’”]?/i);
            if (nameMatch) {
                name = nameMatch[1].trim();
            }

            // Extract role
            let roleSlug = 'admin';
            if (lower.includes('editor') || lower.includes('editör')) roleSlug = 'content-editor';
            if (lower.includes('finans') || lower.includes('finance')) roleSlug = 'finance-manager';
            if (lower.includes('viewer') || lower.includes('izleyici')) roleSlug = 'viewer';

            return {
                role: 'assistant',
                content: `Yeni kullanıcı daveti hazırlığı:\n\n• **Ad Soyad:** ${name}\n• **E-Posta:** ${email}\n• **Atanacak Rol:** ${roleSlug.toUpperCase()}\n\nKullanıcıya güvenli davet bağlantısı oluşturulsun mu?`,
                requiresConfirmation: true,
                confirmationPayload: {
                    actionId: 'user.invite',
                    params: { name, email, roleSlug },
                },
            };
        }

        // 3. PROGRAM ASSIGNMENT
        if (lower.includes('program') && (lower.includes('ata') || lower.includes('ekle') || lower.includes('kaydet'))) {
            // Find entrepreneur name
            const entMatch = prompt.match(/['"‘“]?([^'"‘”]+)['"’”]?\s*(girişimini|girişimi|şirketini)/i);
            const progMatch = prompt.match(/(antspark|antsfire|glow up|kuluçka|hızlandırma)/i);

            const entrepreneurName = entMatch ? entMatch[1].trim() : (context?.selectedEntityId ? undefined : 'ABC');
            const programName = progMatch ? progMatch[1].trim() : 'ANTSPARK';

            return {
                role: 'assistant',
                content: `Girişimci program ataması:\n\n• **Girişimci:** ${entrepreneurName || 'Seçili Girişimci'}\n• **Program:** ${programName.toUpperCase()}\n• **Dönem:** 2026-Q4\n\nAtama işlemini onaylıyor musunuz?`,
                requiresConfirmation: true,
                confirmationPayload: {
                    actionId: 'entrepreneur.assignProgram',
                    params: {
                        entrepreneurId: context?.selectedEntityType === 'Entrepreneur' ? context.selectedEntityId : undefined,
                        entrepreneurName,
                        programName,
                        cohort: '2026-Q4',
                    },
                },
            };
        }

        // 4. RENT & PAYMENT RECORDING
        if (lower.includes('kira') && (lower.includes('öde') || lower.includes('tahsil') || lower.includes('dekont'))) {
            const amountMatch = prompt.match(/(\d+[\d.,]*)\s*(tl|try|lira)/i) || prompt.match(/(\d+)\s*bin/i);
            let amount = 24000;
            if (amountMatch) {
                if (amountMatch[0].includes('bin')) {
                    amount = parseInt(amountMatch[1]) * 1000;
                } else {
                    amount = parseFloat(amountMatch[1].replace('.', '').replace(',', '.'));
                }
            }

            return {
                role: 'assistant',
                content: `Kira ödeme kaydı özeti:\n\n• **Tutar:** ${amount.toLocaleString('tr-TR')} TL\n• **Dekont:** ${context?.attachmentUrl ? '✓ Ekli Dosya' : 'Dekontsuz'}\n• **Ödeme Yöntemi:** Banka Transferi / EFT\n\nBu ödemeyi tahakkuka işlemek ve bakiyeyi kapatmak istiyor musunuz?`,
                requiresConfirmation: true,
                confirmationPayload: {
                    actionId: 'rent.recordPayment',
                    params: {
                        amount,
                        receiptDocUrl: context?.attachmentUrl,
                        paymentMethod: 'BANK_TRANSFER',
                    },
                },
            };
        }

        // 5. DAILY ACTIVITY / "BUGÜN ŞUNLARI YAPTIM..."
        if (lower.includes('bugün') || lower.includes('görüştüm') || lower.includes('yaptım') || lower.includes('toplantı')) {
            const parsed = await this.parseDailyWork(prompt);

            return {
                role: 'assistant',
                content: `Bugünkü çalışmalarınızdan şu operasyonel taslakları oluşturdum:\n\n` +
                         `**Görüşmeler / Ziyaretler (${parsed.interactions.length}):**\n` +
                         parsed.interactions.map(i => `• ${i.contactName} (${i.subject})`).join('\n') + `\n\n` +
                         `**Oluşturulacak Görevler (${parsed.tasks.length}):**\n` +
                         parsed.tasks.map(t => `• ${t.title} [Öncelik: ${t.priority}]`).join('\n') + `\n\n` +
                         `Bu kayıtları veritabanına işlemek istiyor musunuz?`,
                requiresConfirmation: true,
                confirmationPayload: {
                    actionId: 'multi.dailyWork',
                    params: parsed,
                },
            };
        }

        // 6. DAILY OR MONTHLY REPORT REQUEST
        if (lower.includes('rapor')) {
            if (lower.includes('günlük') || lower.includes('bugün')) {
                return {
                    role: 'assistant',
                    content: 'Bugünkü tüm görevleriniz, görüşmeleriniz ve kurumsal faaliyetleriniz toplanarak resmi Günlük Faaliyet Raporu oluşturulacaktır. Onaylıyor musunuz?',
                    requiresConfirmation: true,
                    confirmationPayload: {
                        actionId: 'report.generateDaily',
                        params: { date: new Date().toISOString() },
                    },
                };
            }
        }

        // Default conversational answer with contextual chips
        return {
            role: 'assistant',
            content: `Nasıl yardımcı olabilirim?\n\nDoğal dille şunları isteyebilirsiniz:\n• *"Bu görseli ana sayfaya banner yap."*\n• *"Ayşe Demir adında ayse@example.com mailiyle yeni kullanıcı oluştur."*\n• *"Bugün ABC girişimiyle toplantı yaptık, yarın arayacağım."*\n• *"Bugünkü faaliyet raporumu hazırla."*\n• *"ABC şirketinin 24.000 TL kirasını kaydet."*`,
        };
    },

    /**
     * Executes a confirmed action or changeset atomically.
     */
    async executeConfirmedAction(
        actionId: string,
        params: any,
        actor: { id: string; email: string; name: string; isSuperAdmin: boolean }
    ) {
        if (actionId === 'multi.dailyWork') {
            const parsed: ParseDailyWorkResult = params;
            const executedItems = [];

            try {
                for (const inter of parsed.interactions) {
                    const res = await AI_ACTION_REGISTRY['interaction.create'].execute({
                        contactName: inter.contactName,
                        organizationName: inter.organizationName,
                        subject: inter.subject,
                        notes: inter.notes,
                        followUpDate: inter.followUpDate,
                    }, actor);
                    executedItems.push(res);
                }

                for (const t of parsed.tasks) {
                    const res = await AI_ACTION_REGISTRY['task.create'].execute({
                        title: t.title,
                        description: t.description,
                        priority: t.priority,
                        dueDate: t.dueDate,
                    }, actor);
                    executedItems.push(res);
                }

                const changeSet = await prisma.aiChangeSet.create({
                    data: {
                        userId: actor.id,
                        userEmail: actor.email,
                        userName: actor.name,
                        requestPrompt: 'Bugünkü çalışmaların toplu kaydı',
                        intent: 'multi.dailyWork',
                        riskLevel: 'LOW',
                        actionsJson: JSON.stringify(executedItems.map(i => i.data)),
                        summary: `${parsed.interactions.length} görüşme ve ${parsed.tasks.length} takip görevi başarıyla kaydedildi.`,
                        status: 'COMPLETED',
                    },
                });

                return {
                    success: true,
                    message: `Bugünkü ${parsed.interactions.length} görüşme ve ${parsed.tasks.length} takip görevi veritabanına başarıyla kaydedildi.`,
                    changeSetId: changeSet.id,
                };
            } catch (err: any) {
                // Rollback any executed
                for (const item of executedItems) {
                    if (item.undoPayload?.interactionId) {
                        await AI_ACTION_REGISTRY['interaction.create'].rollback(item.undoPayload, actor);
                    }
                    if (item.undoPayload?.taskId) {
                        await AI_ACTION_REGISTRY['task.create'].rollback(item.undoPayload, actor);
                    }
                }
                return {
                    success: false,
                    message: `İşlem sırasında hata oluştu. Yapılan ara değişiklikler güvenli şekilde geri alındı. Hata: ${err.message}`,
                };
            }
        }

        const actionDef = AI_ACTION_REGISTRY[actionId];
        if (!actionDef) {
            return { success: false, message: `Tanımlanmamış AI eylemi: ${actionId}` };
        }

        try {
            const result = await actionDef.execute(params, actor);
            if (!result.success) {
                return result;
            }

            // Create AIChangeSet record for tracking and undo
            const changeSet = await prisma.aiChangeSet.create({
                data: {
                    userId: actor.id,
                    userEmail: actor.email,
                    userName: actor.name,
                    requestPrompt: actionDef.name,
                    intent: actionId,
                    riskLevel: actionDef.riskLevel,
                    actionsJson: JSON.stringify(result.undoPayload || {}),
                    beforeState: result.beforeState ? JSON.stringify(result.beforeState) : null,
                    afterState: result.afterState ? JSON.stringify(result.afterState) : null,
                    summary: result.message,
                    status: 'COMPLETED',
                },
            });

            return {
                ...result,
                changeSetId: changeSet.id,
            };
        } catch (err: any) {
            return {
                success: false,
                message: `Eylem çalıştırılırken hata oluştu: ${err.message}`,
            };
        }
    },

    /**
     * Reverts an AI changeset atomically.
     */
    async rollbackChangeSet(
        changeSetId: string,
        actor: { id: string; email: string; name: string }
    ) {
        const changeSet = await prisma.aiChangeSet.findUnique({ where: { id: changeSetId } });
        if (!changeSet) return { success: false, message: 'İşlem kaydı bulunamadı.' };
        if (changeSet.status === 'ROLLED_BACK') return { success: false, message: 'Bu işlem zaten daha önce geri alınmış.' };

        const actionDef = AI_ACTION_REGISTRY[changeSet.intent];
        if (!actionDef) {
            return { success: false, message: `Geri alma işleyicisi bulunamadı: ${changeSet.intent}` };
        }

        const undoPayload = changeSet.actionsJson ? JSON.parse(changeSet.actionsJson) : {};
        const rollbackResult = await actionDef.rollback(undoPayload, actor);

        if (rollbackResult.success) {
            await prisma.aiChangeSet.update({
                where: { id: changeSetId },
                data: {
                    status: 'ROLLED_BACK',
                    rollbackStatus: 'ROLLED_BACK',
                    rolledBackAt: new Date(),
                },
            });
        }

        return rollbackResult;
    },

    /**
     * Parses freeform Turkish text into structured work records.
     */
    async parseDailyWork(text: string): Promise<ParseDailyWorkResult> {
        const lines = text.split(/[\n.]+/).filter(l => l.trim().length > 3);
        const interactions = [];
        const tasks = [];
        const activities = [];

        for (const line of lines) {
            const trimmed = line.trim();
            const lower = trimmed.toLowerCase();

            if (lower.includes('görüştüm') || lower.includes('toplantı') || lower.includes('konuştuk')) {
                const nameMatch = trimmed.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)*)/);
                interactions.push({
                    contactName: nameMatch ? nameMatch[0] : 'Katılımcı',
                    subject: trimmed,
                    notes: trimmed,
                    followUpDate: lower.includes('yarın') ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : undefined,
                });
            } else if (lower.includes('görev') || lower.includes('arayacağım') || lower.includes('kontrol') || lower.includes('takip')) {
                tasks.push({
                    title: trimmed,
                    description: trimmed,
                    dueDate: lower.includes('yarın') ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : undefined,
                    priority: lower.includes('acil') ? 'HIGH' : 'MEDIUM',
                });
            } else {
                activities.push({
                    title: trimmed,
                    category: 'GENEL',
                    description: trimmed,
                });
            }
        }

        if (interactions.length === 0 && tasks.length === 0 && activities.length === 0) {
            activities.push({
                title: text.slice(0, 50),
                category: 'GENEL',
                description: text,
            });
        }

        return {
            summary: `Toplam ${interactions.length} görüşme, ${tasks.length} görev ve ${activities.length} faaliyet tespit edildi.`,
            activities,
            interactions,
            tasks,
        };
    },
};
