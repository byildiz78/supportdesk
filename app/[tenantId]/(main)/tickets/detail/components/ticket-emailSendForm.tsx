import { EmailSendForm } from '@/components/tickets/email-send-form';
import { Card } from '@/components/ui/card'
import { TicketComment } from '@/types/tickets';
import { Reply } from 'lucide-react'
import React from 'react'


interface EmailReplyFormProps {
    originalComment?: TicketComment;
    replyAll?: boolean;
    subject: string;
    onSubmit: (content: string, to: string[], cc: string[], subject: string, isInternal: boolean, files?: File[]) => Promise<void>;
    onCancel: () => void;
    ticketMail?: string;
}

const TicketEmailSendForm = ({
    originalComment,
    replyAll = false,
    subject,
    onSubmit,
    onCancel,
    ticketMail
}: EmailReplyFormProps) => {
    
    return (
        <>
            {/* Email Send Form */}
            <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
                            <Reply className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            E-posta Gönder
                        </h3>
                    </div>
                    <EmailSendForm
                         originalComment={originalComment}
                         replyAll={replyAll}
                         subject={subject}
                         onSubmit={onSubmit}
                         onCancel={onCancel}
                         ticketMail={ticketMail} />
                </div>
            </Card>
        </>
    );
}

export default TicketEmailSendForm