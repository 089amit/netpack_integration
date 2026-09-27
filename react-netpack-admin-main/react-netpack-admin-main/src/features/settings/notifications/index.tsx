import ContentSection from '../components/content-section'
import { NotificationsForm } from './notifications-form'
import { EmailMailbox } from './email-mailbox'

export default function SettingsNotifications() {
  return (
    <div className='space-y-10'>
      <ContentSection
        title='Notifications & Email Dispatch Environment'
        desc='Manage notification preferences, test live email delivery, and inspect recent sent/received messages in the in-app mailbox.'
      >
        <NotificationsForm />
      </ContentSection>

      <ContentSection
        title='Test Mailbox & Email Engine Inspector'
        desc='Verify SMTP connection, send diagnostic test emails, and preview all outgoing/incoming HTML templates.'
      >
        <EmailMailbox />
      </ContentSection>
    </div>
  )
}
