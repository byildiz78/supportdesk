import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { format } from 'date-fns';

// Destek merkezi dashboard verilerine dair arayüzler
interface RecentTicket {
    TicketID: string;
    TicketNo: string;
    Subject: string;
    Status: string;
    CreatedAt: string;
    Priority: string;
}

interface DashboardData {
    totalTickets: {
        'Toplam Talep': string;
        'Değişim (Bu Ay)': string;
    };
    openTickets: {
        'Açık Talepler': string;
        'Bekleyen Sayısı': string;
    };
    resolvedToday: {
        'Bugün Çözülen': string;
        'Çözüm Oranı': string;
    };
    activeAgents: {
        'Aktif Temsilci': string;
        'Müsait Temsilci': string;
    };
    averageResolutionTime: {
        'Ortalama Çözüm Süresi': string;
        'Dakika Cinsinden': string;
    };
    recentTickets: RecentTicket[];
    ticketStats: {
        'Gün': string;
        'Açılan Talepler': string;
        'Çözülen Talepler': string;
        'Ortalama Çözüm Süresi': string;
    }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { date1, date2 } = req.body;

        if (!date1 || !date2) {
            return res.status(400).json({ message: 'Date range is required' });
        }

        // Tenant ID'yi req.body içine ekle
        req.body = {
            ...req.body,
            tenantId: req.headers['x-tenant-id'] || req.query.tenantId || 'public'
        };

        // Tenant ID filtresi kaldırıldı
        const tenantFilter = '';

        // Toplam Talep Sayısı ve Bu Ayki Değişim
        const totalTicketsQuery = `
            SELECT COUNT(*) as total_tickets
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL) ${tenantFilter}
        `;

        const currentMonthTicketsQuery = `
            SELECT COUNT(*) as current_month_tickets
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            ${tenantFilter}
        `;

        const previousMonthTicketsQuery = `
            SELECT COUNT(*) as previous_month_tickets
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
            ${tenantFilter}
        `;

        // Açık Talepler ve Bekleyen Sayısı
        const openTicketsQuery = `
            SELECT COUNT(*) as open_tickets
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND status IN ('open', 'in_progress')
            ${tenantFilter}
        `;

        const pendingTicketsQuery = `
            SELECT COUNT(*) as pending_tickets
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND status = 'pending'
            ${tenantFilter}
        `;

        // Bugün Çözülen ve Çözüm Oranı
        const resolvedTodayQuery = `
            SELECT COUNT(*) as resolved_today
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND (status = 'resolved' OR status = 'closed')
            AND DATE(updated_at) = CURRENT_DATE
            ${tenantFilter}
        `;

        const totalTodayTicketsQuery = `
            SELECT COUNT(*) as total_today
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND DATE(created_at) = CURRENT_DATE
            ${tenantFilter}
        `;

        // Aktif Temsilciler ve Müsait Temsilciler
        const activeAgentsQuery = `
            SELECT COUNT(DISTINCT assigned_to) as active_agents
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND assigned_to IS NOT NULL
            ${tenantFilter}
        `;

        const availableAgentsQuery = `
            SELECT COUNT(*) as available_agents
            FROM users
            WHERE role = 'agent'
            AND status = 'active'
            AND id NOT IN (
                SELECT DISTINCT assigned_to
                FROM tickets
                WHERE (is_deleted = false OR is_deleted IS NULL)
                AND status IN ('open', 'in_progress')
                AND assigned_to IS NOT NULL
                ${tenantFilter}
            )
        `;

        // Son Talepler
        const recentTicketsQuery = `
            SELECT 
                id as "TicketID",
                ticketno as "TicketNo",
                title as "Subject",
                status as "Status",
                created_at as "CreatedAt",
                priority as "Priority"
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND created_at >= CURRENT_DATE - INTERVAL '7 day'
            ${tenantFilter}
            ORDER BY created_at DESC
            LIMIT 10
        `;

        // Talep İstatistikleri (Son 7 gün)
        const openedStatsQuery = `
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM-DD') as day,
                COUNT(*) as opened_tickets
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND created_at >= CURRENT_DATE - INTERVAL '6 day'
            ${tenantFilter}
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY day
        `;

        const resolvedStatsQuery = `
            SELECT 
                TO_CHAR(updated_at, 'YYYY-MM-DD') as day,
                COUNT(*) as resolved_tickets
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND (status = 'resolved' OR status = 'closed')
            AND updated_at >= CURRENT_DATE - INTERVAL '6 day'
            ${tenantFilter}
            GROUP BY TO_CHAR(updated_at, 'YYYY-MM-DD')
            ORDER BY day
        `;

