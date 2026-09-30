import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink, Container, Section, StatusPanel } from "@/components/ui";

/** 404 for any unknown URL. It carries the header and footer because the (public) layout does not wrap the root not-found page. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Section>
          <Container>
            <StatusPanel
              tone="empty"
              title="Page not found"
              actions={
                <>
                  <ButtonLink href="/">Go home</ButtonLink>
                  <ButtonLink href="/properties" variant="outline">
                    Browse properties
                  </ButtonLink>
                </>
              }
            >
              The page you are looking for does not exist or has moved.
            </StatusPanel>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
