import { ButtonLink, Container, Section, StatusPanel } from "@/components/ui";

export default function ArticleNotFound() {
  return (
    <Section>
      <Container>
        <StatusPanel tone="empty" title="Article not found" actions={<ButtonLink href="/insights">All insights</ButtonLink>}>
          This article may have moved. Browse the latest insights instead.
        </StatusPanel>
      </Container>
    </Section>
  );
}
