import { Container, Section, SectionHeading } from "@/components/ui";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Your wishlist",
  description: "Properties you have saved on this device.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <Section spacing="snug">
      <Container>
        <SectionHeading as="h1" label="Wishlist" title="Saved properties" />
        <div style={{ marginTop: 28 }}>
          <WishlistView />
        </div>
      </Container>
    </Section>
  );
}
