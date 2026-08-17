// Plantilla del aviso al admin cuando alguien usa el formulario de contacto.
// Solo se renderiza desde el servidor (/api/contact).
import "server-only";
import {
  Body,
  Button,
  Container,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const palette = {
  bg: "#0b0b10",
  card: "#17171f",
  border: "#26262f",
  text: "#e7e7ea",
  muted: "#9a9aa5",
  accent: "#f59e0b",
  accentSoft: "#2a2110",
};

const body = {
  backgroundColor: palette.bg,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "32px 0",
};

const container = {
  maxWidth: 560,
  margin: "0 auto",
};

const header = {
  backgroundColor: palette.card,
  border: `1px solid ${palette.border}`,
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
  padding: "28px 32px",
};

const headerBadge = {
  margin: 0,
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
  color: palette.accent,
  fontWeight: 600,
};

const headerTitle = {
  margin: "6px 0 0",
  fontSize: 20,
  color: palette.text,
  fontWeight: 700,
};

const card = {
  backgroundColor: palette.card,
  border: `1px solid ${palette.border}`,
  borderTop: "none",
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12,
  padding: "24px 32px 32px",
};

const h2 = {
  margin: "0 0 20px",
  fontSize: 15,
  color: palette.muted,
  fontWeight: 600,
};

const field = {
  backgroundColor: "#101016",
  border: `1px solid ${palette.border}`,
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 12,
};

const fieldLabel = {
  margin: 0,
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase" as const,
  color: palette.muted,
  fontWeight: 600,
};

const fieldValue = {
  margin: "4px 0 0",
  fontSize: 15,
  color: palette.text,
  whiteSpace: "pre-wrap" as const,
};

const link = {
  color: palette.accent,
  textDecoration: "underline",
};

const button = {
  backgroundColor: palette.accent,
  color: "#0b0b10",
  fontWeight: 700,
  fontSize: 14,
  borderRadius: 8,
  padding: "12px 20px",
  marginTop: 8,
};

const hr = {
  borderColor: palette.border,
  margin: "20px 0",
};

const footer = {
  margin: 0,
  fontSize: 12,
  color: palette.muted,
  textAlign: "center" as const,
};

export function ContactNotificationEmail({
  name,
  email,
  message,
  siteName = "la web",
}: {
  name: string;
  email: string;
  message: string;
  siteName?: string;
}) {
  return (
    <Html>
      <Preview>
        Nuevo mensaje de {name} ({email}) desde el formulario de contacto
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerBadge}>📬 Formulario de contacto</Text>
            <Heading style={headerTitle}>Nuevo mensaje recibido en {siteName}</Heading>
          </Section>
          <Section style={card}>
            <Heading style={h2}>Alguien te ha escrito desde la web:</Heading>
            <Section style={field}>
              <Text style={fieldLabel}>Nombre</Text>
              <Text style={fieldValue}>{name}</Text>
            </Section>
            <Section style={field}>
              <Text style={fieldLabel}>Email</Text>
              <Text style={fieldValue}>
                <a href={`mailto:${email}`} style={link}>
                  {email}
                </a>
              </Text>
            </Section>
            <Section style={field}>
              <Text style={fieldLabel}>Mensaje</Text>
              <Text style={fieldValue}>{message}</Text>
            </Section>
            <Button href={`mailto:${email}`} style={button}>
              Responder a {name}
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Aviso automático del formulario de contacto de {siteName}. El mensaje
            también queda guardado en la bandeja del panel (/admin/mensajes).
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