        const avgResolutionTimeQuery = `
            SELECT 
                TO_CHAR(updated_at, 'YYYY-MM-DD') as day,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::numeric(10,1) as avg_resolution_time
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND (status = 'resolved' OR status = 'closed')
            AND updated_at >= CURRENT_DATE - INTERVAL '6 day'
            ${tenantFilter}
            GROUP BY TO_CHAR(updated_at, 'YYYY-MM-DD')
            ORDER BY day
        `;

        // Seçili tarih aralığı için ortalama çözüm süresi
        const avgResolutionTimeForRangeQuery = `
            SELECT 
                AVG(EXTRACT(EPOCH FROM (resolution_time - created_at))/60)::numeric(10,1) as avg_resolution_minutes
            FROM tickets
            WHERE (is_deleted = false OR is_deleted IS NULL)
            AND status = 'resolved'
            AND created_at >= $1 AND created_at <= $2
            AND resolution_time IS NOT NULL
            ${tenantFilter}
        `;

        // Tüm sorguları çalıştır
        const [
            totalTicketsResult,
            currentMonthTicketsResult,
            previousMonthTicketsResult,
            openTicketsResult,
            pendingTicketsResult,
            resolvedTodayResult,
            totalTodayTicketsResult,
            activeAgentsResult,
            availableAgentsResult,
            recentTicketsResult,
            openedStatsResult,
            resolvedStatsResult,
            avgResolutionTimeResult,
            avgResolutionTimeForRangeResult
        ] = await Promise.all([
            db.executeQuery<any[]>({ query: totalTicketsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: currentMonthTicketsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: previousMonthTicketsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: openTicketsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: pendingTicketsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: resolvedTodayQuery, params: [], req }),
            db.executeQuery<any[]>({ query: totalTodayTicketsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: activeAgentsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: availableAgentsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: recentTicketsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: openedStatsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: resolvedStatsQuery, params: [], req }),
            db.executeQuery<any[]>({ query: avgResolutionTimeQuery, params: [], req }),
            db.executeQuery<any[]>({ query: avgResolutionTimeForRangeQuery, params: [date1, date2], req })
        ]);

        // Değişim yüzdesini hesapla
        const currentMonthTickets = parseInt(currentMonthTicketsResult?.[0]?.current_month_tickets || 0);
        const previousMonthTickets = parseInt(previousMonthTicketsResult?.[0]?.previous_month_tickets || 0);
        let changePercentage = 0;
        
        if (previousMonthTickets > 0) {
            changePercentage = ((currentMonthTickets - previousMonthTickets) / previousMonthTickets) * 100;
        } else if (currentMonthTickets > 0) {
            changePercentage = 100; // Önceki ay 0 ise ve bu ay talep varsa, %100 artış
        }

        // Çözüm oranını hesapla
        const resolvedToday = parseInt(resolvedTodayResult?.[0]?.resolved_today || 0);
        const totalToday = parseInt(totalTodayTicketsResult?.[0]?.total_today || 0);
        let resolutionRate = 0;
        
        if (totalToday > 0) {
            resolutionRate = (resolvedToday / totalToday) * 100;
        }

        // Talep istatistiklerini birleştir
        const dailyStats: Record<string, {
            'Gün': string;
            'Açılan Talepler': string;
            'Çözülen Talepler': string;
            'Ortalama Çözüm Süresi': string;
        }> = {};
        
        // Açılan talepleri ekle
        openedStatsResult?.forEach((stat: any) => {
            const day = stat.day;
            if (!dailyStats[day]) {
                dailyStats[day] = {
                    'Gün': format(new Date(day), 'dd MMM yyyy'),
                    'Açılan Talepler': '0',
                    'Çözülen Talepler': '0',
                    'Ortalama Çözüm Süresi': '0'
                };
            }
            dailyStats[day]['Açılan Talepler'] = stat.opened_tickets.toString();
        });
        
        // Çözülen talepleri ekle
        resolvedStatsResult?.forEach((stat: any) => {
            const day = stat.day;
            if (!dailyStats[day]) {
                dailyStats[day] = {
                    'Gün': format(new Date(day), 'dd MMM yyyy'),
                    'Açılan Talepler': '0',
                    'Çözülen Talepler': '0',
                    'Ortalama Çözüm Süresi': '0'
                };
            }
            dailyStats[day]['Çözülen Talepler'] = stat.resolved_tickets.toString();
        });
        
