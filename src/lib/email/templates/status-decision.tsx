import {
  Html, Head, Body, Container, Section, Text, Heading, Hr,
} from '@react-email/components';

interface StatusDecisionEmailProps {
  leadName: string;
  currentStatus: string;
  requestedStatus: string;
  decision: 'approved' | 'denied';
  deciderName: string;
}

export function StatusDecisionEmail({
  leadName,
  currentStatus,
  requestedStatus,
  decision,
  deciderName,
}: StatusDecisionEmailProps) {
  const isApproved = decision === 'approved';

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>
              Status Request {isApproved ? 'Approved' : 'Denied'}
            </Heading>
            <Hr style={hr} />
            <Text style={text}>
              Your request to change <strong>{leadName}</strong> from{' '}
              <strong>{currentStatus}</strong> to <strong>{requestedStatus}</strong> has
              been <strong>{decision}</strong> by {deciderName}.
            </Text>
            {isApproved ? (
              <Text style={text}>
                The lead&apos;s status has been updated accordingly.
              </Text>
            ) : (
              <Text style={text}>
                The lead&apos;s status remains unchanged. Contact your admin for more details.
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default StatusDecisionEmail;

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
