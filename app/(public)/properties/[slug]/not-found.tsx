import { ButtonLink, Container, Section, StatusPanel } from "@/components/ui";

export default function PropertyNotFound() {
  return (
    <Section>
      <Container>
        <StatusPanel
          tone="empty"
          title="This property is no longer listed"
          actions={<ButtonLink href="/properties">Browse all properties</ButtonLink>}
        >
          It may have been sold or withdrawn. Browse the current listings or post an enquiry.
        </StatusPanel>
      </Container>
    </Section>
  );
}