        // Ortalama çözüm süresini ekle
        avgResolutionTimeResult?.forEach((stat: any) => {
            const day = stat.day;
            if (!dailyStats[day]) {
                dailyStats[day] = {
                    'Gün': format(new Date(day), 'dd MMM yyyy'),
                    'Açılan Talepler': '0',
                    'Çözülen Talepler': '0',
                    'Ortalama Çözüm Süresi': '0'
                };
            }
            dailyStats[day]['Ortalama Çözüm Süresi'] = Math.round(stat.avg_resolution_time).toString();
        });

        // Son talepleri formatla
        const formattedRecentTickets = recentTicketsResult?.map((ticket: any) => {
            // Durum çevirisi
            let status = 'Açık';
            switch (ticket.Status?.toLowerCase() || ticket.status?.toLowerCase()) {
                case 'open': status = 'Açık'; break;
                case 'in_progress': status = 'İşlemde'; break;
                case 'pending': status = 'Beklemede'; break;
                case 'resolved': status = 'Çözüldü'; break;
                case 'closed': status = 'Kapalı'; break;
            }

            // Öncelik çevirisi
            let priority = 'Orta';
            switch (ticket.Priority?.toLowerCase() || ticket.priority?.toLowerCase()) {
                case 'low': priority = 'Düşük'; break;
                case 'medium': priority = 'Orta'; break;
                case 'high': priority = 'Yüksek'; break;
                case 'urgent': priority = 'Acil'; break;
            }

            // Geçen süreyi hesapla
            const createdAt = new Date(ticket.CreatedAt || ticket.created_at);
            const now = new Date();
            const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
            
            let timeAgo;
            if (diffInMinutes < 60) {
                timeAgo = `${diffInMinutes} dakika önce`;
            } else if (diffInMinutes < 1440) {
                const hours = Math.floor(diffInMinutes / 60);
                timeAgo = `${hours} saat önce`;
            } else {
                const days = Math.floor(diffInMinutes / 1440);
                timeAgo = `${days} gün önce`;
            }

            return {
                TicketID: ticket.TicketID || ticket.id,
                TicketNo: ticket.TicketNo || ticket.ticketno,
                Subject: ticket.Subject || ticket.title,
                Status: status,
                CreatedAt: timeAgo,
                Priority: priority
            };
        }) || [];

        // Sonuç verilerini oluştur
        const dashboardData: DashboardData = {
            totalTickets: {
                'Toplam Talep': totalTicketsResult?.[0]?.total_tickets?.toString() || '0',
                'Değişim (Bu Ay)': `${changePercentage > 0 ? '+' : ''}${Math.round(changePercentage)}%`
            },
            openTickets: {
                'Açık Talepler': openTicketsResult?.[0]?.open_tickets?.toString() || '0',
                'Bekleyen Sayısı': pendingTicketsResult?.[0]?.pending_tickets?.toString() || '0'
            },
            resolvedToday: {
                'Bugün Çözülen': resolvedTodayResult?.[0]?.resolved_today?.toString() || '0',
                'Çözüm Oranı': `${Math.round(resolutionRate)}%`
            },
            activeAgents: {
                'Aktif Temsilci': activeAgentsResult?.[0]?.active_agents?.toString() || '0',
                'Müsait Temsilci': availableAgentsResult?.[0]?.available_agents?.toString() || '0'
            },
            averageResolutionTime: {
                'Ortalama Çözüm Süresi': formatResolutionTime(avgResolutionTimeForRangeResult?.[0]?.avg_resolution_minutes || 0),
                'Dakika Cinsinden': Math.round(avgResolutionTimeForRangeResult?.[0]?.avg_resolution_minutes || 0).toString()
            },
            recentTickets: formattedRecentTickets,
            ticketStats: Object.values(dailyStats)
        };

        return res.status(200).json(dashboardData);
    } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Veritabanından dashboard verileri alınırken bir hata oluştu', 
            details: error.message 
        });
    }
}

// Çözüm süresini formatla (dakikayı saat ve dakika olarak göster)
function formatResolutionTime(minutes: number): string {
    if (!minutes || isNaN(minutes)) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours === 0) {
        return `${remainingMinutes} dk`;
    } else if (remainingMinutes === 0) {
        return `${hours} sa`;
    } else {
        return `${hours} sa ${remainingMinutes} dk`;
    }
}
