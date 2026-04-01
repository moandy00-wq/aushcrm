import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Button,
} from '@react-email/components';

interface NewLeadNotificationEmailProps {
  leadName: string;
  leadEmail: string;
  businessName: string;
  source: string;
  dashboardUrl: string;
}

export function NewLeadNotificationEmail({
  leadName,
  leadEmail,
  businessName,
  source,
  dashboardUrl,
}: NewLeadNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>New Lead: {leadName}</Heading>
            <Hr style={hr} />
            <Text style={text}>
              <strong>Email:</strong> {leadEmail}
            </Text>
            <Text style={text}>
              <strong>Business:</strong> {businessName || 'Not provided'}
            </Text>
            <Text style={text}>
              <strong>Source:</strong> {source || 'interview'}
            </Text>
            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                View in Dashboard
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NewLeadNotificationEmail;

const body = {
  backgroundColor: '#f5f5f5',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: '0',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e5e5',
  margin: '0 auto',
  maxWidth: '560px',
};

const section = {
  padding: '32px',
};

const heading = {
  color: '#141414',
  fontSize: '20px',
  fontWeight: '600' as const,
  lineHeight: '28px',
  margin: '0 0 16px',
};

const hr = {
  borderColor: '#e5e5e5',
  borderTop: '1px solid #e5e5e5',
  margin: '16px 0',
};

const text = {
  color: '#404040',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 8px',
};

const buttonSection = {
  marginTop: '24px',
};

const button = {
  backgroundColor: '#141414',
  color: '#ffffff',
  display: 'inline-block' as const,
  fontSize: '14px',
  fontWeight: '500' as const,
  lineHeight: '1',
  padding: '12px 24px',
  textDecoration: 'none',
};
