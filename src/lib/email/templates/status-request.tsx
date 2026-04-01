import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Button,
} from '@react-email/components';

interface StatusRequestEmailProps {
  requesterName: string;
  leadName: string;
  currentStatus: string;
  requestedStatus: string;
  note: string;
  dashboardUrl: string;
}

export function StatusRequestEmail({
  requesterName,
  leadName,
  currentStatus,
  requestedStatus,
  note,
  dashboardUrl,
}: StatusRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>Status Change Request</Heading>
            <Hr style={hr} />
            <Text style={text}>
              <strong>{requesterName}</strong> has requested to change the status of{' '}
              <strong>{leadName}</strong>.
            </Text>
            <Section style={detailBox}>
              <Text style={detailText}>
                <strong>From:</strong> {currentStatus}
              </Text>
              <Text style={detailText}>
                <strong>To:</strong> {requestedStatus}
              </Text>
              <Text style={detailText}>
                <strong>Note:</strong> {note}
              </Text>
            </Section>
            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                Review Request
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default StatusRequestEmail;

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
  margin: '0 0 16px',
};

const detailBox = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #e5e5e5',
  padding: '16px',
  margin: '0 0 16px',
};

const detailText = {
  color: '#404040',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 4px',
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
