import {
  Html, Head, Body, Container, Section, Text, Heading, Hr,
} from '@react-email/components';

interface LeadConfirmationEmailProps {
  name: string;
}

export function LeadConfirmationEmail({ name }: LeadConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>Thanks for your interest, {name}</Heading>
            <Hr style={hr} />
            <Text style={text}>
              We&apos;ve received your application and our team will review it shortly.
            </Text>
            <Text style={text}>
              We&apos;ll be in touch within 1-2 business days to discuss how Aush can help
              streamline your business operations.
            </Text>
            <Text style={textMuted}>
              &mdash; The Aush Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default LeadConfirmationEmail;

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
  fontSize: '14px',
  lineHeight: '24px',
  margin: '24px 0 0',
};
