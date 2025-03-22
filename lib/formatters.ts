/**
 * Format a number as currency with Turkish Lira symbol
 * @param value Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) return "0,00 ₺";
    
    // Format with Turkish locale (comma as decimal separator)
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Format a date string to a readable format
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date | undefined | null): string {
    if (!dateString) return "-";
    
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        
        // Geçersiz tarih kontrolü
        if (isNaN(date.getTime())) return "-";
        
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    } catch (error) {
        console.error("Date formatting error:", error);
        return "-";
    }
}

/**
 * Format a number with thousand separators
 * @param value Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number | undefined | null): string {
    if (value === undefined || value === null) return "0";
    
    return new Intl.NumberFormat('tr-TR').format(value);
}
