import LegalDocPage from "@/components/LegalDocPage";

// Text lives in marketing/docs.json (lawyer-verified) and is rendered via the
// generated module. See LegalDocPage. Do not inline legal text here.
export default function GDPR() {
  return <LegalDocPage docKey="gdpr" />;
}
