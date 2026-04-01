import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Button,
} from '@react-email/components';

interface TeamInvitationEmailProps {
  role: string;
  inviteUrl: string;
}

export function TeamInvitationEmail({
  role,
  inviteUrl,
}: TeamInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>You&apos;re invited to AushCRM</Heading>
            <Hr style={hr} />
            <Text style={text}>
              You&apos;ve been invited to join AushCRM as a <strong>{role}</strong>.
            </Text>
            <Text style={text}>
              Click the button below to create your account and get started.
            </Text>
            <Section style={buttonSection}>
              <Button style={button} href={inviteUrl}>
                Accept Invitation
              </Button>
            </Section>
            <Text style={textMuted}>
              This invitation expires in 7 days.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default TeamInvitationEmail;

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

const textMuted = {
  color: '#707070',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '24px 0 0',
};

const buttonSection = {
  marginTop: '24px',
  marginBottom: '8px',
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
